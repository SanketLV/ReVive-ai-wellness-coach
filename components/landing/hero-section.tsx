"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

const HeroSection = () => {
  const { data } = authClient.useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI Wellness Coach
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Your personal AI-powered wellness companion. Get personalized health
            advice, track your goals, and transform your lifestyle.
          </p>

          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            {data ? (
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link href="/sign-up">Get Started</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">
                🤖 AI-Powered Guidance
              </CardTitle>
              <CardDescription className="text-lg">
                Get personalized health and wellness advice from advanced AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">📊 Goal Tracking</CardTitle>
              <CardDescription className="text-lg">
                Set, monitor, and achieve your wellness goals with smart
                insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl mb-2">
                🎯 Personalized Plans
              </CardTitle>
              <CardDescription className="text-lg">
                Receive customized wellness plans tailored to your unique needs
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
