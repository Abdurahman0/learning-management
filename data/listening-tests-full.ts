export type ListeningSectionId = "s1" | "s2" | "s3" | "s4";

export type ListeningAudioMeta = {
  nowPlayingLabel: string;
  durationSec: number;
  currentTrackTitle: string;
};

export type NoteFormBlock = {
  type: "noteForm";
  title: string;
  description?: string;
  fields: Array<{
    questionNumber: number;
    label: string;
    placeholder?: string;
  }>;
};

export type TableCompletionBlock = {
  type: "tableCompletion";
  title: string;
  columns: string[];
  rows: Array<{
    questionNumber: number;
    values: string[];
  }>;
};

export type McqGroupBlock = {
  type: "mcqGroup";
  title?: string;
  questions: Array<{
    questionNumber: number;
    prompt: string;
    options: string[];
  }>;
};

export type MatchingBlock = {
  type: "matching";
  title: string;
  options: string[];
  items: Array<{
    questionNumber: number;
    prompt: string;
  }>;
};

export type DiagramLabelingBlock = {
  type: "diagramLabeling";
  title: string;
  description: string;
  options: string[];
  items: Array<{
    questionNumber: number;
    label: string;
  }>;
};

export type SummaryCompletionBlock = {
  type: "summaryCompletion";
  title: string;
  instruction: string;
  lines: Array<{
    before: string;
    questionNumber: number;
    after: string;
  }>;
};

export type ListeningBlock =
  | NoteFormBlock
  | TableCompletionBlock
  | McqGroupBlock
  | MatchingBlock
  | DiagramLabelingBlock
  | SummaryCompletionBlock;

export type ListeningSectionFull = {
  id: ListeningSectionId;
  title: string;
  instructions: string;
  questionRangeLabel: string;
  audioMeta: ListeningAudioMeta;
  blocks: ListeningBlock[];
};

export type ListeningFullTest = {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  sections: ListeningSectionFull[];
};

