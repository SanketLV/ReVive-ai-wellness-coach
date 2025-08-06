import { getEmbedding } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { HealthDataService } from "@/lib/health-data-service";
import { ensureIndexExists, redisClient, vectorToBuffer } from "@/lib/redis";
import { openai } from "@ai-sdk/openai";
import { streamText, smoothStream } from "ai";
import { headers } from "next/headers";

interface RedisSearchResult {
  total: number;
  documents: {
    id: string;
    value: {
      response: string;
      inputText: string;
      similarity: string;
    };
  }[];
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    // Make sure to await this and handle any errors
    try {
      await ensureIndexExists();
      console.log("Index check completed");
    } catch (indexError) {
      console.error("Error ensuring index exists:", indexError);
      // Return error response if index is critical
      return new Response("Search index unavailable", { status: 503 });
    }

    const lastMessage = messages[messages.length - 1];
    const inputText = lastMessage.parts?.[0]?.text || lastMessage.content;

    //* Get health conetxt for the user's query
    const healthDataService = new HealthDataService();
    let healthContext = null;
    let healthContextString = "";

    try {
      healthContext = await healthDataService.getUserHealthContext(
        userId,
        inputText
      );
      healthContextString =
        healthDataService.formatHealthContextForAI(healthContext);
      console.log("Health context string:", healthContextString);
      console.log("Health context retrieved successfully");
    } catch (error) {
      console.warn("Failed to get health context:", error);
    }

    //* 1. Embed user Message
    const embeddingText = healthContextString
      ? `${inputText}\n${healthContextString}`
      : inputText;
    const embedding = await getEmbedding(embeddingText);
    const vectorBuffer = vectorToBuffer(embedding);

    //* 2. Search Redis Vector Index
    const searchResult = (await redisClient.ft.search(
      "chat_cache",
      `*=>[KNN 3 @embedding $vec_param AS similarity]`,
      {
        PARAMS: {
          vec_param: vectorBuffer,
        },
        RETURN: ["response", "inputText", "similarity"],
        SORTBY: "similarity",
        DIALECT: 2,
      }
    )) as RedisSearchResult;

    console.log("Search result:", JSON.stringify(searchResult));

    //* 3. If Similar message found, return cached response
    if (searchResult && searchResult.documents.length > 0) {
      const bestMatch = searchResult.documents[0];
      const similarity = parseFloat(bestMatch.value.similarity);

      // For Redis COSINE, the result is a distance (lower is better).
      // A distance of 0.1 is equivalent to 90% similarity (1 - 0.9).
      // const DISTANCE_THRESHOLD = 0.1;
      const DISTANCE_THRESHOLD = healthContext ? 0.08 : 0.1;

      if (similarity <= DISTANCE_THRESHOLD) {
        const cached = bestMatch.value.response as string;

        //* Use AI SDK's format for cached response
        const result = streamText({
          model: openai("gpt-4o-mini"),
          messages: [{ role: "assistant", content: cached }],
          maxTokens: 500,
        });

        const response = result.toDataStreamResponse();
        //* Add custom header to indicate cached response
        response.headers.set("X-Response-Source", "cache");
        return response;
      }
    }

    //* 4. No Match - Generate new Response with health context
    const systemPrompt = `You are an AI wellness coach. Your role is to provide helpful, encouraging, and evidence-based advice on health, fitness, nutrition, and mental well-being.

    Guidelines:
    - Be supportive and motivational
    - Provide practical, actionable advice
    - Ask clarifying questions when needed
    - Encourage professional medical consultation for serious health concerns
    - Focus on sustainable lifestyle changes
    - Be empathetic and understanding
    - Use the provided health data context to give personalized advice
    - Reference specific data points when relevant (e.g., "I see your sleep average this week is...")
    - Celebrate achievements and provide encouragement for areas needing improvement
    - Make recommendations based on trends and patterns in their data

    ${healthContextString}

    When the user's health data is available, use it to:
    1. Provide personalized insights and recommendations
    2. Track progress toward their goals
    3. Identify patterns and trends
    4. Celebrate achievements
    5. Offer specific, data-driven advice

    Remember to be encouraging and focus on small, sustainable improvements rather than dramatic changes.`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      maxTokens: 500,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
      onFinish: async (result) => {
        // Save to Redis after streaming is complete
        const timestamp = Date.now();
        const key = `chat:${userId}:${timestamp}`;

        const chatData = {
          response: result.text,
          embedding: Array.from(new Float32Array(vectorBuffer.buffer)), //* Store as array for JSON
          userId,
          timestamp,
          inputText: inputText.toLowerCase().trim(),
          hasHealthContext: !!healthContext, //* Track whether health context was used
        };

        await redisClient.json.set(key, "$", chatData);
      },
    });

    const response = result.toDataStreamResponse();
    //* Add custom header to indicate generated response
    response.headers.set("X-Response-Source", "generated");
    response.headers.set("X-Health-Context", healthContext ? "true" : "false");
    return response;
  } catch (error) {
    console.error("Error in chat API:", error);

    // You can return a more specific error response if needed
    if (error instanceof Error && error.name === "AbortError") {
      return new Response("Request aborted", { status: 499 });
    }

    return new Response("An internal error occurred. Please try again.", {
      status: 500,
    });
  }
}
