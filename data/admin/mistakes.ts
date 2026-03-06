import type {AiInsightEntity, AnalyticsRangeKey, MistakesSnapshotEntity, RecommendationSettingsEntity} from "@/types/admin";

const SHARED_INSIGHTS: AiInsightEntity[] = [
  {
    id: "ins-1",
    title: "Summary",
    description:
      "Students are consistently struggling with inference-based questions in Reading Passage 3. Accuracy drops by 24% when passages use abstract terminology."
  },
  {
    id: "ins-2",
    title: "Observation",
    description:
      "A 12% increase in mistakes related to numerical paraphrasing has been detected in Listening Section 4 compared to the previous range."
  },
  {
    id: "ins-3",
    title: "Recommendation",
    description:
      "Deploy targeted micro-lessons for matching headings and inference drills, then retest within 10 days to monitor retention."
  }
];

export const DEFAULT_RECOMMENDATION_SETTINGS_ENTITY: RecommendationSettingsEntity = {
  enabled: true,
  threshold: 35
};

export const MISTAKES_BY_RANGE: Record<AnalyticsRangeKey, MistakesSnapshotEntity> = {
  last7Days: {
    questionTypeAccuracy: [
      {id: "qt-1", label: "Matching Headings", accuracy: 44, severity: "critical"},
      {id: "qt-2", label: "True / False / Not Given", accuracy: 53, severity: "warning"},
      {id: "qt-3", label: "Multiple Choice", accuracy: 57, severity: "warning"},
      {id: "qt-4", label: "Sentence Completion", accuracy: 72, severity: "good"},
      {id: "qt-5", label: "Diagram Labeling", accuracy: 79, severity: "good"}
    ],
    distribution: [
      {module: "reading", percentage: 47, totalErrors: 2900, color: "#4F6BFF"},
      {module: "listening", percentage: 29, totalErrors: 1800, color: "#7C96FF"},
      {module: "writing", percentage: 14, totalErrors: 860, color: "#8B5CF6"},
      {module: "speaking", percentage: 10, totalErrors: 620, color: "#CBD5E1"}
    ],
    totalErrorsLabel: "6.2k",
    mostMissedQuestions: [
      {
        id: "mm-1",
        testId: "cam-18-r-1",
        preview: "...the correlation between fiscal policy and market expansion...",
        type: "Summary Completion",
        accuracyRate: 24,
        attempts: 610,
        topics: ["Inference", "Paraphrasing"]
      },
      {
        id: "mm-2",
        testId: "guide-l-4",
        preview: "Identify the primary reason the explorer decided to return...",
        type: "Matching Information",
        accuracyRate: 30,
        attempts: 520,
        topics: ["Inference", "Negation"]
      },
      {
        id: "mm-3",
        testId: "cam-16-l-3",
        preview: "What did the speaker imply about the future office relocation?",
        type: "Multiple Choice",
        accuracyRate: 34,
        attempts: 780,
        topics: ["Time Expressions", "Synonyms"]
      }
    ],
    passageDifficulty: [
      {id: "pd-1", testId: "cam-18-r-1", title: "Behavioral Economics", accuracy: 37, rank: 1},
      {id: "pd-2", testId: "cam-11-r-1", title: "The History of Glass", accuracy: 41, rank: 2},
      {id: "pd-3", testId: "cam-19-r-3", title: "Artificial Intelligence Trends", accuracy: 45, rank: 3}
    ],
    commonTopics: [
      {id: "topic-1", label: "Inference", count: 1400},
      {id: "topic-2", label: "Paraphrasing", count: 1100},
      {id: "topic-3", label: "Time Expressions", count: 1200},
      {id: "topic-4", label: "Negation", count: 640},
      {id: "topic-5", label: "Synonyms", count: 1900}
    ],
    insights: SHARED_INSIGHTS
  },
  last30Days: {
    questionTypeAccuracy: [
      {id: "qt-1", label: "Matching Headings", accuracy: 41, severity: "critical"},
      {id: "qt-2", label: "True / False / Not Given", accuracy: 52, severity: "warning"},
      {id: "qt-3", label: "Multiple Choice", accuracy: 58, severity: "warning"},
      {id: "qt-4", label: "Sentence Completion", accuracy: 76, severity: "good"},
      {id: "qt-5", label: "Diagram Labeling", accuracy: 82, severity: "good"}
    ],
    distribution: [
      {module: "reading", percentage: 45, totalErrors: 6390, color: "#4F6BFF"},
      {module: "listening", percentage: 30, totalErrors: 4260, color: "#7C96FF"},
      {module: "writing", percentage: 15, totalErrors: 2130, color: "#8B5CF6"},
      {module: "speaking", percentage: 10, totalErrors: 1420, color: "#CBD5E1"}
    ],
    totalErrorsLabel: "14.2k",
    mostMissedQuestions: [
      {
        id: "mm-1",
        testId: "cam-18-r-1",
        preview: "...the correlation between fiscal policy and market expansion...",
        type: "Summary Completion",
        accuracyRate: 22,
        attempts: 1240,
        topics: ["Inference", "Paraphrasing"]
      },
      {
        id: "mm-2",
        testId: "guide-l-4",
        preview: "Identify the primary reason the explorer decided to return...",
        type: "Matching Information",
        accuracyRate: 28,
        attempts: 890,
        topics: ["Inference", "Negation"]
      },
      {
        id: "mm-3",
        testId: "cam-16-l-3",
        preview: "What did the speaker imply about the future office relocation?",
        type: "Multiple Choice",
        accuracyRate: 32,
        attempts: 3500,
        topics: ["Time Expressions", "Synonyms"]
      },
      {
        id: "mm-4",
        testId: "cam-19-r-3",
        preview: "Choose the heading that best matches paragraph C.",
        type: "Matching Headings",
        accuracyRate: 27,
        attempts: 2660,
        topics: ["Inference", "Synonyms"]
      }
    ],
    passageDifficulty: [
      {id: "pd-1", testId: "cam-18-r-1", title: "Behavioral Economics", accuracy: 35, rank: 1},
      {id: "pd-2", testId: "cam-11-r-1", title: "The History of Glass", accuracy: 38, rank: 2},
      {id: "pd-3", testId: "cam-19-r-3", title: "Artificial Intelligence Trends", accuracy: 42, rank: 3}
    ],
    commonTopics: [
      {id: "topic-1", label: "Inference", count: 2400},
      {id: "topic-2", label: "Paraphrasing", count: 1800},
      {id: "topic-3", label: "Time Expressions", count: 2100},
      {id: "topic-4", label: "Negation", count: 940},
      {id: "topic-5", label: "Synonyms", count: 3200}
    ],
    insights: SHARED_INSIGHTS
  },
  last3Months: {
    questionTypeAccuracy: [
      {id: "qt-1", label: "Matching Headings", accuracy: 43, severity: "critical"},
      {id: "qt-2", label: "True / False / Not Given", accuracy: 55, severity: "warning"},
      {id: "qt-3", label: "Multiple Choice", accuracy: 61, severity: "warning"},
      {id: "qt-4", label: "Sentence Completion", accuracy: 78, severity: "good"},
      {id: "qt-5", label: "Diagram Labeling", accuracy: 84, severity: "good"}
    ],
    distribution: [
      {module: "reading", percentage: 44, totalErrors: 12760, color: "#4F6BFF"},
      {module: "listening", percentage: 31, totalErrors: 8990, color: "#7C96FF"},
      {module: "writing", percentage: 15, totalErrors: 4350, color: "#8B5CF6"},
      {module: "speaking", percentage: 10, totalErrors: 2900, color: "#CBD5E1"}
    ],
    totalErrorsLabel: "29.0k",
    mostMissedQuestions: [
      {
        id: "mm-1",
        testId: "cam-18-r-1",
        preview: "...the correlation between fiscal policy and market expansion...",
        type: "Summary Completion",
        accuracyRate: 21,
        attempts: 3210,
        topics: ["Inference", "Paraphrasing"]
      },
      {
        id: "mm-2",
        testId: "guide-l-4",
        preview: "Identify the primary reason the explorer decided to return...",
        type: "Matching Information",
        accuracyRate: 27,
        attempts: 2980,
        topics: ["Inference", "Negation"]
      },
      {
        id: "mm-3",
        testId: "cam-16-l-3",
        preview: "What did the speaker imply about the future office relocation?",
        type: "Multiple Choice",
        accuracyRate: 31,
        attempts: 7440,
        topics: ["Time Expressions", "Synonyms"]
      },
      {
        id: "mm-4",
        testId: "cam-19-r-3",
        preview: "Choose the heading that best matches paragraph C.",
        type: "Matching Headings",
        accuracyRate: 26,
        attempts: 6170,
        topics: ["Inference", "Synonyms"]
      }
    ],
    passageDifficulty: [
      {id: "pd-1", testId: "cam-18-r-1", title: "Behavioral Economics", accuracy: 34, rank: 1},
      {id: "pd-2", testId: "cam-11-r-1", title: "The History of Glass", accuracy: 37, rank: 2},
      {id: "pd-3", testId: "cam-19-r-3", title: "Artificial Intelligence Trends", accuracy: 41, rank: 3}
    ],
    commonTopics: [
      {id: "topic-1", label: "Inference", count: 5200},
      {id: "topic-2", label: "Paraphrasing", count: 3900},
      {id: "topic-3", label: "Time Expressions", count: 4300},
      {id: "topic-4", label: "Negation", count: 2140},
      {id: "topic-5", label: "Synonyms", count: 6800}
    ],
    insights: SHARED_INSIGHTS
  }
};
