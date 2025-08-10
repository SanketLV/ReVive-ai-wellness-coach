import { auth } from "@/lib/auth";
import { RecommendationService } from "@/lib/recommendation-service";
import { ensureIndexExists } from "@/lib/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const recommendationFiltersSchema = z.object({
  type: z.enum(["meal", "workout", "all"]).optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  workoutType: z
    .enum(["cardio", "strength", "flexibility", "mixed"])
    .optional(),
  dietPreference: z.array(z.string()).optional(),
  timeAvailable: z.number().min(1).max(180).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  equipment: z.array(z.string()).optional(),
  calorieRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(20).default(10),
});

const recommendationService = new RecommendationService();

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure Redis indices exist
    await ensureIndexExists();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const filters = {
      type: searchParams.get("type") || undefined,
      mealType: searchParams.get("mealType") || undefined,
      workoutType: searchParams.get("workoutType") || undefined,
      dietPreference: searchParams.get("dietPreference")
        ? searchParams.get("dietPreference")!.split(",")
        : undefined,
      timeAvailable: searchParams.get("timeAvailable")
        ? parseInt(searchParams.get("timeAvailable")!)
        : undefined,
      difficulty: searchParams.get("difficulty") || undefined,
      equipment: searchParams.get("equipment")
        ? searchParams.get("equipment")!.split(",")
        : undefined,
      calorieRange:
        searchParams.get("calorieMin") || searchParams.get("calorieMax")
          ? {
              min: searchParams.get("calorieMin")
                ? parseInt(searchParams.get("calorieMin")!)
                : undefined,
              max: searchParams.get("calorieMax")
                ? parseInt(searchParams.get("calorieMax")!)
                : undefined,
            }
          : undefined,
      tags: searchParams.get("tags")
        ? searchParams.get("tags")!.split(",")
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
    };

    // Validate filters
    const validatedFilters = recommendationFiltersSchema.parse(filters);

    // Get recommendations
    const recommendations = await recommendationService.getRecommendations(
      userId,
      validatedFilters,
      validatedFilters.limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      filters: validatedFilters,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("Error in recommend API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Endpoint to seed sample data
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "seed") {
      // Ensure Redis indices exist first
      await ensureIndexExists();

      // Seed sample data
      await Promise.all([
        recommendationService.seedSampleMeals(),
        recommendationService.seedSampleWorkouts(),
      ]);

      return NextResponse.json({
        success: true,
        message: "Sample data seeded successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
