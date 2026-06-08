"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {ChevronDown} from "lucide-react";

import {studentTestsService} from "@/src/services/student/tests.service";
import type {StudentTestRecord} from "@/src/services/student/types";
import {Card, CardContent} from "@/components/ui/card";
import {cn} from "@/lib/utils";

import {useAppSessionRole} from "../_components/session/AppSessionContext";
import {GuestCallout} from "../_components/listening/GuestCallout";
import {ReadingFilters} from "../_components/reading/ReadingFilters";
import {ReadingTestCard} from "../_components/reading/ReadingTestCard";
import {ReadingUnlockMoreCard} from "../_components/reading/ReadingUnlockMoreCard";

type ReadingTab = "all" | "free" | "premium";
type Difficulty = "easy" | "medium" | "hard";
type DifficultyFilter = "all" | Difficulty;
type PracticeSource = "custom" | "real" | "cambridge";
type SourceFilter = "all" | PracticeSource;
type SortFilter = "newest" | "az";
type ReadingKindFilter = "full" | "passages";
const PASSAGE_PRACTICE_DURATION_MINUTES = 20;

type ReadingGuestTest = {
  listKey?: string;
  id: string;
  title: string;
  groupId?: string | null;
  groupName?: string | null;
  displayOrder?: number | null;
  testFormat: "full" | "part" | "both";
  isPremium: boolean;
  lastAccuracyPercent?: number | null;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
  practiceSource: PracticeSource;
  passages: Array<{
    id?: string;
    title: string;
    questionsCount: number;
    difficulty: Difficulty;
  }>;
};

function isPassageTest(test: ReadingGuestTest) {
  return test.testFormat === "part" || test.passages.length === 1 || test.totalQuestions < 40 || test.durationMinutes <= 25;
}

function toPassagePracticeCards(tests: ReadingGuestTest[]) {
  return tests.flatMap((test) => {
    if (isPassageTest(test)) {
      return [{...test, listKey: test.listKey ?? `${test.id}:passage`}];
    }

    return test.passages.map((passage, index) => ({
      ...test,
      listKey: `${test.id}:passage:${passage.id ?? index}`,
      title: passage.title || `Passage ${index + 1}`,
      testFormat: "part" as const,
      durationMinutes: PASSAGE_PRACTICE_DURATION_MINUTES,
      totalQuestions: passage.questionsCount,
      passages: [passage]
    }));
  });
}

type ReadingListRow =
  | {type: "test"; test: ReadingGuestTest}
  | {type: "group"; id: string; name: string; tests: ReadingGuestTest[]};

function buildReadingListRows(tests: ReadingGuestTest[]): ReadingListRow[] {
  const rows: ReadingListRow[] = [];
  const groups = new Map<string, Extract<ReadingListRow, {type: "group"}>>();

  tests.forEach((test) => {
    const groupId = test.groupId?.trim();
    const groupName = test.groupName?.trim();

    if (!groupId || !groupName) {
      rows.push({type: "test", test});
      return;
    }

    let group = groups.get(groupId);
    if (!group) {
      group = {type: "group", id: groupId, name: groupName, tests: []};
      groups.set(groupId, group);
      rows.push(group);
    }

    group.tests.push(test);
  });

  return rows;
}

function ReadingCardsList({
  tests,
  layout = "stack",
  allowGroups = true
}: {
  tests: ReadingGuestTest[];
  layout?: "stack" | "grid";
  allowGroups?: boolean;
}) {
  const isGrid = layout === "grid";
  const rows = allowGroups
    ? buildReadingListRows(tests)
    : tests.map<ReadingListRow>((test) => ({type: "test", test}));

  return (
    <div className={isGrid ? "grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4" : "space-y-3.5"}>
      {rows.map((row) => {
        if (row.type === "test") {
          return <ReadingTestCard key={row.test.listKey ?? row.test.id} test={row.test} />;
        }

        return (
          <ReadingGroupCard
            key={`group-${row.id}`}
            group={row}
            className={isGrid ? "md:col-span-2 xl:col-span-4" : undefined}
          />
        );
      })}
    </div>
  );
}

