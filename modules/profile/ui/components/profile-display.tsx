"use client";

import { UserHealthProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, User, Heart, Clock } from "lucide-react";

interface ProfileDisplayProps {
  profile: UserHealthProfile;
}

export default function ProfileDisplay({ profile }: ProfileDisplayProps) {
  const getGoalDisplay = (goal: string) => {
    const goalMap = {
      weight_loss: {
        label: "Weight Loss",
        icon: "📉",
        color: "bg-red-100 text-red-500",
      },
      weight_gain: {
        label: "Weight Gain",
        icon: "📈",
        color: "bg-blue-100 text-blue-800",
      },
      muscle_gain: {
        label: "Muscle Gain",
        icon: "💪",
        color: "bg-orange-100 text-orange-800",
      },
      maintenance: {
        label: "Maintenance",
        icon: "⚖️",
        color: "bg-green-100 text-green-800",
      },
      general_health: {
        label: "General Health",
        icon: "🏥",
        color: "bg-purple-100 text-purple-800",
      },
    };
    return (
      goalMap[goal as keyof typeof goalMap] || {
        label: goal,
        icon: "🎯",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const getDietDisplay = (diet: string) => {
    const dietMap = {
      none: { label: "No specific diet", icon: "🍽️" },
      vegetarian: { label: "Vegetarian", icon: "🥗" },
      vegan: { label: "Vegan", icon: "🌱" },
      keto: { label: "Ketogenic", icon: "🥑" },
      paleo: { label: "Paleo", icon: "🥩" },
      mediterranean: { label: "Mediterranean", icon: "🫒" },
      gluten_free: { label: "Gluten Free", icon: "🌾" },
    };
    return dietMap[diet as keyof typeof dietMap] || { label: diet, icon: "🍽️" };
  };

  const getActivityDisplay = (level: string) => {
    const levelMap = {
      sedentary: {
        label: "Sedentary",
        icon: "🪑",
        color: "bg-red-100 text-red-800",
      },
      light: {
        label: "Light",
        icon: "🚶",
        color: "bg-yellow-100 text-yellow-800",
      },
      moderate: {
        label: "Moderate",
        icon: "🏃",
        color: "bg-blue-100 text-blue-800",
      },
      active: {
        label: "Active",
        icon: "🏋️",
        color: "bg-green-100 text-green-800",
      },
      very_active: {
        label: "Very Active",
        icon: "🚴",
        color: "bg-purple-100 text-purple-800",
      },
    };
    return (
      levelMap[level as keyof typeof levelMap] || {
        label: level,
        icon: "🏃",
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateBMI = () => {
    const weight = profile.profile?.personalInfo?.weight;
    const height = profile.profile?.personalInfo?.height;
    if (weight && height) {
      const bmi = weight / (height / 100) ** 2;
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { label: "Underweight", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25)
      return { label: "Normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30)
      return { label: "Overweight", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Obese", color: "bg-red-100 text-red-800" };
  };

  const goalDisplay = getGoalDisplay(profile.profile?.goal || "general_health");
  const dietDisplay = getDietDisplay(profile.profile?.diet || "none");
  const activityDisplay = getActivityDisplay(
    profile.profile?.activityLevel || "moderate"
  );
  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{goalDisplay.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <Badge className={goalDisplay.color}>{goalDisplay.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{dietDisplay.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">Diet</p>
                <p className="font-medium">{dietDisplay.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activityDisplay.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground">Activity Level</p>
                <Badge className={activityDisplay.color}>
                  {activityDisplay.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      {(profile.profile?.personalInfo?.weight ||
        profile.profile?.personalInfo?.height ||
        profile.profile?.personalInfo?.age ||
        profile.profile?.personalInfo?.gender) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.profile?.personalInfo?.weight && (
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold">
                    {profile.profile.personalInfo.weight} kg
                  </p>
                </div>
              )}
              {profile.profile?.personalInfo?.height && (
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-lg font-semibold">
                    {profile.profile.personalInfo.height} cm
                  </p>
                </div>
              )}
              {profile.profile?.personalInfo?.age && (
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="text-lg font-semibold">
                    {profile.profile.personalInfo.age} years
                  </p>
                </div>
              )}
              {profile.profile?.personalInfo?.gender && (
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="text-lg font-semibold capitalize">
                    {profile.profile.personalInfo.gender}
                  </p>
                </div>
              )}
            </div>

            {bmi && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">BMI</p>
                    <p className="text-2xl font-bold">{bmi}</p>
                  </div>
                  {bmiCategory && (
                    <Badge className={bmiCategory.color}>
                      {bmiCategory.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Health Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(profile.goals || {}).map(([metric, goal]) => (
              <div
                key={metric}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="capitalize font-medium">{metric}</span>
                  <Badge
                    variant={
                      goal.priority === "high"
                        ? "destructive"
                        : goal.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {goal.priority} priority
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {goal.target}{" "}
                    {metric === "sleep" ? "hrs" : metric === "water" ? "L" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Conditions */}
      {profile.healthConditions && profile.healthConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Health Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.healthConditions.map((condition, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-red-50 text-red-700"
                >
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last updated: {formatDate(profile.lastUpdated)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
