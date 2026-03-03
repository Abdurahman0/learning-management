export type Difficulty = "easy" | "medium" | "hard";

export type ReadingPassage = {
  title: string;
  questionsCount: number;
  difficulty: Difficulty;
};

export type ReadingGuestTest = {
  id: string;
  title: string;
  isPremium: boolean;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
  passages: ReadingPassage[];
};

export type ListeningGuestTest = {
  id: string;
  title: string;
  isPremium: boolean;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
  sectionsCount: number;
};

export const READING_TESTS: ReadingGuestTest[] = [
  {
    id: "r-001",
    title: "Cambridge IELTS 18 Test 1",
    isPremium: false,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "medium",
    passages: [
      {title: "The History of Glass", questionsCount: 13, difficulty: "easy"},
      {title: "The Growth of Cities", questionsCount: 13, difficulty: "medium"},
      {title: "Language Strategy", questionsCount: 14, difficulty: "hard"}
    ]
  },
  {
    id: "r-002",
    title: "Cambridge IELTS 18 Test 2",
    isPremium: false,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "easy",
    passages: [
      {title: "Urban Gardens", questionsCount: 13, difficulty: "easy"},
      {title: "Solar Architecture", questionsCount: 13, difficulty: "medium"},
      {title: "Behavioral Economics", questionsCount: 14, difficulty: "medium"}
    ]
  },
  {
    id: "r-003",
    title: "Cambridge IELTS 18 Test 3",
    isPremium: true,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "hard",
    passages: [
      {title: "Marine Migration", questionsCount: 13, difficulty: "medium"},
      {title: "Arctic Logistics", questionsCount: 13, difficulty: "hard"},
      {title: "Future Materials", questionsCount: 14, difficulty: "hard"}
    ]
  },
  {
    id: "r-004",
    title: "Cambridge IELTS 17 Test 4",
    isPremium: true,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "medium",
    passages: [
      {title: "Museum Funding", questionsCount: 13, difficulty: "easy"},
      {title: "Modern Farming", questionsCount: 13, difficulty: "medium"},
      {title: "Space Nutrition", questionsCount: 14, difficulty: "hard"}
    ]
  },
  {
    id: "r-005",
    title: "Cambridge IELTS 16 Test 2",
    isPremium: false,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "medium",
    passages: [
      {title: "Rainforest Systems", questionsCount: 13, difficulty: "easy"},
      {title: "Language Mapping", questionsCount: 13, difficulty: "medium"},
      {title: "Neural Interfaces", questionsCount: 14, difficulty: "hard"}
    ]
  },
  {
    id: "r-006",
    title: "Cambridge IELTS 15 Test 1",
    isPremium: true,
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: "hard",
    passages: [
      {title: "Reef Restoration", questionsCount: 13, difficulty: "medium"},
      {title: "Highland Transport", questionsCount: 13, difficulty: "hard"},
      {title: "Data Ethics", questionsCount: 14, difficulty: "hard"}
    ]
  }
];

export const LISTENING_TESTS: ListeningGuestTest[] = [
  {
    id: "l-001",
    title: "Cambridge IELTS 18 Listening Test 1",
    isPremium: false,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "easy",
    sectionsCount: 4
  },
  {
    id: "l-002",
    title: "Cambridge IELTS 18 Listening Test 2",
    isPremium: false,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "medium",
    sectionsCount: 4
  },
  {
    id: "l-003",
    title: "Cambridge IELTS 18 Listening Test 3",
    isPremium: true,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "hard",
    sectionsCount: 4
  },
  {
    id: "l-004",
    title: "Cambridge IELTS 17 Listening Test 4",
    isPremium: true,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "medium",
    sectionsCount: 4
  },
  {
    id: "l-005",
    title: "Cambridge IELTS 16 Listening Test 2",
    isPremium: false,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "medium",
    sectionsCount: 4
  },
  {
    id: "l-006",
    title: "Cambridge IELTS 15 Listening Test 1",
    isPremium: true,
    durationMinutes: 30,
    totalQuestions: 40,
    difficulty: "hard",
    sectionsCount: 4
  }
];
