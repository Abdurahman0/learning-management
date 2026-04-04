"use client"

import {useCallback, useEffect, useMemo, useState} from "react"
import {useTranslations} from "next-intl"

import {AdminSidebar} from "../../_components/AdminSidebar"
import {
  type ContentBankPassage,
  type ContentBankTab,
  type ContentBankVariantSet,
  type ContentDifficultyFilterValue,
  type ContentModuleFilterValue,
  type ContentSourceFilterValue,
  type ContentTopicFilterValue,
  type CreateContentBankPassagePayload,
  type Option
} from "@/data/admin-content-bank"
import {Card} from "@/components/ui/card"
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet"

import {ContentBankHeader} from "./ContentBankHeader"
import {ContentBankTabs} from "./ContentBankTabs"
import {ContentFilters} from "./ContentFilters"
import {AddPassageDialog} from "./AddPassageDialog"
import {CreateVariantSetDialog, type CreateVariantSetInput, type UpdateVariantSetInput} from "./CreateVariantSetDialog"
import {PassagesTable} from "./PassagesTable"
import {QuestionVariantsTable} from "./QuestionVariantsTable"
import {SelectedPassagePanel} from "./SelectedPassagePanel"
import {adminContentBankService} from "@/src/services/admin/contentBank.service"
import {practiceTestsService} from "@/src/services/admin/practiceTests.service"
import {variantSetsService, type VariantSetRecord} from "@/src/services/admin/variantSets.service"
import {AdminApiError} from "@/src/services/admin/types"

const ACTION_NOTE_TIMEOUT_MS = 2600

type AdminTestSummary = {
  id: string
  name: string
  module: "reading" | "listening"
}

const CONTENT_MODULE_OPTIONS: Option<ContentModuleFilterValue>[] = [
  {value: "all", labelKey: "filters.module.allModules"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"}
]

const CONTENT_DIFFICULTY_OPTIONS: Option<ContentDifficultyFilterValue>[] = [
  {value: "all", labelKey: "filters.difficulty.allDifficulty"},
  {value: "easy", labelKey: "filters.difficulty.easy"},
  {value: "medium", labelKey: "filters.difficulty.medium"},
  {value: "hard", labelKey: "filters.difficulty.hard"}
]

const CONTENT_SOURCE_OPTIONS: Option<ContentSourceFilterValue>[] = [
  {value: "all", labelKey: "filters.source.anySource"},
  {value: "cambridge", labelKey: "filters.source.cambridge"},
  {value: "practice", labelKey: "filters.source.practice"},
  {value: "custom", labelKey: "filters.source.custom"}
]

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query)
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeVariantStatus(value: unknown): ContentBankVariantSet["status"] {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "PUBLISHED") return "published"
  if (normalized === "USED") return "used"
  return "draft"
}

function toVariantStatusApi(value: ContentBankVariantSet["status"]): "DRAFT" | "PUBLISHED" | "USED" {
  if (value === "published") return "PUBLISHED"
  if (value === "used") return "USED"
  return "DRAFT"
}

function mapPracticeTestSummary(item: {id?: unknown; title?: unknown; test_type?: unknown}): AdminTestSummary {
  const module = String(item.test_type ?? "").toUpperCase().includes("LISTENING") ? "listening" : "reading"
  return {
    id: asString(item.id),
    name: asString(item.title) || "Untitled Test",
    module
  }
}

function buildTopicOptions(passages: ContentBankPassage[]): Option<ContentTopicFilterValue>[] {
  const uniqueTopics = [...new Set(passages.map((item) => item.topic).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))

  return [
    {value: "all", labelKey: "filters.topic.allTopics"},
    ...uniqueTopics.map((topic) => ({value: topic, labelKey: `topics.${topic.toLowerCase().replace(/\s+/g, "_")}`}))
  ]
}

