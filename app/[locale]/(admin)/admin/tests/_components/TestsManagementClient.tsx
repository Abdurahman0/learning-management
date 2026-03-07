"use client";

import {useMemo, useRef, useState} from "react";
import {Bell, CopyPlus, Plus, Search, Upload} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {ThemeToggle} from "@/components/theme-toggle";
import {
  ADMIN_TESTS,
  TEST_DIFFICULTY_OPTIONS,
  TEST_MODULE_OPTIONS,
  TEST_SORT_OPTIONS,
  TEST_STATUS_OPTIONS,
  type AdminTest,
  type DifficultyFilterValue,
  type ModuleFilterValue,
  type StatusFilterValue,
  type TestModule,
  type TestSort
} from "@/data/admin-tests";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminSidebar, AdminSidebarMobileNav} from "../../_components/AdminSidebar";
import {TestsFilters} from "./TestsFilters";
import {TestsTable} from "./TestsTable";

const PAGE_SIZE = 5;

export function TestsManagementClient() {
  const t = useTranslations("adminTests");
  const locale = useLocale();
  const router = useRouter();
  const [tests, setTests] = useState<AdminTest[]>(ADMIN_TESTS);
  const [searchValue, setSearchValue] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilterValue>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [sortBy, setSortBy] = useState<TestSort>("newest");
  const [page, setPage] = useState(1);
  const seedRef = useRef(1);
  const [expandedTestIds, setExpandedTestIds] = useState<Set<string>>(() => new Set());

  const filteredTests = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return tests.filter((item) => {
      if (moduleFilter !== "all" && item.module !== moduleFilter) {
        return false;
      }

      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(query) ||
        item.book.toLowerCase().includes(query) ||
        item.module.toLowerCase().includes(query)
      );
    });
  }, [tests, searchValue, moduleFilter, difficultyFilter, statusFilter]);

  const sortedTests = useMemo(() => {
    const copy = [...filteredTests];

    copy.sort((left, right) => {
      if (sortBy === "newest") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      if (sortBy === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }

      return left.name.localeCompare(right.name);
    });

    return copy;
  }, [filteredTests, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTests.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTests = useMemo(
    () => sortedTests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedTests, safePage]
  );

  const makeCreatedDate = (value: number) => {
    const day = String((value % 28) + 1).padStart(2, "0");
    return `2023-12-${day}`;
  };

  const navigateToBuilder = (
    testId: string,
    options?: {
      structureId?: string;
      mode?: "editor" | "preview";
    }
  ) => {
    const query = new URLSearchParams();
    if (options?.structureId) {
      query.set("structure", options.structureId);
    }
    if (options?.mode && options.mode !== "editor") {
      query.set("mode", options.mode);
    }

    const basePath = `/${locale}/admin/tests/${testId}/builder`;
    router.push(query.size ? `${basePath}?${query.toString()}` : basePath);
  };

  const duplicateFromSource = (source: AdminTest) => {
    const seed = seedRef.current;
    seedRef.current += 1;

    const duplicate: AdminTest = {
      ...source,
      id: `${source.id}-copy-${seed}`,
      name: `${source.name} ${t("row.copySuffix", {index: seed})}`,
      createdAt: makeCreatedDate(seed)
    };

    setTests((currentTests) => [duplicate, ...currentTests]);
    setPage(1);
    console.info("[admin-tests] duplicated", duplicate.id);
  };

  const handleCreateTest = (module: TestModule = "reading") => {
    const seed = seedRef.current;
    seedRef.current += 1;

    const draft: AdminTest = {
      id: `custom-${module}-${seed}`,
      name: t("row.newDraftTitle", {index: seed}),
      module,
      book: t("row.customBook"),
      questions: 40,
      difficulty: "intermediate",
      status: "draft",
      createdAt: makeCreatedDate(seed),
      passages:
        module === "reading"
          ? [
              {
                id: `custom-${module}-${seed}-p1`,
                title: `${t("table.passageLabel", {index: 1})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 13
              },
              {
                id: `custom-${module}-${seed}-p2`,
                title: `${t("table.passageLabel", {index: 2})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 13
              },
              {
                id: `custom-${module}-${seed}-p3`,
                title: `${t("table.passageLabel", {index: 3})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 14
              }
            ]
          : undefined,
      sections:
        module === "listening"
          ? [
              {
                id: `custom-${module}-${seed}-s1`,
                title: `${t("table.sectionLabel", {index: 1})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 10
              },
              {
                id: `custom-${module}-${seed}-s2`,
                title: `${t("table.sectionLabel", {index: 2})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 10
              },
              {
                id: `custom-${module}-${seed}-s3`,
                title: `${t("table.sectionLabel", {index: 3})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 10
              },
              {
                id: `custom-${module}-${seed}-s4`,
                title: `${t("table.sectionLabel", {index: 4})}`,
                shortDescription: t("row.defaultPassageDescription"),
                questionCount: 10
              }
            ]
          : undefined
    };

    setTests((currentTests) => [draft, ...currentTests]);
    setExpandedTestIds((currentExpanded) => new Set([draft.id, ...currentExpanded]));
    setPage(1);
    navigateToBuilder(draft.id);
  };

  const handleImportCambridge = () => {
    const source = ADMIN_TESTS.find((item) => item.id === "cam-19-r-3") ?? ADMIN_TESTS[0];
    duplicateFromSource(source);
    console.info("[admin-tests] import clicked");
  };

  const handleDuplicateFirstVisible = () => {
    if (!sortedTests.length) {
      return;
    }

    duplicateFromSource(sortedTests[0]);
    console.info("[admin-tests] duplicate quick action clicked");
  };

  const handleDuplicateById = (testId: string) => {
    const source = tests.find((item) => item.id === testId);

    if (!source) {
      return;
    }

    duplicateFromSource(source);
  };

  const handleDelete = (testId: string) => {
    setTests((currentTests) => currentTests.filter((item) => item.id !== testId));
    setExpandedTestIds((currentExpanded) => {
      const next = new Set(currentExpanded);
      next.delete(testId);
      return next;
    });
    console.info("[admin-tests] deleted", testId);
  };

  const handleToggleExpand = (testId: string) => {
    setExpandedTestIds((currentExpanded) => {
      const next = new Set(currentExpanded);

      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }

      return next;
    });
  };

  const handleEditPassage = (testId: string, passageId: string) => {
    navigateToBuilder(testId, {structureId: passageId});
  };

  const handleEditTest = (testId: string) => {
    navigateToBuilder(testId);
  };

  const handlePreviewTest = (testId: string) => {
    navigateToBuilder(testId, {mode: "preview"});
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setModuleFilter("all");
    setDifficultyFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <AdminSidebarMobileNav />
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{t("topbar.title")}</h1>
              </div>

              <div className="ml-auto hidden w-full max-w-[360px] md:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("topbar.searchPlaceholder")}
                    value={searchValue}
                    onChange={(event) => {
                      setSearchValue(event.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
                  />
                </div>
              </div>

              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-10 rounded-xl px-4 font-semibold">
                      <Plus className="size-4" />
                      {t("topbar.createTest")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel>{t("topbar.createMenuLabel")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleCreateTest("reading")}>{t("topbar.createReadingDefault")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleCreateTest("listening")}>{t("topbar.createListening")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <ThemeToggle />

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-9 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  aria-label={t("topbar.notificationsLabel")}
                >
                  <Bell className="size-4.5" />
                  <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-rose-500" />
                </Button>

                <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
                <AdminProfileMenu />
              </div>
            </div>

            <div className="space-y-3 border-t border-border/60 px-4 py-3 md:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("topbar.searchPlaceholder")}
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl border-border/70 bg-card/55 pl-9 focus-visible:ring-primary/35"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-10 w-full rounded-xl font-semibold">
                    <Plus className="size-4" />
                    {t("topbar.createTest")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px]">
                  <DropdownMenuLabel>{t("topbar.createMenuLabel")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleCreateTest("reading")}>{t("topbar.createReadingDefault")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCreateTest("listening")}>{t("topbar.createListening")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <TestsFilters
              moduleValue={moduleFilter}
              difficultyValue={difficultyFilter}
              statusValue={statusFilter}
              sortValue={sortBy}
              moduleOptions={TEST_MODULE_OPTIONS}
              difficultyOptions={TEST_DIFFICULTY_OPTIONS}
              statusOptions={TEST_STATUS_OPTIONS}
              sortOptions={TEST_SORT_OPTIONS}
              onModuleChange={(value) => {
                setModuleFilter(value);
                setPage(1);
              }}
              onDifficultyChange={(value) => {
                setDifficultyFilter(value);
                setPage(1);
              }}
              onStatusChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              onSortChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
              onReset={handleResetFilters}
            />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-10 rounded-xl border-border/70 bg-card/55" onClick={handleImportCambridge}>
                <Upload className="size-4" />
                {t("toolbar.importCambridge")}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-border/70 bg-card/55"
                onClick={handleDuplicateFirstVisible}
                disabled={!sortedTests.length}
              >
                <CopyPlus className="size-4" />
                {t("toolbar.duplicate")}
              </Button>
            </div>

            <TestsTable
              tests={paginatedTests}
              expandedTestIds={expandedTestIds}
              onToggleExpand={handleToggleExpand}
              onEdit={handleEditTest}
              onPreview={handlePreviewTest}
              onDuplicate={handleDuplicateById}
              onDelete={handleDelete}
              onEditPassage={handleEditPassage}
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={sortedTests.length}
              totalPages={totalPages}
              onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages))}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