function ReadingGroupCard({
  group,
  className
}: {
  group: Extract<ReadingListRow, {type: "group"}>;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn("border-border bg-card py-0 shadow-sm", isOpen && "border-blue-600", className)}>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
        >
          <div className="min-w-0">
            <span className="inline-flex h-6 items-center rounded-md bg-blue-100 px-2.5 text-[11px] font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-500/20 dark:text-blue-300">
              Group
            </span>
            <h3 className="mt-2 truncate text-sm font-semibold text-foreground md:text-lg">{group.name}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{group.tests.length} tests</p>
          </div>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
        </button>

        {isOpen ? (
          <div className="space-y-3 border-t border-border px-4 py-4">
            {group.tests.map((test) => (
              <ReadingTestCard key={test.listKey ?? test.id} test={test} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function sortReadingTests(tests: ReadingGuestTest[], sort: SortFilter) {
  const copy = [...tests];

  copy.sort((a, b) => {
    if (sort === "newest") {
      const aOrder = typeof a.displayOrder === "number" ? a.displayOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.displayOrder === "number" ? b.displayOrder : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.title.localeCompare(b.title);
    }

    return a.title.localeCompare(b.title);
  });

  return copy;
}

function mapDifficulty(value: string): Difficulty {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("beginner") || normalized.includes("easy")) return "easy";
  if (normalized.includes("advanced") || normalized.includes("hard")) return "hard";
  return "medium";
}

function mapPracticeSource(value: unknown): PracticeSource {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("CAMBRIDGE")) return "cambridge";
  if (normalized.includes("REAL")) return "real";
  return "custom";
}

function mapTestFormat(value: unknown): ReadingGuestTest["testFormat"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PART_TEST") return "part";
  if (normalized === "BOTH") return "both";
  return "full";
}

function mapStudentReadingTest(item: StudentTestRecord): ReadingGuestTest {
  const testDifficulty = mapDifficulty(item.difficulty_level || item.difficulty_display);
  const practiceSource = mapPracticeSource(item.practice_source);
  const explicitFormat = mapTestFormat(item.test_format);
  const passages =
    item.reading_passages.length > 0
      ? item.reading_passages.map((passage, index) => ({
          id: passage.id,
          title: passage.title || `Passage ${index + 1}`,
          questionsCount: Number(passage.max_questions || 0),
          difficulty: testDifficulty
        }))
      : [
          {title: "Passage 1", questionsCount: 13, difficulty: testDifficulty},
          {title: "Passage 2", questionsCount: 13, difficulty: testDifficulty},
          {title: "Passage 3", questionsCount: 14, difficulty: testDifficulty}
        ];

  return {
    id: item.id,
    title: item.title || "Reading Test",
    groupId: item.group_id ?? null,
    groupName: item.group_name ?? null,
    displayOrder: item.display_order ?? null,
    testFormat: explicitFormat === "full" && passages.length === 1 ? "part" : explicitFormat,
    isPremium: item.is_premium,
    lastAccuracyPercent:
      typeof item.user_attempt_status?.last_attempt_accuracy_percent === "number"
        ? item.user_attempt_status.last_attempt_accuracy_percent
        : null,
    durationMinutes:
      (explicitFormat === "full" && passages.length === 1 ? "part" : explicitFormat) === "part"
        ? PASSAGE_PRACTICE_DURATION_MINUTES
        : Math.max(1, Math.ceil((item.time_limit_seconds ?? 3600) / 60)),
    totalQuestions: item.total_questions || passages.reduce((sum, passage) => sum + passage.questionsCount, 0),
    difficulty: testDifficulty,
    practiceSource,
    passages
  };
}

function mapStudentReadingTestWithOrderFallback(item: StudentTestRecord, index: number): ReadingGuestTest {
  const mapped = mapStudentReadingTest(item);
  return {
    ...mapped,
    displayOrder: typeof mapped.displayOrder === "number" ? mapped.displayOrder : index + 1
  };
}

type PublicPaginatedResponse = {
  count?: unknown;
  next?: unknown;
  previous?: unknown;
  results?: unknown;
};

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function fetchPublicReadingTests() {
  const collected: StudentTestRecord[] = [];
  let nextPath = "/api/public/tests/reading?page_size=100&ordering=display_order";

  while (nextPath) {
    const response = await fetch(nextPath, {cache: "no-store"});
    if (!response.ok) {
      throw new Error("Failed to fetch public reading tests.");
    }

    const payload = (await response.json().catch(() => null)) as PublicPaginatedResponse | null;
    const results = asArray<StudentTestRecord>(payload?.results);
    collected.push(...results);

    const next = typeof payload?.next === "string" ? payload.next.trim() : "";
    if (!next) {
      nextPath = "";
      continue;
    }

    try {
      const url = new URL(next);
      nextPath = `/api/public/tests/reading${url.search}`;
    } catch {
      nextPath = "";
    }
  }

  return collected;
}

export default function ReadingPage() {
  const t = useTranslations("guest");
  const role = useAppSessionRole();
  const isGuest = role === "guest";

  const [apiTests, setApiTests] = useState<ReadingGuestTest[]>([]);
  const [tab, setTab] = useState<ReadingTab>("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [kind, setKind] = useState<ReadingKindFilter>("full");
  const [groupId, setGroupId] = useState<string>("all");
  const showGroupFilters = source !== "real";

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
          const results = isGuest
            ? await fetchPublicReadingTests()
          : (await studentTestsService.listReadingAllPages({pageSize: 100, ordering: "display_order"})).results;
        if (!active) return;
        const visible = isGuest ? results.filter((item) => !item.active_for_registered_users) : results;
        setApiTests(visible.map(mapStudentReadingTestWithOrderFallback));
      } catch {
        if (!active) return;
        setApiTests([]);
      }
    };

    void loadTests();

    return () => {
      active = false;
    };
  }, [isGuest]);

  useEffect(() => {
    if (!showGroupFilters && groupId !== "all") {
      setGroupId("all");
    }
  }, [groupId, showGroupFilters]);

  const filteredTests = useMemo(() => {
    let tests = [...apiTests];

    if (tab === "free") {
      tests = tests.filter((test) => !test.isPremium);
    } else if (tab === "premium") {
      tests = tests.filter((test) => test.isPremium);
    }

    if (difficulty !== "all") {
      tests = tests.filter((test) => test.difficulty === difficulty);
    }

    if (source !== "all") {
      tests = tests.filter((test) => test.practiceSource === source);
    }

    if (showGroupFilters && groupId !== "all") {
      tests = tests.filter((test) => test.groupId === groupId);
    }

    const searchValue = search.trim().toLowerCase();
    if (searchValue) {
      tests = tests.filter((test) => test.title.toLowerCase().includes(searchValue));
    }

    return sortReadingTests(tests, sort);
  }, [apiTests, difficulty, groupId, search, showGroupFilters, sort, tab, source]);

  const groups = useMemo(() => {
    const map = new Map<string, string>();
    for (const test of apiTests) {
      if (test.groupId && test.groupName) map.set(test.groupId, test.groupName);
    }
    return [...map.entries()].map(([id, name]) => ({id, name}));
  }, [apiTests]);

  const fullTests = useMemo(() => filteredTests.filter((test) => !isPassageTest(test)), [filteredTests]);
  const passageTests = useMemo(() => toPassagePracticeCards(filteredTests), [filteredTests]);

  return (
    <div>
      <div className="mx-auto w-full max-w-245 pb-8 pt-4 lg:pt-0">
        {isGuest ? <GuestCallout /> : null}

        <section className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("reading.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("reading.subtitle")}</p>

          <div className="mt-4">
            <ReadingFilters
              tab={tab}
              onTabChange={(nextTab) => setTab(nextTab === "premium" ? "all" : nextTab)}
              kind={kind}
              onKindChange={setKind}
              source={source}
              onSourceChange={setSource}
              search={search}
              onSearchChange={setSearch}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              sort={sort}
              onSortChange={setSort}
            />
          </div>

          {showGroupFilters && groups.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroupId("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${groupId === "all" ? "border-blue-500 bg-blue-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
              >
                All groups
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${groupId === group.id ? "border-blue-500 bg-blue-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 space-y-6">
            {kind === "full" ? (
              <section className="space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{t("reading.fullTestsTitle")}</h2>
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{fullTests.length}</span>
              </div>
              {fullTests.length ? (
                <ReadingCardsList tests={fullTests} />
              ) : (
                <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t("reading.noFullTests")}</p>
              )}
              </section>
            ) : (
              <section className="space-y-3.5">

              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{t("reading.passagesTitle")}</h2>
                <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{passageTests.length}</span>
              </div>
              {passageTests.length ? (
                <ReadingCardsList tests={passageTests} layout="grid" allowGroups={false} />
              ) : (
                <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t("reading.noPassages")}</p>
              )}
              </section>
            )}
          </div>

          {isGuest ? (
            <div className="mt-6">
              <ReadingUnlockMoreCard />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
