export type VocabularySource = "ai" | "manual" | "test";

export type VocabularyModule = "reading" | "listening";

export type VocabularyStatus = "suggested" | "due" | "learning" | "mastered";

export type VocabularyWord = {
  id: string;
  word: string;
  meaning: string;
  explanation: string;
  example?: string;
  note?: string;
  tag?: string;
  source: VocabularySource;
  module?: VocabularyModule;
  sourceLabel?: string;
  status: VocabularyStatus;
  mastery: number;
  stability?: number;
  correctStreak: number;
  addedAt: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  reviewStats?: {
    total: number;
    correct: number;
    incorrect: number;
  };
};

export type VocabularySuggestion = {
  id: string;
  word: string;
  meaning: string;
  explanation: string;
  source: "ai";
  module: VocabularyModule;
  sourceLabel: string;
  recommendedReason: string;
  suggestedAt: string;
};

export type VocabularyPracticeType =
  | "meaningMatch"
  | "synonymChoice"
  | "fillBlank"
  | "typing";

export type VocabularyPracticeQuestion = {
  id: string;
  wordId: string;
  type: VocabularyPracticeType;
  prompt: string;
  choices?: string[];
  answer: string;
};

export type VocabularySummary = {
  dueToday: number;
  learning: number;
  mastered: number;
  recommendations: number;
};
