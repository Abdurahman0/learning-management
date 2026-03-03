export type ListeningDifficulty = "easy" | "medium" | "hard";

export type ListeningSection = {
  label: string;
  questions: number;
};

export type ListeningTestItem = {
  id: string;
  title: string;
  isPremium: boolean;
  difficulty: ListeningDifficulty;
  durationMins: number;
  totalQuestions: number;
  sections: [ListeningSection, ListeningSection, ListeningSection, ListeningSection];
};

export const LISTENING_TESTS: ListeningTestItem[] = [
  {
    id: "l-008",
    title: "Cambridge IELTS 19 Listening Test 2",
    isPremium: false,
    difficulty: "medium",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-007",
    title: "Cambridge IELTS 19 Listening Test 1",
    isPremium: false,
    difficulty: "easy",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-006",
    title: "Official Guide Listening Test 4",
    isPremium: true,
    difficulty: "hard",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-005",
    title: "Recent Real Exam - Jan 2024",
    isPremium: false,
    difficulty: "easy",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-004",
    title: "Cambridge IELTS 18 Listening Test 4",
    isPremium: true,
    difficulty: "medium",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-003",
    title: "Cambridge IELTS 18 Listening Test 3",
    isPremium: true,
    difficulty: "hard",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-002",
    title: "Cambridge IELTS 18 Listening Test 2",
    isPremium: false,
    difficulty: "medium",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  },
  {
    id: "l-001",
    title: "Cambridge IELTS 18 Listening Test 1",
    isPremium: false,
    difficulty: "easy",
    durationMins: 30,
    totalQuestions: 40,
    sections: [
      {label: "SEC 1", questions: 10},
      {label: "SEC 2", questions: 10},
      {label: "SEC 3", questions: 10},
      {label: "SEC 4", questions: 10}
    ]
  }
];
