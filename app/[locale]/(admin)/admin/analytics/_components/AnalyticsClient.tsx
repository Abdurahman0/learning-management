"use client";

import {useMemo, useState} from "react";

import {ADMIN_ANALYTICS_BY_RANGE, type AnalyticsRangeKey} from "@/data/admin-analytics";

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

export function AnalyticsClient() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRangeKey>("last30Days");
  const [accuracySort, setAccuracySort] = useState<"asc" | "desc">("asc");
  const [hardestSearch, setHardestSearch] = useState("");

  const rangeData = useMemo(() => ADMIN_ANALYTICS_BY_RANGE[selectedRange], [selectedRange]);

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

            <InsightsCards items={rangeData.insights} />
          </main>
        </div>
      </div>
    </div>
  );
}
