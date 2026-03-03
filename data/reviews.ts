export type Review = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  testType: "reading" | "listening";
  createdAt: string;
};

export const REVIEWS: Review[] = [
  {
    id: "r-001",
    name: "Dilshod Sobirov",
    city: "Namangan, Uzbekistan",
    rating: 5,
    text: "Listening practice matched the real exam pace. I stopped panicking in section three after one week of regular sessions.",
    testType: "listening",
    createdAt: "2023-10-12"
  },
  {
    id: "r-002",
    name: "Shahlo Mamatova",
    city: "Fergana, Uzbekistan",
    rating: 5,
    text: "The reading explanations are clear and practical. I finally understood why my true/false/not given answers were wrong.",
    testType: "reading",
    createdAt: "2023-10-09"
  },
  {
    id: "r-003",
    name: "Bekzod Axmedov",
    city: "Nukus, Uzbekistan",
    rating: 4,
    text: "Interface is clean and stable on mobile. I practiced during commute and still tracked progress without issues.",
    testType: "listening",
    createdAt: "2023-09-28"
  },
  {
    id: "r-004",
    name: "Aziza Tursunova",
    city: "Andijan, Uzbekistan",
    rating: 5,
    text: "Reading timing drills helped me move faster without losing accuracy. My overall confidence improved a lot.",
    testType: "reading",
    createdAt: "2023-09-20"
  },
  {
    id: "r-005",
    name: "Rustam Karimov",
    city: "Navoi, Uzbekistan",
    rating: 4,
    text: "Support team responded quickly when I had a technical issue. I returned to practice the same evening.",
    testType: "listening",
    createdAt: "2023-09-15"
  },
  {
    id: "r-006",
    name: "Zulaykho Pulatova",
    city: "Qarshi, Uzbekistan",
    rating: 5,
    text: "Reading passages are challenging but realistic. It prepared me well for unfamiliar topics in the real test.",
    testType: "reading",
    createdAt: "2023-09-08"
  },
  {
    id: "r-007",
    name: "Jasur Bekmurodov",
    city: "Bukhara, Uzbekistan",
    rating: 5,
    text: "Listening mock tests exposed my mistakes with map questions. After targeted practice, that section became easier.",
    testType: "listening",
    createdAt: "2023-08-26"
  },
  {
    id: "r-008",
    name: "Madina Rakhimova",
    city: "Samarkand, Uzbekistan",
    rating: 4,
    text: "I like the structure of reading tasks and instant review. It saves time compared to searching explanations online.",
    testType: "reading",
    createdAt: "2023-08-19"
  },
  {
    id: "r-009",
    name: "Temur Ismailov",
    city: "Tashkent, Uzbekistan",
    rating: 5,
    text: "Listening recordings are clear and close to exam audio quality. My note-taking became more efficient.",
    testType: "listening",
    createdAt: "2023-08-11"
  },
  {
    id: "r-010",
    name: "Kamola Usmanova",
    city: "Urgench, Uzbekistan",
    rating: 3,
    text: "Good platform overall. I would like a few more easy-level reading sets for beginners.",
    testType: "reading",
    createdAt: "2023-08-05"
  },
  {
    id: "r-011",
    name: "Nodir Egamberdiev",
    city: "Jizzakh, Uzbekistan",
    rating: 4,
    text: "Listening section timers helped me manage pressure. My score became much more consistent across attempts.",
    testType: "listening",
    createdAt: "2023-07-28"
  },
  {
    id: "r-012",
    name: "Malika Gafurova",
    city: "Kokand, Uzbekistan",
    rating: 5,
    text: "Reading analytics showed exactly where I lose points. I fixed matching headings after following recommendations.",
    testType: "reading",
    createdAt: "2023-07-21"
  },
  {
    id: "r-013",
    name: "Sardor Nematov",
    city: "Termez, Uzbekistan",
    rating: 4,
    text: "Listening practice is practical and the question flow feels real. It improved my concentration for long sections.",
    testType: "listening",
    createdAt: "2023-07-13"
  },
  {
    id: "r-014",
    name: "Lola Khasanova",
    city: "Navoiy, Uzbekistan",
    rating: 5,
    text: "Reading explanations are written in simple language. I could quickly review mistakes after each test.",
    testType: "reading",
    createdAt: "2023-07-02"
  },
  {
    id: "r-015",
    name: "Bekhruz Mirov",
    city: "Tashkent, Uzbekistan",
    rating: 3,
    text: "Useful listening content and smooth interface. I hope more accent variety will be added later.",
    testType: "listening",
    createdAt: "2023-06-26"
  },
  {
    id: "r-016",
    name: "Shakhnoza Aripova",
    city: "Samarkand, Uzbekistan",
    rating: 4,
    text: "Reading module helped me improve scanning skills. I now complete passages with better time control.",
    testType: "reading",
    createdAt: "2023-06-19"
  },
  {
    id: "r-017",
    name: "Otabek Yuldashev",
    city: "Andijan, Uzbekistan",
    rating: 5,
    text: "Listening drills with repeated practice boosted my confidence before exam day. The progress chart was motivating.",
    testType: "listening",
    createdAt: "2023-06-10"
  },
  {
    id: "r-018",
    name: "Gulnoza Ruzieva",
    city: "Bukhara, Uzbekistan",
    rating: 4,
    text: "Reading tasks are well organized by type. I focused on weak areas and saw clear score improvement.",
    testType: "reading",
    createdAt: "2023-05-30"
  },
  {
    id: "r-019",
    name: "Vladimir Petrov",
    city: "Nukus, Uzbekistan",
    rating: 3,
    text: "Listening content is useful and modern. More beginner guidance would make it even better.",
    testType: "listening",
    createdAt: "2023-05-22"
  },
  {
    id: "r-020",
    name: "Azamat Kadirov",
    city: "Fergana, Uzbekistan",
    rating: 5,
    text: "Reading practice here is the closest to what I saw in the exam center. Very reliable preparation tool.",
    testType: "reading",
    createdAt: "2023-05-15"
  }
];
