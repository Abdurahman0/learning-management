"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import {ArrowLeft, Eye, PencilLine, Save} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import type {BuilderMode, BuilderQuestion, BuilderStructureItem, QuestionGroup, QuestionType} from "@/data/admin-test-builder";
import {createDefaultQuestion, getStructureRange} from "@/data/admin-test-builder";
import {AdminSidebar} from "@/app/[locale]/(admin)/admin/_components/AdminSidebar";
import {AdminTopbar} from "@/app/[locale]/(admin)/admin/_components/AdminTopbar";
import {PassageEditor} from "@/app/[locale]/(admin)/admin/tests/[testId]/builder/_components/PassageEditor";
import {QuestionEditorModal} from "@/app/[locale]/(admin)/admin/tests/[testId]/builder/_components/QuestionEditorModal";
import {QuestionGroupsPanel} from "@/app/[locale]/(admin)/admin/tests/[testId]/builder/_components/QuestionGroupsPanel";
import {TestStructurePanel} from "@/app/[locale]/(admin)/admin/tests/[testId]/builder/_components/TestStructurePanel";
import {Button} from "@/components/ui/button";
import {LoadingModal} from "@/components/ui/loading-modal";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {adminMarathonsService} from "@/src/services/admin/marathons.service";
import {questionGroupsService} from "@/src/services/admin/questionGroups.service";
import {questionsService} from "@/src/services/admin/questions.service";
import type {
  AdminMarathonListeningPartPayload,
  AdminMarathonListeningPartRecord,
  AdminMarathonReadingPassagePayload,
  AdminMarathonReadingPassageRecord,
  QuestionGroupPayload,
  QuestionGroupRecord
} from "@/src/services/admin/types";

import {
  findContiguousFreeRange,
  getBoundaryInsertNumber,
  getOccupiedNumbers,
  isQuestionReadyForSync,
  makeCopyId,
  mapApiQuestionGroupToBuilderGroup,
  mapBuilderQuestionToBulkPayload,
  normalizeGroup,
  resolveApiQuestionTypeForGroup,
  resolveGroupContentForSync
} from "./marathonBuilderUtils";

type OwnerModule = "reading" | "listening";

type AdminMarathonQuestionBuilderClientProps = {
  marathonId: string;
  ownerId: string;
  module: OwnerModule;
};

type SelectedQuestionRef = {
  groupId: string;
  questionId: string;
};

type OwnerRecord = AdminMarathonReadingPassageRecord | AdminMarathonListeningPartRecord;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function extractSharedChoiceOptions(groupContent: unknown) {
  const content = asRecord(groupContent);
  const rows = Array.isArray(content.choices)
    ? content.choices
    : Array.isArray(content.options)
      ? content.options
      : Array.isArray(content.labels)
        ? content.labels
        : Array.isArray(content.categories)
          ? content.categories
          : [];

  return rows
    .map((item) => {
      if (typeof item === "string") return item;
      const row = asRecord(item);
      return String(row.text ?? row.label ?? row.key ?? "").trim();
    })
    .filter(Boolean);
}

function extractSharedHeadings(groupContent: unknown) {
  const content = asRecord(groupContent);
  const rows = Array.isArray(content.headings) ? content.headings : [];

  return rows
    .map((item) => {
      if (typeof item === "string") return item;
      const row = asRecord(item);
      return String(row.text ?? row.label ?? row.key ?? "").trim();
    })
    .filter(Boolean);
}

function hydrateQuestionWithGroupContent(question: BuilderQuestion, groupContent?: unknown): BuilderQuestion {
  if (!groupContent) {
    return question;
  }

  if (question.type === "matching_headings") {
    const headings = extractSharedHeadings(groupContent);
    return headings.length > 0 ? {...question, headings} : question;
  }

  if (
    question.type === "matching_information"
    || question.type === "matching_features"
    || question.type === "selecting_from_a_list"
    || question.type === "map"
  ) {
    const choices = extractSharedChoiceOptions(groupContent);
    return choices.length > 0 ? {...question, choices} : question;
  }

  return question;
}

