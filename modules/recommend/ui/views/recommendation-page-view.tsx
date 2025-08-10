"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  MenuIcon,
  PanelLeftCloseIcon,
} from "lucide-react";
import RecommendationFilters from "@/modules/recommend/ui/components/recommendation-filters";
import type {
  RecommendationFilters as Filters,
  RecommendationResult,
} from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import RecommendationResultComp from "@/modules/recommend/ui/components/recommendation-result";

export default function RecommendationPageView() {
  const { toggleSidebar, isMobile } = useSidebar();
  const [filters, setFilters] = useState<Filters>({});
  const [recommendations, setRecommendations] = useState<
    RecommendationResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [needsSeeding, setNeedsSeeding] = useState(false);

  const buildQueryString = (filters: Filters): string => {
    const params = new URLSearchParams();

    if (filters.type) params.set("type", filters.type);
    if (filters.mealType) params.set("mealType", filters.mealType);
    if (filters.workoutType) params.set("workoutType", filters.workoutType);
    if (filters.dietPreference?.length)
      params.set("dietPreference", filters.dietPreference.join(","));
    if (filters.timeAvailable)
      params.set("timeAvailable", filters.timeAvailable.toString());
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.equipment?.length)
      params.set("equipment", filters.equipment.join(","));
    if (filters.calorieRange?.min)
      params.set("calorieMin", filters.calorieRange.min.toString());
    if (filters.calorieRange?.max)
      params.set("calorieMax", filters.calorieRange.max.toString());
    if (filters.tags?.length) params.set("tags", filters.tags.join(","));

    return params.toString();
  };

  const searchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/recommend?${queryString}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.data);

      if (data.data.length === 0) {
        setNeedsSeeding(true);
        toast.info(
          "No recommendations found. Try adjusting your filters or seed some sample data."
        );
      } else {
        setNeedsSeeding(false);
        toast.success(`Found ${data.data.length} recommendations!`);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to fetch recommendations. Please try again.");
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const seedSampleData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to seed data");
      }

      toast.success(
        "Sample data seeded successfully! You can now search for recommendations."
      );
      setNeedsSeeding(false);

      // Automatically search after seeding
      setTimeout(() => searchRecommendations(), 500);
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Failed to seed sample data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecommendation = (recommendation: RecommendationResult) => {
    toast.success(`Saved "${recommendation.title}" to your favorites!`);
    // TODO: Implement save functionality
  };

  const handleTryRecommendation = (recommendation: RecommendationResult) => {
    toast.success(`Added "${recommendation.title}" to your plan!`);
    // TODO: Implement try/add to plan functionality
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}

      <div className="flex items-center gap-4">
        {isMobile ? (
          <MenuIcon className="size-6" onClick={toggleSidebar} />
        ) : (
          <PanelLeftCloseIcon
            className="size-6 cursor-pointer"
            onClick={toggleSidebar}
          />
        )}
        <h1 className="text-xl lg:text-3xl font-bold font-rockSalt">
          Recommendations
        </h1>
      </div>

      {/* Filters */}
      <RecommendationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={searchRecommendations}
        isLoading={isLoading}
      />

      {/* Sample Data Seeding Alert */}
      {needsSeeding && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            No recommendations found. Get started by seeding some sample meals
            and workouts.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={seedSampleData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Seed Sample Data
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      <RecommendationResultComp
        hasSearched={hasSearched}
        isLoading={isLoading}
        recommendations={recommendations}
        searchRecommendations={searchRecommendations}
        handleSaveRecommendation={handleSaveRecommendation}
        handleTryRecommendation={handleTryRecommendation}
        seedSampleData={seedSampleData}
      />

      {/* Welcome State */}
      {!hasSearched && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Ready to Discover?</CardTitle>
            <CardDescription>
              Use the filters above to find personalized meal and workout
              recommendations that match your preferences and goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 border rounded-lg">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">AI-Powered Matching</h3>
                  <p className="text-muted-foreground">
                    Our system analyzes your profile and preferences to suggest
                    the most relevant options.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Dynamic Filtering</h3>
                  <p className="text-muted-foreground">
                    Filter by time, difficulty, dietary preferences, and
                    equipment availability.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium mb-1">Personalized Results</h3>
                  <p className="text-muted-foreground">
                    Get recommendations scored by relevance to your current
                    goals and activity.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={searchRecommendations}
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Exploring
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
