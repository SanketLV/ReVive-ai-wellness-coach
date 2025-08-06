import { auth } from "@/lib/auth";
import { redisClient } from "@/lib/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface UserHealthProfile {
  userId: string;
  goals: {
    [key: string]: {
      target: number;
      priority: "high" | "medium" | "low";
    };
  };
  preferences: {
    units: "metric" | "imperial";
    reminderTimes: string[];
  };
  healthConditions?: string[];
  lastUpdated: Date;
}

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
    const { goals, preferences, healthConditions } = body;

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
