export type ReadingPassage = {
  id: "p1" | "p2" | "p3";
  label: string;
  title: string;
  text: string[];
};

export type ReadingQuestionType =
  | "tfng"
  | "matching_headings"
  | "multiple_choice"
  | "sentence_completion"
  | "placeholder";

export type ReadingQuestion = {
  id: string;
  number: number;
  passageId: ReadingPassage["id"];
  type: ReadingQuestionType;
  prompt: string;
  groupTitle: string;
  groupInstruction?: string;
  options?: string[];
  sectionLabel?: string;
  placeholder?: string;
};

export const READING_TEST_DEMO = {
  timer: "54:23",
  passages: [
    {
      id: "p1",
      label: "READING PASSAGE 1",
      title: "The History of Glass",
      text: [
  "Glass is everywhere in modern life: it forms the skin of office towers, protects food and medicines, and carries information through fiber-optic cables. Because it seems so ordinary, it is easy to assume that glass is a modern invention. In fact, the story of glass stretches back thousands of years and reflects a long chain of experimentation with heat, minerals, and manufacturing control. The material itself is deceptively simple—largely silica—yet producing reliable glass has historically demanded precise temperatures, careful chemistry, and skilled shaping techniques.",

  "For much of its history, glass was not a basic household substance but a scarce and prestigious material. Early societies valued it for the same reason people still admire it today: it can be translucent or brilliantly colored; it can be made smooth, reflective, or intricately patterned; and it keeps its form for centuries. However, those desirable qualities were not automatic. Raw silica melts at extremely high temperatures, so glassmakers had to discover additives that reduced the melting point and stabilized the molten mixture. Even small changes in the recipe could alter clarity, strength, and color, and early producers often relied on practical experience rather than written formulae.",

  "A. Archaeological evidence suggests that some of the earliest man-made glass appeared in Mesopotamia and Ancient Egypt around 3500 BC, typically as beads or small decorative fragments. At this stage, glass was not made in large vessels because controlling the melt was difficult and the result was often opaque. Many early objects were produced by winding molten glass around a core and then removing the core after cooling, a slow method that limited scale. As a result, glass objects circulated among elites and were traded as valuable ornaments rather than everyday tools.",

  "During the Late Bronze Age, knowledge of glassmaking expanded across parts of the eastern Mediterranean. Glassmakers learned to produce stronger colors by adding minerals and to form small containers for perfumes and oils. Yet the craft remained expensive and controlled. Furnaces needed sustained heat, and mistakes could ruin entire batches. In many cases, glass production was associated with specialized workshops and, in some regions, closely linked to royal or temple economies. Glass therefore functioned as both a technical achievement and a symbol of status.",

  "B. The Roman period marked a turning point, not because glass suddenly became cheap, but because new techniques made it easier to produce in larger quantities. One of the most influential developments was glassblowing, which allowed molten glass to be inflated and shaped quickly. Compared with earlier core-formed methods, blown glass reduced production time and enabled a wider range of forms. This increased availability, especially for containers, and helped glass spread beyond elite circles into broader markets.",

  "Romans also contributed to the architectural use of glass. Experiments with clearer glass and improved forming methods made it possible to create window pieces, though early panes were not the thin transparent sheets familiar today. Nevertheless, even imperfect glass could transmit light while providing protection from wind and rain. In some villas and public buildings, windows became a display of comfort and sophistication. Over time, architectural glass encouraged new ways of shaping interior spaces and managing light, foreshadowing much later developments in building design.",

  "C. In the Middle Ages, the center of high-end glassmaking shifted toward Europe, with Venice becoming a leading producer. Venetian authorities famously relocated glass furnaces to the island of Murano, partly to reduce fire risk and partly to strengthen regulation of a valuable industry. Murano’s reputation grew because of both technical innovation and strict control over skilled labor. Glassmaking families developed techniques over generations, and the island became an industrial cluster long before the term existed.",

  "Murano glassmakers produced cristallo, a highly valued, nearly colorless glass admired for its clarity. Achieving this demanded careful control of raw materials and impurities. Venetian authorities guarded knowledge closely: skilled artisans were discouraged from leaving, and trade secrets were protected. This secrecy was economically rational. If competitors acquired the same methods, Venice’s advantage would weaken. Yet despite such controls, Murano products circulated widely across Europe through trade, and Venetian glass became associated with refined taste and high craftsmanship.",

  "D. The most dramatic shift occurred during the Industrial Revolution. New furnace designs improved heat control, enabling longer and more consistent melting cycles. Mechanization gradually changed glass from a workshop craft into a factory product. Standardized molds allowed manufacturers to produce containers and panes in uniform sizes. As output increased, costs fell, and glass became available to ordinary households rather than only to the wealthy.",

  "Industrialization also improved consistency. Factories developed ways to reduce defects and to produce more predictable thickness and strength. This mattered because glass was becoming integrated into wider systems: mass housing required reliable windows; food and medicine industries required standardized bottles and jars; and scientific research demanded reproducible glassware. By the late nineteenth century, glass was no longer primarily a luxury item but a key industrial material.",

  "Today, glass continues to evolve through materials science. Strengthened and laminated forms improve safety; chemical treatments enhance durability; and glass is used in high-technology applications from optical instruments to communication networks. Yet the long history of glass illustrates a consistent theme: progress depended not only on discovering how to melt silica, but on developing the skills, controls, and production systems that turned a fragile craft into a dependable material for everyday life."
]
    },

    {
      id: "p2",
      label: "READING PASSAGE 2",
      title: "Urban Farming in Modern Cities",
      text: [
  "Urban farming has moved from a fringe activity to a topic of serious policy debate in many cities. The term refers to producing food within urban areas, ranging from small community gardens to large commercial facilities that operate inside warehouses. Supporters often present urban agriculture as a response to rising food prices, climate concerns, and the vulnerability of long supply chains. Critics, however, argue that city-based growing cannot match the scale or efficiency of conventional rural farming. In practice, the value of urban farming depends on what problem it is meant to solve and how it is integrated into local systems.",

  "One reason urban farming attracts attention is that cities concentrate consumers far from farmland. Most food must be transported, stored, and distributed through complex networks. When those networks are disrupted—by fuel price spikes, extreme weather, or geopolitical instability—urban areas can experience shortages or sudden increases in cost. Local production does not eliminate these risks, but it can reduce dependence on a single supply route and provide a buffer for certain categories of fresh produce.",

  "The most visible form of urban farming is the rooftop garden. Many buildings have flat rooftops that receive sunlight and are otherwise unused. These spaces can support raised beds, container gardens, or lightweight engineered soil. Rooftop farms may supply nearby households, restaurants, or local markets. In addition to food production, rooftop gardens can reduce heat absorption by buildings, improving insulation and lowering energy consumption in warm seasons. Some projects also use rooftops for education, allowing schools to teach nutrition and environmental science through practical experience.",

  "A second model is community gardening on vacant land. In cities with abandoned lots, residents sometimes convert neglected spaces into productive plots. This approach can strengthen social ties, improve neighborhood appearance, and increase access to fresh produce. However, community gardens require long-term maintenance and stable leadership. If key organizers move away or funding ends, the garden may decline quickly. In some cities, uncertainty about land ownership also discourages investment in soil improvement or infrastructure, because the site can be redeveloped at short notice.",

  "More technologically advanced urban farming takes place indoors. Vertical farms grow plants in stacked layers within buildings using hydroponics or aeroponics. Instead of soil, roots receive nutrients through water or mist. Because the environment is controlled, crops can be produced year-round. Indoor systems can also avoid some outdoor problems such as pests, unpredictable weather, or seasonal limitations. For leafy greens and herbs, which grow quickly and sell at high value relative to weight, indoor production can be commercially attractive.",

  "Yet indoor farming introduces new constraints. Artificial lighting and climate control consume energy, and equipment is expensive. If electricity costs are high or power supply is unstable, indoor production becomes difficult. As a result, critics argue that vertical farms are more like high-tech factories than agricultural solutions and may simply shift environmental costs from land use to energy demand. Supporters respond that LED efficiency has improved rapidly and that renewable power can reduce the impact. They also point out that indoor farms can produce food near consumers, reducing transport emissions and spoilage, especially for fragile produce.",

  "Urban farming is often linked to public health programs as well. Some municipal strategies target neighborhoods with limited access to fresh food, sometimes described as food deserts. In these areas, residents may rely heavily on processed foods because supermarkets are distant and transportation is limited. Urban gardens and micro-farms can increase availability of fresh vegetables while also offering education, workshops, and cooking practice. Health teams report that diet changes are more likely when programs combine produce distribution with practical guidance on preparation and nutrition, rather than simply providing vegetables without support.",

  "Economic impacts vary by model. Community gardens may operate with volunteer labor and small budgets, while commercial farms require investment, skilled staff, and stable sales channels. Some projects succeed because they integrate with restaurants, subscription delivery, or institutional buyers such as schools and hospitals. Others struggle because they cannot compete on price with large-scale rural agriculture. For many cities, the most realistic role for urban farming is not to replace conventional farming but to diversify local supply and add resilience, especially for certain types of fresh produce.",

  "Technology continues to shape the debate. Sensors can measure nutrient balance and moisture levels, helping farmers reduce waste. Automated systems can adjust temperature and humidity. Modern LED lighting can be tuned to specific wavelengths that support growth more efficiently than earlier systems. Over time, these improvements may lower costs and broaden the range of crops that can be produced indoors. However, even optimistic researchers tend to treat urban farming as a complement rather than a substitute. Its success depends on careful planning, realistic expectations, and long-term policy support."
]
    },

    {
      id: "p3",
      label: "READING PASSAGE 3",
      title: "Why Sleep Shapes Memory",
     text: [
  "For many people, sleep feels like lost time: hours when the mind is switched off and nothing is achieved. Yet modern research suggests the opposite. Sleep is an active biological state during which the brain carries out essential work, including the stabilization of memory. Experiences and information acquired during the day do not automatically become permanent. Instead, the brain appears to reorganize and strengthen learning while a person sleeps, improving the chances that knowledge will be retained and later retrieved.",

  "Sleep consists of several stages that differ in brain activity and physiological patterns. One key stage is slow-wave sleep, often called deep sleep. During this stage, electrical activity in the brain becomes slower and more synchronized. Researchers have associated slow-wave sleep with the consolidation of factual learning, such as vocabulary, historical information, and structured knowledge. A separate stage, Rapid Eye Movement (REM) sleep, is characterized by more active brain patterns and is frequently linked to vivid dreaming. REM sleep has been connected to emotional processing and to the integration of new memories into existing networks of understanding.",

  "One explanation for why sleep strengthens memory is that the brain replays patterns from waking experience. Studies using brain imaging and neural recording suggest that, during deep sleep, the brain can reproduce activity patterns that occurred during learning. This replay may act like a rehearsal, reinforcing connections and making them more efficient. Rather than storing every detail, the brain may prioritize what is useful, strengthening meaningful patterns and reducing the noise of irrelevant information.",

  "Laboratory experiments provide evidence for sleep’s role. When participants learn new material and then sleep, they typically perform better on later tests than participants who remain awake for the same period. This effect is not limited to memorizing facts. Sleep has been linked to improvement in motor tasks, pattern recognition, and some forms of problem solving. In many studies, the key factor is not simply rest, but the specific neurological activity that occurs during different sleep stages.",

  "Researchers also study how sleep interacts with learning strategies. One consistent finding is that spacing study sessions over time—often called distributed practice—tends to outperform cramming. Sleep between study sessions may help consolidate what was learned, allowing new information to be added without overwhelming the system. In contrast, intensive study combined with reduced sleep may produce short-term familiarity but weaker long-term retention. Students sometimes interpret tiredness as evidence of hard work, yet the evidence suggests that insufficient sleep can undermine the very goal of study.",

  "The costs of sleep restriction extend beyond memory. Chronic lack of sleep has been associated with reduced attention, slower reaction times, and weaker judgement. People may believe they have adapted to short sleep, but objective performance tests often show decline even when individuals feel normal. Reduced sleep can also affect emotional regulation, making stress harder to manage. For exam candidates, this combination—poorer concentration plus weaker memory—can have a direct impact on results.",

  "Scientists disagree on some details, such as exactly how the brain decides which memories to strengthen. However, there is broad agreement that sleep supports learning. Some theories suggest that sleep helps reorganize memories, transferring them from temporary storage systems into more stable networks. Others propose that sleep restores neural resources used during the day, improving the brain’s capacity to encode new information the next day. These explanations are not mutually exclusive, and multiple mechanisms may operate together.",

  "Although individual needs vary, many guidelines recommend roughly seven to nine hours of sleep for most adults to maintain strong cognitive function. For learners, sleep is not merely recovery; it is part of the learning process itself. Protecting sleep therefore should not be treated as a luxury. It may be one of the most effective, yet underestimated, tools for improving performance and retention."
]
    }
  ] as ReadingPassage[],

  questions: [
    // Passage 1 — TFNG 1-5
    {
      id: "q-1",
      number: 1,
      passageId: "p1",
      type: "tfng",
      groupTitle: "Questions 1-5",
      groupInstruction:
        "Do the following statements agree with the information given in Reading Passage 1?",
      prompt: "The first man-made glass was used to make windows."
    },
    { id: "q-2", number: 2, passageId: "p1", type: "tfng", groupTitle: "Questions 1-5", prompt: "Glass-making was widely accessible to everyone in the Late Bronze Age." },
    { id: "q-3", number: 3, passageId: "p1", type: "tfng", groupTitle: "Questions 1-5", prompt: "Roman advances in clearer glass supported architectural uses of glass." },
    { id: "q-4", number: 4, passageId: "p1", type: "tfng", groupTitle: "Questions 1-5", prompt: "Murano glass techniques were openly shared across Europe." },
    { id: "q-5", number: 5, passageId: "p1", type: "tfng", groupTitle: "Questions 1-5", prompt: "Industrialization made glass products cheaper and more consistent." },

    // Passage 1 — Matching headings 6-9
    {
      id: "q-6",
      number: 6,
      passageId: "p1",
      type: "matching_headings",
      groupTitle: "Questions 6-9",
      groupInstruction:
        "Reading Passage 1 has four sections, A-D. Choose the correct heading for each section from the list below.",
      prompt: "Section A",
      sectionLabel: "A",
      options: [
        "i. The importance of Murano",
        "ii. Modern applications of glass",
        "iii. Early luxury and elite craftsmanship",
        "iv. Industrial mass production techniques",
        "v. Architecture and the Roman contribution"
      ]
    },
    { id: "q-7", number: 7, passageId: "p1", type: "matching_headings", groupTitle: "Questions 6-9", prompt: "Section B", sectionLabel: "B", options: ["i. The importance of Murano","ii. Modern applications of glass","iii. Early luxury and elite craftsmanship","iv. Industrial mass production techniques","v. Architecture and the Roman contribution"] },
    { id: "q-8", number: 8, passageId: "p1", type: "matching_headings", groupTitle: "Questions 6-9", prompt: "Section C", sectionLabel: "C", options: ["i. The importance of Murano","ii. Modern applications of glass","iii. Early luxury and elite craftsmanship","iv. Industrial mass production techniques","v. Architecture and the Roman contribution"] },
    { id: "q-9", number: 9, passageId: "p1", type: "matching_headings", groupTitle: "Questions 6-9", prompt: "Section D", sectionLabel: "D", options: ["i. The importance of Murano","ii. Modern applications of glass","iii. Early luxury and elite craftsmanship","iv. Industrial mass production techniques","v. Architecture and the Roman contribution"] },

    // Passage 1 — MCQ + sentence completion 10-13
    {
      id: "q-10",
      number: 10,
      passageId: "p1",
      type: "multiple_choice",
      groupTitle: "Questions 10-13",
      groupInstruction: "Choose the correct letter, A, B, C or D.",
      prompt: "What best describes glass in the Late Bronze Age?",
      options: [
        "A. It was cheap and widely mass-produced",
        "B. It was a specialist luxury product",
        "C. It was mainly used for optical instruments",
        "D. It replaced ceramics in homes"
      ]
    },
    {
      id: "q-11",
      number: 11,
      passageId: "p1",
      type: "multiple_choice",
      groupTitle: "Questions 10-13",
      prompt: "What did Roman innovations most directly support?",
      options: [
        "A. Broader architectural use of glass",
        "B. The invention of plastic substitutes",
        "C. The end of artisan workshops",
        "D. Murano’s control of European markets"
      ]
    },
    {
      id: "q-12",
      number: 12,
      passageId: "p1",
      type: "sentence_completion",
      groupTitle: "Questions 10-13",
      prompt: "The island associated with Venice’s glass industry was __________.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-13",
      number: 13,
      passageId: "p1",
      type: "sentence_completion",
      groupTitle: "Questions 10-13",
      prompt: "Mechanization increased production and improved __________ in glass output.",
      placeholder: "ONE WORD ONLY"
    },

    // Passage 2 — Mixed set 14-26
    {
      id: "q-14",
      number: 14,
      passageId: "p2",
      type: "tfng",
      groupTitle: "Questions 14-18",
      groupInstruction:
        "Do the following statements agree with the information given in Reading Passage 2?",
      prompt: "Urban farming aims to completely replace conventional rural agriculture."
    },
    {
      id: "q-15",
      number: 15,
      passageId: "p2",
      type: "multiple_choice",
      groupTitle: "Questions 14-18",
      prompt: "Which setting is mentioned as part of urban farming programs?",
      options: [
        "A. Airport terminals",
        "B. Secondary forests",
        "C. School learning spaces",
        "D. Offshore platforms"
      ]
    },
    {
      id: "q-16",
      number: 16,
      passageId: "p2",
      type: "sentence_completion",
      groupTitle: "Questions 14-18",
      prompt: "Supporters view urban farming as strengthening local food __________.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-17",
      number: 17,
      passageId: "p2",
      type: "multiple_choice",
      groupTitle: "Questions 14-18",
      prompt: "What has improved indoor urban farming productivity?",
      options: [
        "A. International trade subsidies",
        "B. Sensors, climate control and efficient LEDs",
        "C. Larger rural land ownership",
        "D. Higher fuel consumption"
      ]
    },
    {
      id: "q-18",
      number: 18,
      passageId: "p2",
      type: "sentence_completion",
      groupTitle: "Questions 14-18",
      prompt: "Rooftops are often used because they are __________ spaces in cities.",
      placeholder: "ONE WORD ONLY"
    },

    {
      id: "q-19",
      number: 19,
      passageId: "p2",
      type: "tfng",
      groupTitle: "Questions 19-22",
      groupInstruction:
        "Do the following statements agree with the information given in Reading Passage 2?",
      prompt: "Vertical farms typically grow plants using soil in outdoor fields."
    },
    {
      id: "q-20",
      number: 20,
      passageId: "p2",
      type: "tfng",
      groupTitle: "Questions 19-22",
      prompt: "Indoor urban farming can produce crops throughout the year."
    },
    {
      id: "q-21",
      number: 21,
      passageId: "p2",
      type: "tfng",
      groupTitle: "Questions 19-22",
      prompt: "Critics claim that energy use can be a limitation of indoor farming."
    },
    {
      id: "q-22",
      number: 22,
      passageId: "p2",
      type: "tfng",
      groupTitle: "Questions 19-22",
      prompt: "Supporters argue urban farming can reduce reliance on long-distance supply chains."
    },
    {
      id: "q-23",
      number: 23,
      passageId: "p2",
      type: "multiple_choice",
      groupTitle: "Questions 23-26",
      groupInstruction: "Choose the correct letter, A, B, C or D.",
      prompt: "What is presented as a main goal of urban farming?",
      options: [
        "A. Replacing all rural agriculture",
        "B. Diversifying and strengthening local food systems",
        "C. Increasing exports of staple crops",
        "D. Eliminating the need for education programs"
      ]
    },
    {
      id: "q-24",
      number: 24,
      passageId: "p2",
      type: "multiple_choice",
      groupTitle: "Questions 23-26",
      prompt: "Why do some projects focus on herbs and leafy greens?",
      options: [
        "A. They require deep soil and heavy structures",
        "B. They mature quickly and suit limited urban space",
        "C. They can only grow in rural climates",
        "D. They require no water or nutrients"
      ]
    },
    {
      id: "q-25",
      number: 25,
      passageId: "p2",
      type: "sentence_completion",
      groupTitle: "Questions 23-26",
      prompt: "Hydroponic systems deliver nutrients through __________ rather than soil.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-26",
      number: 26,
      passageId: "p2",
      type: "sentence_completion",
      groupTitle: "Questions 23-26",
      prompt: "Some urban agriculture strategies address areas known as food __________.",
      placeholder: "ONE WORD ONLY"
    },

    // Passage 3 — Mixed set 27-40
    {
      id: "q-27",
      number: 27,
      passageId: "p3",
      type: "tfng",
      groupTitle: "Questions 27-31",
      groupInstruction:
        "Do the following statements agree with the information given in Reading Passage 3?",
      prompt: "Sleep is described as an active process rather than a passive state."
    },
    { id: "q-28", number: 28, passageId: "p3", type: "tfng", groupTitle: "Questions 27-31", prompt: "Slow-wave sleep is associated with factual memory consolidation." },
    { id: "q-29", number: 29, passageId: "p3", type: "tfng", groupTitle: "Questions 27-31", prompt: "REM sleep is linked to creativity and emotional processing." },
    { id: "q-30", number: 30, passageId: "p3", type: "tfng", groupTitle: "Questions 27-31", prompt: "Cramming without sleep is presented as more effective than spaced learning." },
    { id: "q-31", number: 31, passageId: "p3", type: "tfng", groupTitle: "Questions 27-31", prompt: "People always accurately judge how sleep loss affects their performance." },

    {
      id: "q-32",
      number: 32,
      passageId: "p3",
      type: "multiple_choice",
      groupTitle: "Questions 32-35",
      groupInstruction: "Choose the correct letter, A, B, C or D.",
      prompt: "What does the passage suggest sleep does for new learning?",
      options: [
        "A. Creates knowledge that was not studied",
        "B. Stabilizes and strengthens memories formed while awake",
        "C. Eliminates the need for revision",
        "D. Prevents emotional processing"
      ]
    },
    {
      id: "q-33",
      number: 33,
      passageId: "p3",
      type: "multiple_choice",
      groupTitle: "Questions 32-35",
      prompt: "Which sleep stage is most often linked with dreams and integration of information?",
      options: [
        "A. Slow-wave sleep",
        "B. REM sleep",
        "C. Light wakefulness",
        "D. Napping only"
      ]
    },
    {
      id: "q-34",
      number: 34,
      passageId: "p3",
      type: "multiple_choice",
      groupTitle: "Questions 32-35",
      prompt: "What is distributed practice?",
      options: [
        "A. Studying continuously without breaks",
        "B. Spacing study sessions with sleep between them",
        "C. Avoiding revision after first learning",
        "D. Memorizing only at night"
      ]
    },
    {
      id: "q-35",
      number: 35,
      passageId: "p3",
      type: "multiple_choice",
      groupTitle: "Questions 32-35",
      prompt: "According to the passage, chronic sleep restriction can reduce:",
      options: [
        "A. Attention and judgement",
        "B. The need for memory consolidation",
        "C. The role of REM sleep",
        "D. Brain activity during sleep"
      ]
    },

    {
      id: "q-36",
      number: 36,
      passageId: "p3",
      type: "sentence_completion",
      groupTitle: "Questions 36-40",
      groupInstruction: "Complete the sentences below. Choose ONE WORD ONLY from the passage.",
      prompt: "Sleep helps transform recent experiences into longer-term __________.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-37",
      number: 37,
      passageId: "p3",
      type: "sentence_completion",
      groupTitle: "Questions 36-40",
      prompt: "Slow-wave sleep is sometimes called __________ sleep.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-38",
      number: 38,
      passageId: "p3",
      type: "sentence_completion",
      groupTitle: "Questions 36-40",
      prompt: "REM sleep is often linked to emotional __________.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-39",
      number: 39,
      passageId: "p3",
      type: "sentence_completion",
      groupTitle: "Questions 36-40",
      prompt: "Spacing learning sessions can improve long-term __________.",
      placeholder: "ONE WORD ONLY"
    },
    {
      id: "q-40",
      number: 40,
      passageId: "p3",
      type: "sentence_completion",
      groupTitle: "Questions 36-40",
      prompt: "Most adults generally need between seven and nine hours of sleep for optimal __________ function.",
      placeholder: "ONE WORD ONLY"
    }
  ] as ReadingQuestion[]
};