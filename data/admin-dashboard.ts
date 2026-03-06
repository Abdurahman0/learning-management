import {
  getAdminNavItems,
  getAdminProfile,
  getDashboardStats,
  getPlatformInsights,
  getRecentUserActivity,
  getTestsCompletionStats,
  getUserGrowthStats,
  type ActivityAvatarTone,
  type ActivityStatus,
  type DashboardCompletionPoint,
  type DashboardGrowthPoint
} from "@/data/admin/selectors";
import type {AdminNavItem, AdminNavKey} from "@/data/admin/profile";

export type {AdminNavItem, AdminNavKey};
export type AdminSummaryMetricKey = "totalUsers" | "testsCompleted" | "activeUsers" | "premiumSubscribers";
export type AdminSummaryIconKey = "users" | "clipboardCheck" | "activity" | "crown";
export type AdminMonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun" | "jul";
export type {ActivityStatus, ActivityAvatarTone};

export interface AdminProfile {
  name: string;
  role: string;
  initials: string;
}

export interface AdminSummaryMetric {
  key: AdminSummaryMetricKey;
  icon: AdminSummaryIconKey;
  value: number;
  growthPct: number;
}

export interface UserGrowthPoint extends DashboardGrowthPoint {}
export interface TestCompletionPoint extends DashboardCompletionPoint {}

export interface PlatformInsights {
  mostDifficult: {
    topic: string;
    averageScore: string;
  };
  averageScore: {
    band: number;
    sampleSize: number;
  };
}

export interface RecentActivityItem {
  id: string;
  userName: string;
  userInitials: string;
  avatarTone: ActivityAvatarTone;
  action: string;
  score: string;
  status: ActivityStatus;
}

export const adminNavItems = getAdminNavItems() satisfies AdminNavItem[];
export const adminProfile = getAdminProfile() satisfies AdminProfile;
export const adminSummary = getDashboardStats() satisfies AdminSummaryMetric[];
export const growthStats = getUserGrowthStats() satisfies UserGrowthPoint[];
export const testCompletionStats = getTestsCompletionStats() satisfies TestCompletionPoint[];
export const platformInsights = getPlatformInsights() satisfies PlatformInsights;
export const recentActivity = getRecentUserActivity() satisfies RecentActivityItem[];
