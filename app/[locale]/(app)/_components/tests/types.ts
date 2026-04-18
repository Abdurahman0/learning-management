export type Difficulty = "easy" | "medium" | "hard";
export type PracticeSource = "custom" | "real" | "cambridge";

export type ReadingGuestTest = {
  id: string;
  title: string;
  isPremium: boolean;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
  practiceSource: PracticeSource;
  passages: Array<{
    title: string;
    questionsCount: number;
    difficulty: Difficulty;
  }>;
};

export type ListeningDifficulty = Difficulty;

export type ListeningTestItem = {
  id: string;
  title: string;
  isPremium: boolean;
  difficulty: ListeningDifficulty;
  practiceSource: PracticeSource;
  durationMins: number;
  durationMinutes?: number;
  totalQuestions: number;
  sectionsCount?: number;
  sections: Array<{
    label: string;
    questions: number;
  }>;
};

export type ListeningGuestTest = ListeningTestItem;
