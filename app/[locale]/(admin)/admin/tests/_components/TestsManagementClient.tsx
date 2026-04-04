"use client";

import {useEffect, useMemo, useState} from "react";
import {Bell, CheckCircle2, Plus, Search, Upload} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Separator} from "@/components/ui/separator";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {ThemeToggle} from "@/components/theme-toggle";
import {
  type AdminTest,
  type DifficultyFilterValue,
  type ModuleFilterValue,
  type StatusFilterValue,
  type TestModule,
  type TestSort
} from "@/data/admin-tests";
import {practiceTestsService} from "@/src/services/admin/practiceTests.service";
import type {PracticeTestRecord} from "@/src/services/admin/types";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminSidebar, AdminSidebarMobileNav} from "../../_components/AdminSidebar";
import {TestsFilters} from "./TestsFilters";
import {TestsTable} from "./TestsTable";

const PAGE_SIZE = 5;
type Option<Value extends string> = {
  value: Value;
  labelKey: string;
};

const TEST_MODULE_OPTIONS: Option<ModuleFilterValue>[] = [
  {value: "all", labelKey: "filters.module.all"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"}
];

const TEST_DIFFICULTY_OPTIONS: Option<DifficultyFilterValue>[] = [
  {value: "all", labelKey: "filters.difficulty.all"},
  {value: "beginner", labelKey: "filters.difficulty.beginner"},
  {value: "intermediate", labelKey: "filters.difficulty.intermediate"},
  {value: "advanced", labelKey: "filters.difficulty.advanced"}
];

const TEST_STATUS_OPTIONS: Option<StatusFilterValue>[] = [
  {value: "all", labelKey: "filters.status.all"},
  {value: "published", labelKey: "filters.status.published"},
  {value: "draft", labelKey: "filters.status.draft"}
];

const TEST_SORT_OPTIONS: Option<TestSort>[] = [
  {value: "newest", labelKey: "filters.sort.newest"},
  {value: "oldest", labelKey: "filters.sort.oldest"},
  {value: "alphabetical", labelKey: "filters.sort.alphabetical"}
];

function mapDifficulty(value: string): AdminTest["difficulty"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("BEGINNER")) return "beginner";
  if (normalized.includes("ADVANCED")) return "advanced";
  return "intermediate";
}

function mapStatus(isActive: boolean): AdminTest["status"] {
  return isActive ? "published" : "draft";
}

function mapPracticeTestToAdminTest(item: PracticeTestRecord): AdminTest {
  const module = String(item.test_type ?? "").trim().toUpperCase().includes("LISTENING") ? "listening" : "reading";
  const readingCount = Number(item.reading_passages_count ?? 0);
  const listeningCount = Number(item.listening_parts_count ?? 0);
  const sectionsCount = module === "reading" ? Math.max(readingCount, 3) : Math.max(listeningCount, 4);
  const questionsPerSection = module === "reading" ? [13, 13, 14] : [10, 10, 10, 10];

  return {
    id: String(item.id),
    name: item.title || "Untitled Test",
    module,
    book: "Custom Practice",
    questions: Number(item.total_questions ?? 0),
    difficulty: mapDifficulty(item.difficulty_level),
    status: mapStatus(Boolean(item.is_active)),
    createdAt: String(item.created_at ?? item.updated_at ?? new Date().toISOString()).slice(0, 10),
    passages:
      module === "reading"
        ? Array.from({length: sectionsCount}, (_, index) => ({
            id: `${item.id}-p-${index + 1}`,
            title: `Passage ${index + 1}`,
            shortDescription: "",
            questionCount: questionsPerSection[index] ?? 13
          }))
        : undefined,
    sections:
      module === "listening"
        ? Array.from({length: sectionsCount}, (_, index) => ({
            id: `${item.id}-s-${index + 1}`,
            title: `Section ${index + 1}`,
            shortDescription: "",
            questionCount: questionsPerSection[index] ?? 10
          }))
        : undefined
  };
}

