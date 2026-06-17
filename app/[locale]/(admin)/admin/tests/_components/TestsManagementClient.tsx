"use client";

import {useEffect, useMemo, useState} from "react";
import {CheckCircle2, FolderPlus, Pencil, Plus, Save, Search, Trash2, Upload, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {ConfirmModal} from "@/components/ui/confirm-modal";
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
  type QuestionTypeFilterValue,
  TEST_QUESTION_TYPE_OPTIONS,
  type StatusFilterValue,
  type TestModule,
  type TestSort
} from "@/data/admin-tests";
import {practiceTestGroupsService, practiceTestsService} from "@/src/services/admin/practiceTests.service";
import type {PracticeTestDetailRecord, PracticeTestGroupRecord, PracticeTestRecord} from "@/src/services/admin/types";

import {AdminProfileMenu} from "../../_components/AdminProfileMenu";
import {AdminSidebar, AdminSidebarMobileNav} from "../../_components/AdminSidebar";
import {AdminNotificationBell} from "../../_components/AdminNotificationBell";
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

function collectQuestionTypes(detail: PracticeTestDetailRecord) {
  const types = new Set<string>();

  const addType = (value: unknown) => {
    const normalized = String(value ?? "").trim().toUpperCase();
    if (normalized) {
      types.add(normalized);
    }
  };

  (detail.question_groups ?? []).forEach((group) => {
    if (group && typeof group === "object") {
      addType((group as {question_type?: unknown}).question_type);
    }
  });

  (detail.reading_passages ?? []).forEach((passage) => {
    (passage.question_groups ?? []).forEach((group) => addType(group.question_type));
  });

  (detail.listening_parts ?? []).forEach((part) => {
    (part.question_groups ?? []).forEach((group) => addType(group.question_type));
  });

  return [...types];
}

function mapDifficulty(value: string): AdminTest["difficulty"] {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized.includes("BEGINNER")) return "beginner";
  if (normalized.includes("ADVANCED")) return "advanced";
  return "intermediate";
}

function mapStatus(isActive: boolean): AdminTest["status"] {
  return isActive ? "published" : "draft";
}

function mapTestFormat(value: unknown): NonNullable<AdminTest["testFormat"]> {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PART_TEST") return "part";
  if (normalized === "BOTH") return "both";
  return "full";
}

