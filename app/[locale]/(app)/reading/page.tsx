"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {READING_TESTS, type Difficulty, type ReadingGuestTest} from "@/data/guest-tests";

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

export default function ReadingPage() {
  const t = useTranslations("guest");

  const [tab, setTab] = useState<ReadingTab>("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");

  const filteredTests = useMemo(() => {
    let tests = [...READING_TESTS];

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
  }, [tab, search, difficulty, sort]);

  return (
    <div>
      <div className="mx-auto w-full max-w-[980px] pb-8 pt-4 lg:pt-0">
        <GuestCallout />

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

          <div className="mt-6">
            <ReadingUnlockMoreCard />
          </div>
        </section>
      </div>
    </div>
  );
}
