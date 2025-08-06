import { redisClient } from "./redis";

interface HealthEntry {
  steps: number;
  sleep: number;
  mood: string;
  water?: number;
  timestamp: number;
}

export class HealthInsightService {
  async processNewHealthEntry(
    userId: string,
    entry: HealthEntry
  ): Promise<void> {
    try {
      //* Generate insights based on the new entry
      const insights = await this.generateInsights(userId, entry);

      if (insights.length > 0) {
        //* store insights
        await this.storeInsights(userId, insights);

        //* Update user goals progress
        await this.updateGoalProgress(userId, entry);
      }
    } catch (error) {
      console.error("Error processing health entry:", error);
    }
  }

  private async generateInsights(
    userId: string,
    entry: HealthEntry
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    try {
      //* Get Historical data for comparison
      const historicalData = await this.getHistoricalData(userId, 30); //* Last 30 days
      const goals = await this.getUserGoals(userId);

      //* Sleep insights
      const sleepInsights = await this.analyzeSleep(
        entry,
        historicalData,
        goals
      );
      insights.push(...sleepInsights);

      //* Steps insights
      const stepsInsights = await this.analyzeSteps(
        entry,
        historicalData,
        goals
      );
      insights.push(...stepsInsights);

      //* Water insights
      if (entry.water) {
        const waterInsights = await this.analyzeWater(
          entry,
          historicalData,
          goals
        );
        insights.push(...waterInsights);
      }

      //* Mood insights
      const moodInsights = await this.analyzeMood(entry, historicalData);
      insights.push(...moodInsights);

      //* Cross-metric insights
      const correlationInsights = await this.analyzeCorrelations(
        entry,
        historicalData
      );
      insights.push(...correlationInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    }

    return insights;
  }

  private async analyzeSleep(
    entry: HealthEntry,
    historical: HealthEntry[],
    goals: UserGoal[]
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    const sleepGoal = goals.find((g) => g.metric === "sleep");

    // Goal achievement check
    if (sleepGoal && entry.sleep >= sleepGoal.target) {
      insights.push({
        type: "achievement",
        message: `Great job! You hit your sleep goal of ${sleepGoal.target} hours.`,
        metric: "sleep",
        importance: "high",
        timestamp: new Date(),
      });
    } else if (sleepGoal && entry.sleep < sleepGoal.target - 2) {
      insights.push({
        type: "warning",
        message: `You're ${
          sleepGoal.target - entry.sleep
        } hours short of your sleep goal. Consider going to bed earlier tonight.`,
        metric: "sleep",
        importance: "high",
        timestamp: new Date(),
      });
    }

    // Trend analysis
    if (historical.length >= 7) {
      const recentWeek = historical.slice(-7);
      const previousWeek = historical.slice(-14, -7);

      if (recentWeek.length === 7 && previousWeek.length === 7) {
        const recentAvg = recentWeek.reduce((sum, h) => sum + h.sleep, 0) / 7;
        const previousAvg =
          previousWeek.reduce((sum, h) => sum + h.sleep, 0) / 7;

        const improvement = recentAvg - previousAvg;

        if (improvement > 0.5) {
          insights.push({
            type: "achievement",
            message: `Your sleep has improved by ${improvement.toFixed(
              1
            )} hours this week compared to last week!`,
            metric: "sleep",
            importance: "medium",
            timestamp: new Date(),
          });
        } else if (improvement < -0.5) {
          insights.push({
            type: "suggestion",
            message: `Your sleep has decreased by ${Math.abs(
              improvement
            ).toFixed(
              1
            )} hours this week. Try maintaining a consistent bedtime routine.`,
            metric: "sleep",
            importance: "medium",
            timestamp: new Date(),
          });
        }
      }
    }

    // Sleep quality insights
    if (entry.sleep < 6) {
      insights.push({
        type: "warning",
        message:
          "Getting less than 6 hours of sleep can impact your health and mood. Try to prioritize sleep tonight.",
        metric: "sleep",
        importance: "high",
        timestamp: new Date(),
      });
    } else if (entry.sleep > 9) {
      insights.push({
        type: "suggestion",
        message:
          "You slept more than 9 hours. While rest is important, consistently oversleeping might indicate other health issues.",
        metric: "sleep",
        importance: "low",
        timestamp: new Date(),
      });
    }

    return insights;
  }

  private async analyzeSteps(
    entry: HealthEntry,
    historical: HealthEntry[],
    goals: UserGoal[]
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    const stepsGoal = goals.find((g) => g.metric === "steps");

    // Goal achievement
    if (stepsGoal && entry.steps >= stepsGoal.target) {
      insights.push({
        type: "achievement",
        message: `Awesome! You reached your daily step goal of ${stepsGoal.target.toLocaleString()} steps.`,
        metric: "steps",
        importance: "high",
        timestamp: new Date(),
      });
    }

    // Milestone achievements
    if (entry.steps >= 15000) {
      insights.push({
        type: "milestone",
        message:
          "Outstanding! You walked over 15,000 steps today. That's excellent for your cardiovascular health!",
        metric: "steps",
        importance: "high",
        timestamp: new Date(),
      });
    } else if (entry.steps >= 10000) {
      insights.push({
        type: "achievement",
        message:
          "Great work hitting 10,000+ steps! You're meeting the daily activity recommendation.",
        metric: "steps",
        importance: "medium",
        timestamp: new Date(),
      });
    } else if (entry.steps < 5000) {
      insights.push({
        type: "suggestion",
        message:
          "Try to get more steps in today. Even a short 10-minute walk can make a difference!",
        metric: "steps",
        importance: "medium",
        timestamp: new Date(),
      });
    }

    // Weekly progress
    if (historical.length >= 7) {
      const thisWeek = historical.slice(-6).concat([entry]);
      const weeklyTotal = thisWeek.reduce((sum, h) => sum + h.steps, 0);
      const dailyAverage = weeklyTotal / 7;

      if (stepsGoal && dailyAverage >= stepsGoal.target) {
        insights.push({
          type: "achievement",
          message: `You're averaging ${Math.round(
            dailyAverage
          ).toLocaleString()} steps this week - above your daily goal!`,
          metric: "steps",
          importance: "medium",
          timestamp: new Date(),
        });
      }
    }

    return insights;
  }
  private async analyzeWater(
    entry: HealthEntry,
    historical: HealthEntry[],
    goals: UserGoal[]
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    const waterGoal = goals.find((g) => g.metric === "water");

    if (!entry.water) return insights;

    if (waterGoal && entry.water >= waterGoal.target) {
      insights.push({
        type: "achievement",
        message: `Well done! You've met your hydration goal of ${waterGoal.target}L today.`,
        metric: "water",
        importance: "medium",
        timestamp: new Date(),
      });
    } else if (waterGoal && entry.water < waterGoal.target * 0.5) {
      insights.push({
        type: "warning",
        message:
          "You're drinking less water than usual. Try to increase your intake throughout the day.",
        metric: "water",
        importance: "medium",
        timestamp: new Date(),
      });
    }

    return insights;
  }

  private async analyzeMood(
    entry: HealthEntry,
    historical: HealthEntry[]
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    // Mood tracking insights
    if (historical.length >= 7) {
      const recentMoods = historical.slice(-7).map((h) => h.mood);
      const positiveCount = recentMoods.filter((mood) =>
        ["happy", "excited", "energetic", "content"].includes(
          mood.toLowerCase()
        )
      ).length;

      if (positiveCount >= 5) {
        insights.push({
          type: "achievement",
          message:
            "You've had mostly positive moods this week! Keep up whatever you're doing.",
          metric: "mood",
          importance: "medium",
          timestamp: new Date(),
        });
      } else if (positiveCount <= 2) {
        insights.push({
          type: "suggestion",
          message:
            "Your mood has been lower lately. Consider activities that usually make you feel better, or talk to someone you trust.",
          metric: "mood",
          importance: "high",
          timestamp: new Date(),
        });
      }
    }

    return insights;
  }

  private async analyzeCorrelations(
    entry: HealthEntry,
    historical: HealthEntry[]
  ): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];

