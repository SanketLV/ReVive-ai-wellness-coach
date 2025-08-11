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
  timeframe:
    | "today"
    | "yesterday"
    | "day_before_yesterday"
    | "three_days_ago"
    | "week"
    | "last_week"
    | "month"
    | "year";
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
  profile?: {
    goal: "weight_loss" | "weight_gain" | "muscle_gain" | "maintenance" | "general_health";
    diet: "none" | "vegetarian" | "vegan" | "keto" | "paleo" | "mediterranean" | "gluten_free";
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
    personalInfo?: {
      weight?: number;
      height?: number;
      age?: number;
      gender?: "male" | "female" | "other";
    };
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

// Recommendation System Types
export interface Meal {
  id: string;
  title: string;
  description: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  tags: string[];
  dietaryRestrictions: string[];
  calories: number;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  type: "cardio" | "strength" | "flexibility" | "mixed";
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in minutes
  equipment: string[];
  targetMuscles: string[];
  exercises: {
    name: string;
    sets?: number;
    reps?: number;
    duration?: number; // for time-based exercises
    rest?: number; // rest between sets in seconds
    instructions: string;
  }[];
  caloriesBurned: number; // estimated
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationFilters {
  type?: "meal" | "workout" | "all";
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  workoutType?: "cardio" | "strength" | "flexibility" | "mixed";
  dietPreference?: string[];
  timeAvailable?: number; // in minutes
  difficulty?: "beginner" | "intermediate" | "advanced";
  equipment?: string[];
  calorieRange?: { min?: number; max?: number };
  tags?: string[];
}

export interface RecommendationResult {
  id: string;
  title: string;
  description: string;
  type: "meal" | "workout";
  score: number;
  relevanceReason: string;
  item: Meal | Workout;
}
