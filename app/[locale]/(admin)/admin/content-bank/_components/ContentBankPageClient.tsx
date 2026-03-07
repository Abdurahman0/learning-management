"use client"

import {useEffect, useMemo, useState} from "react"
import {useTranslations} from "next-intl"

import {AdminSidebar} from "../../_components/AdminSidebar"
import {
  CONTENT_BANK_DATA,
  CONTENT_DIFFICULTY_OPTIONS,
  CONTENT_MODULE_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  CONTENT_TOPIC_OPTIONS,
  type ContentBankPassage,
  type ContentBankTab,
  type ContentBankVariantSet,
  type ContentDifficultyFilterValue,
  type ContentModuleFilterValue,
  type ContentSourceFilterValue,
  type ContentTopicFilterValue
} from "@/data/admin-content-bank"
import {Card} from "@/components/ui/card"
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet"

import {ContentBankHeader} from "./ContentBankHeader"
import {ContentBankTabs} from "./ContentBankTabs"
import {ContentFilters} from "./ContentFilters"
import {CreateVariantSetDialog, type CreateVariantSetInput} from "./CreateVariantSetDialog"
import {PassagesTable} from "./PassagesTable"
import {PlatformRuleBanner} from "./PlatformRuleBanner"
import {QuestionVariantsTable} from "./QuestionVariantsTable"
import {SelectedPassagePanel} from "./SelectedPassagePanel"

