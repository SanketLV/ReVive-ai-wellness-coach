import { MetricData } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFormattedDate(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function getTodayStats(
  sleepData: MetricData[] | null,
  stepsData: MetricData[] | null
) {
  if (
    !sleepData ||
    !stepsData ||
    sleepData.length === 0 ||
    stepsData.length === 0
  )
    return "—";
  return `${sleepData[sleepData.length - 1].value} hrs sleep, ${
    stepsData[stepsData.length - 1].value
  } steps`;
}

export function getWeeklyAverage(data: MetricData[] | null) {
  if (!data || data.length === 0) return 0;
  return (data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2);
}

export function getStreak(data: MetricData[] | null) {
  if (!data || data.length === 0) return 0;
  let streak = 1;
  for (let i = data.length - 1; i > 0; i--) {
    const prev = new Date(
      new Date().getFullYear() + "-" + data[i - 1].date.replace("-", "-")
    );
    const curr = new Date(
      new Date().getFullYear() + "-" + data[i].date.replace("-", "-")
    );
    if ((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
