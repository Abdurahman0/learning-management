import type {StudentStreakResult, StudentTestRecord} from "@/types/student";

type CalculateStudyStreakInput = {
  tests: StudentTestRecord[];
  initialStreakDays: number;
  windowStartDate: string;
  referenceDate?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function toUtcDayKey(isoDate: string) {
  return startOfUtcDay(new Date(isoDate));
}

export function calculateStudyStreak({
  tests,
  initialStreakDays,
  windowStartDate,
  referenceDate = new Date()
}: CalculateStudyStreakInput): StudentStreakResult {
  const startDay = toUtcDayKey(windowStartDate);
  const endDay = startOfUtcDay(referenceDate);

  if (startDay > endDay) {
    return {
      currentStreakDays: Math.max(0, initialStreakDays),
      completedTestToday: false,
      timeline: []
    };
  }

  const testDays = new Set(tests.map((test) => toUtcDayKey(test.completedAt)));
  const timeline: StudentStreakResult["timeline"] = [];
  let streakDays = Math.max(0, initialStreakDays);

  for (let day = startDay; day <= endDay; day += DAY_MS) {
    const hasTest = testDays.has(day);
    streakDays = hasTest ? streakDays + 1 : Math.max(0, streakDays - 1);

    timeline.push({
      date: new Date(day).toISOString(),
      hasTest,
      streakAfterDay: streakDays
    });
  }

  return {
    currentStreakDays: streakDays,
    completedTestToday: testDays.has(endDay),
    timeline
  };
}
