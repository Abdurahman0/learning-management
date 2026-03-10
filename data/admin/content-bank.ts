import {TEST_ENTITIES, getTestById} from "./tests";
import type {
  ContentModule,
  PassageAssetEntity,
  PassageDifficulty,
  PassageSource,
  QuestionType,
  QuestionVariantSetEntity,
  VariantGroupTemplate
} from "@/types/admin";

export const MAX_VARIANT_QUESTION_TYPES = 6;

type PassageSeed = {
  id: string;
  title: string;
  module: ContentModule;
  difficulty: PassageDifficulty;
  topic: string;
  source: PassageSource;
  createdAt: string;
  wordCount?: number;
  durationMinutes?: number;
  estimatedTimeLabel?: string;
  previewText?: string;
  fullText?: string[];
  structureRefs: Array<{testId: string; structureId: string}>;
};

type VariantSeed = {
  id: string;
  passageId: string;
  name: string;
  status: QuestionVariantSetEntity["status"];
  groups: Array<{type: QuestionType; count: number}>;
  usedInTestIds: string[];
  createdAt: string;
};

type CreateQuestionVariantSetEntityInput = {
  passageId: string;
  name: string;
  status: QuestionVariantSetEntity["status"];
  groups: VariantGroupTemplate[];
  usedInTestIds?: string[];
  createdAt?: string;
};

type UpdateQuestionVariantSetEntityInput = {
  id: string;
  passageId: string;
  name: string;
  status: QuestionVariantSetEntity["status"];
  groups: VariantGroupTemplate[];
  usedInTestIds?: string[];
};

type CreatePassageAssetEntityInput = {
  title: string;
  module: ContentModule;
  difficulty: PassageDifficulty;
  topic: string;
  source: PassageSource;
  previewText: string;
  fullText?: string[];
  wordCount?: number;
  durationMinutes?: number;
  estimatedTimeLabel?: string;
  createdAt?: string;
  linkedStructureIds?: string[];
  linkedTestIds?: string[];
};

