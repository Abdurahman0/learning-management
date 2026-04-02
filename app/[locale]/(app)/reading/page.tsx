"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {READING_TESTS, type Difficulty, type ReadingGuestTest} from "@/data/guest-tests";
import {studentTestsService} from "@/src/services/student/tests.service";
import type {StudentTestRecord} from "@/src/services/student/types";

import {useAppSessionRole} from "../_components/session/AppSessionContext";
import {GuestCallout} from "../_components/listening/GuestCallout";
import {ReadingFilters} from "../_components/reading/ReadingFilters";
import {ReadingTestCard} from "../_components/reading/ReadingTestCard";
import {ReadingUnlockMoreCard} from "../_components/reading/ReadingUnlockMoreCard";

type ReadingTab = "all" | "free" | "premium";
type DifficultyFilter = "all" | Difficulty;
type SortFilter = "newest" | "az";

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

function mapStudentReadingTest(item: StudentTestRecord): ReadingGuestTest {
  const testDifficulty = mapDifficulty(item.difficulty_level || item.difficulty_display);
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
    passages
  };
}

export default function ReadingPage() {
  const t = useTranslations("guest");
  const role = useAppSessionRole();
  const isGuest = role === "guest";

  const [apiTests, setApiTests] = useState<ReadingGuestTest[]>([]);
  const [tab, setTab] = useState<ReadingTab>("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      if (isGuest) return;
      try {
        const response = await studentTestsService.listReadingAllPages({pageSize: 100});
        if (!active) return;
        setApiTests(response.results.map(mapStudentReadingTest));
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
    let tests = isGuest ? [...READING_TESTS] : [...apiTests];

    if (tab === "free") {
      tests = tests.filter((test) => !test.isPremium);
    } else if (tab === "premium") {
      tests = tests.filter((test) => test.isPremium);
    }

    if (difficulty !== "all") {
      tests = tests.filter((test) => test.difficulty === difficulty);
    }

    const searchValue = search.trim().toLowerCase();
    if (searchValue) {
      tests = tests.filter((test) => test.title.toLowerCase().includes(searchValue));
    }

    return sortReadingTests(tests, sort);
  }, [apiTests, difficulty, isGuest, search, sort, tab]);

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