function mapVariantRecordToUi(payload: {
  row: VariantSetRecord
  passagesById: Map<string, ContentBankPassage>
  testsById: Map<string, AdminTestSummary>
  summaryFallback: string
}): ContentBankVariantSet | null {
  const {row, passagesById, testsById, summaryFallback} = payload

  const rawPassageId = row.reading_passage ?? row.listening_part
  const passageId = asString(rawPassageId)
  if (!passageId) return null

  const passage = passagesById.get(passageId)
  const module = passage?.module
    ?? (String(row.module ?? "").toUpperCase().includes("LISTENING") ? "listening" : "reading")
  const usedInTestIds = Array.isArray(row.used_in_tests)
    ? row.used_in_tests.map((item) => asString(item)).filter(Boolean)
    : []

  return {
    id: asString(row.id),
    passageId,
    passageTitle: passage?.title ?? "Untitled Passage",
    module,
    name: asString(row.name) || "Variant Set",
    status: normalizeVariantStatus(row.status),
    maxQuestionTypes: 6,
    groups: [],
    questionTypesSummary: summaryFallback,
    questionTypeKeys: [],
    questionSignature: asString(row.id),
    usedInTestIds,
    usedInTests: usedInTestIds.map((testId) => testsById.get(testId)).filter((item): item is AdminTestSummary => Boolean(item)),
    createdAt: asString(row.created_at) || new Date().toISOString()
  }
}

