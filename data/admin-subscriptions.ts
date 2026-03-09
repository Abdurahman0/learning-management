import {getSubscriptionsPageData} from "@/data/admin/selectors";

export type PlanId = "guest" | "free" | "pro" | "premium" | `custom-${string}` | "new-plan";
export type BillingPeriod = "forever" | "month";
export type SubscriptionActionStatus = "success" | "pending" | "closed";

export type PlanFeature = {
  id: string;
  label: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  billingPeriod: BillingPeriod;
  highlight?: boolean;
  badge?: string;
  features: PlanFeature[];
};

export type SubscriptionStat = {
  id: "totalSubscribers" | "monthlyRevenue" | "freeUsers" | "conversionRate";
  labelKey: string;
  value: string;
  change: string;
  tone?: "positive" | "negative" | "neutral";
  icon: "users" | "wallet" | "userCheck" | "percent";
};

export type GlobalPlanSettings = {
  guestTestLimit: number;
  aiRecommendationsAccess: boolean;
  premiumExplanations: boolean;
};

export type PlanDistributionItem = {
  plan: "free" | "pro" | "premium";
  percentage: number;
  users: number;
  color: string;
};

export type SubscriptionAction = {
  id: string;
  userName: string;
  email: string;
  avatarFallback: string;
  fromPlan: string;
  toPlan: string;
  date: string;
  status: SubscriptionActionStatus;
};

const subscriptionsData = getSubscriptionsPageData();

export const SUBSCRIPTION_STATS = subscriptionsData.stats satisfies SubscriptionStat[];
export const SUBSCRIPTION_PLANS = subscriptionsData.plans satisfies SubscriptionPlan[];
export const GLOBAL_PLAN_SETTINGS = subscriptionsData.settings satisfies GlobalPlanSettings;
export const PLAN_DISTRIBUTION = subscriptionsData.distribution satisfies PlanDistributionItem[];
export const RECENT_SUBSCRIPTION_ACTIONS = subscriptionsData.recentActions satisfies SubscriptionAction[];
