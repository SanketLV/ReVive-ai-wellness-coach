import { redisClient, vectorToBuffer, VECTOR_DIMENSIONS } from "./redis";
import { getEmbedding } from "./ai";
import { HealthDataService } from "./health-data-service";
import type {
  Meal,
  Workout,
  RecommendationFilters,
  RecommendationResult,
  UserHealthProfile,
} from "@/types";

export class RecommendationService {
  private healthDataService = new HealthDataService();

  async getRecommendations(
    userId: string,
    filters: RecommendationFilters,
    limit = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get user profile and preferences for personalized recommendations
      const userProfile = await this.getUserProfile(userId);

      // Build search query based on user context and filters
      const searchQuery = await this.buildSearchQuery(
        userId,
        filters,
        userProfile
      );

      let results: RecommendationResult[] = [];

      if (!filters.type || filters.type === "meal" || filters.type === "all") {
        const mealResults = await this.searchMeals(searchQuery, filters, limit);
        results.push(...mealResults);
      }

      if (
        !filters.type ||
        filters.type === "workout" ||
        filters.type === "all"
      ) {
        const workoutResults = await this.searchWorkouts(
          searchQuery,
          filters,
          limit
        );
        results.push(...workoutResults);
      }

      // Sort by relevance score and return top results
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  }

  private async buildSearchQuery(
    userId: string,
    filters: RecommendationFilters,
    userProfile: UserHealthProfile | null
  ): Promise<{ text: string; embedding: number[] }> {
    // Build context-aware search text based on user goals, preferences, and current filters
    let searchText = "";

    if (!filters.type || filters.type === "meal" || filters.type === "all") {
      searchText += "healthy nutritious meal ";

      if (filters.mealType) {
        searchText += `${filters.mealType} `;
      }

      if (filters.dietPreference?.length) {
        searchText += `${filters.dietPreference.join(" ")} `;
      }

      if (filters.timeAvailable) {
        const prepTimeCategory =
          filters.timeAvailable <= 15
            ? "quick easy"
            : filters.timeAvailable <= 30
            ? "moderate prep"
            : "elaborate";
        searchText += `${prepTimeCategory} `;
      }
    }

    if (!filters.type || filters.type === "workout" || filters.type === "all") {
      searchText += "effective workout exercise ";

      if (filters.workoutType) {
        searchText += `${filters.workoutType} `;
      }

      if (filters.difficulty) {
        searchText += `${filters.difficulty} `;
      }

      if (filters.timeAvailable) {
        searchText += `${filters.timeAvailable} minutes `;
      }

      if (filters.equipment?.length) {
        searchText += `${filters.equipment.join(" ")} `;
      }
    }

    // Add user goals context
    if (userProfile?.goals) {
      const goalTypes = Object.keys(userProfile.goals);
      if (goalTypes.includes("weight_loss")) {
        searchText += "weight loss fat burning ";
      }
      if (goalTypes.includes("muscle_gain")) {
        searchText += "muscle building strength ";
      }
      if (goalTypes.includes("endurance")) {
        searchText += "endurance cardio stamina ";
      }
    }

    if (filters.tags?.length) {
      searchText += filters.tags.join(" ");
    }

    // Generate embedding for semantic search
    const embedding = await getEmbedding(searchText.trim());

    return { text: searchText.trim(), embedding };
  }

