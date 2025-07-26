import { openai } from "@ai-sdk/openai";
import { streamText, smoothStream } from "ai";

// Set the runtime to edge for best performance
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

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
    });

    return result.toDataStreamResponse();
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