export function TestsManagementClient() {
  const t = useTranslations("adminTests");
  const locale = useLocale();
  const router = useRouter();
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilterValue>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [sortBy, setSortBy] = useState<TestSort>("newest");
  const [page, setPage] = useState(1);
  const [expandedTestIds, setExpandedTestIds] = useState<Set<string>>(() => new Set());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedImportTestId, setSelectedImportTestId] = useState("");
  const [downloadToastOpen, setDownloadToastOpen] = useState(false);
  const [lastDownloadedTestName, setLastDownloadedTestName] = useState("");

  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      try {
        const response = await practiceTestsService.list({page: 1, pageSize: 200});
        if (!active) return;
        setTests(response.results.map(mapPracticeTestToAdminTest));
      } catch {
        if (!active) return;
        setTests([]);
      }
    };

    void loadTests();

    return () => {
      active = false;
    };
  }, []);

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
  const importableTests = useMemo(() => {
    const cambridgeTests = tests.filter((item) => item.name.toLowerCase().includes("cambridge"));
    return cambridgeTests.length ? cambridgeTests : tests;
  }, [tests]);

  useEffect(() => {
    if (!importDialogOpen) {
      return;
    }

    if (!importableTests.length) {
      setSelectedImportTestId("");
      return;
    }

    if (!importableTests.some((item) => item.id === selectedImportTestId)) {
      setSelectedImportTestId(importableTests[0].id);
    }
  }, [importDialogOpen, importableTests, selectedImportTestId]);

  useEffect(() => {
    if (!downloadToastOpen) {
      return;
    }

    const timer = window.setTimeout(() => setDownloadToastOpen(false), 2400);
    return () => window.clearTimeout(timer);
  }, [downloadToastOpen]);

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

  const handleCreateTest = async (module: TestModule = "reading") => {
    try {
      const created = await practiceTestsService.create({
        title: t("row.newDraftTitle", {index: tests.length + 1}),
        description: "",
        test_type: module.toUpperCase(),
        difficulty_level: "INTERMEDIATE",
        test_format: "FULL_TEST",
        total_questions: 40,
        time_limit_seconds: module === "reading" ? 3600 : 1800,
        is_active: false
      });

      const mapped = mapPracticeTestToAdminTest(created);
      setTests((currentTests) => [mapped, ...currentTests]);
      setExpandedTestIds((currentExpanded) => new Set([mapped.id, ...currentExpanded]));
      setPage(1);
      navigateToBuilder(mapped.id);
    } catch {
      // Keep UI stable when API creation fails.
    }
  };

  const handleImportCambridge = () => {
    setImportDialogOpen(true);
  };

  const handleConfirmImport = () => {
    const selectedTest = importableTests.find((item) => item.id === selectedImportTestId);
    if (!selectedTest) {
      return;
    }

    setImportDialogOpen(false);
    setLastDownloadedTestName(selectedTest.name);
    setDownloadToastOpen(true);
    console.info("[admin-tests] cambridge-download-placeholder", selectedTest.id);
  };

  const handleDelete = async (testId: string) => {
    try {
      await practiceTestsService.remove(testId, {hard: true});
      setTests((currentTests) => currentTests.filter((item) => item.id !== testId));
      setExpandedTestIds((currentExpanded) => {
        const next = new Set(currentExpanded);
        next.delete(testId);
        return next;
      });
    } catch {
      // Keep UI stable when API deletion fails.
    }
  };

  const handleActivate = async (testId: string) => {
    try {
      await practiceTestsService.patch(testId, {is_active: true});
      setTests((currentTests) =>
        currentTests.map((item) =>
          item.id === testId
            ? {
                ...item,
                status: "published"
              }
            : item
        )
      );
    } catch {
      // Keep UI stable when API activation fails.
    }
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
            </div>

            <TestsTable
              tests={paginatedTests}
              expandedTestIds={expandedTestIds}
              onToggleExpand={handleToggleExpand}
              onEdit={handleEditTest}
              onPreview={handlePreviewTest}
              onActivate={handleActivate}
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

      <Sheet open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <SheetContent side="right" className="w-full max-w-[440px] border-l border-border/70 bg-background/95 p-0">
          <SheetHeader className="space-y-1">
            <SheetTitle>{t("importDialog.title")}</SheetTitle>
            <SheetDescription>{t("importDialog.description")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-2 px-6 pb-3">
            <p className="text-sm font-medium">{t("importDialog.selectLabel")}</p>

            {importableTests.length ? (
              <Select value={selectedImportTestId} onValueChange={setSelectedImportTestId}>
                <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                  <SelectValue placeholder={t("importDialog.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {importableTests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-xl border border-border/70 bg-card/45 px-3 py-2.5 text-sm text-muted-foreground">
                {t("importDialog.empty")}
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setImportDialogOpen(false)}>
              {t("importDialog.actions.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={handleConfirmImport} disabled={!selectedImportTestId}>
              {t("importDialog.actions.download")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {downloadToastOpen ? (
          <div className="min-w-[280px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("toast.downloadSuccessTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("toast.downloadSuccessDescription", {testName: lastDownloadedTestName})}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
