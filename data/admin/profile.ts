export type AdminNavKey =
  | "dashboard"
  | "tests"
  | "questionBank"
  | "users"
  | "analytics"
  | "mistakesAnalysis"
  | "subscriptions"
  | "achievements"
  | "reports"
  | "blog"
  | "settings";

export type AdminNavItem = {
  key: AdminNavKey;
  segment: string;
};

export type AdminProfileEntity = {
  name: string;
  role: string;
  initials: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {key: "dashboard", segment: ""},
  {key: "tests", segment: "tests"},
  {key: "questionBank", segment: "question-bank"},
  {key: "users", segment: "users"},
  {key: "analytics", segment: "analytics"},
  {key: "mistakesAnalysis", segment: "mistakes-analysis"},
  {key: "subscriptions", segment: "subscriptions"},
  {key: "achievements", segment: "achievements"},
  {key: "reports", segment: "reports"},
  {key: "blog", segment: "blog"},
  {key: "settings", segment: "settings"}
];

export const ADMIN_PROFILE: AdminProfileEntity = {
  name: "Sarah Jenkins",
  role: "Super Admin",
  initials: "SJ"
};
