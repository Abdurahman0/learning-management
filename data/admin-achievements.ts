import {getAchievementsPageData} from "@/data/admin/selectors";

export type AchievementStatIcon = "total" | "earned" | "badge" | "streak";

export type AchievementStat = {
  id: "totalAchievements" | "earnedToday" | "mostEarnedBadge" | "activeStreakUsers";
  value: string;
  icon: AchievementStatIcon;
};

export type ActiveAchievementTone = "gold" | "slate" | "orange" | "purple";
export type ActiveAchievementIcon = "trophy" | "award" | "flame" | "sparkles";

export type ActiveAchievement = {
  id: string;
  title: string;
  description: string;
  timesEarned: number;
  tone: ActiveAchievementTone;
  badgeIcon: ActiveAchievementIcon;
};

export type RecentProgressItem = {
  id: string;
  userName: string;
  email: string;
  avatarFallback: string;
  achievement: string;
  dateEarned: string;
  currentStreak: string;
};

export type GamificationSettings = {
  streakTracking: boolean;
  badgeNotifications: boolean;
  publicLeaderboard: boolean;
};

export type AchievementChartMode = "weekly" | "monthly";

export type AchievementTrendPoint = {
  label: string;
  value: number;
};

export type BadgeLibraryIcon = "star" | "rocket" | "pen" | "mic" | "headphones" | "plus";

export type BadgeLibraryItem = {
  id: string;
  label: string;
  icon: BadgeLibraryIcon;
};

export type AchievementCategory = "streak" | "score" | "module" | "engagement";

export const ACHIEVEMENT_CATEGORY_OPTIONS: AchievementCategory[] = ["streak", "score", "module", "engagement"];

const achievementsData = getAchievementsPageData();

export const ACHIEVEMENT_STATS = achievementsData.stats satisfies AchievementStat[];
export const ACTIVE_ACHIEVEMENTS = achievementsData.activeAchievements satisfies ActiveAchievement[];
export const RECENT_USER_PROGRESS = achievementsData.recentProgress satisfies RecentProgressItem[];
export const DEFAULT_GAMIFICATION_SETTINGS = achievementsData.settings satisfies GamificationSettings;
export const ACHIEVEMENT_TREND_DATA = achievementsData.trends satisfies Record<AchievementChartMode, AchievementTrendPoint[]>;
export const BADGE_LIBRARY_PREVIEW = achievementsData.badgeLibrary satisfies BadgeLibraryItem[];
