import type {TeacherNavItem, TeacherNavKey} from "@/types/teacher";

import {
  getTeacherDashboardMonthlyProgress,
  getTeacherDashboardOverviewStats,
  getTeacherDashboardRecentActivity,
  getTeacherDashboardStudentsNeedingHelp,
  getTeacherNavItems,
  getTeacherProfile,
  getTeacherQuickActions,
  type TeacherDashboardLastActivityKey as TeacherDashboardLastActivityKeyModel,
  type TeacherDashboardMonthKey as TeacherDashboardMonthKeyModel,
  type TeacherDashboardRecentActivityEventKey as TeacherDashboardRecentActivityEventKeyModel,
  type TeacherDashboardRecentActivityItem as TeacherDashboardRecentActivityItemModel,
  type TeacherDashboardRecentActivityTimeKey as TeacherDashboardRecentActivityTimeKeyModel,
  type TeacherDashboardRecentActivityTone as TeacherDashboardRecentActivityToneModel,
  type TeacherDashboardStat as TeacherDashboardStatModel,
  type TeacherDashboardStatKey as TeacherDashboardStatKeyModel,
  type TeacherDashboardStudentNeedingHelp as TeacherDashboardStudentNeedingHelpModel,
  type TeacherDashboardWeakAreaKey as TeacherDashboardWeakAreaKeyModel,
  type TeacherStatIndicatorKey as TeacherStatIndicatorKeyModel,
  type TeacherStatTone as TeacherStatToneModel
} from "@/data/teacher/selectors";

export type {TeacherNavItem, TeacherNavKey};
export type TeacherDashboardStatKey = TeacherDashboardStatKeyModel;
export type TeacherStatIndicatorKey = TeacherStatIndicatorKeyModel;
export type TeacherStatTone = TeacherStatToneModel;
export type TeacherDashboardStat = TeacherDashboardStatModel;
export type TeacherProgressMonthKey = TeacherDashboardMonthKeyModel;
export type TeacherProgressPoint = {
  month: TeacherProgressMonthKey;
  value: number;
};
export type TeacherQuickActionKey = "createAssignment" | "reviewSubmissions" | "messageStudents";
export type TeacherRecentActivityEventKey = TeacherDashboardRecentActivityEventKeyModel;
export type TeacherRecentActivityTimeKey = TeacherDashboardRecentActivityTimeKeyModel;
export type TeacherActivityTone = TeacherDashboardRecentActivityToneModel;
export type TeacherRecentActivityItem = TeacherDashboardRecentActivityItemModel;
export type TeacherWeakAreaKey = TeacherDashboardWeakAreaKeyModel;
export type TeacherLastActivityKey = TeacherDashboardLastActivityKeyModel;
export type TeacherStudentNeedingHelp = TeacherDashboardStudentNeedingHelpModel;

export const TEACHER_PROFILE = getTeacherProfile();
export const teacherNavItems = getTeacherNavItems() satisfies TeacherNavItem[];
export const teacherOverviewStats = getTeacherDashboardOverviewStats() satisfies TeacherDashboardStat[];
export const teacherProgressPoints = getTeacherDashboardMonthlyProgress() satisfies TeacherProgressPoint[];
export const teacherQuickActions = [...getTeacherQuickActions()] as TeacherQuickActionKey[];
export const teacherRecentActivity = getTeacherDashboardRecentActivity() satisfies TeacherRecentActivityItem[];
export const teacherStudentsNeedingHelp = getTeacherDashboardStudentsNeedingHelp() satisfies TeacherStudentNeedingHelp[];
