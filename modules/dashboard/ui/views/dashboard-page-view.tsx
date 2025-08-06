"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActivityIcon,
  HeartIcon,
  MenuIcon,
  MinusIcon,
  PanelLeftCloseIcon,
  TrendingUpDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import DashboardForm from "../components/dashboard-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getStreak, getTodayStats, getWeeklyAverage } from "@/lib/utils";

interface HealthInsightsData {
  insights: HealthInsight[];
  goalProgress: any[];
  trends: any[];
  lastUpdated: string;
}

export default function DashboardPage() {
  const { toggleSidebar, isMobile } = useSidebar();

  const [sleepData, setSleepData] = useState<MetricData[] | null>(null);
  const [stepsData, setStepsData] = useState<MetricData[] | null>(null);
  const [waterData, setWaterData] = useState<MetricData[] | null>(null);
  const [healthInsights, setHealthInsights] =
    useState<HealthInsightsData | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //* Fetch metrics data
        const res = await fetch("/api/metrics");
        const { sleepData, stepsData, waterData } = await res.json();

        setSleepData(sleepData);
        setStepsData(stepsData);
        setWaterData(waterData);

        //* fetch health insights
        const insightsRes = await fetch("/api/health/insights");
        const insightsData = await insightsRes.json();

        setHealthInsights(insightsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [refreshKey]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingUpDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <HeartIcon className="h-4 w-4 text-green-600" />;
      case "warning":
        return <ActivityIcon className="h-4 w-4 text-red-600" />;
      case "suggestion":
        return <ActivityIcon className="h-4 w-4 text-blue-600" />;
      case "milestone":
        return <HeartIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-red-50 border-red-200 text-red-800";
      case "suggestion":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "milestone":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

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
            Dashboard
          </h1>
        </div>

        <div>
          <Dialog>
            <DialogTrigger className="bg-white px-4 py-2 rounded-xl border shadow-sm cursor-pointer hover:scale-105 transition-transform duration-100">
              Add Data
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Today's Data</DialogTitle>
                <DialogDescription>
                  Add your daily sleep hours and steps data. This data will be
                  visible only to you and will be used to generate charts and
                  statistics on this page.
                </DialogDescription>
              </DialogHeader>
              <DashboardForm onSuccess={() => setRefreshKey((k) => k + 1)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Health Insights Section */}
      {healthInsights && healthInsights.insights?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5 text-red-500" />
              Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthInsights.insights.slice(0, 3).map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getInsightColor(
                    insight.type
                  )}`}
                >
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{insight.message}</p>
                      {insight.metric && (
                        <p className="text-xs opacity-70 mt-1">
                          Related to: {insight.metric}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sleep (hrs)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {sleepData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stepsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stepsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends Section */}
      {healthInsights && healthInsights.trends?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {healthInsights.trends.map((trend, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.direction)}
                      <span className="font-medium capitalize">
                        {trend.metric}
                      </span>
                    </div>
                    <span
                      className={`text-sm ${
                        trend.direction === "up"
                          ? "text-green-600"
                          : trend.direction === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {trend.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Current avg: {trend.currentAvg.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today’s Stats</CardTitle>
          </CardHeader>
          <CardContent className="h-20">
            {/* Placeholder - Populate from API */}
            <p className="text-xl font-semibold">
              {sleepData && stepsData
                ? getTodayStats(sleepData, stepsData)
                : "No Data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Average</CardTitle>
          </CardHeader>
          <CardContent className="h-20">
            <p className="text-xl font-semibold">
              {sleepData ? getWeeklyAverage(sleepData) : "No data"} hrs sleep,{" "}
              {stepsData ? getWeeklyAverage(stepsData) : ""} steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Streak</CardTitle>
          </CardHeader>
          <CardContent className="h-20">
            <p className="text-xl font-semibold">
              {sleepData ? getStreak(sleepData) : "No data"} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goal Progress Section */}
      {healthInsights && healthInsights.goalProgress?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {healthInsights.goalProgress.map((progress, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {progress.metric}
                    </span>
                    <span className="text-sm text-gray-600">
                      {progress.current}/{progress.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        progress.progress >= 100
                          ? "bg-green-500"
                          : progress.progress >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(progress.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {progress.progress.toFixed(1)}% complete
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center space-x-4 p-6">
          <span className="text-2xl">😊</span>
          <p className="text-lg font-medium">Feeling energetic and positive</p>
          <p className="text-lg font-medium">
            {waterData && waterData.length > 0
              ? `Water: ${waterData[waterData.length - 1].value} L`
              : "No water data"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
