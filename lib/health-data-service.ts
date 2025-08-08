import { redisClient } from "./redis";
import type {
  HealthContext,
  HealthTrend,
  UserGoal,
  HealthInsight,
  QueryAnalysis,
  UserHealthProfile,
  MetricData,
} from "@/types";

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

    //* Enhanced keyword-based analysis with specific date support
    const analysisRules = {
      timeframes: {
        today: ["today", "today's", "current"],
        yesterday: ["yesterday", "yest"],
        day_before_yesterday: [
          "day before yesterday",
          "day after yesterday",
          "2 days ago",
          "two days ago",
          "day before yest",
        ],
        three_days_ago: ["3 days ago", "three days ago"],
        week: ["week", "weekly", "past week", "this week", "7 days"],
        last_week: ["last week", "previous week"],
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
        console.log(
          `Date parsing: Query "${query}" matched timeframe "${timeframe}"`
        );
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
    let toTimestamp: number = now;

    switch (timeframe) {
      case "today":
        fromTimestamp = new Date().setHours(0, 0, 0, 0);
        toTimestamp = new Date().setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        fromTimestamp = yesterday.setHours(0, 0, 0, 0);
        toTimestamp = yesterday.setHours(23, 59, 59, 999);
        break;
      case "day_before_yesterday":
        const dayBefore = new Date();
        dayBefore.setDate(dayBefore.getDate() - 2);
        fromTimestamp = dayBefore.setHours(0, 0, 0, 0);
        toTimestamp = dayBefore.setHours(23, 59, 59, 999);
        break;
      case "three_days_ago":
        const threeDays = new Date();
        threeDays.setDate(threeDays.getDate() - 3);
        fromTimestamp = threeDays.setHours(0, 0, 0, 0);
        toTimestamp = threeDays.setHours(23, 59, 59, 999);
        break;
      case "week":
        fromTimestamp = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "last_week":
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 14);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - 7);
        fromTimestamp = weekStart.getTime();
        toTimestamp = weekEnd.getTime();
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
      this.getMetricData(userId, "sleep", fromTimestamp, toTimestamp),
      this.getMetricData(userId, "steps", fromTimestamp, toTimestamp),
      this.getMetricData(userId, "water", fromTimestamp, toTimestamp),
      this.getMoodData(userId, fromTimestamp, toTimestamp),
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

      //* Get current averages to calculate progress - use "week" for goals calculation
      const recentData = await this.getRecentMetrics(userId, "week");
      console.log(
        "Goals calculation - recent data:",
        JSON.stringify(recentData, null, 2)
      );

      const goals: UserGoal[] = [];

      for (const [metric, goal] of Object.entries(profile.goals)) {
        const currentData = recentData[
          metric as keyof typeof recentData
        ] as any[];

        let current = 0;

        if (currentData && currentData.length > 0) {
          if (metric === "mood") {
            //* Special handling for mood data - convert strings to scores for goals
            const moodEntries = currentData.filter((d) => d.mood !== undefined);
            if (moodEntries.length > 0) {
              const moodScores = moodEntries.map((d) =>
                this.getMoodScore(d.mood)
              );
              current =
                moodScores.reduce((sum, score) => sum + score, 0) /
                moodScores.length;
            }
          } else {
            //* Regular metrics with .value property
            current =
              currentData.reduce((sum, d) => sum + (d.value || 0), 0) /
              currentData.length;
          }
        }

        goals.push({
          metric,
          target: goal.target,
          current,
          progress: goal.target > 0 ? (current / goal.target) * 100 : 0,
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

    //* Format timeframe description for better AI understanding
    const timeframeDescription = this.getTimeframeDescription(
      context.timeframe
    );
    contextString += `Data for ${timeframeDescription}:\n`;
    for (const metric of context.metrics) {
      const data = context.recentData[
        metric as keyof typeof context.recentData
      ] as any[];

      if (data && data.length > 0) {
        if (metric === "mood") {
          //* Special handling for mood data - string values (sad, happy, excited, neutral)
          const moodEntries = data.filter((d) => d.mood !== undefined);
          if (moodEntries.length > 0) {
            const latest =
              moodEntries[moodEntries.length - 1]?.mood || "unknown";
            const moodCounts = this.getMoodDistribution(
              moodEntries.map((d) => d.mood)
            );
            const mostCommon =
              Object.entries(moodCounts).sort(
                ([, a], [, b]) => b - a
              )[0]?.[0] || "unknown";

            contextString += `- ${metric}: Latest: ${latest}, Most common: ${mostCommon}\n`;
            contextString += `  Mood distribution: ${Object.entries(moodCounts)
              .map(([mood, count]) => `${mood}(${count})`)
              .join(", ")}\n`;
          } else {
            contextString += `- ${metric}: No data available\n`;
          }
        } else {
          //* Regular metric data structure
          const avg =
            data.reduce((sum, d) => sum + (d.value || 0), 0) / data.length;
          const latest = data[data.length - 1]?.value || 0;
          contextString += `- ${metric}: Latest: ${latest}, Average: ${avg.toFixed(
            1
          )}\n`;
        }
      } else {
        contextString += `- ${metric}: No data available\n`;
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

  //* Helper method to get human-readable timeframe description
  private getTimeframeDescription(timeframe: string): string {
    const today = new Date();

    switch (timeframe) {
      case "today":
        return "today (" + today.toLocaleDateString() + ")";
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return "yesterday (" + yesterday.toLocaleDateString() + ")";
      case "day_before_yesterday":
        const dayBefore = new Date(today);
        dayBefore.setDate(dayBefore.getDate() - 2);
        return "day before yesterday (" + dayBefore.toLocaleDateString() + ")";
      case "three_days_ago":
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() - 3);
        return "three days ago (" + threeDays.toLocaleDateString() + ")";
      case "week":
        return "the past 7 days";
      case "last_week":
        return "last week";
      case "month":
        return "the past 30 days";
      case "year":
        return "the past year";
      default:
        return timeframe;
    }
  }

  //* Helper method to convert mood strings to numerical scores for goals calculation
  private getMoodScore(mood: string): number {
    const moodScores: Record<string, number> = {
      sad: 1,
      neutral: 2.5,
      happy: 4,
      excited: 5,
    };
    return moodScores[mood?.toLowerCase()] || 2.5; // Default to neutral
  }

  //* Helper method to count mood distribution
  private getMoodDistribution(moods: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    moods.forEach((mood) => {
      const normalizedMood = mood?.toLowerCase() || "unknown";
      distribution[normalizedMood] = (distribution[normalizedMood] || 0) + 1;
    });
    return distribution;
  }
}
