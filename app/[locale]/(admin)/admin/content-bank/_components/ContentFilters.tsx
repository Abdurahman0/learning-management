"use client"

import {Filter} from "lucide-react"
import {useMessages, useTranslations} from "next-intl"

import {Button} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import type {
  ContentDifficultyFilterValue,
  ContentModuleFilterValue,
  ContentSourceFilterValue,
  ContentTopicFilterValue,
  Option
} from "@/data/admin-content-bank"

type ContentFiltersProps = {
  moduleValue: ContentModuleFilterValue
  difficultyValue: ContentDifficultyFilterValue
  topicValue: ContentTopicFilterValue
  sourceValue: ContentSourceFilterValue
  moduleOptions: Option<ContentModuleFilterValue>[]
  difficultyOptions: Option<ContentDifficultyFilterValue>[]
  topicOptions: Option<ContentTopicFilterValue>[]
  sourceOptions: Option<ContentSourceFilterValue>[]
  onlyUnused: boolean
  onlyPublishedVariants: boolean
  onModuleChange: (value: ContentModuleFilterValue) => void
  onDifficultyChange: (value: ContentDifficultyFilterValue) => void
  onTopicChange: (value: ContentTopicFilterValue) => void
  onSourceChange: (value: ContentSourceFilterValue) => void
  onOnlyUnusedChange: (value: boolean) => void
  onOnlyPublishedVariantsChange: (value: boolean) => void
}

function resolveLabel<Value extends string>(
  translate: ReturnType<typeof useTranslations<"adminContentBank">>,
  messages: ReturnType<typeof useMessages>,
  option: Option<Value>
) {
  if (option.value !== "all" && option.labelKey.startsWith("topics.")) {
    return option.value
  }

  const segments = option.labelKey.split(".").filter(Boolean)
  let current: unknown = messages

  for (const segment of ["adminContentBank", ...segments]) {
    if (!current || typeof current !== "object" || !(segment in (current as Record<string, unknown>))) {
      return option.value
    }
    current = (current as Record<string, unknown>)[segment]
  }

  return translate(option.labelKey)
}

function FilterSelect<Value extends string>({
  value,
  options,
  onChange
}: {
  value: Value
  options: Option<Value>[]
  onChange: (value: Value) => void
}) {
  const t = useTranslations("adminContentBank")
  const messages = useMessages()

  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as Value)}>
      <SelectTrigger className="h-10 rounded-xl border-border/70 bg-card/55">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {resolveLabel(t, messages, option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ContentFilters({
  moduleValue,
  difficultyValue,
  topicValue,
  sourceValue,
  moduleOptions,
  difficultyOptions,
  topicOptions,
  sourceOptions,
  onlyUnused,
  onlyPublishedVariants,
  onModuleChange,
  onDifficultyChange,
  onTopicChange,
  onSourceChange,
  onOnlyUnusedChange,
  onOnlyPublishedVariantsChange
}: ContentFiltersProps) {
  const t = useTranslations("adminContentBank")

  return (
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <FilterSelect value={moduleValue} options={moduleOptions} onChange={onModuleChange} />
      <FilterSelect value={difficultyValue} options={difficultyOptions} onChange={onDifficultyChange} />
      <FilterSelect value={topicValue} options={topicOptions} onChange={onTopicChange} />
      <FilterSelect value={sourceValue} options={sourceOptions} onChange={onSourceChange} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 rounded-xl border-border/70 bg-card/55 px-4 font-semibold">
            <Filter className="size-4" />
            {t("filters.moreFilters")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{t("filters.moreFiltersLabel")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={onlyUnused} onCheckedChange={(checked) => onOnlyUnusedChange(Boolean(checked))}>
            {t("filters.onlyUnused")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={onlyPublishedVariants}
            onCheckedChange={(checked) => onOnlyPublishedVariantsChange(Boolean(checked))}
          >
            {t("filters.onlyPublishedVariants")}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