const PASSAGE_SEEDS: PassageSeed[] = [
  {
    id: "passage-urban-gardens-health",
    title: "Urban Gardens and Public Health",
    module: "reading",
    difficulty: "medium",
    topic: "Environment",
    source: "cambridge",
    createdAt: "2026-01-08",
    wordCount: 842,
    estimatedTimeLabel: "12 - 15 min",
    previewText:
      "Recent studies suggest that the integration of greenery into urban environments does more than improve aesthetics. Researchers now link city gardening projects to reduced stress markers, stronger neighborhood cooperation, and better dietary patterns.",
    fullText: [
      "Recent studies suggest that the integration of greenery into urban environments does more than improve aesthetics. Researchers now link city gardening projects to reduced stress markers, stronger neighborhood cooperation, and better dietary patterns.",
      "When local councils support rooftop beds and shared allotments, residents gain direct access to affordable produce. This has measurable effects on household nutrition, particularly in districts where fresh food access has historically been limited.",
      "Longitudinal data also indicates that these programs improve participation in local volunteer networks, creating secondary benefits for public safety and social cohesion."
    ],
    structureRefs: [
      {testId: "cam-18-r-1", structureId: "cam-18-r-1-p1"},
      {testId: "cam-16-r-4", structureId: "cam-16-r-4-p3"}
    ]
  },
  {
    id: "passage-behavioral-economics",
    title: "Behavioral Economics",
    module: "reading",
    difficulty: "hard",
    topic: "Economics",
    source: "cambridge",
    createdAt: "2026-01-16",
    wordCount: 910,
    estimatedTimeLabel: "14 - 16 min",
    structureRefs: [
      {testId: "cam-18-r-1", structureId: "cam-18-r-1-p3"},
      {testId: "cam-19-r-3", structureId: "cam-19-r-3-p3"}
    ]
  },
  {
    id: "passage-future-manufacturing",
    title: "Future of Manufacturing Systems",
    module: "reading",
    difficulty: "medium",
    topic: "Technology",
    source: "practice",
    createdAt: "2025-12-09",
    wordCount: 768,
    estimatedTimeLabel: "10 - 12 min",
    structureRefs: [
      {testId: "practice-r-mock-1", structureId: "practice-r-mock-1-p2"},
      {testId: "cam-19-r-3", structureId: "cam-19-r-3-p2"}
    ]
  },
  {
    id: "passage-volcanic-soil",
    title: "Volcanic Soil and Agriculture",
    module: "reading",
    difficulty: "easy",
    topic: "Science",
    source: "cambridge",
    createdAt: "2025-11-28",
    wordCount: 694,
    estimatedTimeLabel: "9 - 11 min",
    structureRefs: [
      {testId: "cam-19-r-3", structureId: "cam-19-r-3-p1"},
      {testId: "cam-13-r-2", structureId: "cam-13-r-2-p3"}
    ]
  },
  {
    id: "passage-campus-services",
    title: "Campus Services Desk Transcript",
    module: "listening",
    difficulty: "easy",
    topic: "Education",
    source: "practice",
    createdAt: "2026-01-05",
    durationMinutes: 6,
    estimatedTimeLabel: "6 - 7 min",
    structureRefs: [
      {testId: "guide-l-4", structureId: "guide-l-4-s1"},
      {testId: "cam-18-l-1", structureId: "cam-18-l-1-s1"}
    ]
  },
  {
    id: "passage-urban-planning-talk",
    title: "Urban Planning Talk",
    module: "listening",
    difficulty: "hard",
    topic: "Environment",
    source: "cambridge",
    createdAt: "2026-02-02",
    durationMinutes: 8,
    estimatedTimeLabel: "8 - 9 min",
    structureRefs: [
      {testId: "guide-l-4", structureId: "guide-l-4-s4"},
      {testId: "cam-14-l-1", structureId: "cam-14-l-1-s4"}
    ]
  },
  {
    id: "passage-seminar-planning",
    title: "Seminar Planning Discussion",
    module: "listening",
    difficulty: "medium",
    topic: "Economics",
    source: "cambridge",
    createdAt: "2025-11-02",
    durationMinutes: 7,
    estimatedTimeLabel: "7 - 8 min",
    structureRefs: [
      {testId: "cam-14-l-1", structureId: "cam-14-l-1-s3"},
      {testId: "cam-16-l-3", structureId: "cam-16-l-3-s3"}
    ]
  },
  {
    id: "passage-technology-lecture",
    title: "Technology Lecture",
    module: "listening",
    difficulty: "medium",
    topic: "Technology",
    source: "cambridge",
    createdAt: "2025-10-19",
    durationMinutes: 7,
    estimatedTimeLabel: "7 - 9 min",
    structureRefs: [
      {testId: "cam-12-l-4", structureId: "cam-12-l-4-s4"},
      {testId: "practice-l-mock-2", structureId: "practice-l-mock-2-s4"}
    ]
  }
];

