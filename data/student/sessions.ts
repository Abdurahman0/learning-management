import {STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import type {StudentOneToOneAvailabilitySlot, StudentOneToOneSession, StudentOneToOneSessionStatus} from "@/types/student";

import {STUDENT_PROFILE} from "./performance";

export const STUDENT_ONE_TO_ONE_SESSIONS: StudentOneToOneSession[] = [
  {
    id: "session-001",
    studentId: STUDENT_PROFILE.id,
    teacherId: "sarahJohnson",
    title: "Reading Accuracy Coaching",
    startsAt: "2026-03-16T09:00:00.000Z",
    endsAt: "2026-03-16T09:40:00.000Z",
    status: "scheduled",
    meetingType: "zoom",
    purpose: "Improve matching headings elimination strategy.",
    note: "Bring your latest Cambridge 20 reading mistakes."
  },
  {
    id: "session-002",
    studentId: STUDENT_PROFILE.id,
    teacherId: "davidChen",
    title: "Listening Distractor Control",
    startsAt: "2026-03-11T10:30:00.000Z",
    endsAt: "2026-03-11T11:10:00.000Z",
    status: "completed",
    meetingType: "googleMeet",
    purpose: "Section 4 note completion speed and distractor handling.",
    note: "Completed with follow-up drill assignment."
  },
  {
    id: "session-003",
    studentId: STUDENT_PROFILE.id,
    teacherId: "sarahJohnson",
    title: "Band 7 Writing Plan",
    startsAt: "2026-03-19T08:00:00.000Z",
    endsAt: "2026-03-19T08:45:00.000Z",
    status: "pending",
    meetingType: "inPlatform",
    purpose: "Set weekly writing milestones for target band."
  }
];

export const STUDENT_ONE_TO_ONE_AVAILABILITY: StudentOneToOneAvailabilitySlot[] = [
  {id: "slot-1", teacherId: "sarahJohnson", startsAt: "2026-03-17T08:30:00.000Z", endsAt: "2026-03-17T09:10:00.000Z", meetingType: "zoom", available: true},
  {id: "slot-2", teacherId: "davidChen", startsAt: "2026-03-17T10:00:00.000Z", endsAt: "2026-03-17T10:40:00.000Z", meetingType: "googleMeet", available: true},
  {id: "slot-3", teacherId: "sarahJohnson", startsAt: "2026-03-18T07:30:00.000Z", endsAt: "2026-03-18T08:10:00.000Z", meetingType: "inPlatform", available: true},
  {id: "slot-4", teacherId: "davidChen", startsAt: "2026-03-18T12:15:00.000Z", endsAt: "2026-03-18T12:55:00.000Z", meetingType: "zoom", available: false}
];

export function getStudentOneToOneSessions(studentId: string) {
  return STUDENT_ONE_TO_ONE_SESSIONS
    .filter((session) => session.studentId === studentId)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
}

export function getStudentOneToOneUpcomingSessions(studentId: string, referenceDate = new Date()) {
  return getStudentOneToOneSessions(studentId).filter(
    (session) => new Date(session.startsAt).getTime() >= referenceDate.getTime() && session.status !== "cancelled"
  );
}

export function getStudentOneToOneSessionsByStatus(studentId: string, status: StudentOneToOneSessionStatus) {
  return getStudentOneToOneSessions(studentId).filter((session) => session.status === status);
}

export function getTeacherNameBySessionTeacherId(teacherId: string) {
  return STUDENT_ASSIGNMENT_TEACHERS[teacherId]?.name ?? teacherId;
}
