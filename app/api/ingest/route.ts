import { auth } from "@/lib/auth";
import { readHealthDataAfter, redisClient } from "@/lib/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { steps, sleep, mood, water, timestamp } = body;

    // Check if an entry for this timestamp already exists in the stream
    const existing = await redisClient.xRange(
      `stream:health:${userId}`,
      String(timestamp),
      String(timestamp)
    );
    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Data for this date already exists. Please edit or delete it first.",
        },
        { status: 409 }
      );
    }

    await redisClient.xAdd(`stream:health:${userId}`, String(timestamp), {
      type: "health",
      steps,
      sleep,
      mood,
      ...(water ? { water } : {}),
    });

    const tsPromises = [
      redisClient.ts.add(`ts:steps:${userId}`, timestamp, steps),
      redisClient.ts.add(`ts:sleep:${userId}`, timestamp, sleep),
    ];
    if (water) {
      tsPromises.push(
        redisClient.ts.add(`ts:water:${userId}`, timestamp, water)
      );
    }

    await Promise.all(tsPromises);

    await redisClient.json.set(`latest:health:${userId}:`, "$", {
      steps,
      sleep,
      mood,
      water: water || null,
    });

    return NextResponse.json(
      { message: "Successfully Added the data." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error while ingesting the data:", error);
    return NextResponse.json(
      { error: "An error occurred while ingesting the data." },
      { status: 500 }
    );
  }
}