function buildStructure(owner: OwnerRecord, module: OwnerModule): BuilderStructureItem {
  return {
    id: String(owner.id),
    index: 1,
    kind: module === "reading" ? "passage" : "section",
    title: owner.title,
    questionRangeLabel: `Q1-${Math.max(1, Number(owner.max_questions ?? 1))}`,
    content: [
      module === "reading"
        ? ((owner as AdminMarathonReadingPassageRecord).passage_text || "")
        : ((owner as AdminMarathonListeningPartRecord).transcript_text || "")
    ],
    audioLabel: module === "listening"
      ? String((owner as AdminMarathonListeningPartRecord).audio_url ?? (owner as AdminMarathonListeningPartRecord).audio_file_url ?? "")
      : undefined
  };
}

function createGroup(type: QuestionType, from: number, to: number, instructions: string, groupContent?: unknown): QuestionGroup {
  const questions: BuilderQuestion[] = [];
  for (let number = from; number <= to; number += 1) {
    questions.push(hydrateQuestionWithGroupContent(createDefaultQuestion(type, number), groupContent));
  }

  return normalizeGroup({
    id: `group-${type}-${from}-${to}-${Math.random().toString(36).slice(2, 7)}`,
    title: `Questions ${from}-${to}`,
    type,
    from,
    to,
    questions,
    instructions,
    groupContentJson: groupContent
  });
}

