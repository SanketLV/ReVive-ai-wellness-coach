import type { Metadata } from "next";
import { Geist, Geist_Mono, Rock_Salt } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rockSalt = Rock_Salt({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rock-salt",
});

export const metadata: Metadata = {
  title: "ReVive - AI Wellness Coach",
  description:
    "Redis + Revive (wellness, rejuvenation), Transform your well-being with our AI-powered wellness coaching platform. Get personalized recommendations, track your progress, and achieve your health and wellness goals with our intuitive and supportive tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rockSalt.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
