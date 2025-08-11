"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UserHealthProfile } from "@/types";
import { toast } from "sonner";
import { Loader2, Save, User, Target, Utensils, Activity } from "lucide-react";

interface ProfileFormProps {
  profile?: UserHealthProfile;
  onSuccess?: () => void;
}

export default function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    goal: profile?.profile?.goal || "general_health",
    diet: profile?.profile?.diet || "none",
    activityLevel: profile?.profile?.activityLevel || "moderate",
    weight: profile?.profile?.personalInfo?.weight?.toString() || "",
    height: profile?.profile?.personalInfo?.height?.toString() || "",
    age: profile?.profile?.personalInfo?.age?.toString() || "",
    gender: profile?.profile?.personalInfo?.gender || "other",
    healthConditions: profile?.healthConditions?.join(", ") || "",
    // Health goals
    sleepTarget: profile?.goals?.sleep?.target?.toString() || "8",
    sleepPriority: profile?.goals?.sleep?.priority || "high",
    stepsTarget: profile?.goals?.steps?.target?.toString() || "10000",
    stepsPriority: profile?.goals?.steps?.priority || "medium",
    waterTarget: profile?.goals?.water?.target?.toString() || "2",
    waterPriority: profile?.goals?.water?.priority || "medium",
  });

  const goalOptions = [
    { value: "weight_loss", label: "Weight Loss", icon: "📉" },
    { value: "weight_gain", label: "Weight Gain", icon: "📈" },
    { value: "muscle_gain", label: "Muscle Gain", icon: "💪" },
    { value: "maintenance", label: "Maintenance", icon: "⚖️" },
    { value: "general_health", label: "General Health", icon: "🏥" },
  ];

  const dietOptions = [
    { value: "none", label: "No specific diet", icon: "🍽️" },
    { value: "vegetarian", label: "Vegetarian", icon: "🥗" },
    { value: "vegan", label: "Vegan", icon: "🌱" },
    { value: "keto", label: "Ketogenic", icon: "🥑" },
    { value: "paleo", label: "Paleo", icon: "🥩" },
    { value: "mediterranean", label: "Mediterranean", icon: "🫒" },
    { value: "gluten_free", label: "Gluten Free", icon: "🌾" },
  ];

  const activityOptions = [
    { value: "sedentary", label: "Sedentary (Little/no exercise)", icon: "🪑" },
    { value: "light", label: "Light (1-3 days/week)", icon: "🚶" },
    { value: "moderate", label: "Moderate (3-5 days/week)", icon: "🏃" },
    { value: "active", label: "Active (6-7 days/week)", icon: "🏋️" },
    { value: "very_active", label: "Very Active (2x/day)", icon: "🚴" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate health goals
    const sleepTarget = parseFloat(formData.sleepTarget);
    const stepsTarget = parseInt(formData.stepsTarget);
    const waterTarget = parseFloat(formData.waterTarget);

    if (sleepTarget < 4 || sleepTarget > 12) {
      toast.error("Sleep target should be between 4-12 hours");
      return;
    }

    if (stepsTarget < 1000 || stepsTarget > 50000) {
      toast.error("Steps target should be between 1,000-50,000 steps");
      return;
    }

    if (waterTarget < 0.5 || waterTarget > 6) {
      toast.error("Water target should be between 0.5-6 liters");
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        profile: {
          goal: formData.goal,
          diet: formData.diet,
          activityLevel: formData.activityLevel,
          personalInfo: {
            ...(formData.weight && { weight: parseFloat(formData.weight) }),
            ...(formData.height && { height: parseFloat(formData.height) }),
            ...(formData.age && { age: parseInt(formData.age) }),
            gender: formData.gender,
          },
        },
        goals: {
          sleep: {
            target: parseFloat(formData.sleepTarget),
            priority: formData.sleepPriority,
          },
          steps: {
            target: parseInt(formData.stepsTarget),
            priority: formData.stepsPriority,
          },
          water: {
            target: parseFloat(formData.waterTarget),
            priority: formData.waterPriority,
          },
        },
        ...(formData.healthConditions && {
          healthConditions: formData.healthConditions
            .split(",")
            .map((condition) => condition.trim())
            .filter(Boolean),
        }),
      };

      const response = await fetch("/api/health/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Wellness Goal */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Wellness Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="goal">What's your primary wellness goal?</Label>
          <Select
            value={formData.goal}
            onValueChange={(value) => handleInputChange("goal", value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your goal" />
            </SelectTrigger>
            <SelectContent>
              {goalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Diet Preferences */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-600" />
            Diet Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="diet">Do you follow any specific diet?</Label>
          <Select
            value={formData.diet}
            onValueChange={(value) => handleInputChange("diet", value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your diet" />
            </SelectTrigger>
            <SelectContent>
              {dietOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Activity Level */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Activity Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="activityLevel">How active are you?</Label>
          <Select
            value={formData.activityLevel}
            onValueChange={(value) => handleInputChange("activityLevel", value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your activity level" />
            </SelectTrigger>
            <SelectContent>
              {activityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Personal Information (Optional) */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            Personal Information
            <span className="text-sm font-normal text-muted-foreground">
              (Optional)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 70.5"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="e.g., 175"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 25"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other/Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Health Goals */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Health Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sleep Goal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">😴</span>
              <Label className="text-base font-semibold">Sleep Goal</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sleepTarget">Target Hours per Night</Label>
                <Input
                  id="sleepTarget"
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  placeholder="e.g., 8"
                  value={formData.sleepTarget}
                  onChange={(e) =>
                    handleInputChange("sleepTarget", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sleepPriority">Priority Level</Label>
                <Select
                  value={formData.sleepPriority}
                  onValueChange={(value) =>
                    handleInputChange("sleepPriority", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Steps Goal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👟</span>
              <Label className="text-base font-semibold">Steps Goal</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stepsTarget">Target Steps per Day</Label>
                <Input
                  id="stepsTarget"
                  type="number"
                  min="1000"
                  max="50000"
                  placeholder="e.g., 10000"
                  value={formData.stepsTarget}
                  onChange={(e) =>
                    handleInputChange("stepsTarget", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stepsPriority">Priority Level</Label>
                <Select
                  value={formData.stepsPriority}
                  onValueChange={(value) =>
                    handleInputChange("stepsPriority", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Water Goal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <Label className="text-base font-semibold">Water Goal</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="waterTarget">Target Liters per Day</Label>
                <Input
                  id="waterTarget"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="6"
                  placeholder="e.g., 2.5"
                  value={formData.waterTarget}
                  onChange={(e) =>
                    handleInputChange("waterTarget", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="waterPriority">Priority Level</Label>
                <Select
                  value={formData.waterPriority}
                  onValueChange={(value) =>
                    handleInputChange("waterPriority", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                    <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Conditions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            🏥 Health Conditions
            <span className="text-sm font-normal text-muted-foreground">
              (Optional)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="healthConditions">
            Any health conditions we should be aware of?
          </Label>
          <Textarea
            id="healthConditions"
            placeholder="e.g., diabetes, hypertension, allergies (separate with commas)"
            value={formData.healthConditions}
            onChange={(e) =>
              handleInputChange("healthConditions", e.target.value)
            }
            className="mt-2 min-h-[80px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
