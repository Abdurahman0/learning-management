import type {TestEntity, TestModule, TestStructureEntity} from "@/types/admin";

const READING_RANGES = ["Q1-13", "Q14-26", "Q27-40"] as const;
const LISTENING_RANGES = ["Q1-10", "Q11-20", "Q21-30", "Q31-40"] as const;

function makeReadingStructures(
  testId: string,
  definitions: Array<{title: string; shortDescription: string; content?: string[]}>
): TestStructureEntity[] {
  return READING_RANGES.map((range, index) => {
    const fallbackTitle = `Passage ${index + 1}`;
    const item = definitions[index] ?? {title: fallbackTitle, shortDescription: `Reading content for ${fallbackTitle}.`};
    return {
      id: `${testId}-p${index + 1}`,
      kind: "passage",
      index: index + 1,
      title: item.title,
      questionRangeLabel: range,
      shortDescription: item.shortDescription,
      content: item.content ?? [item.shortDescription],
      questionCount: index === 2 ? 14 : 13
    };
  });
}

function makeListeningStructures(
  testId: string,
  definitions: Array<{title: string; shortDescription: string; content?: string[]}>
): TestStructureEntity[] {
  return LISTENING_RANGES.map((range, index) => {
    const fallbackTitle = `Section ${index + 1}`;
    const item = definitions[index] ?? {title: fallbackTitle, shortDescription: `Listening transcript for ${fallbackTitle}.`};
    return {
      id: `${testId}-s${index + 1}`,
      kind: "section",
      index: index + 1,
      title: item.title,
      questionRangeLabel: range,
      shortDescription: item.shortDescription,
      content: item.content ?? [item.shortDescription],
      questionCount: 10,
      audioLabel: `audio-${testId}-section-${index + 1}.mp3`
    };
  });
}

type TestSeed = {
  id: string;
  name: string;
  module: TestModule;
  book: string;
  questions: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "published" | "draft";
  createdAt: string;
  structures: Array<{title: string; shortDescription: string; content?: string[]}>;
};

