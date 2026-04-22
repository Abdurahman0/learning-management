"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {studentTestsService} from "@/src/services/student/tests.service";
import type {StudentTestRecord} from "@/src/services/student/types";

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

type ReadingGuestTest = {
  id: string;
  title: string;
  isPremium: boolean;
  durationMinutes: number;
  totalQuestions: number;
  difficulty: Difficulty;
  practiceSource: PracticeSource;
  passages: Array<{
    title: string;
    questionsCount: number;
    difficulty: Difficulty;
  }>;
};

function sortReadingTests(tests: ReadingGuestTest[], sort: SortFilter) {
  const copy = [...tests];

  copy.sort((a, b) => {
    if (sort === "newest") {
      const aNum = Number(a.id.replace(/\D/g, ""));
      const bNum = Number(b.id.replace(/\D/g, ""));
      return bNum - aNum;
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

function mapStudentReadingTest(item: StudentTestRecord): ReadingGuestTest {
  const testDifficulty = mapDifficulty(item.difficulty_level || item.difficulty_display);
  const practiceSource = mapPracticeSource(item.practice_source);
  const passages =
    item.reading_passages.length > 0
      ? item.reading_passages.map((passage, index) => ({
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
    isPremium: item.is_premium,
    durationMinutes: Math.max(1, Math.ceil((item.time_limit_seconds ?? 3600) / 60)),
    totalQuestions: item.total_questions || passages.reduce((sum, passage) => sum + passage.questionsCount, 0),
    difficulty: testDifficulty,
    practiceSource,
    passages
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
  let nextPath = "/api/public/tests/reading?page_size=100";

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

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        const results = isGuest
          ? await fetchPublicReadingTests()
          : (await studentTestsService.listReadingAllPages({pageSize: 100})).results;
        if (!active) return;
        const visible = isGuest ? results.filter((item) => !item.active_for_registered_users) : results;
        setApiTests(visible.map(mapStudentReadingTest));
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

  // Premium filtering is temporarily disabled (tab is visible but non-interactive).
  useEffect(() => {
    if (tab === "premium") {
      setTab("all");
    }
  }, [tab]);

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

    const searchValue = search.trim().toLowerCase();
    if (searchValue) {
      tests = tests.filter((test) => test.title.toLowerCase().includes(searchValue));
    }

    return sortReadingTests(tests, sort);
  }, [apiTests, difficulty, search, sort, tab, source]);

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
              onTabChange={setTab}
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

          <div className="mt-4 space-y-3.5">
            {filteredTests.map((test) => (
              <ReadingTestCard key={test.id} test={test} />
            ))}
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
