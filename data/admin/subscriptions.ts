import type {PlanEntity, PlanId, SubscriptionActionEntity} from "@/types/admin";

export type GlobalPlanSettingsEntity = {
  guestTestLimit: number;
  aiRecommendationsAccess: boolean;
  premiumExplanations: boolean;
};

export const PLAN_ENTITIES: PlanEntity[] = [
  {
    id: "guest",
    name: "Guest",
    tagline: "Limited accessibility",
    price: 0,
    billingPeriod: "forever",
    features: [
      {id: "guest-f-1", label: "2 Practice Tests", included: true},
      {id: "guest-f-2", label: "AI Recommendations", included: false},
      {id: "guest-f-3", label: "Premium Materials", included: false}
    ]
  },
  {
    id: "free",
    name: "Free",
    tagline: "Basic registered account",
    price: 0,
    billingPeriod: "forever",
    features: [
      {id: "free-f-1", label: "5 Practice Tests / Month", included: true},
      {id: "free-f-2", label: "Community Access", included: true},
      {id: "free-f-3", label: "AI Score Analysis", included: false}
    ]
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Personalized coaching",
    price: 19,
    billingPeriod: "month",
    highlight: true,
    badge: "POPULAR",
    features: [
      {id: "pro-f-1", label: "Unlimited Tests", included: true},
      {id: "pro-f-2", label: "AI Recommendations", included: true},
      {id: "pro-f-3", label: "Full Performance Tracking", included: true},
      {id: "pro-f-4", label: "Writing Corrections (3/mo)", included: true}
    ]
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "All-inclusive power user",
    price: 49,
    billingPeriod: "month",
    features: [
      {id: "premium-f-1", label: "Everything in Pro", included: true},
      {id: "premium-f-2", label: "Live Tutor Sessions", included: true},
      {id: "premium-f-3", label: "Premium Video Course", included: true},
      {id: "premium-f-4", label: "Official Mock Exam Access", included: true}
    ]
  }
];

export const GLOBAL_PLAN_SETTINGS_ENTITY: GlobalPlanSettingsEntity = {
  guestTestLimit: 2,
  aiRecommendationsAccess: false,
  premiumExplanations: true
};

export const SUBSCRIPTION_ACTION_ENTITIES: SubscriptionActionEntity[] = [
  {
    id: "sub-act-1",
    userId: "usr-1005",
    fromPlanId: "free",
    toPlanId: "pro",
    date: "2023-10-24",
    status: "success"
  },
  {
    id: "sub-act-2",
    userId: "usr-1004",
    fromPlanId: "pro",
    toPlanId: "premium",
    date: "2023-10-23",
    status: "success"
  },
  {
    id: "sub-act-3",
    userId: "usr-1001",
    fromPlanId: "guest",
    toPlanId: "free",
    date: "2023-10-23",
    status: "pending"
  },
  {
    id: "sub-act-4",
    userId: "usr-1003",
    fromPlanId: "pro",
    toPlanId: "cancelled",
    date: "2023-10-22",
    status: "closed"
  },
  {
    id: "sub-act-5",
    userId: "usr-1002",
    fromPlanId: "free",
    toPlanId: "pro",
    date: "2023-10-21",
    status: "success"
  },
  {
    id: "sub-act-6",
    userId: "usr-1008",
    fromPlanId: "pro",
    toPlanId: "premium",
    date: "2023-10-20",
    status: "pending"
  }
];

export function getPlanById(planId: PlanId) {
  return PLAN_ENTITIES.find((plan) => plan.id === planId);
}
