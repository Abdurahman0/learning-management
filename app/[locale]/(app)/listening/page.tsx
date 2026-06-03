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
import {ListeningFilters} from "../_components/listening/ListeningFilters";
import {ListeningTestCard} from "../_components/listening/ListeningTestCard";
import {UnlockMoreCard} from "../_components/listening/UnlockMoreCard";

type ListeningTab = "all" | "free" | "premium";
type ListeningDifficulty = "easy" | "medium" | "hard";
type DifficultyFilter = "all" | ListeningDifficulty;
type PracticeSource = "custom" | "real" | "cambridge";
type SourceFilter = "all" | PracticeSource;
type SortFilter = "newest" | "az";
type ListeningKindFilter = "full" | "parts";

type ListeningTestItem = {
  listKey?: string;
  id: string;
  title: string;
  groupId?: string | null;
  groupName?: string | null;
  displayOrder?: number | null;
  testFormat: "full" | "part" | "both";
  isPremium: boolean;
  difficulty: ListeningDifficulty;
  practiceSource: PracticeSource;
  durationMins: number;
  totalQuestions: number;
  sections: Array<{
    id?: string;
    title?: string;
    label: string;
    questions: number;
  }>;
};

function isPartPractice(test: ListeningTestItem) {
  return test.testFormat === "part" || test.sections.length === 1 || test.totalQuestions < 40 || test.durationMins <= 12;
}

function toPartPracticeCards(tests: ListeningTestItem[]) {
  return tests.flatMap((test) => {
    if (isPartPractice(test)) {
      return [{...test, listKey: test.listKey ?? `${test.id}:part`}];
    }

    return test.sections.map((section, index) => ({
      ...test,
      listKey: `${test.id}:part:${section.id ?? index}`,
      title: section.title || section.label || `Part ${index + 1}`,
      testFormat: "part" as const,
      durationMins: Math.max(1, Math.ceil(test.durationMins / Math.max(test.sections.length, 1))),
      totalQuestions: section.questions,
      sections: [section]
    }));
  });
}

type ListeningListRow =
  | {type: "test"; test: ListeningTestItem}
  | {type: "group"; id: string; name: string; tests: ListeningTestItem[]};

