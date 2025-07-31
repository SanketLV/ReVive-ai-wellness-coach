import { NextResponse } from "next/server";
import { redisClient } from "@/lib/redis";

export async function GET() {
  try {
    // Test Redis connection
    await redisClient.ping();

    return NextResponse.json({
      status: "healthy",
      services: {
        redis: "connected",
        api: "running",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        services: {
          redis: "disconnected",
          api: "running",
        },
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
