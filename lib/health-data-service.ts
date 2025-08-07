import { timestamp } from "drizzle-orm/gel-core";
import { redisClient } from "./redis";
import { date, promise } from "zod";

export class HealthDataService {
  private cacheTime = 300; //* 5 minutes

  async getUserHealthContext(
    userId: string,
    query: string
  ): Promise<HealthContext> {
    try {
      //* 1. Analyze the query to understand what data is needed
      const analysis = await this.analyzeQuery(query);

      //* 2. fetch relevant health data based on analysis
      const healthContext = await this.buildHealthContext(userId, analysis);

      return healthContext;
    } catch (error) {
      console.error("Error getting health context:", error);
      return this.getDefaultHealthContext(userId);
    }
  }

  private async analyzeQuery(query: string): Promise<QueryAnalysis> {
    const lowerQuery = query.toLowerCase();

    //* Simple keyword-based analysis (can be enhanced with AI later)
    const analysisRules = {
      timeframes: {
        today: ["today", "today's", "current"],
        week: ["week", "weekly", "past week", "this week", "7 days"],
        month: ["month", "monthly", "past month", "this month", "30 days"],
        year: ["year", "yearly", "annual"],
      },
      metrics: {
        sleep: ["sleep", "sleeping", "rest", "bedtime"],
        steps: ["steps", "walking", "activity", "movement"],
        water: ["water", "hydration", "drink", "fluid"],
        mood: ["mood", "emotion", "feelings", "mental"],
      },
      intents: {
        compare: ["compare", "vs", "versus", "difference", "better", "worse"],
        trend: ["trend", "progress", "improvement", "decline", "pattern"],
        goal_progress: ["goal", "target", "achievement", "progress", "reach"],
        recommendation: ["advice", "suggest", "recommend", "help", "improve"],
      },
    };

    //* Default
    let timeframe = "week";
    let metrics: string[] = [];
    let intent = "general";
    let contextNeeded = true;

    //* Detect Timeframe
    for (const [tf, keywords] of Object.entries(analysisRules.timeframes)) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        timeframe = tf;
        break;
      }
    }

    //* Detect Metrics
    for (const [metric, keywords] of Object.entries(analysisRules.metrics)) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        metrics.push(metric);
      }
    }

    //* If no specific metrics mentioned, includes all
    if (metrics.length === 0) {
      metrics = ["sleep", "steps", "water", "mood"];
    }

    //* Detect Intent
    for (const [intentType, keywords] of Object.entries(
      analysisRules.intents
    )) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        intent = intentType;
        break;
      }
    }

    return {
      intent: intent as QueryAnalysis["intent"],
      timeframe,
      metrics,
      contextNeeded,
      confidence: 0.8, //* Basic confidence score
    };
  }

  private async buildHealthContext(
    userId: string,
    analysis: QueryAnalysis
  ): Promise<HealthContext> {
    const [recentData, trends, goals, insights] = await Promise.all([
      this.getRecentMetrics(userId, analysis.timeframe),
      this.getTrends(userId, analysis.metrics),
      this.getUserGoals(userId),
      this.getHealthInsights(userId),
    ]);

    return {
      timeframe: analysis.timeframe as HealthContext["timeframe"],
      metrics: analysis.metrics as HealthContext["metrics"],
      trends,
      goals,
      insights,
      recentData,
    };
  }

  private async getRecentMetrics(userId: string, timeframe: string) {
    const cacheKey = `metrics:${userId}:${timeframe}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn("Cache read failed:", error);
    }

    const now = Date.now();
    let fromTimestamp: number;

    switch (timeframe) {
      case "today":
        fromTimestamp = new Date().setHours(0, 0, 0, 0);
        break;
      case "week":
        fromTimestamp = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        fromTimestamp = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        fromTimestamp = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        fromTimestamp = now - 7 * 24 * 60 * 60 * 1000; //* Default to week
    }

    const results = await Promise.allSettled([
      this.getMetricData(userId, "sleep", fromTimestamp, now),
      this.getMetricData(userId, "steps", fromTimestamp, now),
      this.getMetricData(userId, "water", fromTimestamp, now),
      this.getMoodData(userId, fromTimestamp, now),
    ]);

    const recentData = {
      sleep: results[0].status === "fulfilled" ? results[0].value : [],
      steps: results[1].status === "fulfilled" ? results[1].value : [],
      water: results[2].status === "fulfilled" ? results[2].value : [],
      mood: results[3].status === "fulfilled" ? results[3].value : [],
    };

    //* Cache the result
    try {
      await redisClient.setEx(
        cacheKey,
        this.cacheTime,
        JSON.stringify(recentData)
      );
    } catch (error) {
      console.warn("Cache write failed:", error);
    }

    return recentData;
  }

  private async getMetricData(
    userId: string,
    metric: string,
    from: number,
    to: number
  ): Promise<MetricData[]> {
    try {
      const data = await redisClient.ts.range(
        `ts:${metric}:${userId}`,
        from,
        to
      );
      return data.map(
        ({ timestamp, value }: { timestamp: number; value: number }) => ({
          date: new Date(timestamp).toLocaleDateString(),
          value: Number(value),
        })
      );
    } catch (error) {
      console.warn(`Failed to get ${metric} data:`, error);
      return [];
    }
  }

  private async getMoodData(userId: string, from: number, to: number) {
    try {
      const data = await redisClient.xRange(
        `stream:health:${userId}`,
        from.toString(),
        to.toString()
      );
      return data.map((entry: any) => ({
        date: new Date(parseInt(entry.id.split("-")[0])).toLocaleDateString(),
        mood: entry.message.mood,
      }));
    } catch (error) {
      console.warn("failed to get mood data:", error);
      return [];
    }
  }
  private async getTrends(
    userId: string,
    metrics: string[]
  ): Promise<HealthTrend[]> {
    const trends: HealthTrend[] = [];

    for (const metric of metrics) {
      try {
        const trend = await this.calculateTrend(userId, metric);
        if (trend) trends.push(trend);
      } catch (error) {
        console.warn(`Failed to calculate trend for ${metric}:`, error);
      }
    }
    return trends;
  }

  private async calculateTrend(
    userId: string,
    metric: string
  ): Promise<HealthTrend | null> {
    try {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const twoWeekAgo = now - 14 * 24 * 60 * 60 * 1000;

      const [thisWeek, lastWeek] = await Promise.all([
        redisClient.ts.range(`ts:${metric}:${userId}`, oneWeekAgo, now),
        redisClient.ts.range(`ts:${metric}:${userId}`, twoWeekAgo, oneWeekAgo),
      ]);

      if (thisWeek.length === 0 || lastWeek.length === 0) return null;

      const thisWeekAvg =
        thisWeek.reduce((sum, { value }) => sum + value, 0) / thisWeek.length;
      const lastWeekAvg =
        lastWeek.reduce((sum, { value }) => sum + value, 0) / lastWeek.length;

      const percentage = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;
      return {
        metric,
        direction: percentage > 5 ? "up" : percentage < -5 ? "down" : "stable",
        percentage: Math.abs(percentage),
        period: "week",
      };
    } catch (error) {
      console.warn(`Trend calculation failed for ${metric}:`, error);
      return null;
    }
  }

  private async getUserGoals(userId: string): Promise<UserGoal[]> {
    try {
      const profile = (await redisClient.json.get(
        `profile:${userId}`
      )) as unknown as UserHealthProfile;

      if (!profile || !profile.goals) {
        return await this.getDefaultGoals();
      }

      //* Get current averages to calculate progress
      const recentData = await this.getRecentMetrics(userId, "week");

      const goals: UserGoal[] = [];

      for (const [metric, goal] of Object.entries(profile.goals)) {
        const currentData = recentData[
          metric as keyof typeof recentData
        ] as MetricData[];
        const current =
          currentData.length > 0
            ? currentData.reduce((sum, d) => sum + d.value, 0) /
              currentData.length
            : 0;

        goals.push({
          metric,
          target: goal.target,
          current,
          progress: (current / goal.target) * 100,
          priority: goal.priority,
        });
      }
      return goals;
    } catch (error) {
      console.warn("Failed to get user goals:", error);
      return this.getDefaultGoals();
    }
  }

  private getDefaultGoals(): UserGoal[] {
    return [
      { metric: "sleep", target: 8, current: 0, progress: 0, priority: "high" },
      {
        metric: "steps",
        target: 10000,
        current: 0,
        progress: 0,
        priority: "medium",
      },
      {
        metric: "water",
        target: 2,
        current: 0,
        progress: 0,
        priority: "medium",
      },
    ];
  }

  private async getHealthInsights(userId: string): Promise<HealthInsight[]> {
    try {
      const insights = (await redisClient.json.get(
        `insights:${userId}`
      )) as unknown as HealthInsight[];
      return insights || [];
    } catch (error) {
      console.warn("Failed to get health insights:", error);
      return [];
    }
  }

  private async getDefaultHealthContext(
    userId: string
  ): Promise<HealthContext> {
    return {
      timeframe: "week",
      metrics: ["sleep", "steps"],
      trends: [],
      goals: this.getDefaultGoals(),
      insights: [],
      recentData: {
        sleep: [],
        steps: [],
        water: [],
        mood: [],
      },
    };
  }

  //* Helper method to format health context for AI prompt
  formatHealthContextForAI(context: HealthContext): string {
    let contextString = `\n--- USER HEALTH DATA CONTEXT ---\n`;

    //* Recent data summary
    contextString += `Recent ${context.timeframe} data:\n`;
    for (const metric of context.metrics) {
      const data = context.recentData[
        metric as keyof typeof context.recentData
      ] as MetricData[];
      if (data && data.length > 0) {
        const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
        const latest = data[data.length - 1]?.value || 0;
        contextString += `- ${metric}: Latest: ${latest}, Average: ${avg.toFixed(
          1
        )}\n`;
      }
    }

    //* Goals and progress
    if (context.goals.length > 0) {
      contextString += `\nGoals and Progress:\n`;
      context.goals.forEach((goal) => {
        contextString += `- ${goal.metric}: ${goal.current.toFixed(1)}/${
          goal.target
        } (${goal.progress.toFixed(1)}% complete)\n`;
      });
    }

    //* Trends
    if (context.trends.length > 0) {
      contextString += `\nRecent Trends:\n`;
      context.trends.forEach((trend) => {
        contextString += `- ${trend.metric}: ${
          trend.direction
        } by ${trend.percentage.toFixed(1)}% over past ${trend.period}\n`;
      });
    }

    //* Insights
    if (context.insights.length > 0) {
      contextString += `\nKey Insights:\n`;
      context.insights.slice(0, 3).forEach((insight) => {
        contextString += `- ${insight.message}\n`;
      });
    }

    contextString += `--- END HEALTH DATA CONTEXT ---\n`;

    return contextString;
  }
}
