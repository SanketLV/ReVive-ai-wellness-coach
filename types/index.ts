export interface MetricData {
  date: string;
  value: number;
}

export interface HealthTrend {
  metric: string;
  direction: "up" | "down" | "stable";
  percentage: number;
  period: string;
}

export interface UserGoal {
  metric: string;
  target: number;
  current: number;
  progress: number;
  priority: "high" | "medium" | "low";
}

export interface HealthInsight {
  type: "achievement" | "warning" | "suggestion" | "milestone";
  message: string;
  metric?: string;
  importance: "high" | "medium" | "low";
  timestamp: Date;
}

export interface HealthContext {
  timeframe: "today" | "yesterday" | "day_before_yesterday" | "three_days_ago" | "week" | "last_week" | "month" | "year";
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

export interface QueryAnalysis {
  intent: "compare" | "trend" | "goal_progress" | "recommendation" | "general";
  timeframe: string;
  metrics: string[];
  contextNeeded: boolean;
  confidence: number;
}

export interface UserHealthProfile {
  userId: string;
  goals: {
    [metric: string]: { target: number; priority: "high" | "medium" | "low" };
  };
  preferences: {
    units: "metric" | "imperial";
    reminderTimes: string[];
  };
  healthConditions?: string[];
  lastUpdated: Date;
}

export interface HealthSummary {
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
