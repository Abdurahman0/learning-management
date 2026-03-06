"use client";

import {AdminCharts} from "./AdminCharts";
import {AdminInsights} from "./AdminInsights";
import {AdminRecentActivity} from "./AdminRecentActivity";
import {AdminSidebar} from "./AdminSidebar";
import {AdminStatCards} from "./AdminStatCards";
import {AdminTopbar} from "./AdminTopbar";

export function AdminDashboardClient() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <AdminStatCards />
            <AdminCharts />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
              <AdminInsights />
              <AdminRecentActivity />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
