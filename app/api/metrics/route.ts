import { auth } from "@/lib/auth";
import { redisClient } from "@/lib/redis";
import { getFormattedDate } from "@/lib/utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const fromTimestamp = now - 6 * oneDay;

    const stepsRange = await redisClient.ts.range(
      `ts:steps:${userId}`,
      fromTimestamp,
      now
    );
    const sleepRange = await redisClient.ts.range(
      `ts:sleep:${userId}`,
      fromTimestamp,
      now
    );

    const sleepData = sleepRange.map(
      ({ timestamp, value }: { timestamp: number; value: number }) => ({
        date: getFormattedDate(timestamp),
        value: Number(value),
      })
    );

    const stepsData = stepsRange.map(
      ({ timestamp, value }: { timestamp: number; value: number }) => ({
        date: getFormattedDate(timestamp),
        value: Number(value),
      })
    );

    return NextResponse.json({ sleepData, stepsData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching health data:", error);
    return NextResponse.json(
      {
        error: "Error occured while fetching the health data.",
      },
      { status: 500 }
    );
  }
}
