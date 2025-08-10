"use client";

import { Award, Home, Bot, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import DashboardUserButton from "./dashboard-user-button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: Bot,
  },
  {
    title: "Recommendation",
    url: "/recommend",
    icon: Award,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/dashboard" className="flex items-center gap-4 pt-2 px-2">
          <Image src="/logo.svg" alt="logo" width={36} height={36} />
          <p className="text-2xl font-semibold font-rockSalt">ReVive</p>
        </Link>
      </SidebarHeader>

      <div className="px-4 py-2">
        <Separator className="text-black" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "px-4 py-2 h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.url &&
                        "bg-linear-to-r/oklch border-[#5D6B68]/10"
                    )}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="px-4 py-2">
        <Separator className="text-black" />
      </div>

      <SidebarFooter>
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
