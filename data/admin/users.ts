import type {AdminUserEntity} from "@/types/admin";

const monthProgress = ["W1", "W2", "W3", "W4", "W5", "W6"];

function makeBandProgress(base: number, step: number) {
  return monthProgress.map((label, index) => ({label, value: Number((base + step * index).toFixed(2))}));
}

export const USER_ENTITIES: AdminUserEntity[] = [
  {
    id: "usr-1001",
    name: "Marcus Aurelius",
    email: "marcus@example.com",
    avatarFallback: "MA",
    planId: "pro",
    role: "student",
    status: "active",
    locale: "en",
    joinedAt: "2025-10-14",
    isActiveToday: true,
    overallBand: 7.5,
    targetBand: 8,
    moduleStats: {reading: 78, listening: 74, writing: 69, speaking: 70},
    weakAreas: [
      {id: "wa-1", label: "Task 2 Body Paragraphs", severity: "improving"},
      {id: "wa-2", label: "Complex Sentence Cohesion", severity: "stable"}
    ],
    bandProgress: makeBandProgress(6.7, 0.14),
    payments: [
      {id: "pay-1001-1", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1001-2", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-01-01"}
    ]
  },
  {
    id: "usr-1002",
    name: "Alex Johnson",
    email: "alex.j@icloud.com",
    avatarFallback: "AJ",
    planId: "pro",
    role: "student",
    status: "verified",
    locale: "en",
    joinedAt: "2023-10-05",
    isActiveToday: true,
    overallBand: 8,
    targetBand: 8.5,
    moduleStats: {reading: 82, listening: 79, writing: 72, speaking: 75},
    weakAreas: [
      {id: "wa-3", label: "Lexical Resource (Speaking)", severity: "critical"},
      {id: "wa-4", label: "Task 2 Body Paragraphs", severity: "improving"}
    ],
    bandProgress: makeBandProgress(7.1, 0.16),
    payments: [
      {id: "pay-1002-1", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1002-2", title: "Annual Upgrade Invoice", amount: "$129.00", status: "pending", date: "2026-03-01"}
    ]
  },
  {
    id: "usr-1003",
    name: "Elena Rodriguez",
    email: "elena.r@edu.es",
    avatarFallback: "ER",
    planId: "free",
    role: "student",
    status: "active",
    locale: "uz",
    joinedAt: "2026-02-03",
    isActiveToday: false,
    overallBand: 6.5,
    targetBand: 7,
    moduleStats: {reading: 64, listening: 68, writing: 60, speaking: 58},
    weakAreas: [
      {id: "wa-5", label: "Diagram Labeling", severity: "critical"},
      {id: "wa-6", label: "Listening Distractors", severity: "improving"}
    ],
    bandProgress: makeBandProgress(5.8, 0.11),
    payments: [{id: "pay-1003-1", title: "Premium Trial", amount: "$0.00", status: "failed", date: "2026-02-15"}]
  },
  {
    id: "usr-1004",
    name: "Anya Petrov",
    email: "anya.petrov@mail.com",
    avatarFallback: "AP",
    planId: "premium",
    role: "student",
    status: "verified",
    locale: "en",
    joinedAt: "2025-11-22",
    isActiveToday: true,
    overallBand: 7.8,
    targetBand: 8.5,
    moduleStats: {reading: 80, listening: 82, writing: 74, speaking: 77},
    weakAreas: [
      {id: "wa-7", label: "Timing in Passage 3", severity: "improving"},
      {id: "wa-8", label: "Sentence Completion Accuracy", severity: "stable"}
    ],
    bandProgress: makeBandProgress(6.9, 0.18),
    payments: [
      {id: "pay-1004-1", title: "Premium Monthly", amount: "$39.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1004-2", title: "Premium Monthly", amount: "$39.00", status: "paid", date: "2026-01-01"}
    ]
  },
  {
    id: "usr-1005",
    name: "Liam Chen",
    email: "liam.c@example.com",
    avatarFallback: "LC",
    planId: "pro",
    role: "student",
    status: "active",
    locale: "uz",
    joinedAt: "2026-01-09",
    isActiveToday: true,
    overallBand: 7.2,
    targetBand: 8,
    moduleStats: {reading: 75, listening: 73, writing: 67, speaking: 69},
    weakAreas: [
      {id: "wa-9", label: "True/False/Not Given", severity: "critical"},
      {id: "wa-10", label: "Coherence in Writing Task 1", severity: "improving"}
    ],
    bandProgress: makeBandProgress(6.5, 0.13),
    payments: [
      {id: "pay-1005-1", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1005-2", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-01-01"}
    ]
  },
  {
    id: "usr-1006",
    name: "Sofia Karim",
    email: "sofia.karim@gmail.com",
    avatarFallback: "SK",
    planId: "premium",
    role: "student",
    status: "verified",
    locale: "en",
    joinedAt: "2025-08-18",
    isActiveToday: false,
    overallBand: 8.2,
    targetBand: 8.5,
    moduleStats: {reading: 85, listening: 84, writing: 78, speaking: 79},
    weakAreas: [
      {id: "wa-11", label: "Task Achievement (Writing)", severity: "stable"},
      {id: "wa-12", label: "Speaking Fluency Under Time", severity: "improving"}
    ],
    bandProgress: makeBandProgress(7.2, 0.17),
    payments: [{id: "pay-1006-1", title: "Premium Annual", amount: "$349.00", status: "paid", date: "2026-01-03"}]
  },
  {
    id: "usr-1007",
    name: "Daler Nematov",
    email: "daler.nematov@edu.uz",
    avatarFallback: "DN",
    planId: "free",
    role: "student",
    status: "suspended",
    locale: "uz",
    joinedAt: "2025-12-01",
    isActiveToday: false,
    overallBand: 5.9,
    targetBand: 7,
    moduleStats: {reading: 58, listening: 56, writing: 52, speaking: 54},
    weakAreas: [
      {id: "wa-13", label: "Listening Map Labeling", severity: "critical"},
      {id: "wa-14", label: "Vocabulary Precision", severity: "critical"}
    ],
    bandProgress: makeBandProgress(5.1, 0.08),
    payments: [{id: "pay-1007-1", title: "Pro Upgrade Attempt", amount: "$19.00", status: "failed", date: "2026-02-08"}]
  },
  {
    id: "usr-1008",
    name: "Mina Park",
    email: "mina.park@sample.com",
    avatarFallback: "MP",
    planId: "pro",
    role: "student",
    status: "active",
    locale: "en",
    joinedAt: "2026-02-10",
    isActiveToday: true,
    overallBand: 7.1,
    targetBand: 7.5,
    moduleStats: {reading: 72, listening: 74, writing: 66, speaking: 67},
    weakAreas: [
      {id: "wa-15", label: "Matching Headings", severity: "improving"},
      {id: "wa-16", label: "Speaking Part 2 Coherence", severity: "stable"}
    ],
    bandProgress: makeBandProgress(6.4, 0.12),
    payments: [
      {id: "pay-1008-1", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1008-2", title: "Monthly Pro Plan", amount: "$19.00", status: "paid", date: "2026-01-01"}
    ]
  },
  {
    id: "usr-1009",
    name: "Nodira Xasanova",
    email: "nodira.xasanova@mail.uz",
    avatarFallback: "NX",
    planId: "premium",
    role: "tutor",
    status: "verified",
    locale: "uz",
    joinedAt: "2024-04-14",
    isActiveToday: true,
    overallBand: 8.5,
    targetBand: 9,
    moduleStats: {reading: 88, listening: 86, writing: 82, speaking: 84},
    weakAreas: [
      {id: "wa-17", label: "Advanced Vocabulary Coaching", severity: "stable"},
      {id: "wa-18", label: "Listening Feedback Consistency", severity: "improving"}
    ],
    bandProgress: makeBandProgress(7.8, 0.15),
    payments: [{id: "pay-1009-1", title: "Tutor Pro Workspace", amount: "$59.00", status: "paid", date: "2026-02-01"}]
  },
  {
    id: "usr-1010",
    name: "Ibrohim Qodirov",
    email: "ibrohim.qodirov@ielts.uz",
    avatarFallback: "IQ",
    planId: "pro",
    role: "admin",
    status: "verified",
    locale: "uz",
    joinedAt: "2023-09-20",
    isActiveToday: true,
    overallBand: 8.1,
    targetBand: 8.5,
    moduleStats: {reading: 84, listening: 81, writing: 75, speaking: 78},
    weakAreas: [
      {id: "wa-19", label: "Automation Review Queue", severity: "stable"},
      {id: "wa-20", label: "Incident Escalation Timing", severity: "improving"}
    ],
    bandProgress: makeBandProgress(7.4, 0.14),
    payments: [
      {id: "pay-1010-1", title: "Admin Enterprise Seat", amount: "$79.00", status: "paid", date: "2026-02-01"},
      {id: "pay-1010-2", title: "Admin Enterprise Seat", amount: "$79.00", status: "pending", date: "2026-03-01"}
    ]
  }
];

export function getUserById(userId: string) {
  return USER_ENTITIES.find((user) => user.id === userId);
}
