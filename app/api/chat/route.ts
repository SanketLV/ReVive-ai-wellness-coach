import { getEmbedding } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { ensureIndexExists, redisClient, vectorToBuffer } from "@/lib/redis";
import { openai } from "@ai-sdk/openai";
import { streamText, smoothStream } from "ai";
import { headers } from "next/headers";

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

    await ensureIndexExists();

    //* 1. Embed user Message
    const lastMessage = messages[messages.length - 1];
    const inputText = lastMessage.parts?.[0]?.text || lastMessage.content;

    //* 2. Search Redis Vector Index
    const embedding = await getEmbedding(inputText);
    const vectorBuffer = vectorToBuffer(embedding);
    const searchResult = await redisClient.ft.search(
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
    );

    console.log("Search result:", JSON.stringify(searchResult));

    //* 3. If Similar message found, return cached response
    if (searchResult && searchResult.documents.length > 0) {
      const bestMatch = searchResult.documents[0];
      const similarity = parseFloat(bestMatch.value.similarity as string);

      // Use a similarity threshold (0.95 means 95% similar)
      // Adjust this threshold based on your needs
      const SIMILARITY_THRESHOLD = 0.9;
      if (similarity >= SIMILARITY_THRESHOLD) {
        const cached = bestMatch.value.response as string;

        //* Use AI SDK's format for cached response
        const result = streamText({
          model: openai("gpt-4o-mini"),
          messages: [{ role: "assistant", content: cached }],
          maxTokens: 2,
        });

        const response = result.toDataStreamResponse();
        //* Add custom header to indicate cached response
        response.headers.set("X-Response-Source", "cache");
        return response;
      }
    }

    //* 4. No Match - stream AI response

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `You are an AI wellness coach. Your role is to provide helpful, encouraging, and evidence-based advice on health, fitness, nutrition, and mental well-being.

          Guidelines:
          - Be supportive and motivational
          - Provide practical, actionable advice
          - Ask clarifying questions when needed
          - Encourage professional medical consultation for serious health concerns
          - Focus on sustainable lifestyle changes
          - Be empathetic and understanding`,
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
        };

        await redisClient.json.set(key, "$", chatData);
      },
    });

    const response = result.toDataStreamResponse();
    //* Add custom header to indicate generated response
    response.headers.set("X-Response-Source", "generated");
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