    if (historical.length < 14) return insights;

    try {
      // Sleep-Steps correlation
      const goodSleepDays = historical.filter((h) => h.sleep >= 7);
      const poorSleepDays = historical.filter((h) => h.sleep < 6);

      if (goodSleepDays.length >= 5 && poorSleepDays.length >= 5) {
        const goodSleepSteps =
          goodSleepDays.reduce((sum, h) => sum + h.steps, 0) /
          goodSleepDays.length;
        const poorSleepSteps =
          poorSleepDays.reduce((sum, h) => sum + h.steps, 0) /
          poorSleepDays.length;

        if (goodSleepSteps > poorSleepSteps * 1.2) {
          insights.push({
            type: "suggestion",
            message:
              "I notice you tend to be more active on days when you sleep well. Good sleep really does boost your energy!",
            importance: "low",
            timestamp: new Date(),
          });
        }
      }

      // Mood-Sleep correlation
      const positivedays = historical.filter((h) =>
        ["happy", "excited", "energetic", "content"].includes(
          h.mood?.toLowerCase() || ""
        )
      );

      if (positivedays.length >= 5) {
        const positiveDaysSleep =
          positivedays.reduce((sum, h) => sum + h.sleep, 0) /
          positivedays.length;
        const allDaysAvgSleep =
          historical.reduce((sum, h) => sum + h.sleep, 0) / historical.length;

        if (positiveDaysSleep > allDaysAvgSleep + 0.5) {
          insights.push({
            type: "suggestion",
            message:
              "Your mood tends to be better on days when you get more sleep. Prioritizing sleep might help your overall well-being.",
            importance: "medium",
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing correlations:", error);
    }

    return insights;
  }

  private async getHistoricalData(
    userId: string,
    days: number
  ): Promise<HealthEntry[]> {
    try {
      const now = Date.now();
      const fromTimestamp = now - days * 24 * 60 * 60 * 1000;

      const streamData = await redisClient.xRange(
        `stream:health:${userId}`,
        fromTimestamp.toString(),
        "+",
        { COUNT: days }
      );

      return streamData.map((entry: any) => ({
        steps: parseInt(entry.message.steps) || 0,
        sleep: parseFloat(entry.message.sleep) || 0,
        mood: entry.message.mood || "",
        water: entry.message.water
          ? parseFloat(entry.message.water)
          : undefined,
        timestamp: parseInt(entry.id.split("-")[0]),
      }));
    } catch (error) {
      console.error("Error getting historical data:", error);
      return [];
    }
  }

  private async getUserGoals(userId: string): Promise<UserGoal[]> {
    try {
      const profileRaw = await redisClient.json.get(`profile:${userId}`);
      let profile: any;
      try {
        profile =
          typeof profileRaw === "string" ? JSON.parse(profileRaw) : profileRaw;
      } catch {
        profile = profileRaw;
      }

      if (profile && typeof profile === "object" && profile.goals) {
        return Object.entries(profile.goals).map(
          ([metric, goal]: [string, any]) => ({
            metric,
            target: goal.target,
            current: 0, // Will be calculated elsewhere
            progress: 0, // Will be calculated elsewhere
            priority: goal.priority,
          })
        );
      }

      // Default goals
      return [
        {
          metric: "sleep",
          target: 8,
          current: 0,
          progress: 0,
          priority: "high",
        },
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
    } catch (error) {
      console.error("Error getting user goals:", error);
      return [];
    }
  }

  private async storeInsights(
    userId: string,
    insights: HealthInsight[]
  ): Promise<void> {
    try {
      const key = `insights:${userId}`;

      // Get existing insights
      let existingInsights: HealthInsight[] = [];
      try {
        const existing = (await redisClient.json.get(key)) as any;
        if (existing) {
          existingInsights = Array.isArray(existing) ? existing : [];
        }
      } catch (error) {
        // Key doesn't exist, start with empty array
      }

      // Add new insights and keep only the last 50
      const allInsights = [...existingInsights, ...insights]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 50);

      await redisClient.json.set(key, "*", allInsights as any);

      // Set expiration for 30 days
      await redisClient.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error("Error storing insights:", error);
    }
  }

  private async updateGoalProgress(
    userId: string,
    entry: HealthEntry
  ): Promise<void> {
    try {
      const goals = await this.getUserGoals(userId);

      for (const goal of goals) {
        let current = 0;

        switch (goal.metric) {
          case "sleep":
            current = entry.sleep;
            break;
          case "steps":
            current = entry.steps;
            break;
          case "water":
            current = entry.water || 0;
            break;
        }

        const progress = (current / goal.target) * 100;

        // Store daily progress
        const progressKey = `progress:${userId}:${goal.metric}:${
          new Date().toISOString().split("T")[0]
        }`;
        await redisClient.json.set(progressKey, "*", {
          metric: goal.metric,
          target: goal.target,
          current,
          progress: Math.min(progress, 100), // Cap at 100%
          date: new Date().toISOString().split("T")[0],
          timestamp: Date.now(),
        });

        // Set expiration for 1 year
        await redisClient.expire(progressKey, 365 * 24 * 60 * 60);
      }
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  }
}
