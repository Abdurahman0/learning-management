import type {TeacherStudentAttempt} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

const explicitAttempts: TeacherStudentAttempt[] = [
  {
    id: "attempt-alex-1",
    studentId: "student-alex-thompson",
    title: "Cambridge Practice 17",
    module: "reading",
    scoreLabel: "34/40",
    band: 7.5,
    attemptedAt: "2023-10-24T09:30:00.000Z"
  },
  {
    id: "attempt-alex-2",
    studentId: "student-alex-thompson",
    title: "Official Guide Test 4",
    module: "listening",
    scoreLabel: "36/40",
    band: 8.0,
    attemptedAt: "2023-10-22T11:10:00.000Z"
  },
  {
    id: "attempt-alex-3",
    studentId: "student-alex-thompson",
    title: "Task 2 - Essay #12",
    module: "writing",
    scoreLabel: "N/A",
    band: 6.5,
    attemptedAt: "2023-10-20T08:15:00.000Z"
  },
  {
    id: "attempt-maria-garcia-1",
    studentId: "student-maria-garcia",
    title: "Cambridge Practice 14",
    module: "reading",
    scoreLabel: "28/40",
    band: 6.0,
    attemptedAt: "2023-10-23T09:00:00.000Z"
  },
  {
    id: "attempt-maria-garcia-2",
    studentId: "student-maria-garcia",
    title: "Listening Drill A",
    module: "listening",
    scoreLabel: "29/40",
    band: 6.0,
    attemptedAt: "2023-10-19T14:20:00.000Z"
  },
  {
    id: "attempt-liam-nguyen-1",
    studentId: "student-liam-nguyen",
    title: "Cambridge Practice 18",
    module: "reading",
    scoreLabel: "35/40",
    band: 7.5,
    attemptedAt: "2023-10-23T16:30:00.000Z"
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

const generatedAttempts: TeacherStudentAttempt[] = TEACHER_STUDENTS
  .filter((student) => !explicitAttempts.some((attempt) => attempt.studentId === student.id))
  .flatMap((student, index) => {
    const firstBand = roundBand(clamp(student.estimatedBand - 0.4, 4.5, 8.5));
    const secondBand = roundBand(clamp(student.estimatedBand - 0.2, 4.5, 8.5));
    const thirdBand = roundBand(clamp(student.estimatedBand, 4.5, 8.5));

    const baseDate = new Date(Date.UTC(2023, 9, 10 + (index % 15), 8 + (index % 6), 0, 0));
    const secondDate = new Date(baseDate.getTime() - (index % 6 + 2) * 24 * 60 * 60 * 1000);
    const thirdDate = new Date(baseDate.getTime() - (index % 9 + 5) * 24 * 60 * 60 * 1000);

    return [
      {
        id: `attempt-${student.id}-1`,
        studentId: student.id,
        title: "Cambridge Academic Set",
        module: "reading" as const,
        scoreLabel: `${Math.max(18, Math.round(firstBand * 4.5))}/40`,
        band: firstBand,
        attemptedAt: baseDate.toISOString()
      },
      {
        id: `attempt-${student.id}-2`,
        studentId: student.id,
        title: "Listening Drill",
        module: "listening" as const,
        scoreLabel: `${Math.max(18, Math.round(secondBand * 4.5))}/40`,
        band: secondBand,
        attemptedAt: secondDate.toISOString()
      },
      {
        id: `attempt-${student.id}-3`,
        studentId: student.id,
        title: "Writing Task Practice",
        module: "writing" as const,
        scoreLabel: "N/A",
        band: roundBand(clamp(thirdBand - 0.3, 4.5, 8.0)),
        attemptedAt: thirdDate.toISOString()
      }
    ];
  });

export const TEACHER_STUDENT_ATTEMPTS: TeacherStudentAttempt[] = [...explicitAttempts, ...generatedAttempts];
