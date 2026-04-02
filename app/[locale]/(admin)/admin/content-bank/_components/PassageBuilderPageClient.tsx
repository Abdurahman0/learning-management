"use client"

import {ChevronLeft, Copy, GripVertical, Plus, Save, Trash2} from "lucide-react"
import {useEffect, useMemo, useRef, useState} from "react"
import {useRouter} from "next/navigation"
import {useLocale, useTranslations} from "next-intl"

import {QUESTION_TYPE_OPTIONS_BY_MODULE, createDefaultQuestion} from "@/data/admin-test-builder"
import type {BuilderQuestion, QuestionType} from "@/types/admin"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet"

import {AdminSidebar, AdminSidebarMobileNav} from "../../_components/AdminSidebar"
import {PassageQuestionFields} from "./PassageQuestionFields"
import {adminContentBankService, type UpsertContentBankPassagePayload} from "@/src/services/admin/contentBank.service"
import {AdminApiError} from "@/src/services/admin/types"

type PassageBuilderPageClientProps = {
  passageId: string
}

type PassageBuilderDraft = {
  id?: string
  title: string
  module: "reading" | "listening"
  difficulty: "easy" | "medium" | "hard"
  source: "cambridge" | "practice" | "custom"
  topic: string
  contentType: string
  tagsRaw: string
  notes: string
  previewText: string
  fullTextRaw: string
  estimatedTimeLabel: string
  durationMinutes: string
  status: "draft" | "published"
  questions: BuilderQuestion[]
}

function toParagraphs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function toTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))]
}

function toQuestionPreview(question: BuilderQuestion) {
  return question.prompt.trim() ? question.prompt : "No prompt"
}

function createEmptyDraft(): PassageBuilderDraft {
  return {
    title: "",
    module: "reading",
    difficulty: "medium",
    source: "custom",
    topic: "",
    contentType: "passage",
    tagsRaw: "",
    notes: "",
    previewText: "",
    fullTextRaw: "",
    estimatedTimeLabel: "",
    durationMinutes: "7",
    status: "draft",
    questions: []
  }
}

function normalizeQuestionOrder(questions: BuilderQuestion[]) {
  return questions.map((question, index) => ({
    ...question,
    number: index + 1
  }))
}

function createPlaceholderQuestions(questionCount: number) {
  const safeCount = Math.max(0, Math.floor(Number(questionCount) || 0))
  const questions: BuilderQuestion[] = []
  for (let index = 0; index < safeCount; index += 1) {
    questions.push(createDefaultQuestion("multiple_choice", index + 1))
  }
  return questions
}

