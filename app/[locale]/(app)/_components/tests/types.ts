export type Difficulty = "easy" | "medium" | "hard";

export type ReadingGuestTest = {
  id: string;
  title: string;
  isPremium: boolean;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
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
