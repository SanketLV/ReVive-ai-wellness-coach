import { auth } from "@/lib/auth";
import { redisClient } from "@/lib/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { UserHealthProfile } from "@/types";

//* GET user health profile
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = (await redisClient.json.get(
      `profile:${userId}`
    )) as unknown as UserHealthProfile;

    if (!profile) {
      // Return default profile
      const defaultProfile: UserHealthProfile = {
        userId,
        goals: {
          sleep: { target: 8, priority: "high" },
          steps: { target: 10000, priority: "medium" },
          water: { target: 2, priority: "medium" },
        },
        preferences: {
          units: "metric",
          reminderTimes: ["09:00", "15:00", "21:00"],
        },
        profile: {
          goal: "general_health",
          diet: "none",
          activityLevel: "moderate",
        },
        lastUpdated: new Date(),
      };

      // Create default profile
      await redisClient.json.set(
        `profile:${userId}`,
        "$",
        defaultProfile as any
      );
      return NextResponse.json(defaultProfile, { status: 200 });
    }

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("Error fetching health profile:", error);
    return NextResponse.json(
      { error: "Error occurred while fetching health profile." },
      { status: 500 }
    );
  }
}

//* PUT/POST update user health profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { goals, preferences, healthConditions, profile } = body;

    // Validate goals
    if (goals) {
      const validMetrics = ["sleep", "steps", "water"];
      const validPriorities = ["high", "medium", "low"];

      for (const [metric, goal] of Object.entries(goals)) {
        if (!validMetrics.includes(metric)) {
          return NextResponse.json(
            { error: `Invalid metric: ${metric}` },
            { status: 400 }
          );
        }

        const goalData = goal as any;
        if (
          !goalData.target ||
          typeof goalData.target !== "number" ||
          goalData.target <= 0
        ) {
          return NextResponse.json(
            {
              error: `Invalid target for ${metric}: must be a positive number`,
            },
            { status: 400 }
          );
        }

        if (!validPriorities.includes(goalData.priority)) {
          return NextResponse.json(
            {
              error: `Invalid priority for ${metric}: must be high, medium, or low`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate profile data
    if (profile) {
      const validGoals = ["weight_loss", "weight_gain", "muscle_gain", "maintenance", "general_health"];
      const validDiets = ["none", "vegetarian", "vegan", "keto", "paleo", "mediterranean", "gluten_free"];
      const validActivityLevels = ["sedentary", "light", "moderate", "active", "very_active"];
      const validGenders = ["male", "female", "other"];

      if (profile.goal && !validGoals.includes(profile.goal)) {
        return NextResponse.json(
          { error: `Invalid goal: ${profile.goal}` },
          { status: 400 }
        );
      }

      if (profile.diet && !validDiets.includes(profile.diet)) {
        return NextResponse.json(
          { error: `Invalid diet: ${profile.diet}` },
          { status: 400 }
        );
      }

      if (profile.activityLevel && !validActivityLevels.includes(profile.activityLevel)) {
        return NextResponse.json(
          { error: `Invalid activity level: ${profile.activityLevel}` },
          { status: 400 }
        );
      }

      if (profile.personalInfo) {
        const { weight, height, age, gender } = profile.personalInfo;
        
        if (weight && (typeof weight !== "number" || weight <= 0)) {
          return NextResponse.json(
            { error: "Weight must be a positive number" },
            { status: 400 }
          );
        }

        if (height && (typeof height !== "number" || height <= 0)) {
          return NextResponse.json(
            { error: "Height must be a positive number" },
            { status: 400 }
          );
        }

        if (age && (typeof age !== "number" || age <= 0 || age > 150)) {
          return NextResponse.json(
            { error: "Age must be a number between 1 and 150" },
            { status: 400 }
          );
        }

        if (gender && !validGenders.includes(gender)) {
          return NextResponse.json(
            { error: `Invalid gender: ${gender}` },
            { status: 400 }
          );
        }
      }
    }

    //* Get existing profile or create new one
    let existingProfile = (await redisClient.json.get(
      `profile:${userId}`
    )) as unknown as UserHealthProfile;

    if (!existingProfile) {
      existingProfile = {
        userId,
        goals: {
          sleep: { target: 8, priority: "high" },
          steps: { target: 10000, priority: "medium" },
          water: { target: 2, priority: "medium" },
        },
        preferences: {
          units: "metric",
          reminderTimes: ["09:00", "15:00", "21:00"],
        },
        profile: {
          goal: "general_health",
          diet: "none",
          activityLevel: "moderate",
        },
        lastUpdated: new Date(),
      };
    }

    // Update profile with new data
    const updatedProfile: UserHealthProfile = {
      ...existingProfile,
      ...(goals && { goals: { ...existingProfile.goals, ...goals } }),
      ...(preferences && {
        preferences: { ...existingProfile.preferences, ...preferences },
      }),
      ...(profile && {
        profile: { ...existingProfile.profile, ...profile },
      }),
      ...(healthConditions && { healthConditions }),
      lastUpdated: new Date(),
    };

    // Save updated profile
    await redisClient.json.set(`profile:${userId}`, "$", updatedProfile as any);

    // Clear related caches
    await clearProfileCaches(userId);

    return NextResponse.json(updatedProfile, { status: 200 });
  } catch (error) {
    console.error("Error updating health profile:", error);
    return NextResponse.json(
      { error: "Error occurred while updating health profile." },
      { status: 500 }
    );
  }
}

async function clearProfileCaches(userId: string) {
  try {
    const cachePatterns = [
      `metrics:${userId}:*`,
      `insights:${userId}`,
      `trends:${userId}:*`,
      `goals:${userId}:*`,
    ];

    for (const pattern of cachePatterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error("Failed to clear profile caches:", error);
  }
}
