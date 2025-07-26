import { createClient } from "redis";

// Create Redis client with all modules
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

await redisClient.connect();

export const VECTOR_DIMENSIONS = 1536; //* OpenAI embedding size

//* Converts a vector (number[]) into base64-encoded Float32Array for redis
export function toBase64Embedding(vector: number[]): string {
  return Buffer.from(new Float32Array(vector).buffer).toString("base64");
}

//* Ensures the redis vector index is created only once
export async function ensureIndexExists() {
  try {
    await redisClient.ft.create("chat_cache", {
      embedding: {
        type: "VECTOR",
        ALGORITHM: "HNSW",
        TYPE: "FLOAT32",
        DIM: VECTOR_DIMENSIONS,
        DISTANCE_METRIC: "COSINE",
      },
      userID: { type: "TEXT" },
      timestamp: { type: "NUMERIC" },
    });
    console.log("Vector index created");
  } catch (error: any) {
    if (!error.message.includes("Index already exists")) {
      console.error("Redis index creation failed:", error);
    }
  }
}
