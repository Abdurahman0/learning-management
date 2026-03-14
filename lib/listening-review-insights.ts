import type { FlattenedListeningQuestion } from "@/lib/listening-questions";
import type { GradeTestResult } from "@/lib/grading";

export type ListeningSectionPerformanceLike = {
  sectionId: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
};

export type ListeningTypePerformance = {
  type: FlattenedListeningQuestion["type"];
  correct: number;
  total: number;
  percent: number;
};

export type ListeningHeatmapItem = {
  id: string;
  label: string;
  level: "excellent" | "average" | "critical";
  correct: number;
  total: number;
  percent: number;
};

export type ListeningReviewInsights = {
  overallAccuracy: number;
  skippedCount: number;
  weakestSection: ListeningSectionPerformanceLike | null;
  strongestSection: ListeningSectionPerformanceLike | null;
  weakestType: ListeningTypePerformance | null;
  typePerformance: ListeningTypePerformance[];
  heatmap: ListeningHeatmapItem[];
};

export function buildListeningReviewInsights({
  questions,
  grading,
  sectionPerformance,
}: {
  questions: FlattenedListeningQuestion[];
  grading: GradeTestResult;
  sectionPerformance: ListeningSectionPerformanceLike[];
}): ListeningReviewInsights {
  const buckets = new Map<
    FlattenedListeningQuestion["type"],
    { correct: number; total: number }
  >();

  for (const question of questions) {
    const result = grading.byQuestion[question.id];
    const key = question.type;
    const previous = buckets.get(key) ?? { correct: 0, total: 0 };
    previous.total += 1;
    if (result?.isCorrect) {
      previous.correct += 1;
    }
    buckets.set(key, previous);
  }

  const typePerformance: ListeningTypePerformance[] = [...buckets.entries()].map(
    ([type, stats]) => ({
      type,
      correct: stats.correct,
      total: stats.total,
      percent: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    }),
  );

  const weakestType = [...typePerformance].sort((a, b) => a.percent - b.percent)[0] ?? null;
  const weakestSection =
    [...sectionPerformance].sort((a, b) => a.percent - b.percent)[0] ?? null;
  const strongestSection =
    [...sectionPerformance].sort((a, b) => b.percent - a.percent)[0] ?? null;

  const heatmap: ListeningHeatmapItem[] = sectionPerformance.map((item) => ({
    id: item.sectionId,
    label: item.label,
    level:
      item.percent >= 75 ? "excellent" : item.percent >= 45 ? "average" : "critical",
    correct: item.correct,
    total: item.total,
    percent: item.percent,
  }));

  return {
    overallAccuracy: grading.scorePercent,
    skippedCount: grading.unansweredCount,
    weakestSection,
    strongestSection,
    weakestType,
    typePerformance,
    heatmap,
  };
}

