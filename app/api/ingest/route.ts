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

    const { steps, sleep, mood, water } = body;

    const storedData = await redisClient.xAdd(`stream:health:${userId}`, "*", {
      type: "health",
      steps,
      sleep,
      mood,
      ...(water ? { water } : {}),
    });

    console.log("StoredData:", storedData);

    const tsPromises = [
      redisClient.ts.add(`ts:steps:${userId}`, "*", steps),
      redisClient.ts.add(`ts:sleep:${userId}`, "*", sleep),
    ];
    if (water) {
      tsPromises.push(redisClient.ts.add(`ts:water:${userId}`, "*", water));
    }

    await Promise.all(tsPromises);

    const jsonData = await redisClient.json.set(
      `latest:health:${userId}:`,
      "$",
      {
        steps,
        sleep,
        mood,
        water: water || null,
      }
    );

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