export function AdminMarathonQuestionBuilderClient({marathonId, ownerId, module}: AdminMarathonQuestionBuilderClientProps) {
  const t = useTranslations("adminMarathons");
  const builderT = useTranslations("adminTestBuilder");
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);
  const [mode, setMode] = useState<BuilderMode>("editor");
  const [owner, setOwner] = useState<OwnerRecord | null>(null);
  const [structure, setStructure] = useState<BuilderStructureItem | null>(null);
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedQuestionRef, setSelectedQuestionRef] = useState<SelectedQuestionRef | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [removeCurrentAudio, setRemoveCurrentAudio] = useState(false);
  const saveLabel = module === "reading" ? "Save passage" : "Save part";
  const builderFlowTitle = module === "reading" ? "Reading passage builder" : "Listening part builder";
  const builderFlowDescription =
    module === "reading"
      ? "After saving, this passage appears in the Marathon reading library. Assign it to a day from the Marathon detail page."
      : "After saving, this part appears in the Marathon listening library. Assign it to a day from the Marathon detail page.";

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ownerRecord = module === "reading"
        ? await adminMarathonsService.getReadingPassageById(ownerId)
        : await adminMarathonsService.getListeningPartById(ownerId);
      const groupsResponse = await questionGroupsService.list(
        module === "reading"
          ? {page: 1, pageSize: 100, ordering: "group_order", reading_passage: ownerId}
          : {page: 1, pageSize: 100, ordering: "group_order", listening_part: ownerId}
      );
      const detailedGroups = await Promise.all(
        groupsResponse.results.map((group) => questionGroupsService.getById(group.id))
      );

      setOwner(ownerRecord);
      setStructure(buildStructure(ownerRecord, module));
      setGroups(detailedGroups.map((group, index) => mapApiQuestionGroupToBuilderGroup(group, index + 1)));
      setCollapsedGroups({});
      setSelectedQuestionRef(null);
      setSelectedAudioFile(null);
      setRemoveCurrentAudio(false);
    } catch {
      setNotice({title: t("notices.loadFailed.title"), description: t("notices.loadFailed.description"), tone: "error"});
    } finally {
      setLoading(false);
    }
  }, [module, ownerId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const range = useMemo(() => (structure ? getStructureRange(structure) : {from: 1, to: 1}), [structure]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedQuestionRef?.groupId) ?? null,
    [groups, selectedQuestionRef]
  );
  const selectedQuestion = useMemo(
    () => selectedGroup?.questions.find((question) => question.id === selectedQuestionRef?.questionId) ?? null,
    [selectedGroup, selectedQuestionRef]
  );
  const selectedQuestionLabel = selectedQuestion ? String(selectedQuestion.number) : null;
  const selectedWordBankOptions = useMemo(() => {
    const record = (selectedGroup?.groupContentJson && typeof selectedGroup.groupContentJson === "object" && !Array.isArray(selectedGroup.groupContentJson)
      ? (selectedGroup.groupContentJson as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    return Array.isArray(record.word_bank)
      ? record.word_bank.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];
  }, [selectedGroup]);

  const questionProgressByStructureId = useMemo(() => {
    if (!structure) return {};
    const assigned = new Set<number>();
    let outOfRangeEntries = 0;
    for (const group of groups) {
      for (const question of group.questions) {
        if (question.number >= range.from && question.number <= range.to) {
          assigned.add(question.number);
        } else {
          outOfRangeEntries += 1;
        }
      }
    }

    return {
      [structure.id]: {
        assigned: assigned.size,
        required: range.to - range.from + 1,
        complete: assigned.size === range.to - range.from + 1 && outOfRangeEntries === 0
      }
    };
  }, [groups, range.from, range.to, structure]);

  const handleCreateGroup = (type: QuestionType, from: number, to: number, instructions: string, groupContent?: unknown) => {
    setGroups((current) => [...current, createGroup(type, from, to, instructions, groupContent)].sort((left, right) => left.from - right.from));
  };

  const handleEditGroup = (groupId: string, type: QuestionType, from: number, to: number, instructions: string, groupContent?: unknown) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;

        const existingByNumber = new Map(group.questions.map((question) => [question.number, question]));
        const nextQuestions: BuilderQuestion[] = [];
        for (let number = from; number <= to; number += 1) {
          const existing = existingByNumber.get(number);
          if (existing && existing.type === type) {
            nextQuestions.push(hydrateQuestionWithGroupContent({...existing, number}, groupContent));
          } else {
            nextQuestions.push(hydrateQuestionWithGroupContent(createDefaultQuestion(type, number), groupContent));
          }
        }

        return normalizeGroup({
          ...group,
          type,
          from,
          to,
          instructions,
          groupContentJson: groupContent,
          questions: nextQuestions
        });
      })
    );
  };

  const handleDuplicateGroup = (groupId: string) => {
    setGroups((current) => {
      const source = current.find((group) => group.id === groupId);
      if (!source) return current;
      const occupied = getOccupiedNumbers(current);
      const targetRange = findContiguousFreeRange(range, occupied, source.questions.length);
      if (!targetRange) return current;

      const duplicatedQuestions = source.questions.map((question, index) => ({
        ...structuredClone(question),
        id: makeCopyId(question.id),
        number: targetRange.from + index
      }));

      const duplicated = normalizeGroup({
        ...structuredClone(source),
        id: makeCopyId(source.id),
        from: targetRange.from,
        to: targetRange.to,
        questions: duplicatedQuestions
      });

      return [...current, duplicated].sort((left, right) => left.from - right.from);
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((current) => current.filter((group) => group.id !== groupId));
    if (selectedQuestionRef?.groupId === groupId) {
      setSelectedQuestionRef(null);
    }
  };

  const handleAddQuestion = (groupId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const occupiedByOthers = getOccupiedNumbers(current, group.id);
        const insertNumber = getBoundaryInsertNumber(group, range, occupiedByOthers);
        if (insertNumber == null) return group;
        return normalizeGroup({
          ...group,
          questions: [...group.questions, hydrateQuestionWithGroupContent(createDefaultQuestion(group.type, insertNumber), group.groupContentJson)]
        });
      })
    );
  };

  const handleMoveQuestion = (groupId: string, questionId: string, direction: "up" | "down") => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const sorted = [...group.questions].sort((left, right) => left.number - right.number);
        const index = sorted.findIndex((question) => question.id === questionId);
        if (index < 0) return group;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sorted.length) return group;
        const currentNumber = sorted[index].number;
        sorted[index] = {...sorted[index], number: sorted[targetIndex].number};
        sorted[targetIndex] = {...sorted[targetIndex], number: currentNumber};
        return normalizeGroup({...group, questions: sorted});
      })
    );
  };

  const handleDuplicateQuestion = (groupId: string, questionId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const source = group.questions.find((question) => question.id === questionId);
        if (!source) return group;
        const occupiedByOthers = getOccupiedNumbers(current, group.id);
        const insertNumber = getBoundaryInsertNumber(group, range, occupiedByOthers);
        if (insertNumber == null) return group;
        return normalizeGroup({
          ...group,
          questions: [...group.questions, {...structuredClone(source), id: makeCopyId(source.id), number: insertNumber}]
        });
      })
    );
  };

  const handleDeleteQuestion = (groupId: string, questionId: string) => {
    setGroups((current) =>
      current.flatMap((group) => {
        if (group.id !== groupId) return [group];
        const nextQuestions = group.questions.filter((question) => question.id !== questionId);
        if (!nextQuestions.length) return [];
        return [normalizeGroup({...group, questions: nextQuestions})];
      })
    );

    if (selectedQuestionRef?.questionId === questionId) {
      setSelectedQuestionRef(null);
    }
  };

  const handleQuestionChange = (nextQuestion: BuilderQuestion) => {
    if (!selectedQuestionRef) return;
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== selectedQuestionRef.groupId) return group;

        const updatedQuestions = group.questions.map((question) => (question.id === selectedQuestionRef.questionId ? nextQuestion : question));
        const changedQuestion = updatedQuestions.find((question) => question.id === selectedQuestionRef.questionId);

        if (!changedQuestion) {
          return group;
        }

        const isMatchingHeadings = changedQuestion.type === "matching_headings";
        const isOtherGroupedType =
          changedQuestion.type === "matching_information"
          || changedQuestion.type === "matching_features"
          || changedQuestion.type === "selecting_from_a_list"
          || changedQuestion.type === "map";

        if (isMatchingHeadings || isOtherGroupedType) {
          const sourceQuestion = changedQuestion as BuilderQuestion & {headings?: string[]; choices?: string[]};
          return {
            ...group,
            questions: updatedQuestions.map((question) => {
              if (question.id === changedQuestion.id) {
                return question;
              }

              if (isMatchingHeadings) {
                return {...question, headings: [...(sourceQuestion.headings ?? [])]} as BuilderQuestion;
              }

              return {...question, choices: [...(sourceQuestion.choices ?? [])]} as BuilderQuestion;
            })
          };
        }

        return {
          ...group,
          questions: updatedQuestions
        };
      })
    );
  };

  const handleAttachEvidence = (text: string) => {
    if (!selectedQuestionRef) return false;

    let attached = false;
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== selectedQuestionRef.groupId) return group;
        return {
          ...group,
          questions: group.questions.map((question) => {
            if (question.id !== selectedQuestionRef.questionId) return question;
            attached = true;
            return {
              ...question,
              evidence: text,
              evidenceText: text
            };
          })
        };
      })
    );

    return attached;
  };

  const handleSave = async () => {
    if (!owner || !structure) return;

    setSaving(true);
    try {
      const orderedGroups = [...groups].sort((left, right) => left.from - right.from);
      const highestAssignedNumber = orderedGroups.reduce((highest, group) => {
        return Math.max(highest, ...group.questions.map((question) => question.number));
      }, 0);
      const maxQuestions = Math.max(range.to - range.from + 1, highestAssignedNumber, 1);
      const fullText = structure.content.join("\n\n").trim() || " ";

      if (module === "reading") {
        const readingOwner = owner as AdminMarathonReadingPassageRecord;
        const updatedOwner = await adminMarathonsService.patchReadingPassage(readingOwner.id, {
          title: structure.title.trim() || owner.title,
          passage_text: fullText,
          difficulty_level: readingOwner.difficulty_level,
          estimated_time_minutes: readingOwner.estimated_time_minutes ?? null,
          max_questions: maxQuestions,
          time_limit_seconds: readingOwner.time_limit_seconds ?? null,
          is_active: readingOwner.is_active
        } satisfies Partial<AdminMarathonReadingPassagePayload>);
        setOwner(updatedOwner);
      } else {
        const listeningOwner = owner as AdminMarathonListeningPartRecord;
        const updatedOwner = await adminMarathonsService.patchListeningPart(listeningOwner.id, {
          part_number: listeningOwner.part_number ?? undefined,
          title: structure.title.trim() || owner.title,
          transcript_text: fullText,
          difficulty_level: listeningOwner.difficulty_level,
          estimated_time_minutes: listeningOwner.estimated_time_minutes ?? null,
          max_questions: maxQuestions,
          time_limit_seconds: listeningOwner.time_limit_seconds ?? null,
          is_active: listeningOwner.is_active,
          ...(selectedAudioFile ? {audio_file: selectedAudioFile} : {}),
          ...(removeCurrentAudio ? {remove_audio: true} : {})
        } satisfies Partial<AdminMarathonListeningPartPayload>);
        setOwner(updatedOwner);
      }

      const remoteList = await questionGroupsService.list(
        module === "reading"
          ? {page: 1, pageSize: 100, ordering: "group_order", reading_passage: owner.id}
          : {page: 1, pageSize: 100, ordering: "group_order", listening_part: owner.id}
      );
      const remoteDetailed = await Promise.all(remoteList.results.map((group) => questionGroupsService.getById(group.id)));
      const remoteById = new Map(remoteDetailed.map((group) => [String(group.id), group]));
      const localIdSet = new Set(groups.map((group) => group.id));

      for (const remoteGroup of remoteDetailed) {
        if (!localIdSet.has(String(remoteGroup.id))) {
          await questionGroupsService.remove(remoteGroup.id);
        }
      }

      for (let index = 0; index < orderedGroups.length; index += 1) {
        const group = orderedGroups[index];
        const apiQuestionType = resolveApiQuestionTypeForGroup(group.type, Math.max(1, group.to - group.from + 1), group.groupContentJson, module);
        const payload: QuestionGroupPayload = {
          question_type: apiQuestionType,
          group_order: index + 1,
          instructions: group.instructions ?? "",
          question_number_start: group.from,
          question_number_end: group.to,
          word_limit: null,
          number_allowed: false,
          group_content_json: resolveGroupContentForSync(group, module),
          is_active: true,
          ...(module === "reading"
            ? {reading_passage: owner.id, listening_part: null, variant_set: null}
            : {listening_part: owner.id, reading_passage: null, variant_set: null})
        };

        const remote = remoteById.get(group.id);
        const savedGroup: QuestionGroupRecord = remote
          ? await questionGroupsService.patch(remote.id, payload)
          : await questionGroupsService.create(payload);

        const savedDetail = await questionGroupsService.getById(savedGroup.id);
        const existingQuestions = Array.isArray(savedDetail.questions) ? savedDetail.questions : [];
        await Promise.all(existingQuestions.map((question) => questionsService.remove(question.id!)));

        const readyQuestions = group.questions.filter((question) => isQuestionReadyForSync(question));
        if (readyQuestions.length > 0) {
          await questionsService.bulkCreate(savedGroup.id, apiQuestionType, {
            questions: readyQuestions.map((question, questionIndex) => mapBuilderQuestionToBulkPayload(question, apiQuestionType, questionIndex + 1))
          });
        }
      }

      await load();
      setNotice({title: t("notices.saved.title"), description: t("notices.saved.description"), tone: "success"});
    } catch {
      setNotice({title: t("notices.saveFailed.title"), description: t("notices.saveFailed.description"), tone: "error"});
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteToast notice={notice} />
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            title={structure?.title ?? owner?.title ?? t("detail.title")}
            actions={
              <div className="flex items-center gap-2">
                <Button asChild type="button" variant="outline" className="rounded-xl">
                  <Link href={`/${locale}/admin/marathons/${marathonId}?tab=${module}&refresh=${ownerId}&type=${module}`}>
                    <ArrowLeft className="size-4" />
                    {t("actions.back")}
                  </Link>
                </Button>
                <div className="inline-flex rounded-xl border border-border/70 bg-card/60 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === "editor" ? "secondary" : "ghost"}
                    className="h-8 rounded-lg"
                    onClick={() => setMode("editor")}
                    disabled={saving || loading}
                  >
                    <PencilLine className="size-3.5" />
                    {builderT("topbar.mode.editor")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === "preview" ? "secondary" : "ghost"}
                    className="h-8 rounded-lg"
                    onClick={() => setMode("preview")}
                    disabled={saving || loading}
                  >
                    <Eye className="size-3.5" />
                    {builderT("topbar.mode.preview")}
                  </Button>
                </div>
                <Button type="button" className="rounded-xl" disabled={saving || loading || !structure} onClick={() => void handleSave()}>
                  <Save className="size-4" />
                  {saving ? t("actions.saving") : saveLabel}
                </Button>
              </div>
            }
          />

          <main className="mx-auto min-w-0 w-full max-w-[1760px] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <LoadingModal open={saving} message={builderT("validation.syncing") ?? "Saving your changes to the server..."} />

            {!structure || !owner || loading ? (
              <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-10 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            ) : (
              <section className="space-y-4">
                <div className="rounded-3xl border border-border/70 bg-card/70 px-5 py-4">
                  <p className="text-sm font-semibold tracking-tight">{builderFlowTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{builderFlowDescription}</p>
                </div>

                <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_420px]">
                  <div className="min-w-0">
                  <TestStructurePanel
                    module={module}
                    structures={[structure]}
                    activeStructureId={structure.id}
                    questionProgressByStructureId={questionProgressByStructureId}
                    onSelect={() => undefined}
                    onRename={(_, title) => setStructure((current) => (current ? {...current, title} : current))}
                  />
                  </div>

                  <div className="min-w-0">
                  <PassageEditor
                    mode={mode}
                    module={module}
                    structure={structure}
                    selectedQuestionLabel={selectedQuestionLabel}
                    contentBankPassages={[]}
                    selectedPassageId=""
                    onSelectContentBankPassage={() => undefined}
                    variantSets={[]}
                    hasAnyVariantSets={false}
                    requiredQuestionCount={range.to - range.from + 1}
                    selectedVariantSetId=""
                    selectedVariantSetName={null}
                    onSelectVariantSet={() => undefined}
                    onUpdateContent={(structureId, content) =>
                      setStructure((current) => (current && current.id === structureId ? {...current, content} : current))
                    }
                    selectedAudioFileName={selectedAudioFile?.name}
                    removeCurrentAudio={removeCurrentAudio}
                    onSelectAudioFile={setSelectedAudioFile}
                    onToggleRemoveCurrentAudio={setRemoveCurrentAudio}
                    onAttachEvidence={handleAttachEvidence}
                  />
                  </div>

                  <div className="min-w-0 xl:col-span-2 2xl:col-span-1">
                  <QuestionGroupsPanel
                    mode={mode}
                    module={module}
                    activeStructure={structure}
                    groups={groups}
                    collapsedGroups={collapsedGroups}
                    selectedQuestionId={selectedQuestionRef?.questionId ?? null}
                    onCreateGroup={handleCreateGroup}
                    onEditGroup={handleEditGroup}
                    onDuplicateGroup={handleDuplicateGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onToggleGroupCollapse={(groupId) => setCollapsedGroups((current) => ({...current, [groupId]: !current[groupId]}))}
                    onAddQuestion={handleAddQuestion}
                    onOpenQuestionEditor={(groupId, questionId) => setSelectedQuestionRef({groupId, questionId})}
                    onSelectQuestion={(groupId, questionId) => setSelectedQuestionRef({groupId, questionId})}
                    onMoveQuestion={handleMoveQuestion}
                    onDuplicateQuestion={handleDuplicateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                  />
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      <QuestionEditorModal
        open={Boolean(selectedQuestionRef && selectedQuestion)}
        question={selectedQuestion}
        module={module}
        mcqMode="single"
        summaryWordBankOptions={selectedWordBankOptions}
        onOpenChange={(open) => {
          if (!open) setSelectedQuestionRef(null);
        }}
        onQuestionChange={handleQuestionChange}
      />
    </div>
  );
}
