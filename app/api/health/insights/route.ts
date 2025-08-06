import { auth } from "@/lib/auth";
import { redisClient } from "@/lib/redis";
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

    //* Get User insights
    const insights = (await redisClient.json.get(
      `insights:${userId}`
    )) as unknown as HealthInsight[];

    //* Get goal progress for today
    const today = new Date().toISOString().split("T")[0];
    const goalProgress = await getGoalProgress(userId, today);

    //* Get recent trends
    const trends = await getRecentTrends(userId);

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

async function getGoalProgress(userId: string, date: string) {
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

async function getRecentTrends(userId: string) {
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
            thisWeek.reduce((sum, { value }) => sum + value, 0) /
            thisWeek.length;
          const lastWeekAvg =
            lastWeek.reduce((sum, { value }) => sum + value, 0) /
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
  } catch (error) {
    console.error("Error getting recent trends:", error);
    return [];
  }
}
