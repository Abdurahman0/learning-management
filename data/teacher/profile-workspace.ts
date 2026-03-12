import type {TeacherProfile} from "@/types/teacher";

import {TEACHER_PROFILE} from "./index";

export type TeacherProfileActivityKind =
  | "account_login"
  | "review_completed"
  | "assignment_created"
  | "password_changed"
  | "profile_updated"
  | "teaching_profile_updated"
  | "avatar_change_requested";

export type TeacherProfileActivityEntry = {
  id: string;
  kind: TeacherProfileActivityKind;
  detail: string;
  location?: string;
  occurredAt: string;
};

const activitySeed: TeacherProfileActivityEntry[] = [
  {
    id: "teacher-profile-activity-login",
    kind: "account_login",
    detail: "Today, 9:41 AM",
    location: "San Francisco, CA",
    occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "teacher-profile-activity-review",
    kind: "review_completed",
    detail: "Writing Task 2 for Sarah K.",
    occurredAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "teacher-profile-activity-assignment",
    kind: "assignment_created",
    detail: "Reading Practice Set #12",
    occurredAt: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "teacher-profile-activity-password",
    kind: "password_changed",
    detail: "Security update",
    occurredAt: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const workspaceProfile: TeacherProfile = {...TEACHER_PROFILE};
let workspacePassword = "teacher1234";
const workspaceActivities: TeacherProfileActivityEntry[] = [...activitySeed];

export function getTeacherWorkspaceProfile() {
  return {...workspaceProfile, preferredModules: [...workspaceProfile.preferredModules]};
}

export function updateTeacherWorkspaceProfile(patch: Partial<TeacherProfile>) {
  Object.assign(workspaceProfile, patch);

  if (patch.preferredModules) {
    workspaceProfile.preferredModules = [...patch.preferredModules];
  }

  return getTeacherWorkspaceProfile();
}

export function getTeacherWorkspacePassword() {
  return workspacePassword;
}

export function updateTeacherWorkspacePassword(nextValue: string) {
  workspacePassword = nextValue;
}

export function getTeacherWorkspaceProfileActivities() {
  return [...workspaceActivities].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());
}

export function appendTeacherWorkspaceProfileActivity(entry: Omit<TeacherProfileActivityEntry, "id" | "occurredAt">) {
  const created = {
    id: `teacher-profile-activity-${Date.now()}`,
    occurredAt: new Date().toISOString(),
    ...entry
  } satisfies TeacherProfileActivityEntry;

  workspaceActivities.unshift(created);
  return created;
}
