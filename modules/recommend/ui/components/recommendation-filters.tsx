"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search } from "lucide-react";
import type { RecommendationFilters } from "@/types";

interface RecommendationFiltersProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const commonDietPreferences = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "keto",
  "paleo",
  "low-carb",
  "high-protein",
  "mediterranean",
];

const commonEquipment = [
  "none",
  "dumbbells",
  "resistance-bands",
  "yoga-mat",
  "kettlebell",
  "bench",
  "pull-up-bar",
  "treadmill",
  "stationary-bike",
];

const commonTags = [
  "quick",
  "energizing",
  "relaxing",
  "strength",
  "cardio",
  "flexibility",
  "fat-burning",
  "muscle-building",
  "high-protein",
  "low-calorie",
  "healthy",
  "beginner-friendly",
  "advanced",
  "full-body",
  "upper-body",
  "lower-body",
];

export default function RecommendationFilters({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
}: RecommendationFiltersProps) {
  const [selectedDiets, setSelectedDiets] = useState<string[]>(
    filters.dietPreference || []
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    filters.equipment || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    filters.tags || []
  );

  const handleFilterChange = (key: keyof RecommendationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (
    tags: string[],
    setTags: (tags: string[]) => void,
    tag: string,
    key: keyof RecommendationFilters
  ) => {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setTags(newTags);
    handleFilterChange(key, newTags.length > 0 ? newTags : undefined);
  };

  const clearFilters = () => {
    const clearedFilters: RecommendationFilters = {};
    setSelectedDiets([]);
    setSelectedEquipment([]);
    setSelectedTags([]);
    onFiltersChange(clearedFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Recommendation Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Content Type</Label>
            <Select
              value={filters.type || ""}
              onValueChange={(value) =>
                handleFilterChange("type", value || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All (Meals & Workouts)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Meals & Workouts)</SelectItem>
                <SelectItem value="meal">Meals Only</SelectItem>
                <SelectItem value="workout">Workouts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeAvailable">Time Available (minutes)</Label>
            <Input
              type="number"
              placeholder="e.g. 30"
              min="1"
              max="180"
              value={filters.timeAvailable || ""}
              onChange={(e) =>
                handleFilterChange(
                  "timeAvailable",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />
          </div>
        </div>

        {/* Meal-specific filters */}
        {(!filters.type ||
          filters.type === "meal" ||
          filters.type === "all") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="mealType">Meal Type</Label>
              <Select
                value={filters.mealType || ""}
                onValueChange={(value) =>
                  handleFilterChange("mealType", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Meal Type</SelectLabel>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Calorie Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.calorieRange?.min || ""}
                  onChange={(e) =>
                    handleFilterChange("calorieRange", {
                      ...filters.calorieRange,
                      min: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.calorieRange?.max || ""}
                  onChange={(e) =>
                    handleFilterChange("calorieRange", {
                      ...filters.calorieRange,
                      max: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Diet Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {commonDietPreferences.map((diet) => (
                  <Badge
                    key={diet}
                    variant={
                      selectedDiets.includes(diet) ? "default" : "outline"
                    }
                    className="cursor-pointer flex items-center"
                    onClick={() =>
                      toggleTag(
                        selectedDiets,
                        setSelectedDiets,
                        diet,
                        "dietPreference"
                      )
                    }
                  >
                    {diet}
                    {selectedDiets.includes(diet) && (
                      <X className="ml-1 mt-0.5 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Workout-specific filters */}
        {(!filters.type ||
          filters.type === "workout" ||
          filters.type === "all") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="workoutType">Workout Type</Label>
              <Select
                value={filters.workoutType || ""}
                onValueChange={(value) =>
                  handleFilterChange("workoutType", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any workout type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Workout type</SelectLabel>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={filters.difficulty || ""}
                onValueChange={(value) =>
                  handleFilterChange("difficulty", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Difficulty</SelectLabel>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Equipment</Label>
              <div className="flex flex-wrap gap-2">
                {commonEquipment.map((equipment) => (
                  <Badge
                    key={equipment}
                    variant={
                      selectedEquipment.includes(equipment)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      toggleTag(
                        selectedEquipment,
                        setSelectedEquipment,
                        equipment,
                        "equipment"
                      )
                    }
                  >
                    {equipment}
                    {selectedEquipment.includes(equipment) && (
                      <X className="ml-1 mt-0.5 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Common Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {commonTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  toggleTag(selectedTags, setSelectedTags, tag, "tags")
                }
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="ml-1 mt-0.5 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={onSearch} disabled={isLoading} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Searching..." : "Get Recommendations"}
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