export function PassageBuilderPageClient({passageId}: PassageBuilderPageClientProps) {
  const t = useTranslations("adminContentBank")
  const locale = useLocale()
  const router = useRouter()
  const isCreateMode = passageId === "new"

  const [draft, setDraft] = useState<PassageBuilderDraft>(() => createEmptyDraft())
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>("multiple_choice")
  const initialSnapshotRef = useRef<string>("")

  useEffect(() => {
    let active = true

    const run = async () => {
      if (isCreateMode) {
        const empty = createEmptyDraft()
        if (!active) return
        setDraft(empty)
        initialSnapshotRef.current = JSON.stringify(empty)
        setIsLoaded(true)
        return
      }

      try {
        const source = await adminContentBankService.getPassageById(passageId)
        if (!active) return

        if (!source) {
          router.replace(`/${locale}/admin/content-bank`)
          return
        }

        const next: PassageBuilderDraft = {
          id: source.id,
          title: source.title,
          module: source.module,
          difficulty: source.difficulty,
          source: source.source,
          topic: source.topic,
          contentType: source.contentType ?? (source.module === "reading" ? "passage" : "transcript"),
          tagsRaw: source.tags.join(", "),
          notes: source.notes ?? "",
          previewText: source.previewText,
          fullTextRaw: source.fullText.join("\n\n"),
          estimatedTimeLabel: source.estimatedTimeLabel ?? "",
          durationMinutes: String(source.durationMinutes ?? 7),
          status: source.status,
          questions: normalizeQuestionOrder(createPlaceholderQuestions(source.questionCount))
        }

        setDraft(next)
        initialSnapshotRef.current = JSON.stringify(next)
        setValidationError(null)
        setIsLoaded(true)
      } catch (cause) {
        if (!active) return
        const message = cause instanceof AdminApiError ? cause.message : "Failed to load passage."
        setValidationError(message)
        setIsLoaded(true)
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [isCreateMode, locale, passageId, router])

  const isDirty = useMemo(() => {
    if (!isLoaded) return false
    return JSON.stringify(draft) !== initialSnapshotRef.current
  }, [draft, isLoaded])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const activeQuestion = useMemo(
    () => draft.questions.find((question) => question.id === editingQuestionId) ?? null,
    [draft.questions, editingQuestionId]
  )

  const questionTypeOptions = QUESTION_TYPE_OPTIONS_BY_MODULE[draft.module]

  const handleBack = () => {
    if (isDirty) {
      const shouldLeave = window.confirm(t("builder.unsavedChangesConfirm"))
      if (!shouldLeave) return
    }
    router.push(`/${locale}/admin/content-bank`)
  }

  const handleAddQuestion = () => {
    const nextNumber = draft.questions.length + 1
    const nextQuestion = createDefaultQuestion(newQuestionType, nextNumber)
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, nextQuestion]
    }))
  }

  const handleDuplicateQuestion = (questionId: string) => {
    setDraft((current) => {
      const source = current.questions.find((question) => question.id === questionId)
      if (!source) return current
      const copy = {
        ...source,
        id: `${source.id}-copy-${Math.random().toString(36).slice(2, 7)}`
      } as BuilderQuestion
      return {
        ...current,
        questions: normalizeQuestionOrder([...current.questions, copy])
      }
    })
  }

  const handleDeleteQuestion = (questionId: string) => {
    setDraft((current) => ({
      ...current,
      questions: normalizeQuestionOrder(current.questions.filter((question) => question.id !== questionId))
    }))
    if (editingQuestionId === questionId) {
      setEditingQuestionId(null)
      setEditorOpen(false)
    }
  }

  const handleMoveQuestion = (questionId: string, direction: "up" | "down") => {
    setDraft((current) => {
      const index = current.questions.findIndex((question) => question.id === questionId)
      if (index < 0) return current
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.questions.length) return current
      const next = [...current.questions]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return {
        ...current,
        questions: normalizeQuestionOrder(next)
      }
    })
  }

  const openQuestionEditor = (questionId: string) => {
    setEditingQuestionId(questionId)
    setEditorOpen(true)
  }

  const handleSave = async (status: "draft" | "published") => {
    if (isSaving) return

    const fullText = toParagraphs(draft.fullTextRaw)
    const previewText = draft.previewText.trim() || fullText[0] || ""

    if (!draft.title.trim()) {
      setValidationError(t("builder.validation.titleRequired"))
      return
    }

    if (!fullText.length) {
      setValidationError(t("builder.validation.contentRequired"))
      return
    }

    if (status === "published" && draft.questions.length === 0) {
      setValidationError(t("builder.validation.questionRequired"))
      return
    }

    setValidationError(null)
    setIsSaving(true)

    const payload: UpsertContentBankPassagePayload = {
      title: draft.title.trim(),
      module: draft.module,
      difficulty: draft.difficulty,
      topic: draft.topic.trim() || "General",
      source: draft.source,
      contentType: draft.contentType.trim() || undefined,
      tags: toTags(draft.tagsRaw),
      notes: draft.notes.trim() || undefined,
      previewText,
      fullText,
      status,
      durationMinutes: draft.module === "listening" ? Math.max(1, Number(draft.durationMinutes || 7)) : undefined,
      estimatedTimeLabel: draft.estimatedTimeLabel.trim() || undefined,
      questionCount: normalizeQuestionOrder(draft.questions).length
    }

    try {
      if (draft.id) {
        await adminContentBankService.updatePassage(draft.id, payload)
      } else {
        await adminContentBankService.createPassage(payload)
      }
      router.push(`/${locale}/admin/content-bank`)
    } catch (cause) {
      const message = cause instanceof AdminApiError ? cause.message : "Failed to save passage."
      setValidationError(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                <AdminSidebarMobileNav />
                <Button variant="ghost" size="sm" className="h-9 rounded-xl px-2.5" onClick={handleBack}>
                  <ChevronLeft className="size-4" />
                  {t("builder.backToContentBank")}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-card/55" onClick={() => handleSave("draft")} disabled={isSaving}>
                  <Save className="size-4" />
                  {t("builder.saveDraft")}
                </Button>
                <Button className="h-9 rounded-xl" onClick={() => handleSave("published")} disabled={isSaving}>
                  {t("builder.savePassage")}
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto min-w-0 w-full max-w-[1560px] space-y-4 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("builder.title")}</h1>
              <p className="text-sm text-muted-foreground sm:text-base">{t("builder.subtitle")}</p>
            </div>

            {validationError ? (
              <Card className="rounded-xl border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{validationError}</Card>
            ) : null}

            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.85fr)]">
              <div className="min-w-0 space-y-4">
                <Card className="space-y-4 rounded-2xl border-border/70 bg-card/70 p-4">
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t("builder.passageDetails")}</h2>

                  <div className="space-y-1.5">
                    <Label>{t("builder.fields.title")}</Label>
                    <Input
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({...current, title: event.target.value}))}
                      placeholder={t("builder.fields.titlePlaceholder")}
                      className="rounded-xl border-border/70 bg-background/45"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.module")}</Label>
                      <Select
                        value={draft.module}
                        onValueChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            module: value as "reading" | "listening",
                            contentType: value === "reading" ? "passage" : "transcript"
                          }))
                        }
                      >
                        <SelectTrigger className="rounded-xl border-border/70 bg-background/45">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reading">{t("modules.reading")}</SelectItem>
                          <SelectItem value="listening">{t("modules.listening")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.difficulty")}</Label>
                      <Select value={draft.difficulty} onValueChange={(value) => setDraft((current) => ({...current, difficulty: value as "easy" | "medium" | "hard"}))}>
                        <SelectTrigger className="rounded-xl border-border/70 bg-background/45">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">{t("difficulty.easy")}</SelectItem>
                          <SelectItem value="medium">{t("difficulty.medium")}</SelectItem>
                          <SelectItem value="hard">{t("difficulty.hard")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.topic")}</Label>
                      <Input
                        value={draft.topic}
                        onChange={(event) => setDraft((current) => ({...current, topic: event.target.value}))}
                        placeholder={t("builder.fields.topicPlaceholder")}
                        className="rounded-xl border-border/70 bg-background/45"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.source")}</Label>
                      <Select value={draft.source} onValueChange={(value) => setDraft((current) => ({...current, source: value as "cambridge" | "practice" | "custom"}))}>
                        <SelectTrigger className="rounded-xl border-border/70 bg-background/45">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cambridge">{t("filters.source.cambridge")}</SelectItem>
                          <SelectItem value="practice">{t("filters.source.practice")}</SelectItem>
                          <SelectItem value="custom">{t("filters.source.custom")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.tags")}</Label>
                      <Input
                        value={draft.tagsRaw}
                        onChange={(event) => setDraft((current) => ({...current, tagsRaw: event.target.value}))}
                        placeholder={t("builder.fields.tagsPlaceholder")}
                        className="rounded-xl border-border/70 bg-background/45"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.estimatedTimeLabel")}</Label>
                      <Input
                        value={draft.estimatedTimeLabel}
                        onChange={(event) => setDraft((current) => ({...current, estimatedTimeLabel: event.target.value}))}
                        placeholder={t("builder.fields.estimatedTimePlaceholder")}
                        className="rounded-xl border-border/70 bg-background/45"
                      />
                    </div>
                  </div>

                  {draft.module === "listening" ? (
                    <div className="space-y-1.5">
                      <Label>{t("builder.fields.durationMinutes")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={draft.durationMinutes}
                        onChange={(event) => setDraft((current) => ({...current, durationMinutes: event.target.value}))}
                        className="rounded-xl border-border/70 bg-background/45"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label>{t("builder.fields.notes")}</Label>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft((current) => ({...current, notes: event.target.value}))}
                      placeholder={t("builder.fields.notesPlaceholder")}
                      className="min-h-[84px] w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    />
                  </div>
                </Card>

                <Card className="space-y-4 rounded-2xl border-border/70 bg-card/70 p-4">
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t("builder.passageContent")}</h2>

                  <div className="space-y-1.5">
                    <Label>{t("builder.fields.previewText")}</Label>
                    <textarea
                      value={draft.previewText}
                      onChange={(event) => setDraft((current) => ({...current, previewText: event.target.value}))}
                      placeholder={t("builder.fields.previewPlaceholder")}
                      className="min-h-[84px] w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t("builder.fields.fullText")}</Label>
                    <textarea
                      value={draft.fullTextRaw}
                      onChange={(event) => setDraft((current) => ({...current, fullTextRaw: event.target.value}))}
                      placeholder={t("builder.fields.fullTextPlaceholder")}
                      className="min-h-[320px] w-full rounded-xl border border-border/70 bg-background/45 px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    />
                  </div>
                </Card>
              </div>

              <Card className="min-w-0 space-y-4 rounded-2xl border-border/70 bg-card/70 p-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{t("builder.questions")}</h2>
                  <p className="text-xs text-muted-foreground">{t("builder.questionsDescription")}</p>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-2">
                  <Select value={newQuestionType} onValueChange={(value) => setNewQuestionType(value as QuestionType)}>
                    <SelectTrigger className="rounded-xl border-border/70 bg-background/45">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="rounded-xl" onClick={handleAddQuestion}>
                    <Plus className="size-4" />
                    {t("builder.addQuestion")}
                  </Button>
                </div>

                {!draft.questions.length ? (
                  <Card className="rounded-xl border-dashed border-border/80 bg-background/35 p-4 text-sm text-muted-foreground">
                    {t("builder.emptyQuestions")}
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {draft.questions.map((question, index) => (
                      <Card key={question.id} className="rounded-xl border-border/70 bg-background/35 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{t("builder.questionLabel", {number: question.number})}</p>
                            <p className="text-xs text-muted-foreground">{t(`questionTypes.${question.type}`)}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{toQuestionPreview(question)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => handleMoveQuestion(question.id, "up")} disabled={index === 0}>
                              <GripVertical className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg"
                              onClick={() => handleMoveQuestion(question.id, "down")}
                              disabled={index === draft.questions.length - 1}
                            >
                              <GripVertical className="size-3.5 rotate-180" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => handleDuplicateQuestion(question.id)}>
                              <Copy className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg text-rose-300 hover:text-rose-200" onClick={() => handleDeleteQuestion(question.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <Button variant="outline" className="mt-2 h-8 rounded-lg border-border/70 bg-background/45 text-xs" onClick={() => openQuestionEditor(question.id)}>
                          {t("builder.editQuestion")}
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </main>
        </div>
      </div>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto border-l border-border/70 bg-background/95 p-0">
          <SheetHeader className="border-b border-border/70 p-5">
            <SheetTitle className="text-base">{t("builder.questionEditorTitle")}</SheetTitle>
            <SheetDescription>{t("builder.questionEditorDescription")}</SheetDescription>
          </SheetHeader>
          <div className="p-5">
            {activeQuestion ? (
              <PassageQuestionFields
                question={activeQuestion}
                onChange={(nextQuestion) =>
                  setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((question) => (question.id === activeQuestion.id ? nextQuestion : question))
                  }))
                }
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
