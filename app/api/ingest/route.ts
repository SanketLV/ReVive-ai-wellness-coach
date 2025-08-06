import { auth } from "@/lib/auth";
import { HealthInsightService } from "@/lib/health-insight-service";
import { redisClient } from "@/lib/redis";
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

    //* Check if an entry for this timestamp already exists in the stream
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

    //* Add to stream
    await redisClient.xAdd(`stream:health:${userId}`, String(timestamp), {
      type: "health",
      steps,
      sleep,
      mood,
      ...(water ? { water } : {}),
    });

    //* Add to time series
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

    //* Update latest data
    await redisClient.json.set(`latest:health:${userId}:`, "$", {
      steps,
      sleep,
      mood,
      water: water || null,
    });

    //* Process health insights and update aggregated data
    try {
      const healthInsightService = new HealthInsightService();

      //* Process new entry for insights(fire and forget)
      healthInsightService
        .processNewHealthEntry(userId, {
          steps,
          sleep,
          mood,
          water,
          timestamp,
        })
        .catch((error) => {
          console.error("Failed to process health insights:", error);
        });

      //* Update health summary data
      await updateHealthSummary(userId, {
        steps,
        sleep,
        mood,
        water,
        timestamp,
      });

      //* clear relevant caches
      await clearHealthCaches(userId);
    } catch (error) {
      console.error("Error processing health insights:", error);
    }

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

async function updateHealthSummary(userId: string, data: any) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const summaryKey = `summary:daily:${userId}:${today}`;

    //* Get existing summary or create new one
    let summary = (await redisClient.json.get(summaryKey)) as any;

    if (!summary) {
      summary = {
        userId,
        period: "daily",
        date: today,
        entries: [],
        metrics: {
          sleep: { total: 0, count: 0, avg: 0 },
          steps: { total: 0, count: 0, avg: 0 },
          water: { total: 0, count: 0, avg: 0 },
          mood: { distribution: {} },
        },
      };
    }

    //* update summary with new data
    const metrics = summary.metrics;

    metrics.sleep.total += data.sleep;
    metrics.sleep.count += 1;
    metrics.sleep.avg = metrics.sleep.total / metrics.sleep.count;

    metrics.steps.total += data.steps;
    metrics.steps.count += 1;
    metrics.steps.avg = metrics.steps.total / metrics.steps.count;

    if (data.water) {
      metrics.water.total += data.water;
      metrics.water.count += 1;
      metrics.water.avg = metrics.water.total / metrics.water.count;
    }

    if (data.mood) {
      metrics.mood.distribution[data.mood] =
        (metrics.mood.distribution[data.mood] || 0) + 1;
    }

    summary.entries.push({
      timestamp: data.timestamp,
      data,
    });

    await redisClient.json.set(summaryKey, "$", summary);

    // Set expiration for 1 year
    await redisClient.expire(summaryKey, 365 * 24 * 60 * 60);
  } catch (error) {
    console.error("Failed to update health summary:", error);
  }
}

async function clearHealthCaches(userId: string) {
  try {
    const cachePatterns = [
      `metrics:${userId}:*`,
      `insights:${userId}`,
      `trends:${userId}:*`,
    ];

    for (const pattern of cachePatterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error("Failed to clear health caches:", error);
  }
}
