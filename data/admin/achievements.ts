import type {
  AchievementEntity,
  BadgeLibraryEntity,
  GamificationSettingsEntity,
  UserAchievementEntity
} from "@/types/admin";

export const ACHIEVEMENT_ENTITIES: AchievementEntity[] = [
  {
    id: "achv-7day-streak",
    title: "7 Day Streak",
    description: "Complete one test every day for a full week.",
    tone: "gold",
    badgeIcon: "trophy"
  },
  {
    id: "achv-high-flyer",
    title: "High Flyer",
    description: "Achieve a band score of 8.0 or higher in any module.",
    tone: "slate",
    badgeIcon: "award"
  },
  {
    id: "achv-30day-streak",
    title: "30 Day Streak",
    description: "Maintain activity for 30 consecutive days.",
    tone: "orange",
    badgeIcon: "flame"
  },
  {
    id: "achv-perfect-score",
    title: "Perfect Score",
    description: "Get 40/40 correct in a Reading or Listening test.",
    tone: "purple",
    badgeIcon: "sparkles"
  },
  {
    id: "achv-listening-momentum",
    title: "Listening Momentum",
    description: "Finish five listening tests with no skipped questions.",
    tone: "slate",
    badgeIcon: "award"
  },
  {
    id: "achv-reading-marathon",
    title: "Reading Marathon",
    description: "Complete three full reading sets in one weekend.",
    tone: "gold",
    badgeIcon: "trophy"
  }
];

export const USER_ACHIEVEMENT_ENTITIES: UserAchievementEntity[] = [
  {
    id: "ua-1",
    userId: "usr-1005",
    achievementId: "achv-7day-streak",
    dateEarned: "Oct 24, 2023",
    currentStreak: "12 Days"
  },
  {
    id: "ua-2",
    userId: "usr-1004",
    achievementId: "achv-perfect-score",
    dateEarned: "Oct 23, 2023",
    currentStreak: "3 Days"
  },
  {
    id: "ua-3",
    userId: "usr-1001",
    achievementId: "achv-high-flyer",
    dateEarned: "Oct 22, 2023",
    currentStreak: "45 Days"
  },
  {
    id: "ua-4",
    userId: "usr-1003",
    achievementId: "achv-30day-streak",
    dateEarned: "Oct 21, 2023",
    currentStreak: "31 Days"
  },
  {
    id: "ua-5",
    userId: "usr-1002",
    achievementId: "achv-listening-momentum",
    dateEarned: "Oct 21, 2023",
    currentStreak: "9 Days"
  }
];

export const GAMIFICATION_SETTINGS_ENTITY: GamificationSettingsEntity = {
  streakTracking: true,
  badgeNotifications: true,
  publicLeaderboard: false
};

export const BADGE_LIBRARY_ENTITIES: BadgeLibraryEntity[] = [
  {id: "badge-starter", label: "Starter", icon: "star"},
  {id: "badge-fast-learner", label: "Fast Learner", icon: "rocket"},
  {id: "badge-essay-king", label: "Essay King", icon: "pen"},
  {id: "badge-speaker", label: "Speaker", icon: "mic"},
  {id: "badge-listener", label: "Listener", icon: "headphones"},
  {id: "badge-new", label: "New Badge", icon: "plus"}
];

export const ACHIEVEMENT_TRENDS: Record<"weekly" | "monthly", Array<{label: string; value: number}>> = {
  weekly: [
    {label: "Mon", value: 114},
    {label: "Tue", value: 162},
    {label: "Wed", value: 246},
    {label: "Thu", value: 178},
    {label: "Fri", value: 305},
    {label: "Sat", value: 102},
    {label: "Sun", value: 268}
  ],
  monthly: [
    {label: "Jan", value: 1420},
    {label: "Feb", value: 1580},
    {label: "Mar", value: 1745},
    {label: "Apr", value: 1650},
    {label: "May", value: 1910},
    {label: "Jun", value: 2140},
    {label: "Jul", value: 2290}
  ]
};