export function ContentBankPageClient() {
  const t = useTranslations("adminContentBank")
  const [activeTab, setActiveTab] = useState<ContentBankTab>("passages")
  const [searchValue, setSearchValue] = useState("")
  const [moduleFilter, setModuleFilter] = useState<ContentModuleFilterValue>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<ContentDifficultyFilterValue>("all")
  const [topicFilter, setTopicFilter] = useState<ContentTopicFilterValue>("all")
  const [sourceFilter, setSourceFilter] = useState<ContentSourceFilterValue>("all")
  const [onlyUnused, setOnlyUnused] = useState(false)
  const [onlyPublishedVariants, setOnlyPublishedVariants] = useState(false)
  const [passagesState, setPassagesState] = useState<ContentBankPassage[]>([])
  const [variants, setVariants] = useState<ContentBankVariantSet[]>([])
  const [tests, setTests] = useState<AdminTestSummary[]>([])
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null)
  const [addPassageDialogOpen, setAddPassageDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogPassageId, setCreateDialogPassageId] = useState<string | undefined>(undefined)
  const [editVariantDialogOpen, setEditVariantDialogOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [fullPassageId, setFullPassageId] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const testsById = useMemo(
    () => new Map(tests.map((test) => [test.id, test])),
    [tests]
  )

  const topicOptions = useMemo(() => buildTopicOptions(passagesState), [passagesState])

  const loadContentBank = useCallback(async () => {
    setIsLoading(true)

    try {
      const [passages, variantRows, practiceTests] = await Promise.all([
        adminContentBankService.listPassages(),
        variantSetsService.listAll({is_active: true, ordering: "-created_at"}),
        practiceTestsService.list({page: 1, pageSize: 200, ordering: "-created_at"})
      ])

      const testRows = practiceTests.results.map((item) =>
        mapPracticeTestSummary({
          id: item.id,
          title: item.title,
          test_type: item.test_type
        })
      )
      const passageMap = new Map(passages.map((item) => [item.id, item]))
      const testsMap = new Map(testRows.map((item) => [item.id, item]))
      const summaryFallback = t("createVariantDialog.summaryEmpty")
      const normalizedVariants = variantRows
        .map((row) =>
          mapVariantRecordToUi({
            row,
            passagesById: passageMap,
            testsById: testsMap,
            summaryFallback
          })
        )
        .filter((item): item is ContentBankVariantSet => Boolean(item))

      setPassagesState(passages)
      setVariants(normalizedVariants)
      setTests(testRows)
      setSelectedPassageId((current) => {
        if (current && passages.some((passage) => passage.id === current)) {
          return current
        }
        return passages[0]?.id ?? null
      })
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      setActionNote(message)
      setPassagesState([])
      setVariants([])
      setTests([])
      setSelectedPassageId(null)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadContentBank()
  }, [loadContentBank])

  useEffect(() => {
    if (!actionNote) return
    const timeout = window.setTimeout(() => setActionNote(null), ACTION_NOTE_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [actionNote])

  const query = searchValue.trim().toLowerCase()

  const filteredPassages = useMemo(() => {
    return passagesState.filter((passage) => {
      if (moduleFilter !== "all" && passage.module !== moduleFilter) return false
      if (difficultyFilter !== "all" && passage.difficulty !== difficultyFilter) return false
      if (topicFilter !== "all" && passage.topic !== topicFilter) return false
      if (sourceFilter !== "all" && passage.source !== sourceFilter) return false
      if (onlyUnused && passage.usedInTestIds.length > 0) return false
      if (onlyPublishedVariants && !variants.some((variant) => variant.passageId === passage.id && variant.status !== "draft")) return false

      if (!query) return true

      const variantMatches = variants.some(
        (variant) =>
          variant.passageId === passage.id &&
          (matchesSearch(variant.name, query) || matchesSearch(variant.questionTypesSummary, query))
      )

      return (
        matchesSearch(passage.title, query) ||
        matchesSearch(passage.topic, query) ||
        matchesSearch(passage.previewText, query) ||
        variantMatches
      )
    })
  }, [
    difficultyFilter,
    moduleFilter,
    onlyPublishedVariants,
    onlyUnused,
    passagesState,
    query,
    sourceFilter,
    topicFilter,
    variants
  ])

  const filteredVariants = useMemo(() => {
    const passagesById = new Map(passagesState.map((passage) => [passage.id, passage]))

    return variants.filter((variant) => {
      const passage = passagesById.get(variant.passageId)
      if (!passage) return false
      if (moduleFilter !== "all" && passage.module !== moduleFilter) return false
      if (difficultyFilter !== "all" && passage.difficulty !== difficultyFilter) return false
      if (topicFilter !== "all" && passage.topic !== topicFilter) return false
      if (sourceFilter !== "all" && passage.source !== sourceFilter) return false
      if (onlyUnused && variant.usedInTestIds.length > 0) return false
      if (onlyPublishedVariants && variant.status === "draft") return false
      if (!query) return true

      return (
        matchesSearch(variant.name, query) ||
        matchesSearch(variant.questionTypesSummary, query) ||
        matchesSearch(passage.title, query) ||
        variant.usedInTests.some((test) => matchesSearch(test.name, query))
      )
    })
  }, [
    difficultyFilter,
    moduleFilter,
    onlyPublishedVariants,
    onlyUnused,
    passagesState,
    query,
    sourceFilter,
    topicFilter,
    variants
  ])

  const resolvedSelectedPassageId = useMemo(() => {
    if (!filteredPassages.length) return null
    if (selectedPassageId && filteredPassages.some((passage) => passage.id === selectedPassageId)) {
      return selectedPassageId
    }
    return filteredPassages[0].id
  }, [filteredPassages, selectedPassageId])

  const selectedPassage = useMemo(
    () => passagesState.find((passage) => passage.id === resolvedSelectedPassageId) ?? null,
    [passagesState, resolvedSelectedPassageId]
  )
  const selectedPassageVariants = useMemo(
    () => variants.filter((variant) => variant.passageId === resolvedSelectedPassageId),
    [resolvedSelectedPassageId, variants]
  )
  const fullPassage = useMemo(
    () => passagesState.find((passage) => passage.id === fullPassageId) ?? null,
    [fullPassageId, passagesState]
  )
  const editingVariant = useMemo(
    () => variants.find((variant) => variant.id === editingVariantId) ?? null,
    [editingVariantId, variants]
  )

  const postAction = (message: string) => {
    setActionNote(message)
  }

  const openCreateVariant = (passageId?: string) => {
    setCreateDialogPassageId(passageId ?? resolvedSelectedPassageId ?? undefined)
    setCreateDialogOpen(true)
  }

  const handleCreatePassage = async (payload: CreateContentBankPassagePayload) => {
    try {
      await adminContentBankService.createPassage({
        title: payload.title,
        module: payload.module,
        difficulty: payload.difficulty,
        topic: payload.topic,
        source: payload.source,
        contentType: payload.module === "reading" ? "passage" : "transcript",
        tags: [],
        notes: undefined,
        previewText: payload.previewText,
        fullText: payload.fullText && payload.fullText.length > 0 ? payload.fullText : [payload.previewText],
        estimatedTimeLabel: payload.estimatedTimeLabel,
        durationMinutes: payload.durationMinutes,
        status: "draft",
        questionCount: 0
      })
      await loadContentBank()
      postAction(t("feedback.passageCreated", {name: payload.title}))
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      postAction(message)
    }
  }

  const handleCreateVariant = async (payload: CreateVariantSetInput) => {
    try {
      const selected = passagesState.find((item) => item.id === payload.passageId)
      if (!selected) return

      await variantSetsService.create({
        module: selected.module,
        ownerId: selected.id,
        name: payload.name,
        status: toVariantStatusApi(payload.status),
        is_active: true
      })

      await loadContentBank()
      setSelectedPassageId(payload.passageId)
      postAction(t("feedback.variantCreated", {name: payload.name}))
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      postAction(message)
    }
  }

  const handleDeletePassage = async (passageId: string) => {
    const source = passagesState.find((item) => item.id === passageId)
    if (!source) return

    const shouldDelete = window.confirm(t("feedback.confirmDeletePassage", {name: source.title}))
    if (!shouldDelete) return

    try {
      await adminContentBankService.deletePassage(source.id, source.module)
      await loadContentBank()
      if (fullPassageId === source.id) {
        setFullPassageId(null)
      }
      postAction(t("feedback.passageDeleted", {name: source.title}))
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      postAction(message)
    }
  }

  const handleArchiveVariant = async (variantId: string) => {
    try {
      const source = variants.find((variant) => variant.id === variantId)
      if (!source) return
      await variantSetsService.remove(variantId)
      await loadContentBank()
      postAction(t("feedback.variantArchived", {name: source.name}))
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      postAction(message)
    }
  }

  const handleEditVariant = (variantId: string) => {
    const source = variants.find((variant) => variant.id === variantId)
    if (!source) return
    setEditingVariantId(source.id)
    setEditVariantDialogOpen(true)
  }

  const handleSaveVariant = async (payload: UpdateVariantSetInput) => {
    try {
      const passage = passagesState.find((item) => item.id === payload.passageId)
      if (!passage) return

      await variantSetsService.patch(payload.id, {
        name: payload.name,
        status: toVariantStatusApi(payload.status),
        is_active: true,
        ...(passage.module === "reading" ? {reading_passage: passage.id} : {listening_part: passage.id})
      })

      await loadContentBank()
      setSelectedPassageId(payload.passageId)
      postAction(t("feedback.variantUpdated", {name: payload.name}))
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : t("feedback.genericError")
      postAction(message)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <ContentBankHeader
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onImportCsv={() => postAction(t("feedback.importCsvRequested"))}
            onAddNewPassage={() => setAddPassageDialogOpen(true)}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            {actionNote ? (
              <Card className="rounded-xl border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                {actionNote}
              </Card>
            ) : null}

            <ContentBankTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              passageCount={filteredPassages.length}
              variantCount={filteredVariants.length}
            />

            <ContentFilters
              moduleValue={moduleFilter}
              difficultyValue={difficultyFilter}
              topicValue={topicFilter}
              sourceValue={sourceFilter}
              moduleOptions={[...CONTENT_MODULE_OPTIONS]}
              difficultyOptions={[...CONTENT_DIFFICULTY_OPTIONS]}
              topicOptions={topicOptions}
              sourceOptions={[...CONTENT_SOURCE_OPTIONS]}
              onlyUnused={onlyUnused}
              onlyPublishedVariants={onlyPublishedVariants}
              onModuleChange={setModuleFilter}
              onDifficultyChange={setDifficultyFilter}
              onTopicChange={setTopicFilter}
              onSourceChange={setSourceFilter}
              onOnlyUnusedChange={setOnlyUnused}
              onOnlyPublishedVariantsChange={setOnlyPublishedVariants}
            />

            {isLoading ? (
              <Card className="rounded-2xl border-border/70 bg-card/70 p-6">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </Card>
            ) : activeTab === "passages" ? (
              <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <div className="min-w-0 space-y-2">
                  <PassagesTable
                    passages={filteredPassages}
                    testsById={testsById}
                    selectedPassageId={resolvedSelectedPassageId}
                    onSelectPassage={setSelectedPassageId}
                    onReadFullPassage={setFullPassageId}
                    onOpenCreateVariant={openCreateVariant}
                    onDeletePassage={(passageId) => void handleDeletePassage(passageId)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("table.showingResults", {visible: filteredPassages.length, total: passagesState.length})}
                  </p>
                </div>

                <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
                  <SelectedPassagePanel
                    passage={selectedPassage}
                    variants={selectedPassageVariants}
                    onReadFullPassage={setFullPassageId}
                    onCreateNewVariant={openCreateVariant}
                    onPreviewVariant={(variantId) => {
                      const variant = variants.find((item) => item.id === variantId)
                      if (!variant) return
                      postAction(t("feedback.previewQuestionsRequested", {name: variant.name}))
                    }}
                    onArchiveVariant={handleArchiveVariant}
                  />
                </div>
              </section>
            ) : (
              <section className="space-y-2">
                <QuestionVariantsTable
                  variants={filteredVariants}
                  onEdit={handleEditVariant}
                  onArchive={handleArchiveVariant}
                />
                <p className="text-xs text-muted-foreground">
                  {t("variantsTable.showingResults", {visible: filteredVariants.length, total: variants.length})}
                </p>
              </section>
            )}
          </main>
        </div>
      </div>

      <CreateVariantSetDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        passages={passagesState}
        tests={tests}
        defaultPassageId={createDialogPassageId}
        onCreate={(payload) => void handleCreateVariant(payload)}
      />

      <CreateVariantSetDialog
        mode="edit"
        open={editVariantDialogOpen}
        onOpenChange={(open) => {
          setEditVariantDialogOpen(open)
          if (!open) setEditingVariantId(null)
        }}
        passages={passagesState}
        tests={tests}
        variant={editingVariant}
        onSave={(payload) => void handleSaveVariant(payload)}
      />

      <AddPassageDialog
        open={addPassageDialogOpen}
        onOpenChange={setAddPassageDialogOpen}
        onCreate={(payload) => void handleCreatePassage(payload)}
      />

      <Sheet open={guidelinesOpen} onOpenChange={setGuidelinesOpen}>
        <SheetContent className="border-l border-border/70 bg-background/95 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("guidelines.title")}</SheetTitle>
            <SheetDescription>{t("guidelines.subtitle")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-6 pb-6 text-sm text-muted-foreground">
            <p>{t("guidelines.rule1")}</p>
            <p>{t("guidelines.rule2")}</p>
            <p>{t("guidelines.rule3")}</p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(fullPassage)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setFullPassageId(null)
        }}
      >
        <SheetContent className="w-full border-l border-border/70 bg-background/95 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{fullPassage?.title ?? t("readFullPassage")}</SheetTitle>
            <SheetDescription>
              {fullPassage
                ? t("fullPassageMeta", {
                    module: t(`modules.${fullPassage.module}`),
                    count:
                      fullPassage.module === "reading"
                        ? `${fullPassage.wordCount ?? 0} ${t("wordCountLabel")}`
                        : `${fullPassage.durationMinutes ?? 0} ${t("minutesLabel")}`
                  })
                : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-6 pb-6">
            {(fullPassage?.fullText ?? []).map((paragraph, index) => (
              <p key={`${fullPassage?.id}-${index}`} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