export const LISTENING_TESTS_FULL: ListeningFullTest[] = [
  {
    id: "cambridge-19-listening-2",
    title: "Cambridge IELTS 19 Listening Test 2",
    durationMinutes: 30,
    totalQuestions: 40,
    sections: [
      {
        id: "s1",
        title: "Part 1: Accommodation Enquiry",
        instructions: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        questionRangeLabel: "Questions 1-10",
        audioMeta: {
          nowPlayingLabel: "Part 1 of 4",
          durationSec: 420,
          currentTrackTitle: "Conversation at Riverside Student Residence"
        },
        blocks: [
          {
            type: "noteForm",
            title: "RIVERSIDE STUDENT RESIDENCE - BOOKING FORM",
            fields: [
              { questionNumber: 1, label: "Applicant name" },
              { questionNumber: 2, label: "Preferred move-in date" },
              { questionNumber: 3, label: "Length of stay" },
              { questionNumber: 4, label: "Room type requested" },
              { questionNumber: 5, label: "Monthly budget" },
              { questionNumber: 6, label: "Nearest bus stop" }
            ]
          },
          {
            type: "mcqGroup",
            title: "Choose the correct letter, A, B or C.",
            questions: [
              {
                questionNumber: 7,
                prompt: "What is included in the weekly rent?",
                options: ["A. Laundry and internet", "B. Electricity and internet", "C. Electricity and meals"]
              },
              {
                questionNumber: 8,
                prompt: "When can the applicant view the room?",
                options: ["A. Wednesday morning", "B. Thursday afternoon", "C. Friday evening"]
              },
              {
                questionNumber: 9,
                prompt: "Which document must be emailed before arrival?",
                options: ["A. Passport copy", "B. University letter", "C. Insurance card"]
              },
              {
                questionNumber: 10,
                prompt: "How should the deposit be paid?",
                options: ["A. In cash at reception", "B. By bank transfer", "C. Through a mobile app"]
              }
            ]
          }
        ]
      },
      {
        id: "s2",
        title: "Part 2: Community Center Tour",
        instructions: "Label the map below. Choose the correct letter, A-G, and write it next to Questions 11-16. Then complete the notes for Questions 17-20.",
        questionRangeLabel: "Questions 11-20",
        audioMeta: {
          nowPlayingLabel: "Part 2 of 4",
          durationSec: 450,
          currentTrackTitle: "Guide talk at Brookfield Community Center"
        },
        blocks: [
          {
            type: "diagramLabeling",
            title: "SITE PLAN - BROOKFIELD COMMUNITY CENTER",
            description: "Match each location number to a place on the map.",
            options: [
              "A. Reception Desk",
              "B. Art Studio",
              "C. Indoor Climbing Wall",
              "D. Cafe Terrace",
              "E. Equipment Store",
              "F. Lecture Hall",
              "G. Childcare Room"
            ],
            items: [
              { questionNumber: 11, label: "Point near the main entrance" },
              { questionNumber: 12, label: "Room beside the staircase" },
              { questionNumber: 13, label: "Area at the west corner" },
              { questionNumber: 14, label: "Facility above the sports hall" },
              { questionNumber: 15, label: "Space facing the garden" },
              { questionNumber: 16, label: "Unit close to lockers" }
            ]
          },
          {
            type: "summaryCompletion",
            title: "Tour Notes",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 17, before: "The evening yoga classes start at", after: "." },
              { questionNumber: 18, before: "Members must bring their own", after: " for art sessions." },
              { questionNumber: 19, before: "Weekend family workshops are held in the", after: " room." },
              { questionNumber: 20, before: "The center's monthly newsletter is sent by", after: "." }
            ]
          }
        ]
      },
      {
        id: "s3",
        title: "Part 3: Seminar Planning Discussion",
        instructions: "Questions 21-26: Match each student task with the correct person (A-C). Questions 27-30: Complete the table.",
        questionRangeLabel: "Questions 21-30",
        audioMeta: {
          nowPlayingLabel: "Part 3 of 4",
          durationSec: 510,
          currentTrackTitle: "Students preparing a sustainability seminar"
        },
        blocks: [
          {
            type: "matching",
            title: "Who is responsible for each task?",
            options: [
              "A. Lina",
              "B. Omar",
              "C. Priya"
            ],
            items: [
              { questionNumber: 21, prompt: "Contacting external speakers" },
              { questionNumber: 22, prompt: "Designing the event poster" },
              { questionNumber: 23, prompt: "Booking the lecture theatre" },
              { questionNumber: 24, prompt: "Preparing registration forms" },
              { questionNumber: 25, prompt: "Managing social media updates" },
              { questionNumber: 26, prompt: "Final proofreading of handouts" }
            ]
          },
          {
            type: "tableCompletion",
            title: "Seminar Schedule Plan",
            columns: ["Session", "Focus", "Answer"],
            rows: [
              { questionNumber: 27, values: ["Opening talk", "Campus transport", "..."] },
              { questionNumber: 28, values: ["Workshop", "Food waste", "..."] },
              { questionNumber: 29, values: ["Panel", "Renewable energy", "..."] },
              { questionNumber: 30, values: ["Closing activity", "Student pledge", "..."] }
            ]
          }
        ]
      },
      {
        id: "s4",
        title: "Part 4: Lecture on Coastal Research",
        instructions: "Complete the notes below. Write ONE WORD ONLY for each answer.",
        questionRangeLabel: "Questions 31-40",
        audioMeta: {
          nowPlayingLabel: "Part 4 of 4",
          durationSec: 520,
          currentTrackTitle: "University lecture: monitoring coastal ecosystems"
        },
        blocks: [
          {
            type: "summaryCompletion",
            title: "Field Lecture Notes - Coastal Monitoring",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 31, before: "Early surveys relied on", after: " drawn by local sailors." },
              { questionNumber: 32, before: "Modern drones can collect", after: " images every 30 minutes." },
              { questionNumber: 33, before: "One challenge is measuring sediment after heavy", after: "." },
              { questionNumber: 34, before: "Researchers compare present data with", after: " records from the 1990s." },
              { questionNumber: 35, before: "The team stores water samples in a portable", after: "." },
              { questionNumber: 36, before: "Local schools help by reporting unusual", after: " near beaches." },
              { questionNumber: 37, before: "Satellite data improved estimates of seasonal", after: "." },
              { questionNumber: 38, before: "One recommendation was to restore coastal", after: " as natural barriers." },
              { questionNumber: 39, before: "Funding for the project now comes from a regional", after: "." },
              { questionNumber: 40, before: "The next phase will test a new underwater", after: " system." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "cambridge-19-listening-1",
    title: "Cambridge IELTS 19 Listening Test 1",
    durationMinutes: 30,
    totalQuestions: 40,
    sections: [
      {
        id: "s1",
        title: "Part 1: Gym Membership Registration",
        instructions: "Complete the registration form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        questionRangeLabel: "Questions 1-10",
        audioMeta: {
          nowPlayingLabel: "Part 1 of 4",
          durationSec: 430,
          currentTrackTitle: "Phone call to CityFit Gym"
        },
        blocks: [
          {
            type: "noteForm",
            title: "CITYFIT GYM - NEW MEMBER FORM",
            fields: [
              { questionNumber: 1, label: "Member full name" },
              { questionNumber: 2, label: "Contact number" },
              { questionNumber: 3, label: "Membership start date" },
              { questionNumber: 4, label: "Preferred training time" },
              { questionNumber: 5, label: "Fitness goal" },
              { questionNumber: 6, label: "Emergency contact" }
            ]
          },
          {
            type: "mcqGroup",
            title: "Choose the correct letter, A, B or C.",
            questions: [
              {
                questionNumber: 7,
                prompt: "Which package does the caller choose?",
                options: ["A. Standard monthly", "B. Student annual", "C. Premium monthly"]
              },
              {
                questionNumber: 8,
                prompt: "When is the induction session available?",
                options: ["A. Monday 8 a.m.", "B. Tuesday 6 p.m.", "C. Saturday 10 a.m."]
              },
              {
                questionNumber: 9,
                prompt: "What should the caller bring on day one?",
                options: ["A. A bank statement", "B. A photo ID", "C. A medical note"]
              },
              {
                questionNumber: 10,
                prompt: "How will payment be confirmed?",
                options: ["A. Text message", "B. Email receipt", "C. Printed letter"]
              }
            ]
          }
        ]
      },
      {
        id: "s2",
        title: "Part 2: Museum Orientation",
        instructions: "Questions 11-16: Label the floor plan. Questions 17-20: Complete the notes.",
        questionRangeLabel: "Questions 11-20",
        audioMeta: {
          nowPlayingLabel: "Part 2 of 4",
          durationSec: 455,
          currentTrackTitle: "Welcome talk at Eastgate Museum"
        },
        blocks: [
          {
            type: "diagramLabeling",
            title: "FLOOR PLAN - EASTGATE MUSEUM",
            description: "Write the correct letter A-G for each location.",
            options: [
              "A. Ticket Office",
              "B. Ancient Coins Gallery",
              "C. Interactive Science Room",
              "D. Cafe",
              "E. Archive Reading Room",
              "F. Temporary Exhibition Hall",
              "G. Gift Shop"
            ],
            items: [
              { questionNumber: 11, label: "Area opposite the entrance" },
              { questionNumber: 12, label: "Space next to the central stairs" },
              { questionNumber: 13, label: "Room near the west corridor" },
              { questionNumber: 14, label: "Hall beside the courtyard" },
              { questionNumber: 15, label: "Unit behind the information desk" },
              { questionNumber: 16, label: "Area close to the exit" }
            ]
          },
          {
            type: "summaryCompletion",
            title: "Visitor Information",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 17, before: "Guided tours start every", after: " minutes." },
              { questionNumber: 18, before: "Large bags must be left in a", after: " before entry." },
              { questionNumber: 19, before: "Photography is not allowed in the", after: " gallery." },
              { questionNumber: 20, before: "Families can collect activity sheets from the", after: "." }
            ]
          }
        ]
      },
      {
        id: "s3",
        title: "Part 3: Project Team Meeting",
        instructions: "Questions 21-25: Choose the correct person (A-D). Questions 26-30: Choose the correct option in the table.",
        questionRangeLabel: "Questions 21-30",
        audioMeta: {
          nowPlayingLabel: "Part 3 of 4",
          durationSec: 505,
          currentTrackTitle: "University group discussing final-year project"
        },
        blocks: [
          {
            type: "matching",
            title: "Which member suggested each idea?",
            options: ["A. Ben", "B. Sara", "C. Yi", "D. Carlos"],
            items: [
              { questionNumber: 21, prompt: "Running a pilot test in two schools" },
              { questionNumber: 22, prompt: "Adding a short online survey" },
              { questionNumber: 23, prompt: "Using recycled materials only" },
              { questionNumber: 24, prompt: "Inviting local volunteers" },
              { questionNumber: 25, prompt: "Recording interviews for analysis" }
            ]
          },
          {
            type: "tableCompletion",
            title: "Project Decision Table",
            columns: ["Topic", "Current status", "Answer"],
            rows: [
              { questionNumber: 26, values: ["Budget planning", "Draft complete", "..."] },
              { questionNumber: 27, values: ["Participant consent", "In progress", "..."] },
              { questionNumber: 28, values: ["Data collection app", "Testing", "..."] },
              { questionNumber: 29, values: ["Presentation slides", "Not started", "..."] },
              { questionNumber: 30, values: ["Final report", "Outline ready", "..."] }
            ]
          }
        ]
      },
      {
        id: "s4",
        title: "Part 4: Lecture on Renewable Energy Storage",
        instructions: "Complete the notes. Write ONE WORD ONLY for each answer.",
        questionRangeLabel: "Questions 31-40",
        audioMeta: {
          nowPlayingLabel: "Part 4 of 4",
          durationSec: 530,
          currentTrackTitle: "Public lecture: battery and grid storage"
        },
        blocks: [
          {
            type: "summaryCompletion",
            title: "Lecture Notes - Energy Storage",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 31, before: "Early storage systems were based on pumped", after: "." },
              { questionNumber: 32, before: "A major challenge is balancing supply at peak", after: "." },
              { questionNumber: 33, before: "Lithium batteries improved because of better", after: " materials." },
              { questionNumber: 34, before: "Grid operators monitor real-time", after: " to prevent overload." },
              { questionNumber: 35, before: "One pilot project stored excess wind power at", after: " scale." },
              { questionNumber: 36, before: "Researchers tested battery performance in cold", after: "." },
              { questionNumber: 37, before: "New safety rules require thermal", after: " in all stations." },
              { questionNumber: 38, before: "Communities were consulted about visual", after: " concerns." },
              { questionNumber: 39, before: "Future systems may combine batteries with green", after: "." },
              { questionNumber: 40, before: "The lecturer predicts lower storage costs by", after: "." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "recent-real-exam-jan-2026",
    title: "Recent Real Exam - Jan 2026",
    durationMinutes: 30,
    totalQuestions: 40,
    sections: [
      {
        id: "s1",
        title: "Part 1: Airport Shuttle Booking",
        instructions: "Complete the booking note. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        questionRangeLabel: "Questions 1-10",
        audioMeta: {
          nowPlayingLabel: "Part 1 of 4",
          durationSec: 410,
          currentTrackTitle: "Customer call: airport shuttle reservation"
        },
        blocks: [
          {
            type: "noteForm",
            title: "AIRPORT SHUTTLE RESERVATION",
            fields: [
              { questionNumber: 1, label: "Passenger surname" },
              { questionNumber: 2, label: "Flight number" },
              { questionNumber: 3, label: "Arrival terminal" },
              { questionNumber: 4, label: "Hotel name" },
              { questionNumber: 5, label: "Number of suitcases" },
              { questionNumber: 6, label: "Contact method" }
            ]
          },
          {
            type: "mcqGroup",
            title: "Choose the correct letter, A, B or C.",
            questions: [
              {
                questionNumber: 7,
                prompt: "What time will the shuttle leave the airport?",
                options: ["A. 18:20", "B. 18:40", "C. 19:00"]
              },
              {
                questionNumber: 8,
                prompt: "Where should the passenger wait?",
                options: ["A. Gate 2", "B. Gate 4", "C. Gate 6"]
              },
              {
                questionNumber: 9,
                prompt: "How long is the estimated journey?",
                options: ["A. 25 minutes", "B. 40 minutes", "C. 55 minutes"]
              },
              {
                questionNumber: 10,
                prompt: "How can the booking be changed?",
                options: ["A. By phone", "B. Through the website", "C. By email"]
              }
            ]
          }
        ]
      },
      {
        id: "s2",
        title: "Part 2: City Festival Guide",
        instructions: "Questions 11-15: Label the site plan with letters A-G. Questions 16-20: Complete the notes.",
        questionRangeLabel: "Questions 11-20",
        audioMeta: {
          nowPlayingLabel: "Part 2 of 4",
          durationSec: 460,
          currentTrackTitle: "Festival orientation announcement"
        },
        blocks: [
          {
            type: "diagramLabeling",
            title: "FESTIVAL SITE PLAN",
            description: "Choose FIVE answers from the options box and write the correct letter A-G.",
            options: [
              "A. Main Stage",
              "B. Food Court",
              "C. Medical Tent",
              "D. Volunteer Desk",
              "E. Children's Area",
              "F. Local Crafts Market",
              "G. Information Point"
            ],
            items: [
              { questionNumber: 11, label: "Near the river entrance" },
              { questionNumber: 12, label: "Behind the central lawn" },
              { questionNumber: 13, label: "Next to the parking zone" },
              { questionNumber: 14, label: "Beside the ticket checkpoint" },
              { questionNumber: 15, label: "At the east corner" }
            ]
          },
          {
            type: "summaryCompletion",
            title: "Festival Visitor Notes",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 16, before: "The evening concert starts at", after: " p.m." },
              { questionNumber: 17, before: "Reusable cups can be collected with a", after: "." },
              { questionNumber: 18, before: "Lost property is managed by the", after: " team." },
              { questionNumber: 19, before: "Bicycles must be parked in the designated", after: "." },
              { questionNumber: 20, before: "The weather alert service sends", after: " messages." }
            ]
          }
        ]
      },
      {
        id: "s3",
        title: "Part 3: Tutor and Students Discussion",
        instructions: "Questions 21-26: Match topics with speakers A-C. Questions 27-30: Complete the planning table.",
        questionRangeLabel: "Questions 21-30",
        audioMeta: {
          nowPlayingLabel: "Part 3 of 4",
          durationSec: 500,
          currentTrackTitle: "Academic tutorial: fieldwork preparation"
        },
        blocks: [
          {
            type: "matching",
            title: "Which student mentions each point?",
            options: ["A. Maya", "B. Tom", "C. Rehan"],
            items: [
              { questionNumber: 21, prompt: "Concern about travel costs" },
              { questionNumber: 22, prompt: "Need for clearer interview questions" },
              { questionNumber: 23, prompt: "Suggestion to use a pilot study" },
              { questionNumber: 24, prompt: "Preference for weekend field visits" },
              { questionNumber: 25, prompt: "Plan to analyze data in pairs" },
              { questionNumber: 26, prompt: "Request for extra library sources" }
            ]
          },
          {
            type: "tableCompletion",
            title: "Fieldwork Preparation Table",
            columns: ["Task", "Deadline", "Answer"],
            rows: [
              { questionNumber: 27, values: ["Draft questionnaire", "Monday", "..."] },
              { questionNumber: 28, values: ["Ethics approval", "Wednesday", "..."] },
              { questionNumber: 29, values: ["Transport booking", "Friday", "..."] },
              { questionNumber: 30, values: ["Interview training", "Next week", "..."] }
            ]
          }
        ]
      },
      {
        id: "s4",
        title: "Part 4: Lecture on Urban Wildlife",
        instructions: "Complete the notes. Write ONE WORD ONLY for each answer.",
        questionRangeLabel: "Questions 31-40",
        audioMeta: {
          nowPlayingLabel: "Part 4 of 4",
          durationSec: 545,
          currentTrackTitle: "Lecture: adaptation of wildlife in modern cities"
        },
        blocks: [
          {
            type: "summaryCompletion",
            title: "Lecture Notes - Urban Wildlife Adaptation",
            instruction: "Write ONE WORD ONLY for each answer.",
            lines: [
              { questionNumber: 31, before: "Some species adapt by changing their feeding", after: "." },
              { questionNumber: 32, before: "Artificial lighting affects animal", after: " patterns." },
              { questionNumber: 33, before: "Researchers measured bird noise at different", after: " of day." },
              { questionNumber: 34, before: "Green roofs can provide temporary", after: " for insects." },
              { questionNumber: 35, before: "Citizen reports were collected through a mobile", after: "." },
              { questionNumber: 36, before: "Fox populations expanded near areas with more", after: " bins." },
              { questionNumber: 37, before: "Road design changes reduced nighttime", after: " rates." },
              { questionNumber: 38, before: "The speaker stressed long-term habitat", after: " rather than short projects." },
              { questionNumber: 39, before: "A university lab is testing low-cost acoustic", after: "." },
              { questionNumber: 40, before: "Future plans include a regional data", after: " with local councils." }
            ]
          }
        ]
      }
    ]
  }
];

export function getListeningTestById(id: string) {
  return LISTENING_TESTS_FULL.find((test) => test.id === id);
}

