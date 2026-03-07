export type AdminNavKey =
  | "dashboard"
  | "tests"
  | "contentBank"
  | "users"
  | "analytics"
  | "mistakesAnalysis"
  | "subscriptions"
  | "achievements"
  | "reports"
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
  {key: "contentBank", segment: "content-bank"},
  {key: "users", segment: "users"},
  {key: "analytics", segment: "analytics"},
  {key: "mistakesAnalysis", segment: "mistakes-analysis"},
  {key: "subscriptions", segment: "subscriptions"},
  {key: "achievements", segment: "achievements"},
  {key: "reports", segment: "reports"},
  {key: "settings", segment: "settings"}
];

export const ADMIN_PROFILE: AdminProfileEntity = {
  name: "Sarah Jenkins",
  role: "Super Admin",
  initials: "SJ"
};