const ACTION_NOTE_TIMEOUT_MS = 2600

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query)
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
  const [variants, setVariants] = useState<ContentBankVariantSet[]>(CONTENT_BANK_DATA.variants)
  const [archivedVariantIds, setArchivedVariantIds] = useState<Set<string>>(new Set())
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(CONTENT_BANK_DATA.passages[0]?.id ?? null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogPassageId, setCreateDialogPassageId] = useState<string | undefined>(undefined)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [fullPassageId, setFullPassageId] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string | null>(null)

  const testsById = useMemo(
    () => new Map(CONTENT_BANK_DATA.tests.map((test) => [test.id, test])),
    []
  )
  const basePassagesById = useMemo(
    () => new Map(CONTENT_BANK_DATA.passages.map((passage) => [passage.id, passage])),
    []
  )

  const activeVariants = useMemo(
    () => variants.filter((variant) => !archivedVariantIds.has(variant.id)),
    [archivedVariantIds, variants]
  )

  const passages = useMemo<ContentBankPassage[]>(() => {
    return CONTENT_BANK_DATA.passages.map((passage) => {
      const attachedVariants = activeVariants.filter((variant) => variant.passageId === passage.id)
      const usedInTestIds = [...new Set([...passage.usedInTestIds, ...attachedVariants.flatMap((variant) => variant.usedInTestIds)])]

      return {
        ...passage,
        variantIds: attachedVariants.map((variant) => variant.id),
        variantCount: attachedVariants.length,
        usedInTestIds
      }
    })
  }, [activeVariants])

  const query = searchValue.trim().toLowerCase()

  const filteredPassages = useMemo(() => {
    return passages.filter((passage) => {
      if (moduleFilter !== "all" && passage.module !== moduleFilter) return false
      if (difficultyFilter !== "all" && passage.difficulty !== difficultyFilter) return false
      if (topicFilter !== "all" && passage.topic !== topicFilter) return false
      if (sourceFilter !== "all" && passage.source !== sourceFilter) return false
      if (onlyUnused && passage.usedInTestIds.length > 0) return false
      if (onlyPublishedVariants && !activeVariants.some((variant) => variant.passageId === passage.id && variant.status !== "draft")) return false

      if (!query) return true

      const variantMatches = activeVariants.some(
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
    activeVariants,
    difficultyFilter,
    moduleFilter,
    onlyPublishedVariants,
    onlyUnused,
    passages,
    query,
    sourceFilter,
    topicFilter
  ])

  const filteredVariants = useMemo(() => {
    return activeVariants.filter((variant) => {
      const passage = basePassagesById.get(variant.passageId)
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
    activeVariants,
    basePassagesById,
    difficultyFilter,
    moduleFilter,
    onlyPublishedVariants,
    onlyUnused,
    query,
    sourceFilter,
    topicFilter
  ])

  useEffect(() => {
    if (!actionNote) return
    const timeout = window.setTimeout(() => setActionNote(null), ACTION_NOTE_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [actionNote])

  const resolvedSelectedPassageId = useMemo(() => {
    if (!filteredPassages.length) return null
    if (selectedPassageId && filteredPassages.some((passage) => passage.id === selectedPassageId)) {
      return selectedPassageId
    }
    return filteredPassages[0].id
  }, [filteredPassages, selectedPassageId])

  const selectedPassage = useMemo(
    () => passages.find((passage) => passage.id === resolvedSelectedPassageId) ?? null,
    [passages, resolvedSelectedPassageId]
  )
  const selectedPassageVariants = useMemo(
    () => activeVariants.filter((variant) => variant.passageId === resolvedSelectedPassageId),
    [activeVariants, resolvedSelectedPassageId]
  )
  const fullPassage = useMemo(
    () => passages.find((passage) => passage.id === fullPassageId) ?? null,
    [fullPassageId, passages]
  )

  const postAction = (message: string) => {
    setActionNote(message)
  }

  const openCreateVariant = (passageId?: string) => {
    setCreateDialogPassageId(passageId ?? resolvedSelectedPassageId ?? undefined)
    setCreateDialogOpen(true)
  }

  const handleCreateVariant = (payload: CreateVariantSetInput) => {
    const now = Date.now()
    const passage = basePassagesById.get(payload.passageId)
    const usedInTests = payload.usedInTestIds
      .map((testId) => testsById.get(testId))
      .filter((test): test is NonNullable<typeof test> => Boolean(test))

    const nextVariant: ContentBankVariantSet = {
      id: `variant-${now}`,
      passageId: payload.passageId,
      passageTitle: passage?.title ?? t("labels.unknownPassage"),
      module: passage?.module ?? "reading",
      name: payload.name,
      status: payload.status,
      questionTypesSummary: payload.questionTypesSummary,
      questionTypeKeys: payload.questionTypeKeys,
      questionSignature: `custom-${now}`,
      usedInTestIds: [...payload.usedInTestIds],
      usedInTests,
      createdAt: new Date(now).toISOString().slice(0, 10)
    }

    setVariants((current) => [nextVariant, ...current])
    setSelectedPassageId(payload.passageId)
    postAction(t("feedback.variantCreated", {name: payload.name}))
  }

  const handleDuplicateVariant = (variantId: string) => {
    const source = activeVariants.find((variant) => variant.id === variantId)
    if (!source) return
    const now = Date.now()
    const copy: ContentBankVariantSet = {
      ...source,
      id: `variant-copy-${now}`,
      name: `${source.name} ${t("labels.copySuffix")}`,
      status: "draft",
      usedInTestIds: [],
      usedInTests: [],
      questionSignature: `${source.questionSignature}-copy-${now}`,
      createdAt: new Date(now).toISOString().slice(0, 10)
    }
    setVariants((current) => [copy, ...current])
    postAction(t("feedback.variantDuplicated", {name: source.name}))
  }

  const handleArchiveVariant = (variantId: string) => {
    const source = activeVariants.find((variant) => variant.id === variantId)
    if (!source) return
    setArchivedVariantIds((current) => new Set([...current, variantId]))
    postAction(t("feedback.variantArchived", {name: source.name}))
  }

  const handleEditVariant = (variantId: string) => {
    const source = activeVariants.find((variant) => variant.id === variantId)
    if (!source) return
    postAction(t("feedback.variantEditRequested", {name: source.name}))
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
            onAddNewPassage={() => postAction(t("feedback.addPassageRequested"))}
            onQuickPublish={() => postAction(t("feedback.quickPublishRequested"))}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            {actionNote ? (
              <Card className="rounded-xl border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
                {actionNote}
              </Card>
            ) : null}

            <PlatformRuleBanner meta={CONTENT_BANK_DATA.meta} onViewGuidelines={() => setGuidelinesOpen(true)} />

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
              topicOptions={CONTENT_TOPIC_OPTIONS}
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

            {activeTab === "passages" ? (
              <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                <div className="min-w-0 space-y-2">
                  <PassagesTable
                    passages={filteredPassages}
                    testsById={testsById}
                    selectedPassageId={resolvedSelectedPassageId}
                    onSelectPassage={setSelectedPassageId}
                    onReadFullPassage={setFullPassageId}
                    onOpenCreateVariant={openCreateVariant}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("table.showingResults", {visible: filteredPassages.length, total: passages.length})}
                  </p>
                </div>

                <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
                  <SelectedPassagePanel
                    passage={selectedPassage}
                    variants={selectedPassageVariants}
                    onReadFullPassage={setFullPassageId}
                    onCreateNewVariant={openCreateVariant}
                    onPreviewVariant={(variantId) => {
                      const variant = activeVariants.find((item) => item.id === variantId)
                      if (!variant) return
                      postAction(t("feedback.previewQuestionsRequested", {name: variant.name}))
                    }}
                    onDuplicateVariant={handleDuplicateVariant}
                    onArchiveVariant={handleArchiveVariant}
                  />
                </div>
              </section>
            ) : (
              <section className="space-y-2">
                <QuestionVariantsTable
                  variants={filteredVariants}
                  onEdit={handleEditVariant}
                  onDuplicate={handleDuplicateVariant}
                  onArchive={handleArchiveVariant}
                />
                <p className="text-xs text-muted-foreground">
                  {t("variantsTable.showingResults", {visible: filteredVariants.length, total: activeVariants.length})}
                </p>
              </section>
            )}
          </main>
        </div>
      </div>

      <CreateVariantSetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        passages={passages}
        tests={CONTENT_BANK_DATA.tests}
        defaultPassageId={createDialogPassageId}
        onCreate={handleCreateVariant}
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
