"use client";

import {useEffect, useMemo, useState} from "react";

import {adminSummary, growthStats, platformInsights, recentActivity, testCompletionStats, type AdminMonthKey} from "@/data/admin-dashboard";
import {adminDashboardService} from "@/src/services/admin/dashboard.service";

import {AdminCharts} from "./AdminCharts";
import {AdminInsights} from "./AdminInsights";
import {AdminRecentActivity} from "./AdminRecentActivity";
import {AdminSidebar} from "./AdminSidebar";
import {AdminStatCards} from "./AdminStatCards";
import {AdminTopbar} from "./AdminTopbar";

const avatarTones = ["blue", "emerald", "violet", "amber"] as const;
const activityStatuses = ["verified", "active", "pendingReview"] as const;

function toMonthKey(value: string): AdminMonthKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "jan";
  }

  const month = date.getUTCMonth();
  const monthKeys: AdminMonthKey[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul"];
  return monthKeys[month % monthKeys.length] ?? "jan";
}

export function AdminDashboardClient() {
  const [dashboardPayload, setDashboardPayload] = useState<Awaited<ReturnType<typeof adminDashboardService.get>> | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await adminDashboardService.get();
        if (!active) return;
        setDashboardPayload(response);
      } catch {
        if (!active) return;
        setDashboardPayload(null);
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const mappedSummary = useMemo(() => {
    if (!dashboardPayload) return adminSummary;
    const metrics = dashboardPayload.metrics;

    return [
      {...adminSummary[0], value: metrics.totalUsers, growthPct: 0},
      {...adminSummary[1], value: metrics.testsCompleted, growthPct: 0},
      {...adminSummary[2], value: metrics.activeUsers, growthPct: 0},
      {...adminSummary[3], value: metrics.premiumSubscribers, growthPct: 0}
    ];
  }, [dashboardPayload]);

  const mappedGrowth = useMemo(() => {
    if (!dashboardPayload || dashboardPayload.userGrowth.length === 0) return growthStats;

    return dashboardPayload.userGrowth.slice(-7).map((item) => ({
      month: toMonthKey(item.date),
      users: item.newUsers
    }));
  }, [dashboardPayload]);

  const mappedCompletion = useMemo(() => {
    if (!dashboardPayload || dashboardPayload.testsCompletedSeries.length === 0) return testCompletionStats;

    return dashboardPayload.testsCompletedSeries.slice(-7).map((item) => ({
      month: toMonthKey(item.date),
      academic: item.testsCompleted
    }));
  }, [dashboardPayload]);

  const mappedInsights = useMemo(() => {
    if (!dashboardPayload) return platformInsights;
    const hardest = dashboardPayload.platformInsights.hardestQuestionTypes[0];
    const attemptsSum = dashboardPayload.platformInsights.hardestQuestionTypes.reduce((sum, item) => sum + item.attempts, 0);

    return {
      mostDifficult: {
        topic: hardest?.questionType || platformInsights.mostDifficult.topic,
        averageScore: hardest ? `${hardest.accuracyPercent.toFixed(1)}%` : platformInsights.mostDifficult.averageScore
      },
      averageScore: {
        band: dashboardPayload.platformInsights.averageScore,
        sampleSize: attemptsSum || platformInsights.averageScore.sampleSize
      }
    };
  }, [dashboardPayload]);

  const mappedActivity = useMemo(() => {
    if (!dashboardPayload || dashboardPayload.recentUserActivity.length === 0) return recentActivity;

    return dashboardPayload.recentUserActivity.slice(0, 10).map((item, index) => {
      const firstChar = String(item.userName || item.email || "U").trim().charAt(0).toUpperCase();
      const secondChar = String(item.userName || item.email || "S")
        .trim()
        .split(" ")
        .filter(Boolean)[1]?.charAt(0)
        ?.toUpperCase();

      return {
        id: item.attemptId || `${item.userId}-${item.timestamp}-${index}`,
        userName: item.userName || item.email || "Unknown User",
        userInitials: `${firstChar}${secondChar ?? ""}` || "U",
        avatarTone: avatarTones[index % avatarTones.length],
        action: item.testTitle || "Completed test",
        score: item.bandScore > 0 ? item.bandScore.toFixed(1) : item.score > 0 ? `${item.score}` : "-",
        status: activityStatuses[index % activityStatuses.length]
      };
    });
  }, [dashboardPayload]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <AdminStatCards summary={mappedSummary} />
            <AdminCharts growthPoints={mappedGrowth} completionPoints={mappedCompletion} />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.6fr)]">
              <AdminInsights insights={mappedInsights} />
              <AdminRecentActivity activity={mappedActivity} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
