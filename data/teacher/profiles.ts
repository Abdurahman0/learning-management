import type {TeacherStudentProfileMeta, TeacherStudentWeakAreaMetric} from "@/types/teacher";

import {TEACHER_STUDENTS} from "./students";

const explicitProfiles: TeacherStudentProfileMeta[] = [
  {
    studentId: "student-alex-thompson",
    joinedAt: "2023-10-12T00:00:00.000Z",
    streakDays: 12,
    testsDone: 18,
    recommendation:
      "Focus on Reading Module 2 exercises. Matching headings requires scanning techniques.",
    bandProgress: [
      {id: "month-1", label: "month1", band: 5.5},
      {id: "month-2", label: "month2", band: 6.0},
      {id: "month-3", label: "month3", band: 6.3},
      {id: "month-4", label: "month4", band: 6.8},
      {id: "month-5", label: "month5", band: 7.1},
      {id: "current", label: "current", band: 7.5}
    ],
    weakAreas: [
      {id: "wa-1", label: "matchingHeadings", score: 42, tone: "weak"},
      {id: "wa-2", label: "trueFalseNotGiven", score: 55, tone: "average"},
      {id: "wa-3", label: "multipleChoice", score: 88, tone: "strong"},
      {id: "wa-4", label: "sentenceCompletion", score: 76, tone: "strong"}
    ]
  },
  {
    studentId: "student-maria-garcia",
    joinedAt: "2023-09-05T00:00:00.000Z",
    streakDays: 7,
    testsDone: 11,
    recommendation: "Build speaking fluency with short timed answers and daily response recordings.",
    bandProgress: [
      {id: "month-1", label: "month1", band: 5.0},
      {id: "month-2", label: "month2", band: 5.3},
      {id: "month-3", label: "month3", band: 5.6},
      {id: "month-4", label: "month4", band: 5.8},
      {id: "month-5", label: "month5", band: 5.9},
      {id: "current", label: "current", band: 6.0}
    ],
    weakAreas: [
      {id: "wa-1", label: "speakingFluency", score: 47, tone: "weak"},
      {id: "wa-2", label: "sentenceCompletion", score: 59, tone: "average"},
      {id: "wa-3", label: "matchingHeadings", score: 71, tone: "strong"},
      {id: "wa-4", label: "listeningPart4", score: 64, tone: "average"}
    ]
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

function buildWeakAreaMetrics(index: number): TeacherStudentWeakAreaMetric[] {
  const first = 40 + (index % 12);
  const second = 52 + (index % 18);
  const third = 73 + (index % 20);
  const fourth = 66 + (index % 14);

  return [
    {id: "wa-1", label: "matchingHeadings", score: first, tone: first < 50 ? "weak" : "average"},
    {id: "wa-2", label: "trueFalseNotGiven", score: second, tone: second < 60 ? "average" : "strong"},
    {id: "wa-3", label: "multipleChoice", score: third, tone: "strong"},
    {id: "wa-4", label: "sentenceCompletion", score: fourth, tone: fourth < 60 ? "average" : "strong"}
  ];
}

const generatedProfiles: TeacherStudentProfileMeta[] = TEACHER_STUDENTS
  .filter((student) => !explicitProfiles.some((profile) => profile.studentId === student.id))
  .map((student, index) => {
    const joinedAt = new Date(Date.UTC(2023, (index + 2) % 12, 3 + (index % 20), 0, 0, 0)).toISOString();
    const testsDone = 8 + (index % 19);
    const streakDays = 3 + (index % 14);
    const currentBand = student.estimatedBand;

    return {
      studentId: student.id,
      joinedAt,
      testsDone,
      streakDays,
      recommendation:
        "Prioritize weekly mixed drills and review error logs after each attempt to sustain progress.",
      bandProgress: [
        {id: "month-1", label: "month1", band: roundBand(clamp(currentBand - 1.1, 4.0, 8.0))},
        {id: "month-2", label: "month2", band: roundBand(clamp(currentBand - 0.8, 4.0, 8.0))},
        {id: "month-3", label: "month3", band: roundBand(clamp(currentBand - 0.6, 4.0, 8.0))},
        {id: "month-4", label: "month4", band: roundBand(clamp(currentBand - 0.3, 4.0, 8.0))},
        {id: "month-5", label: "month5", band: roundBand(clamp(currentBand - 0.1, 4.0, 8.0))},
        {id: "current", label: "current", band: roundBand(clamp(currentBand, 4.0, 8.5))}
      ],
      weakAreas: buildWeakAreaMetrics(index)
    };
  });

export const TEACHER_STUDENT_PROFILES: TeacherStudentProfileMeta[] = [...explicitProfiles, ...generatedProfiles];
