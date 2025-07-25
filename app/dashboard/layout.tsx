import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "@/modules/dashboard/ui/components/sidebar";
import React from "react";

export default function Dashboardlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col h-auto w-screen bg-muted">
        <div className="w-full">{children}</div>
      </main>
    </SidebarProvider>
  );
}
