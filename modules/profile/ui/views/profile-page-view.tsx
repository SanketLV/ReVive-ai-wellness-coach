"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHealthProfile } from "@/types";
import ProfileDisplay from "../components/profile-display";
import ProfileForm from "../components/profile-form";
import {
  MenuIcon,
  PanelLeftCloseIcon,
  User,
  Settings,
  RefreshCw,
  Loader,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePageView() {
  const { toggleSidebar, isMobile } = useSidebar();
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("view");

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/health/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData = await response.json();
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = () => {
    // Refresh profile data after successful update
    fetchProfile();
    // Switch to view tab after successful update
    setActiveTab("view");
    toast.success("Profile updated successfully!");
  };

  const handleRefresh = () => {
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
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
              Profile
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            Profile
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Profile Content */}
      {profile ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="border flex">
            <TabsTrigger
              value="view"
              className="flex items-center gap-2 w-[200px]"
            >
              <User className="h-4 w-4" />
              View Profile
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="flex items-center gap-2 w-[200px]"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            <ProfileDisplay profile={profile} />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <ProfileForm profile={profile} onSuccess={handleProfileUpdate} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Profile Data</h3>
          <p className="text-muted-foreground mb-4">
            Create your wellness profile to get personalized recommendations.
          </p>
          <Button onClick={() => setActiveTab("edit")}>Create Profile</Button>
        </div>
      )}
    </div>
  );
}
