import type {
  TeacherModuleKey,
  TeacherStudent,
  TeacherStudentProgressState,
  TeacherStudentStatus,
  TeacherWeakSkillKey
} from "@/types/teacher";

const TOTAL_STUDENTS = 128;

const FIRST_NAMES = [
  "Noah",
  "Olivia",
  "Ethan",
  "Sophia",
  "Mason",
  "Ava",
  "Logan",
  "Isabella",
  "Lucas",
  "Mia",
  "Benjamin",
  "Charlotte",
  "Henry",
  "Amelia",
  "Daniel",
  "Harper",
  "Jack",
  "Evelyn",
  "Owen",
  "Abigail"
] as const;

const LAST_NAMES = [
  "Walker",
  "Brooks",
  "Carter",
  "Reed",
  "Perry",
  "Rivera",
  "Hughes",
  "Mendoza",
  "Patel",
  "Collins",
  "Ross",
  "Ward",
  "Morgan",
  "Cooper",
  "Foster",
  "Powell",
  "Bennett",
  "Sanders",
  "Price",
  "Lopez"
] as const;

const WEAK_SKILL_CYCLE: TeacherWeakSkillKey[] = [
  "matchingHeadings",
  "listeningPart4",
  "speakingFluency",
  "writingTask2",
  "timeManagement",
  "trueFalseNotGiven",
  "sentenceCompletion"
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

function initialsFromName(name: string) {
  const parts = name.split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function weakSkillToModule(weakSkill: TeacherWeakSkillKey): TeacherModuleKey {
  switch (weakSkill) {
    case "listeningPart4":
    case "sentenceCompletion":
      return "listening";
    case "speakingFluency":
      return "speaking";
    case "writingTask2":
      return "writing";
    default:
      return "reading";
  }
}

function buildTargetModuleBands(targetBand: number, seed: number) {
  return {
    reading: roundBand(clamp(targetBand + (seed % 3 === 0 ? 0.1 : 0), 5.0, 8.5)),
    listening: roundBand(clamp(targetBand + (seed % 3 === 1 ? 0.1 : 0), 5.0, 8.5)),
    writing: roundBand(clamp(targetBand + (seed % 3 === 2 ? 0.1 : 0), 5.0, 8.5)),
    speaking: roundBand(clamp(targetBand, 5.0, 8.5))
  };
}

function buildCurrentModuleBands(
  estimatedBand: number,
  weakSkill: TeacherWeakSkillKey,
  seed: number
): Record<TeacherModuleKey, number> {
  const weakModule = weakSkillToModule(weakSkill);
  const base = {
    reading: estimatedBand + (seed % 2 === 0 ? 0.1 : -0.1),
    listening: estimatedBand + (seed % 3 === 0 ? 0.1 : -0.05),
    writing: estimatedBand + (seed % 4 === 0 ? 0.05 : -0.1),
    speaking: estimatedBand + (seed % 5 === 0 ? 0.1 : -0.05)
  };

  base[weakModule] -= 0.55;

  return {
    reading: roundBand(clamp(base.reading, 4.0, 8.5)),
    listening: roundBand(clamp(base.listening, 4.0, 8.5)),
    writing: roundBand(clamp(base.writing, 4.0, 8.5)),
    speaking: roundBand(clamp(base.speaking, 4.0, 8.5))
  };
}

const priorityStudents: TeacherStudent[] = [
  {
    id: "student-alex-thompson",
    studentCode: "ST-9021",
    name: "Alex Thompson",
    avatarFallback: "AT",
    targetBand: 8.0,
    estimatedBand: 7.5,
    bandDelta: 0.5,
    weakestSkill: "writingTask2",
    status: "active",
    progressState: "improving",
    caseload: "primary",
    lastActiveMinutesAgo: 120,
    targetModuleBands: {reading: 8.0, listening: 8.1, writing: 7.9, speaking: 8.0},
    moduleBands: {reading: 7.8, listening: 7.7, writing: 7.1, speaking: 7.6}
  },
  {
    id: "student-maria-garcia",
    studentCode: "ST-8845",
    name: "Maria Garcia",
    avatarFallback: "MG",
    targetBand: 7.0,
    estimatedBand: 6.0,
    bandDelta: 0,
    weakestSkill: "speakingFluency",
    status: "active",
    progressState: "stable",
    caseload: "primary",
    lastActiveMinutesAgo: 300,
    targetModuleBands: {reading: 7.0, listening: 7.0, writing: 6.9, speaking: 7.1},
    moduleBands: {reading: 6.2, listening: 6.1, writing: 6.0, speaking: 5.4}
  },
  {
    id: "student-liam-nguyen",
    studentCode: "ST-7721",
    name: "Liam Nguyen",
    avatarFallback: "LN",
    targetBand: 7.5,
    estimatedBand: 7.5,
    bandDelta: 0.3,
    weakestSkill: "listeningPart4",
    status: "active",
    progressState: "improving",
    caseload: "primary",
    lastActiveMinutesAgo: 1560,
    targetModuleBands: {reading: 7.6, listening: 7.5, writing: 7.5, speaking: 7.4},
    moduleBands: {reading: 7.7, listening: 7.0, writing: 7.6, speaking: 7.7}
  },
  {
    id: "student-james-sterling",
    studentCode: "ST-6403",
    name: "James Sterling",
    avatarFallback: "JS",
    targetBand: 6.5,
    estimatedBand: 5.5,
    bandDelta: -0.3,
    weakestSkill: "matchingHeadings",
    status: "at_risk",
    progressState: "needs_help",
    caseload: "primary",
    lastActiveMinutesAgo: 1230,
    targetModuleBands: {reading: 6.5, listening: 6.6, writing: 6.4, speaking: 6.5},
    moduleBands: {reading: 4.9, listening: 5.7, writing: 5.5, speaking: 5.8}
  },
  {
    id: "student-maria-valdez",
    studentCode: "ST-6410",
    name: "Maria Valdez",
    avatarFallback: "MV",
    targetBand: 7.0,
    estimatedBand: 6.0,
    bandDelta: -0.2,
    weakestSkill: "listeningPart4",
    status: "at_risk",
    progressState: "needs_help",
    caseload: "primary",
    lastActiveMinutesAgo: 2880,
    targetModuleBands: {reading: 7.0, listening: 7.1, writing: 7.0, speaking: 6.9},
    moduleBands: {reading: 6.2, listening: 5.3, writing: 6.1, speaking: 6.0}
  },
  {
    id: "student-arjun-kapoor",
    studentCode: "ST-6418",
    name: "Arjun Kapoor",
    avatarFallback: "AK",
    targetBand: 6.5,
    estimatedBand: 5.0,
    bandDelta: -0.4,
    weakestSkill: "speakingFluency",
    status: "at_risk",
    progressState: "needs_help",
    caseload: "primary",
    lastActiveMinutesAgo: 90,
    targetModuleBands: {reading: 6.5, listening: 6.4, writing: 6.3, speaking: 6.6},
    moduleBands: {reading: 5.3, listening: 5.2, writing: 5.1, speaking: 4.4}
  },
  {
    id: "student-john-smith",
    studentCode: "ST-6104",
    name: "John Smith",
    avatarFallback: "JS",
    targetBand: 7.0,
    estimatedBand: 6.6,
    bandDelta: 0.4,
    weakestSkill: "timeManagement",
    status: "active",
    progressState: "improving",
    caseload: "primary",
    lastActiveMinutesAgo: 2,
    targetModuleBands: {reading: 7.0, listening: 7.1, writing: 7.0, speaking: 6.9},
    moduleBands: {reading: 6.0, listening: 6.7, writing: 6.5, speaking: 6.8}
  },
  {
    id: "student-emma-wilson",
    studentCode: "ST-6110",
    name: "Emma Wilson",
    avatarFallback: "EW",
    targetBand: 7.5,
    estimatedBand: 6.9,
    bandDelta: 0.3,
    weakestSkill: "writingTask2",
    status: "active",
    progressState: "improving",
    caseload: "primary",
    lastActiveMinutesAgo: 45,
    targetModuleBands: {reading: 7.6, listening: 7.5, writing: 7.5, speaking: 7.4},
    moduleBands: {reading: 7.0, listening: 7.0, writing: 6.3, speaking: 7.1}
  },
  {
    id: "student-liam-chen",
    studentCode: "ST-6117",
    name: "Liam Chen",
    avatarFallback: "LC",
    targetBand: 7.0,
    estimatedBand: 6.4,
    bandDelta: 0.1,
    weakestSkill: "listeningPart4",
    status: "active",
    progressState: "stable",
    caseload: "primary",
    lastActiveMinutesAgo: 120,
    targetModuleBands: {reading: 7.1, listening: 7.0, writing: 6.9, speaking: 7.0},
    moduleBands: {reading: 6.5, listening: 5.8, writing: 6.3, speaking: 6.5}
  }
];

const remainingProgressStates: TeacherStudentProgressState[] = [
  ...Array.from({length: 90}, () => "improving" as const),
  ...Array.from({length: 14}, () => "stable" as const),
  ...Array.from({length: 15}, () => "needs_help" as const)
];

const remainingStatuses: TeacherStudentStatus[] = [
  ...Array.from({length: 88}, () => "active" as const),
  ...Array.from({length: 16}, () => "inactive" as const),
  ...Array.from({length: 15}, () => "at_risk" as const)
];

const generatedStudents: TeacherStudent[] = Array.from({length: TOTAL_STUDENTS - priorityStudents.length}, (_, index) => {
  const progressState = remainingProgressStates[index];
  const status = remainingStatuses[index];
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const name = `${firstName} ${lastName}`;
  const weakSkill = WEAK_SKILL_CYCLE[index % WEAK_SKILL_CYCLE.length];
  const targetBand = [6.0, 6.5, 7.0, 7.5, 8.0][index % 5];
  const progressOffset = progressState === "improving" ? 0.35 : progressState === "stable" ? 0.75 : 1.25;
  const variance = ((index % 5) - 2) * 0.08;
  const estimatedBand = roundBand(clamp(targetBand - progressOffset + variance, 4.5, 8.2));
  const bandDelta =
    progressState === "improving"
      ? roundBand(0.2 + (index % 4) * 0.1)
      : progressState === "stable"
        ? index % 2 === 0
          ? 0
          : 0.1
        : roundBand(-0.2 - (index % 3) * 0.1);

  let lastActiveMinutesAgo = 120 + (index % 16) * 35;
  if (status === "inactive") {
    lastActiveMinutesAgo = 3200 + (index % 22) * 240;
  } else if (status === "at_risk") {
    lastActiveMinutesAgo = 90 + (index % 18) * 95;
  }

  const studentCode = `ST-${7000 + index}`;
  const caseload = index < 33 ? "primary" : "monitoring";

  return {
    id: `student-auto-${String(index + 1).padStart(3, "0")}`,
    studentCode,
    name,
    avatarFallback: initialsFromName(name),
    targetBand,
    estimatedBand,
    bandDelta,
    weakestSkill: weakSkill,
    status,
    progressState,
    caseload,
    lastActiveMinutesAgo,
    targetModuleBands: buildTargetModuleBands(targetBand, index),
    moduleBands: buildCurrentModuleBands(estimatedBand, weakSkill, index)
  };
});

export const TEACHER_STUDENTS: TeacherStudent[] = [...priorityStudents, ...generatedStudents];