  private async searchMeals(
    searchQuery: { text: string; embedding: number[] },
    filters: RecommendationFilters,
    limit: number
  ): Promise<RecommendationResult[]> {
    try {
      // Build Redis Search query with hybrid vector + filter approach
      let query = "*";
      const queryParts = [];

      // Add text-based filters
      if (filters.mealType) {
        queryParts.push(`@type:{${filters.mealType}}`);
      }

      if (filters.dietPreference?.length) {
        const dietFilters = filters.dietPreference.map(
          (diet) => `@dietaryRestrictions:{${diet}}`
        );
        queryParts.push(`(${dietFilters.join(" | ")})`);
      }

      if (filters.timeAvailable) {
        const maxTime = filters.timeAvailable;
        queryParts.push(`@prepTime:[0 ${maxTime}]`);
      }

      if (filters.calorieRange) {
        const min = filters.calorieRange.min || 0;
        const max = filters.calorieRange.max || 2000;
        queryParts.push(`@calories:[${min} ${max}]`);
      }

      if (filters.tags?.length) {
        const tagFilters = filters.tags.map((tag) => `@tags:{${tag}}`);
        queryParts.push(`(${tagFilters.join(" | ")})`);
      }

      if (queryParts.length > 0) {
        query = queryParts.join(" ");
      }

      // Perform hybrid search: KNN vector search + text filtering
      const searchResults = await redisClient.ft.search(
        "meals_index",
        `${query}=>[KNN ${limit} @embedding $vec_param AS vector_score]`,
        {
          PARAMS: { vec_param: vectorToBuffer(searchQuery.embedding) },
          SORTBY: "vector_score",
          DIALECT: 2,
          RETURN: [
            "vector_score",
            "$.id",
            "$.title",
            "$.description",
            "$.type",
            "$.calories",
            "$.prepTime",
            "$.cookTime",
            "$.tags",
            "$",
          ],
          LIMIT: { from: 0, size: limit },
        }
      );

      const results: RecommendationResult[] = [];

      for (const doc of (searchResults as { documents: any[] }).documents) {
        try {
          // const mealData = JSON.parse(doc.value.$) as Meal;
          const mealData = doc.value as Meal;

          const score = this.calculateRelevanceScore(
            1 - (doc.score || 0), // Convert distance to similarity
            mealData,
            filters,
            "meal"
          );

          results.push({
            id: mealData.id,
            title: mealData.title,
            description: mealData.description,
            type: "meal",
            score,
            relevanceReason: this.generateRelevanceReason(
              mealData,
              filters,
              "meal"
            ),
            item: mealData,
          });
        } catch (parseError) {
          console.warn("Failed to parse meal document:", parseError);
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching meals:", error);
      return [];
    }
  }

  private async searchWorkouts(
    searchQuery: { text: string; embedding: number[] },
    filters: RecommendationFilters,
    limit: number
  ): Promise<RecommendationResult[]> {
    try {
      // Build Redis Search query with hybrid vector + filter approach
      let query = "*";
      const queryParts = [];

      // Add text-based filters
      if (filters.workoutType) {
        queryParts.push(`@type:{${filters.workoutType}}`);
      }

      if (filters.difficulty) {
        queryParts.push(`@difficulty:{${filters.difficulty}}`);
      }

      if (filters.timeAvailable) {
        queryParts.push(`@duration:[0 ${filters.timeAvailable}]`);
      }

      if (filters.equipment?.length) {
        const equipmentFilters = filters.equipment.map(
          (eq) => `@equipment:{${eq}}`
        );
        queryParts.push(`(${equipmentFilters.join(" | ")})`);
      }

      if (filters.tags?.length) {
        const tagFilters = filters.tags.map((tag) => `@tags:{${tag}}`);
        queryParts.push(`(${tagFilters.join(" | ")})`);
      }

      if (queryParts.length > 0) {
        query = queryParts.join(" ");
      }

      // Perform hybrid search: KNN vector search + text filtering
      const searchResults = await redisClient.ft.search(
        "workouts_index",
        `${query}=>[KNN ${limit} @embedding $vec_param AS vector_score]`,
        {
          PARAMS: { vec_param: vectorToBuffer(searchQuery.embedding) },
          SORTBY: "vector_score",
          DIALECT: 2,
          RETURN: [
            "vector_score",
            "$.id",
            "$.title",
            "$.description",
            "$.type",
            "$.duration",
            "$.difficulty",
            "$.caloriesBurned",
            "$.tags",
            "$",
          ],
          LIMIT: { from: 0, size: limit },
        }
      );

      const results: RecommendationResult[] = [];

      for (const doc of (searchResults as { documents: any[] }).documents) {
        try {
          const workoutData = doc.value as Workout;

          const score = this.calculateRelevanceScore(
            1 - (doc.score || 0), // Convert distance to similarity
            workoutData,
            filters,
            "workout"
          );

          results.push({
            id: workoutData.id,
            title: workoutData.title,
            description: workoutData.description,
            type: "workout",
            score,
            relevanceReason: this.generateRelevanceReason(
              workoutData,
              filters,
              "workout"
            ),
            item: workoutData,
          });
        } catch (parseError) {
          console.warn("Failed to parse workout document:", parseError);
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching workouts:", error);
      return [];
    }
  }

  private calculateRelevanceScore(
    vectorScore: number,
    item: Meal | Workout,
    filters: RecommendationFilters,
    type: "meal" | "workout"
  ): number {
    let score = vectorScore * 0.6; // Base vector similarity (60% weight)

    // Add filter matching bonus (40% weight)
    let filterMatchScore = 0;
    let filterCount = 0;

    if (type === "meal" && "type" in item) {
      const meal = item as Meal;

      if (filters.mealType) {
        filterCount++;
        if (meal.type === filters.mealType) {
          filterMatchScore += 0.2;
        }
      }

      if (filters.dietPreference?.length) {
        filterCount++;
        const matchingDiets = filters.dietPreference.filter((diet) =>
          meal.dietaryRestrictions.includes(diet)
        );
        filterMatchScore +=
          (matchingDiets.length / filters.dietPreference.length) * 0.2;
      }

      if (filters.timeAvailable) {
        filterCount++;
        const totalTime = meal.prepTime + meal.cookTime;
        if (totalTime <= filters.timeAvailable) {
          filterMatchScore += 0.15;
        }
      }
    }

    if (type === "workout" && "difficulty" in item) {
      const workout = item as Workout;

      if (filters.workoutType) {
        filterCount++;
        if (workout.type === filters.workoutType) {
          filterMatchScore += 0.2;
        }
      }

      if (filters.difficulty) {
        filterCount++;
        if (workout.difficulty === filters.difficulty) {
          filterMatchScore += 0.15;
        }
      }

      if (filters.timeAvailable) {
        filterCount++;
        if (workout.duration <= filters.timeAvailable) {
          filterMatchScore += 0.15;
        }
      }

      if (filters.equipment?.length) {
        filterCount++;
        const matchingEquipment = filters.equipment.filter((eq) =>
          workout.equipment.includes(eq)
        );
        filterMatchScore +=
          (matchingEquipment.length / filters.equipment.length) * 0.1;
      }
    }

    // Add tag matching bonus
    if (filters.tags?.length) {
      filterCount++;
      const matchingTags = filters.tags.filter((tag) =>
        item.tags.includes(tag)
      );
      filterMatchScore += (matchingTags.length / filters.tags.length) * 0.1;
    }

    // Normalize filter score
    if (filterCount > 0) {
      score += (filterMatchScore / filterCount) * 0.4;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  private generateRelevanceReason(
    item: Meal | Workout,
    filters: RecommendationFilters,
    type: "meal" | "workout"
  ): string {
    const reasons = [];

    if (type === "meal" && "type" in item) {
      const meal = item as Meal;

      if (filters.mealType && meal.type === filters.mealType) {
        reasons.push(`Perfect for ${filters.mealType}`);
      }

      if (filters.dietPreference?.length) {
        const matchingDiets = filters.dietPreference.filter((diet) =>
          meal.dietaryRestrictions.includes(diet)
        );
        if (matchingDiets.length > 0) {
          reasons.push(`Fits ${matchingDiets.join(", ")} diet`);
        }
      }

      if (filters.timeAvailable) {
        const totalTime = meal.prepTime + meal.cookTime;
        if (totalTime <= filters.timeAvailable) {
          reasons.push(`Quick ${totalTime}-minute prep`);
        }
      }

      reasons.push(`${meal.calories} calories`);
    }

    if (type === "workout" && "difficulty" in item) {
      const workout = item as Workout;

      if (filters.difficulty && workout.difficulty === filters.difficulty) {
        reasons.push(`${workout.difficulty} level`);
      }

      if (filters.timeAvailable && workout.duration <= filters.timeAvailable) {
        reasons.push(`${workout.duration}-minute workout`);
      }

      reasons.push(`Burns ~${workout.caloriesBurned} calories`);
    }

    return reasons.length > 0 ? reasons.join(" • ") : "Recommended for you";
  }

  private async getUserProfile(
    userId: string
  ): Promise<UserHealthProfile | null> {
    try {
      const profile = (await redisClient.json.get(
        `profile:${userId}`
      )) as unknown as UserHealthProfile;
      return profile;
    } catch (error) {
      console.warn("Failed to get user profile:", error);
      return null;
    }
  }

  // Utility methods for seeding sample data
  async seedSampleMeals(): Promise<void> {
    const sampleMeals: Omit<Meal, "embedding">[] = [
      {
        id: "meal_001",
        title: "Protein Power Smoothie Bowl",
        description:
          "A nutrient-packed smoothie bowl with Greek yogurt, berries, and protein powder topped with granola and nuts.",
        type: "breakfast",
        tags: ["high-protein", "quick", "energizing", "antioxidants"],
        dietaryRestrictions: ["vegetarian", "gluten-free"],
        calories: 350,
        prepTime: 10,
        cookTime: 0,
        servings: 1,
        ingredients: [
          "Greek yogurt",
          "protein powder",
          "frozen berries",
          "banana",
          "granola",
          "almonds",
          "honey",
        ],
        instructions: [
          "Blend yogurt, protein powder, and fruits",
          "Pour into bowl",
          "Top with granola and nuts",
        ],
        nutrition: { protein: 25, carbs: 35, fat: 8, fiber: 6 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "meal_002",
        title: "Mediterranean Quinoa Salad",
        description:
          "Fresh Mediterranean salad with quinoa, vegetables, feta cheese, and olive oil dressing.",
        type: "lunch",
        tags: ["mediterranean", "healthy", "filling", "fresh"],
        dietaryRestrictions: ["vegetarian", "gluten-free"],
        calories: 420,
        prepTime: 15,
        cookTime: 15,
        servings: 2,
        ingredients: [
          "quinoa",
          "cherry tomatoes",
          "cucumber",
          "feta cheese",
          "olive oil",
          "lemon",
          "herbs",
        ],
        instructions: [
          "Cook quinoa",
          "Chop vegetables",
          "Mix all ingredients",
          "Add dressing",
        ],
        nutrition: { protein: 16, carbs: 45, fat: 18, fiber: 8 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "meal_003",
        title: "Grilled Salmon with Sweet Potato",
        description:
          "Herb-crusted grilled salmon served with roasted sweet potato and steamed broccoli.",
        type: "dinner",
        tags: ["high-protein", "omega-3", "balanced", "anti-inflammatory"],
        dietaryRestrictions: ["gluten-free", "dairy-free"],
        calories: 480,
        prepTime: 10,
        cookTime: 25,
        servings: 1,
        ingredients: [
          "salmon fillet",
          "sweet potato",
          "broccoli",
          "herbs",
          "olive oil",
          "lemon",
        ],
        instructions: [
          "Season salmon",
          "Roast sweet potato",
          "Grill salmon",
          "Steam broccoli",
        ],
        nutrition: { protein: 35, carbs: 30, fat: 22, fiber: 6 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const meal of sampleMeals) {
      const embedding = await getEmbedding(
        `${meal.title} ${meal.description} ${meal.tags.join(" ")}`
      );
      const mealWithEmbedding: Meal = { ...meal, embedding };

      await redisClient.json.set(
        `meal:${meal.id}`,
        "$",
        mealWithEmbedding as any
      );
    }

    console.log("Sample meals seeded successfully");
  }

  async seedSampleWorkouts(): Promise<void> {
    const sampleWorkouts: Omit<Workout, "embedding">[] = [
      {
        id: "workout_001",
        title: "HIIT Cardio Blast",
        description:
          "High-intensity interval training workout to boost metabolism and burn calories quickly.",
        type: "cardio",
        tags: ["hiit", "fat-burning", "energizing", "quick"],
        difficulty: "intermediate",
        duration: 20,
        equipment: ["none"],
        targetMuscles: ["full-body"],
        exercises: [
          {
            name: "Jumping Jacks",
            duration: 45,
            rest: 15,
            instructions: "Jump with arms and legs wide, return to start",
          },
          {
            name: "Burpees",
            reps: 10,
            rest: 30,
            instructions:
              "Squat, jump back to plank, push-up, jump forward, jump up",
          },
          {
            name: "Mountain Climbers",
            duration: 30,
            rest: 15,
            instructions: "Plank position, alternate bringing knees to chest",
          },
          {
            name: "High Knees",
            duration: 30,
            rest: 15,
            instructions: "Run in place, bringing knees up high",
          },
        ],
        caloriesBurned: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "workout_002",
        title: "Upper Body Strength Builder",
        description:
          "Comprehensive upper body strength workout targeting chest, shoulders, and arms.",
        type: "strength",
        tags: ["strength", "muscle-building", "upper-body", "progressive"],
        difficulty: "intermediate",
        duration: 45,
        equipment: ["dumbbells", "bench"],
        targetMuscles: ["chest", "shoulders", "arms"],
        exercises: [
          {
            name: "Push-ups",
            sets: 3,
            reps: 12,
            rest: 60,
            instructions: "Standard push-up with good form",
          },
          {
            name: "Dumbbell Press",
            sets: 3,
            reps: 10,
            rest: 90,
            instructions: "Chest press with dumbbells",
          },
          {
            name: "Shoulder Press",
            sets: 3,
            reps: 10,
            rest: 60,
            instructions: "Press dumbbells overhead",
          },
          {
            name: "Bicep Curls",
            sets: 3,
            reps: 12,
            rest: 45,
            instructions: "Curl dumbbells to shoulders",
          },
        ],
        caloriesBurned: 180,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "workout_003",
        title: "Relaxing Yoga Flow",
        description:
          "Gentle yoga sequence to improve flexibility and reduce stress.",
        type: "flexibility",
        tags: ["yoga", "relaxing", "flexibility", "mindfulness"],
        difficulty: "beginner",
        duration: 30,
        equipment: ["yoga-mat"],
        targetMuscles: ["full-body"],
        exercises: [
          {
            name: "Sun Salutation",
            sets: 3,
            instructions: "Flow through classic sun salutation sequence",
          },
          {
            name: "Warrior Poses",
            duration: 60,
            instructions: "Hold warrior I and II poses",
          },
          {
            name: "Downward Dog",
            duration: 60,
            instructions: "Hold downward facing dog",
          },
          {
            name: "Child's Pose",
            duration: 90,
            instructions: "Relaxing rest pose",
          },
        ],
        caloriesBurned: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const workout of sampleWorkouts) {
      const embedding = await getEmbedding(
        `${workout.title} ${workout.description} ${workout.tags.join(" ")}`
      );
      const workoutWithEmbedding: Workout = { ...workout, embedding };

      await redisClient.json.set(
        `workout:${workout.id}`,
        "$",
        workoutWithEmbedding as any
      );
    }

    console.log("Sample workouts seeded successfully");
  }
}
