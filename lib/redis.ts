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
  await ensureChatIndex();
  await ensureRecommendationIndices();
}

async function ensureChatIndex() {
  try {
    // If the index exists, this succeeds; if not, it throws
    await redisClient.sendCommand(["FT.INFO", "chat_cache"]);
    console.log("Chat vector index already existed.");
    return;
  } catch (infoError) {
    // Create the index when it does not exist
    try {
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
      console.log("Chat vector index created successfully");
    } catch (createError) {
      console.error("Redis chat index creation failed:", createError);
      throw createError;
    }
  }
}

async function ensureRecommendationIndices() {
  // Create meals index
  try {
    await redisClient.sendCommand(["FT.INFO", "meals_index"]);
    console.log("Meals index already existed.");
  } catch (infoError) {
    try {
      await redisClient.ft.create(
        "meals_index",
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
          "$.title": { type: "TEXT", AS: "title" },
          "$.description": { type: "TEXT", AS: "description" },
          "$.type": { type: "TAG", AS: "type" },
          "$.tags": { type: "TAG", AS: "tags", SEPARATOR: "," },
          "$.dietaryRestrictions": { type: "TAG", AS: "dietaryRestrictions", SEPARATOR: "," },
          "$.calories": { type: "NUMERIC", AS: "calories" },
          "$.prepTime": { type: "NUMERIC", AS: "prepTime" },
          "$.cookTime": { type: "NUMERIC", AS: "cookTime" },
        },
        {
          ON: "JSON",
          PREFIX: "meal:",
        }
      );
      console.log("Meals index created successfully");
    } catch (createError) {
      console.error("Redis meals index creation failed:", createError);
    }
  }

  // Create workouts index
  try {
    await redisClient.sendCommand(["FT.INFO", "workouts_index"]);
    console.log("Workouts index already existed.");
  } catch (infoError) {
    try {
      await redisClient.ft.create(
        "workouts_index",
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
          "$.title": { type: "TEXT", AS: "title" },
          "$.description": { type: "TEXT", AS: "description" },
          "$.type": { type: "TAG", AS: "type" },
          "$.tags": { type: "TAG", AS: "tags", SEPARATOR: "," },
          "$.difficulty": { type: "TAG", AS: "difficulty" },
          "$.duration": { type: "NUMERIC", AS: "duration" },
          "$.equipment": { type: "TAG", AS: "equipment", SEPARATOR: "," },
          "$.targetMuscles": { type: "TAG", AS: "targetMuscles", SEPARATOR: "," },
          "$.caloriesBurned": { type: "NUMERIC", AS: "caloriesBurned" },
        },
        {
          ON: "JSON",
          PREFIX: "workout:",
        }
      );
      console.log("Workouts index created successfully");
    } catch (createError) {
      console.error("Redis workouts index creation failed:", createError);
    }
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