const VARIANT_SEEDS: VariantSeed[] = [
  {
    id: "var-urban-a",
    passageId: "passage-urban-gardens-health",
    name: "Variant Set A",
    status: "used",
    groups: [
      {type: "tfng", count: 5},
      {type: "matching_headings", count: 4},
      {type: "summary_completion", count: 4}
    ],
    usedInTestIds: ["cam-18-r-1"],
    createdAt: "2026-01-18"
  },
  {
    id: "var-urban-b",
    passageId: "passage-urban-gardens-health",
    name: "Variant Set B",
    status: "draft",
    groups: [
      {type: "multiple_choice", count: 4},
      {type: "summary_completion", count: 5},
      {type: "short_answer", count: 4}
    ],
    usedInTestIds: [],
    createdAt: "2026-02-03"
  },
  {
    id: "var-urban-c",
    passageId: "passage-urban-gardens-health",
    name: "Variant Set C",
    status: "published",
    groups: [
      {type: "multiple_choice", count: 5},
      {type: "matching_features", count: 4},
      {type: "sentence_completion", count: 5}
    ],
    usedInTestIds: ["cam-16-r-4"],
    createdAt: "2026-02-21"
  },
  {
    id: "var-behavioral-a",
    passageId: "passage-behavioral-economics",
    name: "Variant Set A",
    status: "used",
    groups: [
      {type: "matching_features", count: 6},
      {type: "yes_no_not_given", count: 8}
    ],
    usedInTestIds: ["cam-18-r-1", "cam-19-r-3"],
    createdAt: "2025-12-28"
  },
  {
    id: "var-manufacturing-a",
    passageId: "passage-future-manufacturing",
    name: "Variant Set A",
    status: "published",
    groups: [
      {type: "summary_completion", count: 5},
      {type: "short_answer", count: 5},
      {type: "sentence_completion", count: 3}
    ],
    usedInTestIds: ["practice-r-mock-1"],
    createdAt: "2026-01-12"
  },
  {
    id: "var-volcanic-a",
    passageId: "passage-volcanic-soil",
    name: "Variant Set A",
    status: "draft",
    groups: [
      {type: "table_completion", count: 6},
      {type: "yes_no_not_given", count: 4},
      {type: "short_answer", count: 3}
    ],
    usedInTestIds: [],
    createdAt: "2026-02-14"
  },
  {
    id: "var-campus-a",
    passageId: "passage-campus-services",
    name: "Variant Set A",
    status: "used",
    groups: [{type: "form_completion", count: 10}],
    usedInTestIds: ["guide-l-4", "cam-18-l-1"],
    createdAt: "2026-01-09"
  },
  {
    id: "var-urban-talk-a",
    passageId: "passage-urban-planning-talk",
    name: "Variant Set A",
    status: "used",
    groups: [
      {type: "summary_completion", count: 5},
      {type: "selecting_from_a_list", count: 5}
    ],
    usedInTestIds: ["guide-l-4"],
    createdAt: "2025-12-19"
  },
  {
    id: "var-urban-talk-b",
    passageId: "passage-urban-planning-talk",
    name: "Variant Set B",
    status: "published",
    groups: [
      {type: "map", count: 5},
      {type: "flow_chart", count: 5}
    ],
    usedInTestIds: [],
    createdAt: "2026-01-25"
  },
  {
    id: "var-seminar-a",
    passageId: "passage-seminar-planning",
    name: "Variant Set A",
    status: "published",
    groups: [
      {type: "matching_information", count: 5},
      {type: "multiple_choice", count: 5}
    ],
    usedInTestIds: ["cam-16-l-3"],
    createdAt: "2025-11-21"
  },
  {
    id: "var-tech-a",
    passageId: "passage-technology-lecture",
    name: "Variant Set A",
    status: "used",
    groups: [
      {type: "note_completion", count: 6},
      {type: "short_answer", count: 4}
    ],
    usedInTestIds: ["cam-12-l-4"],
    createdAt: "2025-10-29"
  }
];

function unique(values: string[]) {
  return [...new Set(values)];
}

function toQuestionTypeLabel(type: QuestionType) {
  const labels: Record<QuestionType, string> = {
    tfng: "TFNG",
    yes_no_not_given: "Yes / No / Not Given",
    multiple_choice: "Multiple Choice",
    selecting_from_a_list: "Selecting from a List",
    matching_headings: "Matching Headings",
    matching_information: "Matching Information",
    matching_features: "Matching Features",
    sentence_completion: "Sentence Completion",
    summary_completion: "Summary Completion",
    table_completion: "Table Completion",
    flow_chart: "Flow Chart",
    map: "Map",
    diagram_labeling: "Diagram Labeling",
    form_completion: "Form Completion",
    note_completion: "Note Completion",
    short_answer: "Short Answer"
  };

  return labels[type];
}

function toQuestionTypeKeys(groups: VariantGroupTemplate[]) {
  const ordered: QuestionType[] = [];
  for (const group of groups) {
    if (!ordered.includes(group.type)) {
      ordered.push(group.type);
    }
  }
  return ordered;
}

function createVariantGroups(groups: Array<{type: QuestionType; count: number}>) {
  return groups.map((group, index) => ({
    id: `group-${index + 1}`,
    type: group.type,
    count: group.count
  }));
}

export function buildVariantSummaryFromGroups(groups: VariantGroupTemplate[]) {
  return groups.map((group) => `${toQuestionTypeLabel(group.type)} (${group.count})`).join(" + ");
}

function buildQuestionSignature(passageId: string, groups: VariantGroupTemplate[]) {
  const normalized = groups.map((group) => `${group.type}:${group.count}`).join("|");
  return `${passageId}-${normalized}`.toLowerCase();
}

