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
import { MenuIcon, PanelLeftCloseIcon } from "lucide-react";
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

export default function DashboardPage() {
  const { toggleSidebar, isMobile } = useSidebar();

  const [sleepData, setSleepData] = useState<MetricData[] | null>(null);
  const [stepsData, setStepsData] = useState<MetricData[] | null>(null);
  const [moodData, setMoodData] = useState<MetricData[] | null>(null);
  const [waterData, setWaterData] = useState<MetricData[] | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // Simulated sleep and step data for past 7 days
    const fetchData = async () => {
      const res = await fetch("/api/metrics");
      const {
        sleepData,
        stepsData,
        // moodData,
        waterData,
      } = await res.json();
      setSleepData(sleepData);
      setStepsData(stepsData);
      // setMoodData(moodData);
      setWaterData(waterData);
    };
    fetchData();
  }, [refreshKey]);

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
