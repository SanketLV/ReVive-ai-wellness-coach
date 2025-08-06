interface MetricData {
  date: string;
  value: number;
}

interface HealthTrend {
  metric: string;
  direction: "up" | "down" | "stable";
  percentage: number;
  period: string;
}

interface UserGoal {
  metric: string;
  target: number;
  current: number;
  progress: number;
  priority: "high" | "medium" | "low";
}

interface HealthInsight {
  type: "achievement" | "warning" | "suggestion" | "milestone";
  message: string;
  metric?: string;
  importance: "high" | "medium" | "low";
  timestamp: Date;
}

interface HealthContext {
  timeframe: "today" | "week" | "month" | "year";
  metrics: ("sleep" | "steps" | "mood" | "water")[];
  trends: HealthTrend[];
  goals: UserGoal[];
  insights: HealthInsight[];
  recentData: {
    sleep: MetricData[];
    steps: MetricData[];
    water: MetricData[];
    mood: any[];
  };
}

interface QueryAnalysis {
  intent: "compare" | "trend" | "goal_progress" | "recommendation" | "general";
  timeframe: string;
  metrics: string[];
  contextNeeded: boolean;
  confidence: number;
}

interface UserHealthProfile {
  userId: string;
  goals: {
    sleep: { target: number; priority: "high" | "medium" | "low" };
    steps: { target: number; priority: "high" | "medium" | "low" };
    water: { target: number; priority: "high" | "medium" | "low" };
  };
  preference: {
    units: "metric" | "imperial";
    reminderTimes: string[];
  };
  healthConditions?: string[];
  lastUpdated: Date;
}

interface HealthSummary {
  userId: string;
  period: "daily" | "weekly" | "monthly";
  date: string;
  metrics: {
    sleep: {
      avg: number;
      min: number;
      max: number;
      trend: "up" | "down" | "stable";
    };
    steps: {
      avg: number;
      min: number;
      max: number;
      trend: "up" | "down" | "stable";
    };
    water: {
      avg: number;
      min: number;
      max: number;
      trend: "up" | "down" | "stable";
    };
    mood: { distribution: Record<string, number> };
  };
}