function buildListeningListRows(tests: ListeningTestItem[]): ListeningListRow[] {
  const rows: ListeningListRow[] = [];
  const groups = new Map<string, Extract<ListeningListRow, {type: "group"}>>();

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

function ListeningCardsList({tests}: {tests: ListeningTestItem[]}) {
  return (
    <div className="space-y-3.5">
      {buildListeningListRows(tests).map((row) => {
        if (row.type === "test") {
          return <ListeningTestCard key={row.test.listKey ?? row.test.id} test={row.test} />;
        }

        return <ListeningGroupCard key={`group-${row.id}`} group={row} />;
      })}
    </div>
  );
}

function ListeningGroupCard({group}: {group: Extract<ListeningListRow, {type: "group"}>}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn("max-w-full overflow-hidden border-border bg-card py-0 shadow-sm", isOpen && "border-blue-600")}>
      <CardContent className="max-w-full p-0">
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
              <ListeningTestCard key={test.listKey ?? test.id} test={test} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function sortListeningTests(tests: ListeningTestItem[], sort: SortFilter) {
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

function mapDifficulty(value: string): ListeningDifficulty {
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

function mapTestFormat(value: unknown): ListeningTestItem["testFormat"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PART_TEST") return "part";
  if (normalized === "BOTH") return "both";
  return "full";
}

function toSections(item: StudentTestRecord, fallbackQuestions: number, testFormat: ListeningTestItem["testFormat"]) {
  const parts = item.listening_parts
    .slice()
    .sort((a, b) => {
      const aPart = Number(String(a.part_number ?? "").replace(/\D/g, "")) || 0;
      const bPart = Number(String(b.part_number ?? "").replace(/\D/g, "")) || 0;
      return aPart - bPart;
    });

  const sections: ListeningTestItem["sections"] = parts.map((part, index) => ({
    id: part.id,
    title: part.title || undefined,
    label: part.part_number || `Part ${index + 1}`,
    questions: Number(part.max_questions || 0)
  }));

  if (testFormat === "part") {
    return (sections.length ? sections : [{label: "Part 1", questions: fallbackQuestions}]).slice(0, 1) as ListeningTestItem["sections"];
  }

  while (sections.length < 4) {
    const index = sections.length;
    sections.push({
      label: `Part ${index + 1}`,
      questions: Math.max(0, Math.floor(fallbackQuestions / 4))
    });
  }

  return sections.slice(0, 4) as ListeningTestItem["sections"];
}

function mapStudentListeningTest(item: StudentTestRecord): ListeningTestItem {
  const difficulty = mapDifficulty(item.difficulty_level || item.difficulty_display);
  const practiceSource = mapPracticeSource(item.practice_source);
  const explicitFormat = mapTestFormat(item.test_format);
  const resolvedFormat = explicitFormat === "full" && item.listening_parts.length === 1 ? "part" : explicitFormat;
  const totalQuestions = item.total_questions || 40;

  return {
    id: item.id,
    title: item.title || "Listening Test",
    groupId: item.group_id ?? null,
    groupName: item.group_name ?? null,
    displayOrder: item.display_order ?? null,
    testFormat: resolvedFormat,
    isPremium: item.is_premium,
    difficulty,
    practiceSource,
    durationMins: Math.max(1, Math.ceil((item.time_limit_seconds ?? 1800) / 60)),
    totalQuestions,
    sections: toSections(item, totalQuestions, resolvedFormat)
  };
}

function mapStudentListeningTestWithOrderFallback(item: StudentTestRecord, index: number): ListeningTestItem {
  const mapped = mapStudentListeningTest(item);
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

async function fetchPublicListeningTests() {
  const collected: StudentTestRecord[] = [];
  let nextPath = "/api/public/tests/listening?page_size=100&ordering=display_order";

  while (nextPath) {
    const response = await fetch(nextPath, {cache: "no-store"});
    if (!response.ok) {
      throw new Error("Failed to fetch public listening tests.");
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
      nextPath = `/api/public/tests/listening${url.search}`;
    } catch {
      nextPath = "";
    }
  }

  return collected;
}

export default function ListeningPage() {
  const t = useTranslations("guest");
  const role = useAppSessionRole();
  const isGuest = role === "guest";

  const [apiTests, setApiTests] = useState<ListeningTestItem[]>([]);
  const [tab, setTab] = useState<ListeningTab>("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");
  const [kind, setKind] = useState<ListeningKindFilter>("full");
  const [groupId, setGroupId] = useState<string>("all");

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        const results = isGuest
          ? await fetchPublicListeningTests()
          : (await studentTestsService.listListeningAllPages({pageSize: 100, ordering: "display_order"})).results;
        if (!active) return;
        const visible = isGuest ? results.filter((item) => !item.active_for_registered_users) : results;
        setApiTests(visible.map(mapStudentListeningTestWithOrderFallback));
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

    if (groupId !== "all") {
      tests = tests.filter((test) => test.groupId === groupId);
    }

    const searchValue = search.trim().toLowerCase();
    if (searchValue) {
      tests = tests.filter((test) => test.title.toLowerCase().includes(searchValue));
    }

    return sortListeningTests(tests, sort);
  }, [apiTests, difficulty, groupId, search, sort, tab, source]);

  const groups = useMemo(() => {
    const map = new Map<string, string>();
    for (const test of apiTests) {
      if (test.groupId && test.groupName) map.set(test.groupId, test.groupName);
    }
    return [...map.entries()].map(([id, name]) => ({id, name}));
  }, [apiTests]);

  const fullTests = useMemo(() => filteredTests.filter((test) => !isPartPractice(test)), [filteredTests]);
  const partTests = useMemo(() => toPartPracticeCards(filteredTests), [filteredTests]);

  return (
    <div>
      <div className="mx-auto w-full max-w-245 pb-8 pt-4 lg:pt-0">
        {isGuest ? <GuestCallout /> : null}

        <section className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("listening.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("listening.subtitle")}</p>

          <div className="mt-4">
            <ListeningFilters
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

          {groups.length ? (
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

          <div className="mt-4 space-y-3.5">
            {kind === "full" ? (
              fullTests.length ? (
                <ListeningCardsList tests={fullTests} />
              ) : (
                <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t("listening.noFullTests")}</p>
              )
            ) : partTests.length ? (
              <ListeningCardsList tests={partTests} />
            ) : (
              <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t("listening.noParts")}</p>
            )}
          </div>

          {isGuest ? (
            <div className="mt-6">
              <UnlockMoreCard />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
