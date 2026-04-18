"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {studentTestsService} from "@/src/services/student/tests.service";
import type {StudentTestRecord} from "@/src/services/student/types";

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

type ListeningTestItem = {
  id: string;
  title: string;
  isPremium: boolean;
  difficulty: ListeningDifficulty;
  practiceSource: PracticeSource;
  durationMins: number;
  totalQuestions: number;
  sections: Array<{
    label: string;
    questions: number;
  }>;
};

function sortListeningTests(tests: ListeningTestItem[], sort: SortFilter) {
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

function toSections(item: StudentTestRecord, fallbackQuestions: number) {
  const parts = item.listening_parts
    .slice()
    .sort((a, b) => {
      const aPart = Number(String(a.part_number ?? "").replace(/\D/g, "")) || 0;
      const bPart = Number(String(b.part_number ?? "").replace(/\D/g, "")) || 0;
      return aPart - bPart;
    });

  const sections = parts.map((part, index) => ({
    label: part.part_number || `Part ${index + 1}`,
    questions: Number(part.max_questions || 0)
  }));

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
  const totalQuestions = item.total_questions || 40;

  return {
    id: item.id,
    title: item.title || "Listening Test",
    isPremium: item.is_premium,
    difficulty,
    practiceSource,
    durationMins: Math.max(1, Math.ceil((item.time_limit_seconds ?? 1800) / 60)),
    totalQuestions,
    sections: toSections(item, totalQuestions)
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
  let nextPath = "/api/public/tests/listening?page_size=100";

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

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        const results = isGuest
          ? await fetchPublicListeningTests()
          : (await studentTestsService.listListeningAllPages({pageSize: 100})).results;
        if (!active) return;
        const visible = isGuest ? results.filter((item) => !item.active_for_registered_users) : results;
        setApiTests(visible.map(mapStudentListeningTest));
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

    const searchValue = search.trim().toLowerCase();
    if (searchValue) {
      tests = tests.filter((test) => test.title.toLowerCase().includes(searchValue));
    }

    return sortListeningTests(tests, sort);
  }, [apiTests, difficulty, search, sort, tab, source]);

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
              <ListeningTestCard
                key={test.id}
                test={test}
              />
            ))}
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