const TEST_SEEDS: TestSeed[] = [
  {
    id: "cam-18-r-1",
    name: "Cambridge IELTS 18 - Test 1",
    module: "reading",
    book: "Book 18",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-10-12",
    structures: [
      {
        title: "Urban Gardens",
        shortDescription: "Community farming trends and modern city planning strategies.",
        content: [
          "Urban farming communities use social incentives and practical constraints.",
          "Researchers found that neighborhood design has a measurable impact on outcomes."
        ]
      },
      {
        title: "Solar Architecture",
        shortDescription: "Integrating sustainable materials into medium-density buildings."
      },
      {
        title: "Behavioral Economics",
        shortDescription: "How modern buyers react to incentive design and pricing models."
      }
    ]
  },
  {
    id: "guide-l-4",
    name: "Official Guide Test 4",
    module: "listening",
    book: "Official Guide",
    questions: 40,
    difficulty: "advanced",
    status: "published",
    createdAt: "2023-10-05",
    structures: [
      {title: "Student Services", shortDescription: "A registration dialogue focused on factual detail matching."},
      {title: "Campus Briefing", shortDescription: "A short lecture with map labeling and completion tasks."},
      {title: "Research Meeting", shortDescription: "Academic discussion with opinion matching and note completion."},
      {title: "Urban Planning Talk", shortDescription: "Monologue with summary completion and detail recognition."}
    ]
  },
  {
    id: "cam-17-r-2",
    name: "Cambridge IELTS 17 - Test 2",
    module: "reading",
    book: "Book 17",
    questions: 40,
    difficulty: "beginner",
    status: "draft",
    createdAt: "2023-09-28",
    structures: [
      {title: "Marine Sensors", shortDescription: "Sensor deployment in shallow waters for climate tracking."},
      {title: "Museum Logistics", shortDescription: "Transport planning and collection safety in global exhibitions."},
      {title: "Workplace Dynamics", shortDescription: "Team motivation and productivity models in hybrid companies."}
    ]
  },
  {
    id: "cam-16-l-3",
    name: "Cambridge IELTS 16 Listening Test 3",
    module: "listening",
    book: "Book 16",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-09-15",
    structures: [
      {title: "Housing Enquiry", shortDescription: "Accommodation booking details and pricing."},
      {title: "Local Event Guide", shortDescription: "Broadcast with multiple choice and map tasks."},
      {title: "Tutorial Discussion", shortDescription: "Assignment discussion between students and tutor."},
      {title: "Marine Science", shortDescription: "Lecture with sentence completion."}
    ]
  },
  {
    id: "cam-19-r-3",
    name: "Cambridge IELTS 19 - Test 3",
    module: "reading",
    book: "Book 19",
    questions: 40,
    difficulty: "advanced",
    status: "published",
    createdAt: "2023-11-02",
    structures: [
      {title: "Volcanic Soil", shortDescription: "How mineral-rich landscapes affect agricultural outcomes."},
      {title: "Remote Manufacturing", shortDescription: "Distributed production pipelines and quality control."},
      {title: "Cognitive Fatigue", shortDescription: "Decision-making accuracy under sustained pressure."}
    ]
  },
  {
    id: "cam-15-l-2",
    name: "Cambridge IELTS 15 Listening Test 2",
    module: "listening",
    book: "Book 15",
    questions: 40,
    difficulty: "beginner",
    status: "draft",
    createdAt: "2023-08-24",
    structures: [
      {title: "Course Booking", shortDescription: "Form completion around enrollment and contact details."},
      {title: "Travel Orientation", shortDescription: "Tour briefing with route-specific questions."},
      {title: "Project Feedback", shortDescription: "Academic collaboration with matching opinions."},
      {title: "Health Systems", shortDescription: "Long monologue requiring focused keyword recognition."}
    ]
  },
  {
    id: "cam-18-l-1",
    name: "Cambridge IELTS 18 Listening Test 1",
    module: "listening",
    book: "Book 18",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-10-01",
    structures: [
      {title: "Library Membership", shortDescription: "Dialogue with form completion and personal details."},
      {title: "Community Program", shortDescription: "Information talk featuring map and table completion."},
      {title: "Group Assignment", shortDescription: "Discussion with matching and multi-select tasks."},
      {title: "Environment Lecture", shortDescription: "Academic lecture with summary completion."}
    ]
  },
  {
    id: "cam-16-r-4",
    name: "Cambridge IELTS 16 - Test 4",
    module: "reading",
    book: "Book 16",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-09-03",
    structures: [
      {title: "Antarctic Mapping", shortDescription: "Satellite imaging for ice-flow modeling."},
      {title: "Smart Materials", shortDescription: "Responsive construction materials and adoption."},
      {title: "Public Health Data", shortDescription: "Long-term datasets for prevention outcomes."}
    ]
  },
  {
    id: "cam-14-l-1",
    name: "Cambridge IELTS 14 Listening Test 1",
    module: "listening",
    book: "Book 14",
    questions: 40,
    difficulty: "advanced",
    status: "published",
    createdAt: "2023-07-18",
    structures: [
      {title: "Appointment Booking", shortDescription: "Practical booking conversation with numbers."},
      {title: "Museum Tour Info", shortDescription: "Information talk with route directions."},
      {title: "Seminar Planning", shortDescription: "Planning dialogue with opinion matching."},
      {title: "Innovation Lecture", shortDescription: "Long monologue requiring note completion."}
    ]
  },
  {
    id: "practice-r-mock-1",
    name: "Practice Mock Test 1",
    module: "reading",
    book: "Practice Series",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-08-09",
    structures: [
      {title: "Nutrition Trends", shortDescription: "Changing dietary patterns and health indicators."},
      {title: "Manufacturing AI", shortDescription: "Automation workflows in medium factories."},
      {title: "Public Transport Design", shortDescription: "How commuter behavior informs route optimization."}
    ]
  },
  {
    id: "practice-l-mock-2",
    name: "Practice Mock Test 2",
    module: "listening",
    book: "Practice Series",
    questions: 40,
    difficulty: "beginner",
    status: "draft",
    createdAt: "2023-07-02",
    structures: [
      {title: "City Information Desk", shortDescription: "Short dialogue with form completion."},
      {title: "Sports Complex Tour", shortDescription: "Informational talk with map labeling."},
      {title: "Study Group Discussion", shortDescription: "Conversation around project planning."},
      {title: "Renewable Energy Brief", shortDescription: "Lecture style section with note completion."}
    ]
  },
  {
    id: "cam-13-r-2",
    name: "Cambridge IELTS 13 - Test 2",
    module: "reading",
    book: "Book 13",
    questions: 40,
    difficulty: "beginner",
    status: "draft",
    createdAt: "2023-06-29",
    structures: [
      {title: "Island Transport", shortDescription: "Infrastructure challenges in coastal communities."},
      {title: "Learning Memory", shortDescription: "Spaced repetition impact on retention."},
      {title: "Wildlife Corridors", shortDescription: "Design principles for fragmented habitats."}
    ]
  },
  {
    id: "cam-12-l-4",
    name: "Cambridge IELTS 12 Listening Test 4",
    module: "listening",
    book: "Book 12",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-05-16",
    structures: [
      {title: "Customer Survey", shortDescription: "Conversation with form and note completion."},
      {title: "Town Development", shortDescription: "Monologue with map and table references."},
      {title: "Seminar Debrief", shortDescription: "Research discussion with matching tasks."},
      {title: "Technology Lecture", shortDescription: "Lecture on innovation trends."}
    ]
  },
  {
    id: "cam-11-r-1",
    name: "Cambridge IELTS 11 - Test 1",
    module: "reading",
    book: "Book 11",
    questions: 40,
    difficulty: "intermediate",
    status: "published",
    createdAt: "2023-04-11",
    structures: [
      {title: "Historic Navigation", shortDescription: "Shift from celestial to modern marine navigation."},
      {title: "Battery Innovation", shortDescription: "Breakthroughs in storage chemistry."},
      {title: "Workplace Reskilling", shortDescription: "Training models for rapidly changing industries."}
    ]
  }
];

export const TEST_ENTITIES: TestEntity[] = TEST_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  module: seed.module,
  book: seed.book,
  questions: seed.questions,
  difficulty: seed.difficulty,
  status: seed.status,
  createdAt: seed.createdAt,
  structures:
    seed.module === "reading" ? makeReadingStructures(seed.id, seed.structures) : makeListeningStructures(seed.id, seed.structures)
}));

export function getTestById(testId: string) {
  return TEST_ENTITIES.find((test) => test.id === testId);
}
