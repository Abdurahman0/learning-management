"use client";

import {useMemo, useState} from "react";

import {
  ADMIN_MISTAKES_ANALYSIS_BY_RANGE,
  DEFAULT_RECOMMENDATION_SETTINGS,
  type MistakesDateRangeKey
} from "@/data/admin-mistakes-analysis";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AiInsightsCard} from "./AiInsightsCard";
import {AiRecommendationSettingsCard} from "./AiRecommendationSettingsCard";
import {CommonMistakeTopicsCard} from "./CommonMistakeTopicsCard";
import {MistakeDistributionChart} from "./MistakeDistributionChart";
import {MistakesAnalysisHeader} from "./MistakesAnalysisHeader";
import {MistakeSummaryCards} from "./MistakeSummaryCards";
import {MostMissedQuestionsTable} from "./MostMissedQuestionsTable";
import {PassageDifficultyRankCard} from "./PassageDifficultyRankCard";
import {QuestionTypeAccuracyCard} from "./QuestionTypeAccuracyCard";

export function MistakesAnalysisClient() {
  const [selectedRange, setSelectedRange] = useState<MistakesDateRangeKey>("last30Days");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"accuracyRate" | "attempts">("accuracyRate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [aiSettings, setAiSettings] = useState(DEFAULT_RECOMMENDATION_SETTINGS);

  const data = useMemo(() => ADMIN_MISTAKES_ANALYSIS_BY_RANGE[selectedRange], [selectedRange]);
  const query = searchQuery.trim().toLowerCase();

  const visibleTopics = useMemo(() => {
    if (!query) {
      return data.commonTopics;
    }

    return data.commonTopics.filter((topic) => topic.label.toLowerCase().includes(query));
  }, [data.commonTopics, query]);

  const visiblePassages = useMemo(() => {
    if (!query) {
      return data.passageDifficulty;
    }

    return data.passageDifficulty.filter((item) => item.title.toLowerCase().includes(query));
  }, [data.passageDifficulty, query]);

  const visibleQuestions = useMemo(() => {
    const filtered = data.mostMissedQuestions.filter((item) => {
      if (selectedTopic && !item.topics.includes(selectedTopic)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.preview.toLowerCase().includes(query) ||
        item.testName.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.topics.some((topic) => topic.toLowerCase().includes(query))
      );
    });

    return [...filtered].sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortBy === "accuracyRate") {
        return (left.accuracyRate - right.accuracyRate) * direction;
      }
      return (left.attempts - right.attempts) * direction;
    });
  }, [data.mostMissedQuestions, selectedTopic, query, sortBy, sortDirection]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <MistakesAnalysisHeader
            searchQuery={searchQuery}
            selectedRange={selectedRange}
            onSearchChange={(value) => setSearchQuery(value)}
            onRangeChange={(value) => setSelectedRange(value)}
            onExport={() => {
              console.info("[mistakes-analysis] export-insights", {range: selectedRange});
            }}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <MistakeSummaryCards stats={data.summaryStats} />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
              <QuestionTypeAccuracyCard items={data.questionTypeAccuracy} />
              <MistakeDistributionChart items={data.distribution} totalErrorsLabel={data.totalErrorsLabel} />
            </section>

            <MostMissedQuestionsTable
              rows={visibleQuestions}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={(field) => {
                if (field === sortBy) {
                  setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
                  return;
                }
                setSortBy(field);
                setSortDirection("asc");
              }}
              onViewDetailedList={() => {
                console.info("[mistakes-analysis] view-detailed-list", {count: visibleQuestions.length, selectedTopic});
              }}
            />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
              <div className="space-y-5">
                <PassageDifficultyRankCard items={visiblePassages} />
                <CommonMistakeTopicsCard topics={visibleTopics} selectedTopic={selectedTopic} onTopicSelect={setSelectedTopic} />
              </div>

              <div className="space-y-5">
                <AiInsightsCard
                  items={data.aiInsights}
                  onGenerateModules={() => {
                    console.info("[mistakes-analysis] generate-improvement-modules", {range: selectedRange, topic: selectedTopic});
                  }}
                />
                <AiRecommendationSettingsCard
                  settings={aiSettings}
                  onToggleEnabled={(value) => setAiSettings((current) => ({...current, enabled: value}))}
                  onThresholdChange={(value) => setAiSettings((current) => ({...current, threshold: value}))}
                />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