function getStructureRef(testId: string, structureId: string) {
  const test = getTestById(testId);
  if (!test) return null;
  const structure = test.structures.find((item) => item.id === structureId);
  if (!structure) return null;
  return {test, structure};
}

function toWordCount(text: string[]) {
  return text.join(" ").split(/\s+/).filter(Boolean).length;
}

const BASE_PASSAGE_ASSET_ENTITIES: PassageAssetEntity[] = PASSAGE_SEEDS.map((seed) => {
  const refs = seed.structureRefs
    .map((item) => getStructureRef(item.testId, item.structureId))
    .filter((item): item is NonNullable<ReturnType<typeof getStructureRef>> => Boolean(item));
  const linkedStructureIds = refs.map((item) => item.structure.id);
  const linkedTestIds = unique(refs.map((item) => item.test.id));
  const fallbackPreview =
    seed.module === "reading"
      ? refs[0]?.structure.content[0] ?? refs[0]?.structure.shortDescription ?? ""
      : refs[0]?.structure.shortDescription ?? refs[0]?.structure.content[0] ?? "";
  const fullText = seed.fullText ?? refs.flatMap((item) => item.structure.content).slice(0, 4);

  return {
    id: seed.id,
    title: seed.title,
    module: seed.module,
    wordCount: seed.module === "reading" ? seed.wordCount ?? toWordCount(fullText) : undefined,
    durationMinutes: seed.module === "listening" ? seed.durationMinutes ?? 7 : undefined,
    difficulty: seed.difficulty,
    topic: seed.topic,
    source: seed.source,
    previewText: seed.previewText ?? fallbackPreview,
    fullText,
    estimatedTimeLabel: seed.estimatedTimeLabel,
    createdAt: seed.createdAt,
    linkedStructureIds,
    linkedTestIds
  };
});

function clonePassageEntity(entity: PassageAssetEntity): PassageAssetEntity {
  return {
    ...entity,
    fullText: [...entity.fullText],
    linkedStructureIds: [...entity.linkedStructureIds],
    linkedTestIds: [...entity.linkedTestIds]
  };
}

let runtimePassageAssetEntities: PassageAssetEntity[] | null = null;

function getRuntimePassagesStore() {
  if (!runtimePassageAssetEntities) {
    runtimePassageAssetEntities = BASE_PASSAGE_ASSET_ENTITIES.map(clonePassageEntity);
  }
  return runtimePassageAssetEntities;
}

export function getPassageAssetEntities() {
  return getRuntimePassagesStore();
}

