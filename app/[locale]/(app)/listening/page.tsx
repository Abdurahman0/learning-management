"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  LISTENING_TESTS,
  type ListeningDifficulty,
  type ListeningTestItem,
} from "@/data/listening-tests";

import { useAppSessionRole } from "../_components/session/AppSessionContext";
import { GuestCallout } from "../_components/listening/GuestCallout";
import { ListeningFilters } from "../_components/listening/ListeningFilters";
import { ListeningTestCard } from "../_components/listening/ListeningTestCard";
import { UnlockMoreCard } from "../_components/listening/UnlockMoreCard";

type ListeningTab = "all" | "free" | "premium";
type DifficultyFilter = "all" | ListeningDifficulty;
type SortFilter = "newest" | "az";

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

export default function ListeningPage() {
  const t = useTranslations("guest");
  const role = useAppSessionRole();
  const isGuest = role === "guest";

  const [tab, setTab] = useState<ListeningTab>("all");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [sort, setSort] = useState<SortFilter>("newest");

  const filteredTests = useMemo(() => {
    let tests = [...LISTENING_TESTS];

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
      tests = tests.filter((test) =>
        test.title.toLowerCase().includes(searchValue),
      );
    }

    return sortListeningTests(tests, sort);
  }, [tab, search, difficulty, sort]);

  return (
    <div>
      <div className="mx-auto w-full max-w-245 pb-8 pt-4 lg:pt-0">
        {isGuest ? <GuestCallout /> : null}

        <section className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("listening.title")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("listening.subtitle")}
          </p>

          <div className="mt-4">
            <ListeningFilters
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
