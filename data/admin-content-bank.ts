import {
  getContentBankData,
  type AdminTestSummary,
  type ContentBankData,
  type ContentBankMeta,
  type ContentBankPassage,
  type ContentBankVariantSet
} from "@/data/admin/selectors"
import {createPassageAssetEntity, createQuestionVariantSetEntity, updateQuestionVariantSetEntity} from "@/data/admin/content-bank"
import type {QuestionVariantStatus, VariantGroupTemplate} from "@/types/admin"

export type ContentBankTab = "passages" | "variants"
export type ContentModuleFilterValue = "all" | "reading" | "listening"
export type ContentDifficultyFilterValue = "all" | "easy" | "medium" | "hard"
export type ContentSourceFilterValue = "all" | "cambridge" | "practice" | "custom"
export type ContentTopicFilterValue = "all" | string

export type Option<Value extends string> = {
  value: Value
  labelKey: string
}

export type {ContentBankPassage, ContentBankVariantSet, AdminTestSummary, ContentBankMeta, ContentBankData}

export const CONTENT_BANK_DATA = getContentBankData()
export const getContentBankSnapshot = getContentBankData

export type CreateContentBankVariantPayload = {
  passageId: string
  name: string
  status: QuestionVariantStatus
  groups: VariantGroupTemplate[]
  usedInTestIds?: string[]
}

export type UpdateContentBankVariantPayload = {
  id: string
  passageId: string
  name: string
  status: QuestionVariantStatus
  groups: VariantGroupTemplate[]
  usedInTestIds?: string[]
}

export type CreateContentBankPassagePayload = {
  title: string
  module: ContentBankPassage["module"]
  difficulty: ContentBankPassage["difficulty"]
  topic: string
  source: ContentBankPassage["source"]
  previewText: string
  fullText?: string[]
  wordCount?: number
  durationMinutes?: number
  estimatedTimeLabel?: string
}

export function createContentBankVariantSet(payload: CreateContentBankVariantPayload) {
  return createQuestionVariantSetEntity(payload)
}

export function updateContentBankVariantSet(payload: UpdateContentBankVariantPayload) {
  return updateQuestionVariantSetEntity(payload)
}

export function createContentBankPassage(payload: CreateContentBankPassagePayload) {
  return createPassageAssetEntity(payload)
}

const TOPIC_VALUES = [...new Set(CONTENT_BANK_DATA.passages.map((passage) => passage.topic))].sort((left, right) =>
  left.localeCompare(right)
)

export const CONTENT_BANK_TAB_OPTIONS = [
  {value: "passages", labelKey: "tabs.passageBank"},
  {value: "variants", labelKey: "tabs.questionVariants"}
] as const satisfies Array<{value: ContentBankTab; labelKey: string}>

export const CONTENT_MODULE_OPTIONS = [
  {value: "all", labelKey: "filters.module.allModules"},
  {value: "reading", labelKey: "filters.module.reading"},
  {value: "listening", labelKey: "filters.module.listening"}
] as const satisfies Option<ContentModuleFilterValue>[]

export const CONTENT_DIFFICULTY_OPTIONS = [
  {value: "all", labelKey: "filters.difficulty.allDifficulty"},
  {value: "easy", labelKey: "filters.difficulty.easy"},
  {value: "medium", labelKey: "filters.difficulty.medium"},
  {value: "hard", labelKey: "filters.difficulty.hard"}
] as const satisfies Option<ContentDifficultyFilterValue>[]

export const CONTENT_SOURCE_OPTIONS = [
  {value: "all", labelKey: "filters.source.anySource"},
  {value: "cambridge", labelKey: "filters.source.cambridge"},
  {value: "practice", labelKey: "filters.source.practice"},
  {value: "custom", labelKey: "filters.source.custom"}
] as const satisfies Option<ContentSourceFilterValue>[]

export const CONTENT_TOPIC_OPTIONS: Option<ContentTopicFilterValue>[] = [
  {value: "all", labelKey: "filters.topic.allTopics"},
  ...TOPIC_VALUES.map((topic) => ({value: topic, labelKey: `topics.${topic.toLowerCase().replace(/\s+/g, "_")}`}))
]
