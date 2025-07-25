"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const DashboardPageView = () => {
  const { data } = authClient.useSession();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {data?.user.name}!
          </h1>
          <p className="text-muted-foreground">Your wellness dashboard</p>
        </div>
        <Button onClick={() => authClient.signOut()} variant="outline">
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {data?.user.name}
              </p>
              <p>
                <strong>Email:</strong> {data?.user.email}
              </p>
              <p>
                <strong>Email Verified:</strong>{" "}
                {data?.user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wellness Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No goals set yet. Start by creating your first wellness goal!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Coach</CardTitle>
            <CardDescription>Get personalized advice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Chat with your AI wellness coach for personalized guidance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPageView;
