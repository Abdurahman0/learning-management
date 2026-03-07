"use client"

import {useMemo, useState} from "react"
import {useTranslations} from "next-intl"

import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet"
import type {AdminTestSummary, ContentBankPassage, ContentBankVariantSet} from "@/data/admin-content-bank"

export type CreateVariantSetInput = {
  passageId: string
  name: string
  status: ContentBankVariantSet["status"]
  questionTypesSummary: string
  questionTypeKeys: ContentBankVariantSet["questionTypeKeys"]
  usedInTestIds: string[]
}

type CreateVariantSetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  passages: ContentBankPassage[]
  tests: AdminTestSummary[]
  defaultPassageId?: string
  onCreate: (payload: CreateVariantSetInput) => void
}

const QUESTION_TYPE_KEYS: ContentBankVariantSet["questionTypeKeys"] = [
  "tfng",
  "multiple_choice",
  "matching_headings",
  "matching_information",
  "summary_completion",
  "table_completion",
  "form_completion",
  "note_completion"
]

type CreateVariantSetDialogBodyProps = {
  passages: ContentBankPassage[]
  tests: AdminTestSummary[]
  defaultPassageId?: string
  firstPassageId: string
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateVariantSetInput) => void
}

function CreateVariantSetDialogBody({
  passages,
  tests,
  defaultPassageId,
  firstPassageId,
  onOpenChange,
  onCreate
}: CreateVariantSetDialogBodyProps) {
  const t = useTranslations("adminContentBank")
  const [passageId, setPassageId] = useState(defaultPassageId ?? firstPassageId)
  const [name, setName] = useState("")
  const [status, setStatus] = useState<ContentBankVariantSet["status"]>("draft")
  const [questionTypesSummary, setQuestionTypesSummary] = useState("")
  const [questionTypeKeys, setQuestionTypeKeys] = useState<Set<ContentBankVariantSet["questionTypeKeys"][number]>>(new Set(["tfng"]))
  const [usedInTestId, setUsedInTestId] = useState("")

  const filteredTests = useMemo(() => {
    const passage = passages.find((item) => item.id === passageId)
    if (!passage) return tests
    return tests.filter((test) => test.module === passage.module)
  }, [passageId, passages, tests])

  const handleToggleType = (typeKey: ContentBankVariantSet["questionTypeKeys"][number], checked: boolean) => {
    setQuestionTypeKeys((current) => {
      const next = new Set(current)
      if (checked) next.add(typeKey)
      else next.delete(typeKey)
      return next
    })
  }

  const handleCreate = () => {
    const safeName = name.trim()
    const safeTypes = [...questionTypeKeys]
    if (!safeName || !passageId || !safeTypes.length) {
      return
    }

    onCreate({
      passageId,
      name: safeName,
      status,
      questionTypesSummary: questionTypesSummary.trim() || t("variantSummaryFallback", {count: safeTypes.length}),
      questionTypeKeys: safeTypes,
      usedInTestIds: status === "used" && usedInTestId ? [usedInTestId] : []
    })
    onOpenChange(false)
  }

  return (
    <>
      <SheetHeader className="space-y-1">
        <SheetTitle>{t("createVariantDialog.title")}</SheetTitle>
        <SheetDescription>{t("createVariantDialog.description")}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-6 pb-3">
        <div className="space-y-1.5">
          <Label htmlFor="cb-variant-name">{t("createVariantDialog.fields.variantName")}</Label>
          <Input
            id="cb-variant-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("createVariantDialog.fields.variantNamePlaceholder")}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("createVariantDialog.fields.passage")}</Label>
          <Select value={passageId} onValueChange={setPassageId}>
            <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {passages.map((passage) => (
                <SelectItem key={passage.id} value={passage.id}>
                  {passage.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("createVariantDialog.fields.status")}</Label>
          <Select value={status} onValueChange={(next) => setStatus(next as ContentBankVariantSet["status"])}>
            <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t("status.draft")}</SelectItem>
              <SelectItem value="published">{t("status.published")}</SelectItem>
              <SelectItem value="used">{t("status.used")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === "used" ? (
          <div className="space-y-1.5">
            <Label>{t("createVariantDialog.fields.usedInTest")}</Label>
            <Select value={usedInTestId} onValueChange={setUsedInTestId}>
              <SelectTrigger className="rounded-xl border-border/70 bg-card/55">
                <SelectValue placeholder={t("createVariantDialog.fields.selectTestPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {filteredTests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>{t("createVariantDialog.fields.questionTypes")}</Label>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {QUESTION_TYPE_KEYS.map((typeKey) => {
              const checked = questionTypeKeys.has(typeKey)
              return (
                <label key={typeKey} className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/45 px-2.5 py-2 text-sm">
                  <Checkbox checked={checked} onChange={(event) => handleToggleType(typeKey, event.target.checked)} />
                  <span>{t(`questionTypes.${typeKey}`)}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cb-variant-summary">{t("createVariantDialog.fields.summary")}</Label>
          <Input
            id="cb-variant-summary"
            value={questionTypesSummary}
            onChange={(event) => setQuestionTypesSummary(event.target.value)}
            placeholder={t("createVariantDialog.fields.summaryPlaceholder")}
            className="rounded-xl border-border/70 bg-card/55"
          />
        </div>
      </div>

      <SheetFooter className="border-t border-border/70">
        <Button variant="outline" className="rounded-xl border-border/70 bg-card/55" onClick={() => onOpenChange(false)}>
          {t("common.cancel")}
        </Button>
        <Button className="rounded-xl" onClick={handleCreate}>
          {t("createVariantDialog.create")}
        </Button>
      </SheetFooter>
    </>
  )
}

export function CreateVariantSetDialog({
  open,
  onOpenChange,
  passages,
  tests,
  defaultPassageId,
  onCreate
}: CreateVariantSetDialogProps) {
  const firstPassageId = passages[0]?.id ?? ""
  const formKey = `${open ? "open" : "closed"}:${defaultPassageId ?? firstPassageId}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-l border-border/70 bg-background/95 sm:max-w-lg">
        {open ? (
          <CreateVariantSetDialogBody
            key={formKey}
            passages={passages}
            tests={tests}
            defaultPassageId={defaultPassageId}
            firstPassageId={firstPassageId}
            onOpenChange={onOpenChange}
            onCreate={onCreate}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