export function createPassageAssetEntity(input: CreatePassageAssetEntityInput) {
  const safeTitle = input.title.trim();
  const safePreviewText = input.previewText.trim();
  const safeFullText = (input.fullText ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const safeTopic = input.topic.trim() || "General";
  const timestamp = Date.now();
  const createdAt = input.createdAt ?? new Date(timestamp).toISOString().slice(0, 10);
  const generatedId = `passage-custom-${timestamp.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const fullText = safeFullText.length ? safeFullText : [safePreviewText];

  const next: PassageAssetEntity = {
    id: generatedId,
    title: safeTitle,
    module: input.module,
    difficulty: input.difficulty,
    topic: safeTopic,
    source: input.source,
    previewText: safePreviewText,
    fullText,
    wordCount: input.module === "reading" ? input.wordCount ?? toWordCount(fullText) : undefined,
    durationMinutes: input.module === "listening" ? Math.max(1, Math.floor(input.durationMinutes ?? 7)) : undefined,
    estimatedTimeLabel: input.estimatedTimeLabel?.trim() || undefined,
    createdAt,
    linkedStructureIds: [...new Set((input.linkedStructureIds ?? []).filter(Boolean))],
    linkedTestIds: [...new Set((input.linkedTestIds ?? []).filter(Boolean))]
  };

  getRuntimePassagesStore().unshift(next);
  return next;
}

function buildInitialVariantSetEntities(): QuestionVariantSetEntity[] {
  return VARIANT_SEEDS.map((seed) => {
    const groups = createVariantGroups(seed.groups);
    const usedInTestIds = unique(seed.usedInTestIds.filter((testId) => TEST_ENTITIES.some((test) => test.id === testId)));

    return {
      id: seed.id,
      passageId: seed.passageId,
      name: seed.name,
      status: seed.status,
      maxQuestionTypes: MAX_VARIANT_QUESTION_TYPES,
      groups,
      questionTypesSummary: buildVariantSummaryFromGroups(groups),
      questionTypeKeys: toQuestionTypeKeys(groups),
      questionSignature: buildQuestionSignature(seed.passageId, groups),
      usedInTestIds,
      createdAt: seed.createdAt
    };
  });
}

function cloneVariantEntity(entity: QuestionVariantSetEntity): QuestionVariantSetEntity {
  return {
    ...entity,
    groups: entity.groups.map((group) => ({...group})),
    questionTypeKeys: [...entity.questionTypeKeys],
    usedInTestIds: [...entity.usedInTestIds]
  };
}

const BASE_QUESTION_VARIANT_SET_ENTITIES = buildInitialVariantSetEntities();
let runtimeQuestionVariantSetEntities: QuestionVariantSetEntity[] | null = null;

function getRuntimeVariantsStore() {
  if (!runtimeQuestionVariantSetEntities) {
    runtimeQuestionVariantSetEntities = BASE_QUESTION_VARIANT_SET_ENTITIES.map(cloneVariantEntity);
  }
  return runtimeQuestionVariantSetEntities;
}

export function getQuestionVariantSetEntities() {
  return getRuntimeVariantsStore();
}

export function createQuestionVariantSetEntity(input: CreateQuestionVariantSetEntityInput) {
  const safeName = input.name.trim();
  const safeGroups = input.groups
    .map((group, index) => ({
      id: group.id || `group-${index + 1}`,
      type: group.type,
      count: Math.max(0, Math.floor(group.count))
    }))
    .filter((group) => group.count > 0);
  const safeUsedInTestIds = unique((input.usedInTestIds ?? []).filter((testId) => TEST_ENTITIES.some((test) => test.id === testId)));
  const timestamp = Date.now();
  const createdAt = input.createdAt ?? new Date(timestamp).toISOString().slice(0, 10);

  const next: QuestionVariantSetEntity = {
    id: `var-custom-${timestamp.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    passageId: input.passageId,
    name: safeName,
    status: input.status,
    maxQuestionTypes: MAX_VARIANT_QUESTION_TYPES,
    groups: safeGroups,
    questionTypesSummary: buildVariantSummaryFromGroups(safeGroups),
    questionTypeKeys: toQuestionTypeKeys(safeGroups),
    questionSignature: buildQuestionSignature(input.passageId, safeGroups),
    usedInTestIds: safeUsedInTestIds,
    createdAt
  };

  getRuntimeVariantsStore().unshift(next);
  return next;
}

export function updateQuestionVariantSetEntity(input: UpdateQuestionVariantSetEntityInput) {
  const store = getRuntimeVariantsStore();
  const index = store.findIndex((variant) => variant.id === input.id);
  if (index < 0) return null;

  const safeName = input.name.trim();
  const safeGroups = input.groups
    .map((group, groupIndex) => ({
      id: group.id || `group-${groupIndex + 1}`,
      type: group.type,
      count: Math.max(0, Math.floor(group.count))
    }))
    .filter((group) => group.count > 0);
  const safeUsedInTestIds = unique((input.usedInTestIds ?? []).filter((testId) => TEST_ENTITIES.some((test) => test.id === testId)));
  const current = store[index];
  const next: QuestionVariantSetEntity = {
    ...current,
    passageId: input.passageId,
    name: safeName,
    status: input.status,
    groups: safeGroups,
    questionTypesSummary: buildVariantSummaryFromGroups(safeGroups),
    questionTypeKeys: toQuestionTypeKeys(safeGroups),
    questionSignature: buildQuestionSignature(input.passageId, safeGroups),
    usedInTestIds: safeUsedInTestIds
  };
  store[index] = next;
  return next;
}

export const PASSAGE_ASSET_ENTITIES = getPassageAssetEntities();
export const QUESTION_VARIANT_SET_ENTITIES = getQuestionVariantSetEntities();
