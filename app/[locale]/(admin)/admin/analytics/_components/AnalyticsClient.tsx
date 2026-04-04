"use client";

import {useEffect, useMemo, useState} from "react";

import type {AnalyticsRangeDataset, AnalyticsRangeKey} from "@/data/admin-analytics";
import {adminAnalyticsService} from "@/src/services/admin/analytics.service";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AnalyticsHeader} from "./AnalyticsHeader";
import {AnalyticsStatCards} from "./AnalyticsStatCards";
import {HardestQuestionsTable} from "./HardestQuestionsTable";
import {InsightsCards} from "./InsightsCards";
import {PassagePerformanceCard} from "./PassagePerformanceCard";
import {QuestionTypeAccuracy} from "./QuestionTypeAccuracy";
import {SkillDistributionChart} from "./SkillDistributionChart";
import {StudentScoreTrendChart} from "./StudentScoreTrendChart";
import {TestsCompletedChart} from "./TestsCompletedChart";

function mapQuestionTypeKey(value: string) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("tfng") || normalized.includes("true_false")) return "tfng" as const;
  if (normalized.includes("matching_heading")) return "matchingHeadings" as const;
  if (normalized.includes("diagram")) return "diagramLabeling" as const;
  if (normalized.includes("summary")) return "summaryCompletion" as const;
  if (normalized.includes("table")) return "tableCompletion" as const;
  return "multipleChoice" as const;
}

const EMPTY_ANALYTICS_DATA: AnalyticsRangeDataset = {
  summary: [
    {id: "totalTestsTaken", value: "0", change: "+0.0%", icon: "tests"},
    {id: "avgReadingScore", value: "0.0", change: "+0.0%", icon: "reading"},
    {id: "avgListeningScore", value: "0.0", change: "+0.0%", icon: "listening"},
    {id: "activeStudents", value: "0", change: "+0.0%", icon: "users"}
  ],
  scoreTrend: [],
  completedPerDay: [],
  questionTypeAccuracy: [],
  skillDistribution: {
    reading: 0,
    listening: 0,
    writing: 0,
    speaking: 0
  },
  hardestQuestions: [],
  passagePerformance: [],
  insights: []
};

export function AnalyticsClient() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRangeKey>("last30Days");
  const [accuracySort, setAccuracySort] = useState<"asc" | "desc">("asc");
  const [hardestSearch, setHardestSearch] = useState("");
  const [rangeData, setRangeData] = useState<AnalyticsRangeDataset>(EMPTY_ANALYTICS_DATA);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      try {
        const response = await adminAnalyticsService.get();
        if (!active) return;

        const summary = [
          {id: "totalTestsTaken", value: response.metrics.totalCompletedAttempts.toLocaleString(), change: "+0.0%", icon: "tests"},
          {id: "avgReadingScore", value: response.metrics.averageReadingBand.toFixed(1), change: "+0.0%", icon: "reading"},
          {id: "avgListeningScore", value: response.metrics.averageListeningBand.toFixed(1), change: "+0.0%", icon: "listening"},
          {id: "activeStudents", value: response.metrics.activeStudents.toLocaleString(), change: "+0.0%", icon: "users"}
        ] as const;

        const scoreTrend =
          response.studentScoreTrend.length > 0
            ? response.studentScoreTrend.map((point, index) => ({
                label: `W${index + 1}`,
                reading: point.readingBand,
                listening: point.listeningBand
              }))
            : [];

        const completedPerDay =
          response.testsPerDay.length > 0
            ? response.testsPerDay.map((point) => ({
                day: new Intl.DateTimeFormat("en-US", {month: "short", day: "numeric"}).format(new Date(point.date)),
                value: point.testsCompleted
              }))
            : [];

        const typeColors = ["#3B82F6", "#F97316", "#22C55E", "#A855F7", "#06B6D4", "#F59E0B"];
        const questionTypeAccuracy =
          response.questionTypeAccuracy.length > 0
            ? response.questionTypeAccuracy.map((item, index) => ({
                id: `${item.questionType}-${index}`,
                typeKey: mapQuestionTypeKey(item.questionType),
                accuracy: item.accuracyPercent,
                color: typeColors[index % typeColors.length]
              }))
            : [];

        const hardestQuestions =
          response.hardestQuestions.length > 0
            ? response.hardestQuestions.map((item, index) => ({
                id: item.questionId || `${index}`,
                preview: item.questionLabel || item.parentTitle,
                type: item.questionType || item.module,
                testName: item.parentTitle || item.module,
                accuracy: item.accuracyPercent,
                attempts: item.attempts
              }))
            : [];

        const passagePerformance =
          response.passagePerformance.length > 0
            ? [...response.passagePerformance]
                .sort((left, right) => left.accuracyPercent - right.accuracyPercent)
                .slice(0, 5)
                .map((item, index) => ({
                  id: item.contentId || `${index}`,
                  title: item.title || item.module,
                  avgScore: item.accuracyPercent,
                  rank: index + 1
                }))
            : [];

        setRangeData({
          summary: [...summary],
          scoreTrend,
          completedPerDay,
          questionTypeAccuracy,
          skillDistribution: {
            reading: response.skillDistribution.reading,
            listening: response.skillDistribution.listening,
            writing: 0,
            speaking: 0
          },
          hardestQuestions,
          passagePerformance,
          insights: []
        });
      } catch {
        if (!active) return;
        setRangeData(EMPTY_ANALYTICS_DATA);
      }
    };

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [selectedRange]);

  const hardestRows = useMemo(() => {
    const query = hardestSearch.trim().toLowerCase();
    const filtered = rangeData.hardestQuestions.filter((row) => {
      if (!query) return true;
      return row.preview.toLowerCase().includes(query) || row.testName.toLowerCase().includes(query) || row.type.toLowerCase().includes(query);
    });

    return [...filtered].sort((left, right) => {
      if (accuracySort === "asc") {
        return left.accuracy - right.accuracy;
      }
      return right.accuracy - left.accuracy;
    });
  }, [accuracySort, hardestSearch, rangeData.hardestQuestions]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AnalyticsHeader
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            onExport={() => {
              console.info("[analytics] export report", {range: selectedRange});
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <AnalyticsStatCards stats={rangeData.summary} />

            <section className="grid min-w-0 gap-5 xl:grid-cols-2">
              <StudentScoreTrendChart points={rangeData.scoreTrend} />
              <TestsCompletedChart points={rangeData.completedPerDay} />
            </section>

            <section className="grid min-w-0 gap-5 xl:grid-cols-2">
              <QuestionTypeAccuracy items={rangeData.questionTypeAccuracy} />
              <SkillDistributionChart value={rangeData.skillDistribution} />
            </section>

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
              <HardestQuestionsTable
                rows={hardestRows}
                searchValue={hardestSearch}
                sortDirection={accuracySort}
                onSearchChange={setHardestSearch}
                onToggleAccuracySort={() => setAccuracySort((current) => (current === "asc" ? "desc" : "asc"))}
              />
              <PassagePerformanceCard rows={rangeData.passagePerformance} />
            </section>

            {rangeData.insights.length > 0 ? <InsightsCards items={rangeData.insights} /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
