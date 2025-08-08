import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

// Get embedding using Vercel AI SDK
export async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding;
}
