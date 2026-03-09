"use client"

import {useEffect, useMemo, useState} from "react"
import {useTranslations} from "next-intl"

import {AdminSidebar} from "../../_components/AdminSidebar"
import {
  CONTENT_DIFFICULTY_OPTIONS,
  CONTENT_MODULE_OPTIONS,
  CONTENT_SOURCE_OPTIONS,
  CONTENT_TOPIC_OPTIONS,
  createContentBankPassage,
  createContentBankVariantSet,
  getContentBankSnapshot,
  updateContentBankVariantSet,
  type ContentBankPassage,
  type ContentBankTab,
  type ContentBankVariantSet,
  type CreateContentBankPassagePayload,
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
import {AddPassageDialog} from "./AddPassageDialog"
import {CreateVariantSetDialog, type CreateVariantSetInput, type UpdateVariantSetInput} from "./CreateVariantSetDialog"
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
  const initialContentData = useMemo(() => getContentBankSnapshot(), [])
  const [activeTab, setActiveTab] = useState<ContentBankTab>("passages")
  const [searchValue, setSearchValue] = useState("")
  const [moduleFilter, setModuleFilter] = useState<ContentModuleFilterValue>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<ContentDifficultyFilterValue>("all")
  const [topicFilter, setTopicFilter] = useState<ContentTopicFilterValue>("all")
  const [sourceFilter, setSourceFilter] = useState<ContentSourceFilterValue>("all")
  const [onlyUnused, setOnlyUnused] = useState(false)
  const [onlyPublishedVariants, setOnlyPublishedVariants] = useState(false)
  const [passagesState, setPassagesState] = useState<ContentBankPassage[]>(initialContentData.passages)
  const [variants, setVariants] = useState<ContentBankVariantSet[]>(initialContentData.variants)
  const [archivedVariantIds, setArchivedVariantIds] = useState<Set<string>>(new Set())
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(initialContentData.passages[0]?.id ?? null)
  const [addPassageDialogOpen, setAddPassageDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createDialogPassageId, setCreateDialogPassageId] = useState<string | undefined>(undefined)
  const [editVariantDialogOpen, setEditVariantDialogOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [fullPassageId, setFullPassageId] = useState<string | null>(null)
  const [actionNote, setActionNote] = useState<string | null>(null)

  const testsById = useMemo(
    () => new Map(initialContentData.tests.map((test) => [test.id, test])),
    [initialContentData.tests]
  )
  const basePassagesById = useMemo(
    () => new Map(passagesState.map((passage) => [passage.id, passage])),
    [passagesState]
  )

  const activeVariants = useMemo(
    () => variants.filter((variant) => !archivedVariantIds.has(variant.id)),
    [archivedVariantIds, variants]
  )

  const passages = useMemo<ContentBankPassage[]>(() => {
    return passagesState.map((passage) => {
      const attachedVariants = activeVariants.filter((variant) => variant.passageId === passage.id)
      const usedInTestIds = [...new Set([...passage.usedInTestIds, ...attachedVariants.flatMap((variant) => variant.usedInTestIds)])]

      return {
        ...passage,
        variantIds: attachedVariants.map((variant) => variant.id),
        variantCount: attachedVariants.length,
        usedInTestIds
      }
    })
  }, [activeVariants, passagesState])

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
  const editingVariant = useMemo(
    () => activeVariants.find((variant) => variant.id === editingVariantId) ?? null,
    [activeVariants, editingVariantId]
  )

  const postAction = (message: string) => {
    setActionNote(message)
  }

  const openCreateVariant = (passageId?: string) => {
    setCreateDialogPassageId(passageId ?? resolvedSelectedPassageId ?? undefined)
    setCreateDialogOpen(true)
  }

  const handleCreatePassage = (payload: CreateContentBankPassagePayload) => {
    createContentBankPassage(payload)
    const snapshot = getContentBankSnapshot()
    setPassagesState(snapshot.passages)
    const created = snapshot.passages[0]
    if (created) {
      setSelectedPassageId(created.id)
      postAction(t("feedback.passageCreated", {name: created.title}))
    }
  }

  const handleCreateVariant = (payload: CreateVariantSetInput) => {
    createContentBankVariantSet(payload)
    const snapshot = getContentBankSnapshot()
    setVariants(snapshot.variants)
    setPassagesState(snapshot.passages)
    setSelectedPassageId(payload.passageId)
    postAction(t("feedback.variantCreated", {name: payload.name}))
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
    setEditingVariantId(source.id)
    setEditVariantDialogOpen(true)
  }

  const handleSaveVariant = (payload: UpdateVariantSetInput) => {
    const updated = updateContentBankVariantSet(payload)
    if (!updated) return
    const snapshot = getContentBankSnapshot()
    setVariants(snapshot.variants)
    setPassagesState(snapshot.passages)
    setSelectedPassageId(payload.passageId)
    postAction(t("feedback.variantUpdated", {name: payload.name}))
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

            <PlatformRuleBanner meta={initialContentData.meta} onViewGuidelines={() => setGuidelinesOpen(true)} />

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
                  {t("variantsTable.showingResults", {visible: filteredVariants.length, total: activeVariants.length})}
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
        passages={passages}
        tests={initialContentData.tests}
        defaultPassageId={createDialogPassageId}
        onCreate={handleCreateVariant}
      />

      <CreateVariantSetDialog
        mode="edit"
        open={editVariantDialogOpen}
        onOpenChange={(open) => {
          setEditVariantDialogOpen(open)
          if (!open) setEditingVariantId(null)
        }}
        passages={passages}
        tests={initialContentData.tests}
        variant={editingVariant}
        onSave={handleSaveVariant}
      />

      <AddPassageDialog
        open={addPassageDialogOpen}
        onOpenChange={setAddPassageDialogOpen}
        onCreate={handleCreatePassage}
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
