import { auth } from "@/lib/auth";
import { getRedisClient } from "@/lib/redis";
import { HealthInsightService } from "@/lib/health-insight-service";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { HealthInsight } from "@/types";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Redis client with lazy connection
    const redisClient = await getRedisClient();

    //* Get User insights
    let insights = (await redisClient.json.get(
      `insights:${userId}`
    )) as unknown as HealthInsight[];

    //* If no insights exist, try to generate them from recent data
    if (!insights || insights.length === 0) {
      console.log(
        "No insights found, attempting to generate from recent data..."
      );
      try {
        const healthInsightService = new HealthInsightService();

        // Get most recent health entry to trigger insight generation
        const recentEntries = await redisClient.xRevRange(
          `stream:health:${userId}`,
          "-",
          "+",
          { COUNT: 1 }
        );

        if (recentEntries && recentEntries.length > 0) {
          const entry = recentEntries[0];
          const healthEntry = {
            steps: parseInt(entry.message.steps) || 0,
            sleep: parseFloat(entry.message.sleep) || 0,
            mood: entry.message.mood || "",
            water: entry.message.water
              ? parseFloat(entry.message.water)
              : undefined,
            timestamp: parseInt(entry.id.split("-")[0]),
          };

          // Process this entry to generate insights
          await healthInsightService.processNewHealthEntry(userId, healthEntry);

          // Re-fetch insights after generation
          insights = (await redisClient.json.get(
            `insights:${userId}`
          )) as unknown as HealthInsight[];

          console.log(`Generated ${insights?.length || 0} insights`);
        }
      } catch (error) {
        console.error("Error generating insights on-demand:", error);
      }
    }

    //* Get goal progress for today
    const today = new Date().toISOString().split("T")[0];
    const goalProgress = await getGoalProgress(redisClient, userId, today);

    //* Get recent trends
    const trends = await getRecentTrends(redisClient, userId);

    return NextResponse.json(
      {
        insights: insights || [],
        trends,
        goalProgress,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching health insights:", error);
    return NextResponse.json(
      { error: "Error occured while fetching health insights." },
      { status: 500 }
    );
  }
}

async function getGoalProgress(redisClient: any, userId: string, date: string) {
  try {
    const progressKeys = [
      `progress:${userId}:sleep:${date}`,
      `progress:${userId}:steps:${date}`,
      `progress:${userId}:water:${date}`,
    ];

    const progressData = await Promise.allSettled(
      progressKeys.map((key) => redisClient.json.get(key))
    );

    return progressData
      .map((result, index) => {
        if (result.status === "fulfilled" && result.value) {
          return result.value;
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Error getting goal progress:", error);
    return [];
  }
}

async function getRecentTrends(redisClient: any, userId: string) {
  try {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeekAgo = now - 14 * 24 * 60 * 60 * 1000;

    const metrics = ["sleep", "steps", "water"];
    const trends = [];

    for (const metric of metrics) {
      try {
        const [thisWeek, lastWeek] = await Promise.all([
          redisClient.ts.range(`ts:${metric}:${userId}`, oneWeekAgo, now),
          redisClient.ts.range(
            `ts:${metric}:${userId}`,
            twoWeekAgo,
            oneWeekAgo
          ),
        ]);

        if (thisWeek.length > 0 && lastWeek.length > 0) {
          const thisWeekAvg =
            thisWeek.reduce((sum: number, { value }: { value: number }) => sum + value, 0) /
            thisWeek.length;
          const lastWeekAvg =
            lastWeek.reduce((sum: number, { value }: { value: number }) => sum + value, 0) /
            lastWeek.length;
          const percentage = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;

          trends.push({
            metric,
            direction:
              percentage > 5 ? "up" : percentage < -5 ? "down" : "stable",
            percentage: Math.abs(percentage),
            period: "week",
            currentAvg: thisWeekAvg,
            previousAvg: lastWeekAvg,
          });
        }
      } catch (error) {
        console.warn(`Failed to calculate trend for ${metric}:`, error);
      }
    }
    return trends;
  } catch (error) {
    console.error("Error getting recent trends:", error);
    return [];
  }
}