function mapPracticeTestToAdminTest(item: PracticeTestRecord): AdminTest {
  const testModule = String(item.test_type ?? "").trim().toUpperCase().includes("LISTENING") ? "listening" : "reading";
  const testFormat = mapTestFormat(item.test_format);
  const readingCount = Number(item.reading_passages_count ?? 0);
  const listeningCount = Number(item.listening_parts_count ?? 0);
  const defaultReadingCount = testFormat === "part" ? 1 : 3;
  const defaultListeningCount = testFormat === "part" ? 1 : 4;
  const sectionsCount = testModule === "reading" ? Math.max(readingCount, defaultReadingCount) : Math.max(listeningCount, defaultListeningCount);
  const questionsPerSection = testModule === "reading" ? [13, 13, 14] : [10, 10, 10, 10];

  return {
    id: String(item.id),
    name: item.title || "Untitled Test",
    module: testModule,
    testFormat,
    book: "Custom Practice",
    displayOrder: typeof item.display_order === "number" ? item.display_order : null,
    groupId: item.group_id == null ? null : String(item.group_id),
    groupName: item.group_name ?? null,
    questions: Number(item.total_questions ?? 0),
    difficulty: mapDifficulty(item.difficulty_level),
    status: mapStatus(Boolean(item.is_active)),
    createdAt: String(item.created_at ?? item.updated_at ?? new Date().toISOString()).slice(0, 10),
    passages:
      testModule === "reading"
        ? Array.from({length: sectionsCount}, (_, index) => ({
            id: `${item.id}-p-${index + 1}`,
            title: `Passage ${index + 1}`,
            shortDescription: "",
            questionCount: questionsPerSection[index] ?? 13
          }))
        : undefined,
    sections:
      testModule === "listening"
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
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [sortBy, setSortBy] = useState<TestSort>("newest");
  const [questionTypesByTestId, setQuestionTypesByTestId] = useState<Record<string, string[]>>({});
  const [groups, setGroups] = useState<PracticeTestGroupRecord[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupDescription, setEditingGroupDescription] = useState("");
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<PracticeTestGroupRecord | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [draggingTestId, setDraggingTestId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
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
        setTests(response.results.map(mapPracticeTestToAdminTest).sort((a, b) => {
          const left = typeof a.displayOrder === "number" ? a.displayOrder : Number.MAX_SAFE_INTEGER;
          const right = typeof b.displayOrder === "number" ? b.displayOrder : Number.MAX_SAFE_INTEGER;
          if (left !== right) return left - right;
          return a.name.localeCompare(b.name);
        }));
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

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      try {
        const response = await practiceTestGroupsService.list({pageSize: 100});
        if (!active) return;
        setGroups(response.results);
      } catch {
        if (!active) return;
        setGroups([]);
      }
    };

    void loadGroups();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (questionTypeFilter === "all" || tests.length === 0) {
      return;
    }

    const missingTestIds = tests.map((item) => item.id).filter((id) => !(id in questionTypesByTestId));
    if (!missingTestIds.length) {
      return;
    }

    let active = true;

    const loadQuestionTypesForTests = async () => {
      const entries = await Promise.all(
        missingTestIds.map(async (testId) => {
          try {
            const detail = await practiceTestsService.getById(testId);
            return [testId, collectQuestionTypes(detail)] as const;
          } catch {
            return [testId, []] as const;
          }
        })
      );

      if (!active) return;

      setQuestionTypesByTestId((current) => {
        const next = {...current};
        for (const [testId, types] of entries) {
          next[testId] = [...types];
        }
        return next;
      });
    };

    void loadQuestionTypesForTests();

    return () => {
      active = false;
    };
  }, [questionTypeFilter, questionTypesByTestId, tests]);

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

      if (questionTypeFilter !== "all") {
        const testTypes = questionTypesByTestId[item.id] ?? [];
        if (!testTypes.includes(questionTypeFilter)) {
          return false;
        }
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
  }, [tests, searchValue, moduleFilter, difficultyFilter, questionTypeFilter, questionTypesByTestId, statusFilter]);

  const sortedTests = useMemo(() => {
    const copy = [...filteredTests];

    copy.sort((left, right) => {
      if (sortBy === "newest") {
        const leftOrder = typeof left.displayOrder === "number" ? left.displayOrder : Number.MAX_SAFE_INTEGER;
        const rightOrder = typeof right.displayOrder === "number" ? right.displayOrder : Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.name.localeCompare(right.name);
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
      const timer = window.setTimeout(() => setSelectedImportTestId(""), 0);
      return () => window.clearTimeout(timer);
    }

    if (!importableTests.some((item) => item.id === selectedImportTestId)) {
      const timer = window.setTimeout(() => setSelectedImportTestId(importableTests[0].id), 0);
      return () => window.clearTimeout(timer);
    }

    return () => undefined;
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

  const handleCreateTest = async (module: TestModule = "reading", format: "full" | "part" = "full") => {
    const isReadingPart = module === "reading" && format === "part";
    const isListeningPart = module === "listening" && format === "part";
    const isPart = isReadingPart || isListeningPart;

    try {
      const created = await practiceTestsService.create({
        title: isReadingPart
          ? t("row.newPassageDraftTitle", {index: tests.length + 1})
          : isListeningPart
            ? t("row.newListeningPartDraftTitle", {index: tests.length + 1})
            : t("row.newDraftTitle", {index: tests.length + 1}),
        description: "",
        test_type: module.toUpperCase(),
        difficulty_level: "INTERMEDIATE",
        // Default: keep drafts visible only to registered users unless explicitly made public later.
        active_for_registered_users: true,
        // Default: custom/admin-created test (backend can default if field is optional).
        practice_source: "CUSTOM_PRACTICE",
        test_format: isPart ? "PART_TEST" : "FULL_TEST",
        total_questions: isReadingPart ? 13 : isListeningPart ? 10 : 40,
        time_limit_seconds: isReadingPart ? 1200 : isListeningPart ? 600 : module === "reading" ? 3600 : 1800,
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
    const deletedTest = tests.find((item) => item.id === testId) ?? null;
    try {
      await practiceTestsService.remove(testId, {hard: true});
      setTests((currentTests) => currentTests.filter((item) => item.id !== testId));
      if (deletedTest?.groupId) {
        setGroups((currentGroups) =>
          currentGroups.map((group) =>
            String(group.id) === deletedTest.groupId
              ? {
                  ...group,
                  test_count: Math.max(0, Number(group.test_count ?? 0) - 1)
                }
              : group
          )
        );
      }
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

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;

    try {
      const created = await practiceTestGroupsService.create({
        name,
        description: newGroupDescription.trim()
      });
      setGroups((current) => [...current, created]);
      setNewGroupName("");
      setNewGroupDescription("");
    } catch {
      // Keep UI stable when group creation fails.
    }
  };

  const handleStartEditGroup = (group: PracticeTestGroupRecord) => {
    setEditingGroupId(String(group.id));
    setEditingGroupName(group.name);
    setEditingGroupDescription(group.description ?? "");
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
    setEditingGroupDescription("");
    setSavingGroupId(null);
  };

  const handleSaveGroup = async () => {
    if (!editingGroupId) return;

    const name = editingGroupName.trim();
    if (!name) return;

    setSavingGroupId(editingGroupId);

    try {
      const updated = await practiceTestGroupsService.patch(editingGroupId, {
        name,
        description: editingGroupDescription.trim()
      });

      setGroups((current) => current.map((group) => (String(group.id) === editingGroupId ? updated : group)));
      setTests((current) =>
        current.map((test) =>
          test.groupId === editingGroupId
            ? {
                ...test,
                groupName: updated.name
              }
            : test
        )
      );
      handleCancelEditGroup();
    } catch {
      setSavingGroupId(null);
    }
  };

  const handleDeleteGroup = async (group: PracticeTestGroupRecord) => {
    const groupId = String(group.id);
    setDeletingGroupId(groupId);

    try {
      await practiceTestGroupsService.remove(groupId);
      setGroups((current) => current.filter((item) => String(item.id) !== groupId));
      setTests((current) =>
        current.map((test) =>
          test.groupId === groupId
            ? {
                ...test,
                groupId: null,
                groupName: null
              }
            : test
        )
      );
      if (editingGroupId === groupId) {
        handleCancelEditGroup();
      }
    } catch {
      // Keep UI stable when group deletion fails.
    } finally {
      setPendingDeleteGroup(null);
      setDeletingGroupId(null);
    }
  };

  const handleAssignGroup = async (testId: string, groupId: string) => {
    const normalizedGroupId = groupId === "none" ? null : groupId;
    const previousGroupId = tests.find((item) => item.id === testId)?.groupId ?? null;
    const group = normalizedGroupId ? groups.find((item) => String(item.id) === normalizedGroupId) : null;
    try {
      await practiceTestsService.patch(testId, {group: normalizedGroupId});
      setTests((current) =>
        current.map((item) =>
          item.id === testId
            ? {
                ...item,
                groupId: normalizedGroupId,
                groupName: group?.name ?? null
              }
            : item
        )
      );
      if (previousGroupId !== normalizedGroupId) {
        setGroups((current) =>
          current.map((item) => {
            const itemId = String(item.id);
            if (itemId === previousGroupId) {
              return {
                ...item,
                test_count: Math.max(0, Number(item.test_count ?? 0) - 1)
              };
            }
            if (itemId === normalizedGroupId) {
              return {
                ...item,
                test_count: Number(item.test_count ?? 0) + 1
              };
            }
            return item;
          })
        );
      }
    } catch {
      // Keep previous value if backend rejects assignment.
    }
  };

  const handleReorder = async (draggedId: string, targetId: string) => {
    const draggedIndex = sortedTests.findIndex((item) => item.id === draggedId);
    const targetIndex = sortedTests.findIndex((item) => item.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return;

    const reorderedVisible = [...sortedTests];
    const [dragged] = reorderedVisible.splice(draggedIndex, 1);
    reorderedVisible.splice(targetIndex, 0, dragged);

    const visibleIds = new Set(reorderedVisible.map((item) => item.id));
    const nextTests = [
      ...reorderedVisible,
      ...tests.filter((item) => !visibleIds.has(item.id))
    ].map((item, index) => ({
      ...item,
      displayOrder: index + 1
    }));

    setTests(nextTests);
    setIsSavingOrder(true);
    try {
      const response = await practiceTestsService.reorder(nextTests.map((item) => item.id));
      const mapped = response.map(mapPracticeTestToAdminTest);
      if (mapped.length) {
        setTests(mapped);
      }
    } catch {
      // Keep optimistic order; next page load will reconcile with backend if save failed.
    } finally {
      setIsSavingOrder(false);
      setDraggingTestId(null);
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
    setQuestionTypeFilter("all");
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
                    <DropdownMenuItem onSelect={() => handleCreateTest("reading", "full")}>{t("topbar.createReadingDefault")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleCreateTest("reading", "part")}>{t("topbar.createReadingPassage")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleCreateTest("listening", "full")}>{t("topbar.createListening")}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleCreateTest("listening", "part")}>{t("topbar.createListeningPart")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <ThemeToggle />

                <AdminNotificationBell label={t("topbar.notificationsLabel")} />

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
                  <DropdownMenuItem onSelect={() => handleCreateTest("reading", "full")}>{t("topbar.createReadingDefault")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCreateTest("reading", "part")}>{t("topbar.createReadingPassage")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCreateTest("listening", "full")}>{t("topbar.createListening")}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCreateTest("listening", "part")}>{t("topbar.createListeningPart")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <TestsFilters
              moduleValue={moduleFilter}
              difficultyValue={difficultyFilter}
              questionTypeValue={questionTypeFilter}
              statusValue={statusFilter}
              sortValue={sortBy}
              moduleOptions={TEST_MODULE_OPTIONS}
              difficultyOptions={TEST_DIFFICULTY_OPTIONS}
              questionTypeOptions={TEST_QUESTION_TYPE_OPTIONS}
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
              onQuestionTypeChange={(value) => {
                setQuestionTypeFilter(value);
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

            <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/70 p-4 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-500/12 text-blue-400">
                    <FolderPlus className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{t("groups.title")}</h2>
                    <p className="text-xs text-muted-foreground">{t("groups.description")}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {groups.length ? (
                    groups.map((group) => (
                      <div
                        key={String(group.id)}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-3 py-3"
                      >
                        {editingGroupId === String(group.id) ? (
                          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1fr]">
                            <Input
                              value={editingGroupName}
                              onChange={(event) => setEditingGroupName(event.target.value)}
                              placeholder={t("groups.namePlaceholder")}
                              className="h-10 rounded-xl border-border/70 bg-background/45"
                            />
                            <Input
                              value={editingGroupDescription}
                              onChange={(event) => setEditingGroupDescription(event.target.value)}
                              placeholder={t("groups.descriptionPlaceholder")}
                              className="h-10 rounded-xl border-border/70 bg-background/45"
                            />
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("groups.testCount", {count: Number(group.test_count ?? 0)})}
                            </p>
                            {group.description ? (
                              <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
                            ) : null}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {editingGroupId === String(group.id) ? (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-9 rounded-xl"
                                onClick={handleCancelEditGroup}
                              >
                                <X className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                className="size-9 rounded-xl"
                                onClick={handleSaveGroup}
                                disabled={!editingGroupName.trim() || savingGroupId === String(group.id)}
                              >
                                <Save className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-9 rounded-xl"
                                onClick={() => handleStartEditGroup(group)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="size-9 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                onClick={() => setPendingDeleteGroup(group)}
                                disabled={deletingGroupId === String(group.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("groups.empty")}</span>
                  )}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder={t("groups.namePlaceholder")}
                  className="h-10 rounded-xl border-border/70 bg-background/45"
                />
                <Input
                  value={newGroupDescription}
                  onChange={(event) => setNewGroupDescription(event.target.value)}
                  placeholder={t("groups.descriptionPlaceholder")}
                  className="h-10 rounded-xl border-border/70 bg-background/45"
                />
                <Button type="button" className="h-10 rounded-xl" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  <Plus className="size-4" />
                  {t("groups.create")}
                </Button>
              </div>
            </div>

            {isSavingOrder ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                <Save className="size-3.5" />
                {t("ordering.saving")}
              </div>
            ) : null}

            <TestsTable
              tests={paginatedTests}
              groups={groups.map((group) => ({id: String(group.id), name: group.name}))}
              expandedTestIds={expandedTestIds}
              onToggleExpand={handleToggleExpand}
              onEdit={handleEditTest}
              onPreview={handlePreviewTest}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onAssignGroup={handleAssignGroup}
              onEditPassage={handleEditPassage}
              onReorder={handleReorder}
              draggingTestId={draggingTestId}
              onDragStart={setDraggingTestId}
              onDragEnd={() => setDraggingTestId(null)}
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={sortedTests.length}
              totalPages={totalPages}
              onPageChange={(nextPage) => setPage(Math.min(Math.max(1, nextPage), totalPages))}
            />

            {paginatedTests.length ? (
              <div className="rounded-3xl border border-border/70 bg-card/70 p-4">
                <h2 className="text-sm font-semibold">{t("groups.assignTitle")}</h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/45 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{test.name}</p>
                        <p className="text-xs text-muted-foreground">{test.groupName ?? t("groups.noGroup")}</p>
                      </div>
                      <Select value={test.groupId ?? "none"} onValueChange={(value) => handleAssignGroup(test.id, value)}>
                        <SelectTrigger className="h-9 w-42 rounded-xl border-border/70 bg-card/70 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("groups.noGroup")}</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={String(group.id)} value={String(group.id)}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDeleteGroup)}
        title={t("groups.deleteTitle")}
        description={
          pendingDeleteGroup
            ? t("groups.deleteConfirm", {name: pendingDeleteGroup.name})
            : t("groups.deleteDescriptionFallback")
        }
        confirmText={t("groups.deleteAction")}
        cancelText={t("groups.cancel")}
        confirmVariant="destructive"
        onCancel={() => {
          if (!deletingGroupId) {
            setPendingDeleteGroup(null);
          }
        }}
        onConfirm={() => {
          if (pendingDeleteGroup) {
            void handleDeleteGroup(pendingDeleteGroup);
          }
        }}
      />

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
