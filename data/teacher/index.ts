import type {TeacherNavItem, TeacherProfile} from "@/types/teacher";

import {TEACHER_ACTIVITY_EVENTS} from "./activity";
import {TEACHER_ASSIGNMENTS, TEACHER_ASSIGNMENT_TASKS} from "./assignments";
import {TEACHER_MESSAGE_THREADS} from "./messages";
import {TEACHER_STUDENT_INITIAL_NOTES} from "./notes";
import {TEACHER_STUDENT_ATTEMPTS} from "./attempts";
import {TEACHER_STUDENT_PROFILES} from "./profiles";
import {TEACHER_REVIEWS} from "./reviews";
import {TEACHER_STUDENT_TIMELINE_EVENTS} from "./student-activity";
import {TEACHER_STUDENTS} from "./students";

export const TEACHER_PROFILE: TeacherProfile = {
  id: "teacher-1",
  role: "teacher",
  name: "Dr. Sarah Jenkins",
  title: "Senior IELTS Instructor",
  email: "teacher@gmail.com",
  avatarFallback: "SJ"
};

export const TEACHER_NAV_ITEMS: TeacherNavItem[] = [
  {key: "dashboard", segment: "", enabled: true},
  {key: "myStudents", segment: "students", enabled: true},
  {key: "assignments", segment: "assignments", enabled: true},
  {key: "reviews", segment: "reviews", enabled: true},
  {key: "messages", segment: "messages", enabled: true},
  {key: "analytics", segment: "analytics", enabled: true},
  {key: "profile", segment: "profile", enabled: false},
  {key: "settings", segment: "settings", enabled: false}
];

export const TEACHER_QUICK_ACTIONS = ["createAssignment", "reviewSubmissions", "messageStudents"] as const;

export const TEACHER_DASHBOARD_MONTHLY_PROGRESS = [
  {month: "jan", value: 3.2},
  {month: "feb", value: 4.1},
  {month: "mar", value: 6.0},
  {month: "apr", value: 5.6},
  {month: "may", value: 4.7},
  {month: "jun", value: 8.4}
] as const;

export {
  TEACHER_STUDENTS,
  TEACHER_ASSIGNMENTS,
  TEACHER_ASSIGNMENT_TASKS,
  TEACHER_REVIEWS,
  TEACHER_MESSAGE_THREADS,
  TEACHER_ACTIVITY_EVENTS,
  TEACHER_STUDENT_ATTEMPTS,
  TEACHER_STUDENT_PROFILES,
  TEACHER_STUDENT_TIMELINE_EVENTS,
  TEACHER_STUDENT_INITIAL_NOTES
};
