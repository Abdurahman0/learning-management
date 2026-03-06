import {getUsersSummaryStats, getUsersTableData, type UsersPageUser} from "@/data/admin/selectors";

export type UserPlan = "free" | "pro" | "premium";
export type UserRole = "student" | "admin" | "tutor";
export type UserStatus = "verified" | "active" | "suspended";
export type UserLocale = "en" | "uz";

export type UserModuleStats = {
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
};

export type WeakArea = {
  id: string;
  label: string;
  severity: "critical" | "improving" | "stable";
};

export type UserHistoryItem = {
  id: string;
  testName: string;
  module: "reading" | "listening" | "writing" | "speaking";
  score: string;
  date: string;
};

export type PaymentItem = {
  id: string;
  title: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  date: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarFallback: string;
  avatarUrl?: string;
  plan: UserPlan;
  role: UserRole;
  status: UserStatus;
  locale: UserLocale;
  overallBand: number;
  targetBand: number;
  joinedAt: string;
  isActiveToday: boolean;
  stats: UserModuleStats;
  weakAreas: WeakArea[];
  bandProgress: {label: string; value: number}[];
  history: UserHistoryItem[];
  payments: PaymentItem[];
};

export type FilterOption<T extends string> = {
  value: T;
  labelKey: string;
};

export type StatusFilterValue = "all" | UserStatus;
export type RoleFilterValue = "all" | UserRole;
export type PlanFilterValue = "all" | UserPlan;
export type LocaleFilterValue = "all" | UserLocale;

export type UserStatCard = {
  id: "totalUsers" | "activeToday" | "newThisMonth" | "payingUsers";
  value: number;
  change: string;
  icon: "users" | "activity" | "newUsers" | "crown";
};

export const STATUS_FILTER_OPTIONS: FilterOption<StatusFilterValue>[] = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "verified", labelKey: "filters.status.verified"},
  {value: "active", labelKey: "filters.status.active"},
  {value: "suspended", labelKey: "filters.status.suspended"}
];

export const ROLE_FILTER_OPTIONS: FilterOption<RoleFilterValue>[] = [
  {value: "all", labelKey: "filters.role.all"},
  {value: "student", labelKey: "filters.role.student"},
  {value: "admin", labelKey: "filters.role.admin"},
  {value: "tutor", labelKey: "filters.role.tutor"}
];

export const PLAN_FILTER_OPTIONS: FilterOption<PlanFilterValue>[] = [
  {value: "all", labelKey: "filters.plan.all"},
  {value: "free", labelKey: "filters.plan.free"},
  {value: "pro", labelKey: "filters.plan.pro"},
  {value: "premium", labelKey: "filters.plan.premium"}
];

export const LOCALE_FILTER_OPTIONS: FilterOption<LocaleFilterValue>[] = [
  {value: "all", labelKey: "filters.locale.all"},
  {value: "en", labelKey: "filters.locale.en"},
  {value: "uz", labelKey: "filters.locale.uz"}
];

export const ADMIN_USERS = getUsersTableData() satisfies UsersPageUser[];

export function deriveUserStats(users: AdminUser[]): UserStatCard[] {
  if (users.length === ADMIN_USERS.length) {
    return [...getUsersSummaryStats()] as UserStatCard[];
  }

  const totalUsers = users.length;
  const activeToday = users.filter((user) => user.isActiveToday).length;
  const newThisMonth = users.filter((user) => user.joinedAt.startsWith("2026-03")).length;
  const payingUsers = users.filter((user) => user.plan !== "free").length;

  return [
    {id: "totalUsers", value: totalUsers, change: "+12.5%", icon: "users"},
    {id: "activeToday", value: activeToday, change: "+4.3%", icon: "activity"},
    {id: "newThisMonth", value: newThisMonth, change: "+8.1%", icon: "newUsers"},
    {id: "payingUsers", value: payingUsers, change: "+6.8%", icon: "crown"}
  ] satisfies UserStatCard[];
}
