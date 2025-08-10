"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Dumbbell,
  Zap,
  Heart,
  BookOpen,
  Star,
  ChefHat,
  Timer,
  Users,
  Target,
} from "lucide-react";
import type { RecommendationResult, Meal, Workout } from "@/types";

interface RecommendationCardProps {
  recommendation: RecommendationResult;
  onSave?: (recommendation: RecommendationResult) => void;
  onTry?: (recommendation: RecommendationResult) => void;
}

export default function RecommendationCard({
  recommendation,
  onSave,
  onTry,
}: RecommendationCardProps) {
  const { title, description, type, score, relevanceReason, item } =
    recommendation;
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isMeal = type === "meal";
  const meal = isMeal ? (item as Meal) : null;
  const workout = !isMeal ? (item as Workout) : null;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (itemType: string) => {
    switch (itemType) {
      case "breakfast":
        return "bg-orange-100 text-orange-800";
      case "lunch":
        return "bg-blue-100 text-blue-800";
      case "dinner":
        return "bg-purple-100 text-purple-800";
      case "snack":
        return "bg-pink-100 text-pink-800";
      case "cardio":
        return "bg-red-100 text-red-800";
      case "strength":
        return "bg-blue-100 text-blue-800";
      case "flexibility":
        return "bg-green-100 text-green-800";
      case "mixed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isMeal ? (
              <ChefHat className="h-5 w-5" />
            ) : (
              <Dumbbell className="h-5 w-5" />
            )}
            <Badge
              variant="outline"
              className={getTypeColor(isMeal ? meal!.type : workout!.type)}
            >
              {isMeal ? meal!.type : workout!.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Star className="h-4 w-4 fill-current" />
            <span>{(score * 100).toFixed(0)}%</span>
          </div>
        </div>

        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>

        <div className="text-xs text-muted-foreground">{relevanceReason}</div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {isMeal
                ? `${formatTime(meal!.prepTime + meal!.cookTime)}`
                : `${formatTime(workout!.duration)}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>
              {isMeal
                ? `${meal!.calories} cal`
                : `${workout!.caloriesBurned} cal`}
            </span>
          </div>
        </div>

        {/* Workout-specific info */}
        {workout && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Badge
              className={getDifficultyColor(workout.difficulty)}
              variant="secondary"
            >
              {workout.difficulty}
            </Badge>
          </div>
        )}

        {/* Meal-specific info */}
        {meal && (
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              <span>Prep: {formatTime(meal.prepTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {meal.servings} serving{meal.servings > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <BookOpen className="mr-2 h-4 w-4" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isMeal ? (
                    <ChefHat className="h-5 w-5" />
                  ) : (
                    <Dumbbell className="h-5 w-5" />
                  )}
                  {title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-muted-foreground">{description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      {isMeal
                        ? formatTime(meal!.prepTime + meal!.cookTime)
                        : formatTime(workout!.duration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isMeal ? "Total Time" : "Duration"}
                    </div>
                  </div>

                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      {isMeal
                        ? `${meal!.calories}`
                        : `${workout!.caloriesBurned}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Calories
                    </div>
                  </div>

                  {meal && (
                    <>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Timer className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-medium">
                          {formatTime(meal.prepTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Prep Time
                        </div>
                      </div>

                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-medium">
                          {meal.servings}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Servings
                        </div>
                      </div>
                    </>
                  )}

                  {workout && (
                    <>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-medium capitalize">
                          {workout.difficulty}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Difficulty
                        </div>
                      </div>

                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Heart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-sm font-medium">
                          {workout.targetMuscles.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Muscle Groups
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Meal Details */}
                {meal && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">
                        Nutrition (per serving)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          Protein:{" "}
                          <span className="font-medium">
                            {meal.nutrition.protein}g
                          </span>
                        </div>
                        <div>
                          Carbs:{" "}
                          <span className="font-medium">
                            {meal.nutrition.carbs}g
                          </span>
                        </div>
                        <div>
                          Fat:{" "}
                          <span className="font-medium">
                            {meal.nutrition.fat}g
                          </span>
                        </div>
                        <div>
                          Fiber:{" "}
                          <span className="font-medium">
                            {meal.nutrition.fiber}g
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Ingredients</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {meal.ingredients.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Instructions</h4>
                      <ol className="list-decimal list-inside text-sm space-y-2">
                        {meal.instructions.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {meal.dietaryRestrictions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Dietary Information
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {meal.dietaryRestrictions.map((diet) => (
                            <Badge key={diet} variant="secondary">
                              {diet}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Workout Details */}
                {workout && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Equipment Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {workout.equipment.map((eq) => (
                          <Badge key={eq} variant="secondary">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Target Muscles</h4>
                      <div className="flex flex-wrap gap-2">
                        {workout.targetMuscles.map((muscle) => (
                          <Badge key={muscle} variant="outline">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Exercises</h4>
                      <div className="space-y-3">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {exercise.sets && `${exercise.sets} sets • `}
                              {exercise.reps && `${exercise.reps} reps • `}
                              {exercise.duration && `${exercise.duration}s • `}
                              {exercise.rest && `${exercise.rest}s rest`}
                            </div>
                            <p className="text-sm">{exercise.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* All Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {onTry && (
            <Button size="sm" onClick={() => onTry(recommendation)}>
              <Heart className="mr-2 h-4 w-4" />
              Try This
            </Button>
          )}

          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSave(recommendation)}
            >
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
