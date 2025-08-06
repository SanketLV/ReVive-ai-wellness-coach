import { createClient } from "redis";

// Create Redis client with all modules
export const redisClient = createClient({
  // url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

await redisClient.connect();

export const VECTOR_DIMENSIONS = 1536; //* OpenAI embedding size

// Converts a vector (number[]) into Float32Array buffer for Redis
export function vectorToBuffer(vector: number[]): Buffer {
  return Buffer.from(new Float32Array(vector).buffer);
}

// Ensures the redis vector index is created only once
export async function ensureIndexExists() {
  try {
    const exists = await redisClient.sendCommand(["FT.INFO", "chat_cache"]);
    if (!exists) {
      // Create the index with proper schema
      await redisClient.ft.create(
        "chat_cache",
        {
          "$.embedding": {
            type: "VECTOR",
            ALGORITHM: "HNSW",
            TYPE: "FLOAT32",
            DIM: VECTOR_DIMENSIONS,
            DISTANCE_METRIC: "COSINE",
            M: 16,
            AS: "embedding",
            EF_CONSTRUCTION: 200,
          },
          "$.response": { type: "TEXT", AS: "response" },
          "$.userId": { type: "TEXT", AS: "userId" },
          "$.timestamp": { type: "NUMERIC", AS: "timestamp" },
          "$.inputText": { type: "TEXT", AS: "inputText" },
        },
        {
          ON: "JSON",
          PREFIX: "chat:",
        }
      );
      console.log("Vector index created successfully");
    }
    console.log("Vector index already existed.");
  } catch (error: unknown) {
    console.error("Redis index creation failed:", error);
    throw error;
  }
}

export async function readHealthDataAfter(
  userId: string,
  afterId: string = "0"
): Promise<Array<{ id: string; timestamp: Date; data: Record<string, any> }>> {
  try {
    const result = await redisClient.xRead(
      { key: `stream:health:${userId}`, id: afterId },
      { COUNT: 100, BLOCK: 0 } // BLOCK: 0 means don't block, return immediately
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const streamData = result[0] as {
        name: string;
        messages: { id: string; message: { [x: string]: string } }[];
      };
      return streamData.messages.map((entry) => ({
        id: entry.id,
        timestamp: new Date(parseInt(entry.id.split("-")[0])),
        data: entry.message,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error reading stream after ID:", error);
    return [];
  }
}
