import type {
  VocabularyPracticeQuestion,
  VocabularySource,
  VocabularyStatus,
  VocabularySuggestion,
  VocabularySummary,
  VocabularyWord,
} from "@/types/vocabulary";

const BASE_DATE = new Date("2026-03-18T09:00:00.000Z");

function isoFromBase(dayOffset: number, hour = 9) {
  const value = new Date(BASE_DATE);
  value.setUTCDate(value.getUTCDate() + dayOffset);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createWord({
  id,
  word,
  meaning,
  explanation,
  status,
  source,
  mastery,
  stability,
  streak,
  addedDaysAgo,
  reviewedDaysAgo,
  nextReviewDays,
  module,
  sourceLabel,
  example,
  note,
  tag,
}: {
  id: string;
  word: string;
  meaning: string;
  explanation: string;
  status: VocabularyStatus;
  source: VocabularySource;
  mastery: number;
  stability?: number;
  streak: number;
  addedDaysAgo: number;
  reviewedDaysAgo?: number;
  nextReviewDays?: number;
  module?: "reading" | "listening";
  sourceLabel?: string;
  example?: string;
  note?: string;
  tag?: string;
}): VocabularyWord {
  const totalReviews = Math.max(2, streak + 2);
  const correctReviews = Math.min(totalReviews, Math.max(1, streak + 1));
  const incorrectReviews = Math.max(0, totalReviews - correctReviews);

  return {
    id,
    word,
    meaning,
    explanation,
    example,
    note,
    tag,
    source,
    module,
    sourceLabel,
    status,
    mastery: clampPercent(mastery),
    stability: stability == null ? undefined : clampPercent(stability),
    correctStreak: streak,
    addedAt: isoFromBase(-Math.abs(addedDaysAgo), 10),
    lastReviewedAt: reviewedDaysAgo == null ? undefined : isoFromBase(-Math.abs(reviewedDaysAgo), 7),
    nextReviewAt: nextReviewDays == null ? undefined : isoFromBase(nextReviewDays, 8),
    reviewStats: {
      total: totalReviews,
      correct: correctReviews,
      incorrect: incorrectReviews,
    },
  };
}

const DUE_CORE_WORDS: VocabularyWord[] = [
  createWord({
    id: "v-due-1",
    word: "Inexorable",
    meaning: "Impossible to stop or prevent.",
    explanation: "Use it when a process continues steadily despite attempts to resist it.",
    status: "due",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 3 (Passage 1)",
    mastery: 28,
    stability: 20,
    streak: 1,
    addedDaysAgo: 10,
    reviewedDaysAgo: 4,
    nextReviewDays: 0,
    example: "The city faced inexorable pressure from rising housing demand.",
  }),
  createWord({
    id: "v-due-2",
    word: "Proliferate",
    meaning: "To increase rapidly in number.",
    explanation: "Often used in academic texts about trends, species, or technologies.",
    status: "due",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 3 (Passage 1)",
    mastery: 46,
    stability: 35,
    streak: 2,
    addedDaysAgo: 8,
    reviewedDaysAgo: 3,
    nextReviewDays: 0,
    example: "Misinformation can proliferate quickly on social platforms.",
  }),
  createWord({
    id: "v-due-3",
    word: "Mitigate",
    meaning: "To make something less severe.",
    explanation: "IELTS tasks frequently use this in policy and climate contexts.",
    status: "due",
    source: "manual",
    mastery: 52,
    stability: 42,
    streak: 3,
    addedDaysAgo: 12,
    reviewedDaysAgo: 2,
    nextReviewDays: 0,
    note: "Pair with nouns: risk, impact, damage.",
    tag: "policy",
  }),
  createWord({
    id: "v-due-4",
    word: "Deteriorate",
    meaning: "To become worse over time.",
    explanation: "Useful for writing task 1 trend descriptions and reading paraphrases.",
    status: "due",
    source: "test",
    module: "listening",
    sourceLabel: "Listening Test 2 (Part 4)",
    mastery: 37,
    stability: 27,
    streak: 1,
    addedDaysAgo: 9,
    reviewedDaysAgo: 5,
    nextReviewDays: 0,
    example: "Air quality may deteriorate in highly congested districts.",
  }),
  createWord({
    id: "v-due-5",
    word: "Feasible",
    meaning: "Possible and practical to do.",
    explanation: "Common in essays discussing solutions and decision-making.",
    status: "due",
    source: "manual",
    mastery: 61,
    stability: 55,
    streak: 4,
    addedDaysAgo: 14,
    reviewedDaysAgo: 1,
    nextReviewDays: 0,
    note: "Collocations: financially feasible, technically feasible.",
    tag: "task2",
  }),
  createWord({
    id: "v-due-6",
    word: "Disparity",
    meaning: "A significant difference or inequality.",
    explanation: "High-frequency word in social and economic IELTS passages.",
    status: "due",
    source: "ai",
    module: "reading",
    sourceLabel: "AI Coach: Weak area trends",
    mastery: 44,
    stability: 31,
    streak: 2,
    addedDaysAgo: 6,
    reviewedDaysAgo: 2,
    nextReviewDays: 0,
  }),
];

const DUE_FILLER_TERMS = [
  "Compelling",
  "Inevitable",
  "Predominant",
  "Substantiate",
  "Constrain",
  "Diminish",
];

const DUE_FILLER_WORDS: VocabularyWord[] = DUE_FILLER_TERMS.map((term, index) =>
  createWord({
    id: `v-due-${index + 7}`,
    word: term,
    meaning: "Academic term for precise IELTS reading and writing usage.",
    explanation: "Review this word in context and practice one sentence from memory.",
    status: "due",
    source: index % 2 === 0 ? "test" : "manual",
    module: index % 2 === 0 ? "reading" : "listening",
    sourceLabel: index % 2 === 0 ? "Reading mistake review" : "Listening note completion",
    mastery: 30 + index * 6,
    stability: 24 + index * 5,
    streak: 1 + (index % 3),
    addedDaysAgo: 7 + index,
    reviewedDaysAgo: 2 + (index % 4),
    nextReviewDays: 0,
  })
);

const LEARNING_CORE_WORDS: VocabularyWord[] = [
  createWord({
    id: "v-learning-1",
    word: "Exacerbate",
    meaning: "To make a problem worse.",
    explanation: "A strong essay verb when discussing causes and effects.",
    status: "learning",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 2 (Passage 3)",
    mastery: 65,
    stability: 58,
    streak: 5,
    addedDaysAgo: 16,
    reviewedDaysAgo: 1,
    nextReviewDays: 1,
    example: "Poor planning can exacerbate traffic congestion.",
  }),
  createWord({
    id: "v-learning-2",
    word: "Viable",
    meaning: "Capable of working successfully.",
    explanation: "Use it to evaluate alternatives in Writing Task 2.",
    status: "learning",
    source: "manual",
    mastery: 71,
    stability: 64,
    streak: 6,
    addedDaysAgo: 21,
    reviewedDaysAgo: 1,
    nextReviewDays: 2,
    note: "Collocation: viable alternative.",
    tag: "argument",
  }),
  createWord({
    id: "v-learning-3",
    word: "Allocate",
    meaning: "To distribute resources for a purpose.",
    explanation: "Appears in policy and management contexts across IELTS modules.",
    status: "learning",
    source: "test",
    module: "listening",
    sourceLabel: "Listening Test 1 (Part 3)",
    mastery: 57,
    stability: 50,
    streak: 3,
    addedDaysAgo: 11,
    reviewedDaysAgo: 2,
    nextReviewDays: 1,
  }),
  createWord({
    id: "v-learning-4",
    word: "Credible",
    meaning: "Believable and trustworthy.",
    explanation: "Useful for evaluating evidence quality in reading passages.",
    status: "learning",
    source: "ai",
    module: "reading",
    sourceLabel: "AI Coach: frequent elimination mistakes",
    mastery: 63,
    stability: 57,
    streak: 4,
    addedDaysAgo: 13,
    reviewedDaysAgo: 1,
    nextReviewDays: 2,
  }),
  createWord({
    id: "v-learning-5",
    word: "Consensus",
    meaning: "General agreement among a group.",
    explanation: "Good synonym for agreement in formal essays.",
    status: "learning",
    source: "manual",
    mastery: 68,
    stability: 62,
    streak: 4,
    addedDaysAgo: 18,
    reviewedDaysAgo: 1,
    nextReviewDays: 2,
  }),
  createWord({
    id: "v-learning-6",
    word: "Constrain",
    meaning: "To limit the development of something.",
    explanation: "High-value verb for writing economic or environmental topics.",
    status: "learning",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 4 (Passage 2)",
    mastery: 54,
    stability: 48,
    streak: 3,
    addedDaysAgo: 9,
    reviewedDaysAgo: 1,
    nextReviewDays: 1,
  }),
];

const LEARNING_FILLER_WORDS: VocabularyWord[] = Array.from({ length: 39 }, (_, index) =>
  createWord({
    id: `v-learning-${index + 7}`,
    word: `Lexeme${index + 1}`,
    meaning: "Academic vocabulary item used in IELTS reading and writing contexts.",
    explanation: "Continue spaced reviews to stabilize meaning recall and productive use.",
    status: "learning",
    source: index % 3 === 0 ? "manual" : "test",
    module: index % 2 === 0 ? "reading" : "listening",
    sourceLabel: index % 2 === 0 ? "Reading progress set" : "Listening error log",
    mastery: 40 + (index % 30),
    stability: 33 + (index % 28),
    streak: 2 + (index % 5),
    addedDaysAgo: 25 + (index % 12),
    reviewedDaysAgo: 1 + (index % 3),
    nextReviewDays: 1 + (index % 4),
  })
);

const MASTERED_CORE_WORDS: VocabularyWord[] = [
  createWord({
    id: "v-mastered-1",
    word: "Sustainable",
    meaning: "Able to continue without causing damage.",
    explanation: "Core adjective for long-term solutions and development topics.",
    status: "mastered",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 1",
    mastery: 94,
    stability: 88,
    streak: 9,
    addedDaysAgo: 60,
    reviewedDaysAgo: 4,
    nextReviewDays: 12,
  }),
  createWord({
    id: "v-mastered-2",
    word: "Evaluate",
    meaning: "To assess carefully.",
    explanation: "Strong academic verb for both writing and speaking responses.",
    status: "mastered",
    source: "manual",
    mastery: 96,
    stability: 90,
    streak: 12,
    addedDaysAgo: 75,
    reviewedDaysAgo: 6,
    nextReviewDays: 14,
  }),
  createWord({
    id: "v-mastered-3",
    word: "Substantial",
    meaning: "Large in amount or value.",
    explanation: "Useful for describing trend changes and quantitative comparisons.",
    status: "mastered",
    source: "test",
    module: "listening",
    sourceLabel: "Listening Test 3",
    mastery: 91,
    stability: 84,
    streak: 8,
    addedDaysAgo: 69,
    reviewedDaysAgo: 5,
    nextReviewDays: 11,
  }),
  createWord({
    id: "v-mastered-4",
    word: "Accurate",
    meaning: "Correct and exact.",
    explanation: "Essential adjective for reporting data and conclusions.",
    status: "mastered",
    source: "manual",
    mastery: 92,
    stability: 86,
    streak: 10,
    addedDaysAgo: 82,
    reviewedDaysAgo: 7,
    nextReviewDays: 15,
  }),
  createWord({
    id: "v-mastered-5",
    word: "Hypothesis",
    meaning: "A proposed explanation based on limited evidence.",
    explanation: "Appears in science and research passages frequently.",
    status: "mastered",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 5",
    mastery: 93,
    stability: 87,
    streak: 9,
    addedDaysAgo: 54,
    reviewedDaysAgo: 3,
    nextReviewDays: 10,
  }),
  createWord({
    id: "v-mastered-6",
    word: "Implement",
    meaning: "To put a plan into action.",
    explanation: "Common policy/action verb for Writing Task 2 essays.",
    status: "mastered",
    source: "manual",
    mastery: 95,
    stability: 89,
    streak: 11,
    addedDaysAgo: 71,
    reviewedDaysAgo: 5,
    nextReviewDays: 13,
  }),
  createWord({
    id: "v-mastered-7",
    word: "Correlate",
    meaning: "To have a mutual relationship with something.",
    explanation: "Useful in data interpretation and academic argumentation.",
    status: "mastered",
    source: "test",
    module: "reading",
    sourceLabel: "Reading Test 6",
    mastery: 90,
    stability: 83,
    streak: 8,
    addedDaysAgo: 64,
    reviewedDaysAgo: 5,
    nextReviewDays: 12,
  }),
  createWord({
    id: "v-mastered-8",
    word: "Consecutive",
    meaning: "Following continuously in sequence.",
    explanation: "Helpful for process, timeline, and sequence descriptions.",
    status: "mastered",
    source: "manual",
    mastery: 92,
    stability: 85,
    streak: 9,
    addedDaysAgo: 58,
    reviewedDaysAgo: 4,
    nextReviewDays: 11,
  }),
];

const MASTERED_FILLER_WORDS: VocabularyWord[] = Array.from({ length: 120 }, (_, index) =>
  createWord({
    id: `v-mastered-${index + 9}`,
    word: `Mastered Term ${index + 1}`,
    meaning: "Previously learned vocabulary item retained through repeated review.",
    explanation: "Already stable. Keep occasional spaced checks to maintain fluency.",
    status: "mastered",
    source: index % 4 === 0 ? "manual" : "test",
    module: index % 2 === 0 ? "reading" : "listening",
    sourceLabel: index % 2 === 0 ? "Reading streak archive" : "Listening streak archive",
    mastery: 88 + (index % 12),
    stability: 80 + (index % 15),
    streak: 7 + (index % 8),
    addedDaysAgo: 45 + (index % 40),
    reviewedDaysAgo: 3 + (index % 6),
    nextReviewDays: 8 + (index % 10),
  })
);

export const STUDENT_VOCABULARY_WORDS: VocabularyWord[] = [
  ...DUE_CORE_WORDS,
  ...DUE_FILLER_WORDS,
  ...LEARNING_CORE_WORDS,
  ...LEARNING_FILLER_WORDS,
  ...MASTERED_CORE_WORDS,
  ...MASTERED_FILLER_WORDS,
];

export const STUDENT_VOCABULARY_AI_SUGGESTIONS: VocabularySuggestion[] = [
  {
    id: "v-suggestion-1",
    word: "Substantiate",
    meaning: "To support a claim with evidence.",
    explanation: "You missed evidence-based options in recent reading eliminations.",
    source: "ai",
    module: "reading",
    sourceLabel: "From: Reading Test 3 (Passage 1)",
    recommendedReason: "Frequent confusion between opinion and evidence-based statements.",
    suggestedAt: isoFromBase(0, 6),
  },
  {
    id: "v-suggestion-2",
    word: "Ambiguous",
    meaning: "Open to more than one interpretation.",
    explanation: "Helpful for tricky TFNG and inference tasks.",
    source: "ai",
    module: "reading",
    sourceLabel: "From: Reading Test 4 (Passage 2)",
    recommendedReason: "Inference mistakes increased on nuanced statements.",
    suggestedAt: isoFromBase(0, 6),
  },
  {
    id: "v-suggestion-3",
    word: "Nuance",
    meaning: "A subtle difference in meaning or tone.",
    explanation: "Strong word for writing explanations and reading paraphrases.",
    source: "ai",
    module: "reading",
    sourceLabel: "From: Review Center weak-area feed",
    recommendedReason: "Keyword matching is strong, but subtle meaning distinctions are weaker.",
    suggestedAt: isoFromBase(0, 6),
  },
  {
    id: "v-suggestion-4",
    word: "Allocate",
    meaning: "To distribute resources for a purpose.",
    explanation: "Appears in listening lectures about budgets and planning.",
    source: "ai",
    module: "listening",
    sourceLabel: "From: Listening Test 2 (Part 3)",
    recommendedReason: "Wrong selection in planning/budget multiple choice items.",
    suggestedAt: isoFromBase(0, 6),
  },
  {
    id: "v-suggestion-5",
    word: "Consecutive",
    meaning: "Following one after another.",
    explanation: "Useful for process and timeline wording.",
    source: "ai",
    module: "listening",
    sourceLabel: "From: Listening Test 1 (Part 4)",
    recommendedReason: "Missed sequence-based notes in part 4 lecture.",
    suggestedAt: isoFromBase(-1, 6),
  },
  {
    id: "v-suggestion-6",
    word: "Constrain",
    meaning: "To limit the development of something.",
    explanation: "Frequently used in academic discussion passages.",
    source: "ai",
    module: "reading",
    sourceLabel: "From: Reading Test 6 (Passage 2)",
    recommendedReason: "Repeated errors in cause-effect sentence completion.",
    suggestedAt: isoFromBase(-1, 6),
  },
  {
    id: "v-suggestion-7",
    word: "Plausible",
    meaning: "Seemingly reasonable or probable.",
    explanation: "Helps evaluate distractors in multiple-choice questions.",
    source: "ai",
    module: "listening",
    sourceLabel: "From: Listening Test 3 (Part 2)",
    recommendedReason: "Distractor options felt plausible and caused wrong choices.",
    suggestedAt: isoFromBase(-2, 6),
  },
  {
    id: "v-suggestion-8",
    word: "Diverge",
    meaning: "To move in different directions.",
    explanation: "Appears in essays and reading arguments comparing viewpoints.",
    source: "ai",
    module: "reading",
    sourceLabel: "From: Reading Test 5 (Passage 3)",
    recommendedReason: "Mixed up similar viewpoints in paragraph matching.",
    suggestedAt: isoFromBase(-2, 6),
  },
];

function cloneWord(item: VocabularyWord): VocabularyWord {
  return {
    ...item,
    reviewStats: item.reviewStats ? { ...item.reviewStats } : undefined,
  };
}

export function getStudentVocabularyWords() {
  return STUDENT_VOCABULARY_WORDS.map(cloneWord);
}

export function getStudentVocabularySuggestions() {
  return STUDENT_VOCABULARY_AI_SUGGESTIONS.map((item) => ({ ...item }));
}

export function getVocabularySummary(words: VocabularyWord[], suggestions: VocabularySuggestion[]): VocabularySummary {
  return {
    dueToday: words.filter((word) => word.status === "due").length,
    learning: words.filter((word) => word.status === "learning").length,
    mastered: words.filter((word) => word.status === "mastered").length,
    recommendations: suggestions.length,
  };
}

export function getDueTodayWords(words: VocabularyWord[]) {
  return [...words]
    .filter((word) => word.status === "due")
    .sort((a, b) => a.mastery - b.mastery || a.word.localeCompare(b.word));
}

export function getLearningWords(words: VocabularyWord[]) {
  return [...words]
    .filter((word) => word.status === "learning")
    .sort((a, b) => a.mastery - b.mastery || a.word.localeCompare(b.word));
}

export function getSavedWords(words: VocabularyWord[]) {
  return [...words]
    .filter((word) => word.source === "manual")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function getMasteredWords(words: VocabularyWord[]) {
  return [...words]
    .filter((word) => word.status === "mastered")
    .sort((a, b) => b.mastery - a.mastery || a.word.localeCompare(b.word));
}

export function buildVocabularyPracticeDeck(words: VocabularyWord[], limit = 12) {
  return [...words]
    .filter((word) => word.status === "due" || word.status === "learning")
    .sort((a, b) => {
      const duePriority = a.status === b.status ? 0 : a.status === "due" ? -1 : 1;
      if (duePriority !== 0) return duePriority;
      return a.mastery - b.mastery || a.word.localeCompare(b.word);
    })
    .slice(0, limit);
}

const SYNONYM_CHOICES = ["amplify", "worsen", "stabilize", "isolate"];
const MEANING_CHOICES = [
  "To increase rapidly",
  "To reduce gradually",
  "To stop completely",
  "To reject formally",
];

export function buildPracticeQuestions(deck: VocabularyWord[]): VocabularyPracticeQuestion[] {
  return deck.map((word, index) => {
    const typeIndex = index % 4;
    if (typeIndex === 0) {
      const distractors = MEANING_CHOICES.filter((choice) => choice !== word.meaning).slice(0, 3);
      const orderedChoices = [word.meaning, ...distractors];
      const offset = index % orderedChoices.length;
      const rotatedChoices = [...orderedChoices.slice(offset), ...orderedChoices.slice(0, offset)];
      return {
        id: `pq-${word.id}`,
        wordId: word.id,
        type: "meaningMatch",
        prompt: `Select the closest meaning for "${word.word}".`,
        choices: rotatedChoices,
        answer: word.meaning,
      };
    }

    if (typeIndex === 1) {
      return {
        id: `pq-${word.id}`,
        wordId: word.id,
        type: "synonymChoice",
        prompt: `Choose the best synonym for "${word.word}".`,
        choices: [word.word === "Exacerbate" ? "worsen" : SYNONYM_CHOICES[0], ...SYNONYM_CHOICES.slice(1)].slice(0, 4),
        answer: word.word === "Exacerbate" ? "worsen" : SYNONYM_CHOICES[0],
      };
    }

    if (typeIndex === 2) {
      return {
        id: `pq-${word.id}`,
        wordId: word.id,
        type: "fillBlank",
        prompt: `Fill in the blank: "Policy delays can ____ the problem."`,
        answer: word.word.toLowerCase(),
      };
    }

    return {
      id: `pq-${word.id}`,
      wordId: word.id,
      type: "typing",
      prompt: `Type the vocabulary word that means: "${word.meaning}".`,
      answer: word.word.toLowerCase(),
    };
  });
}
