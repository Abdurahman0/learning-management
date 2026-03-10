"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import type {BuilderQuestion, QuestionGroup, QuestionType} from "@/data/admin-test-builder";
import {
  createDefaultQuestion,
  createQuestionGroup,
  getInitialBuilderTest,
  getStructureRange,
  hasQuestionContent,
  type BuilderMode
} from "@/data/admin-test-builder";
import {
  generateQuestionGroupsFromVariant,
  getAllowedQuestionCount,
  getCompatibleVariantsForSlot,
  getContentBankData,
  getPassageVariantSets,
  type ContentBankPassage,
  type ContentBankVariantSet
} from "@/data/admin/selectors";

import {AdminSidebar, AdminSidebarMobileNav} from "../../../../_components/AdminSidebar";
import {BuilderTopbar} from "./BuilderTopbar";
import {PassageEditor} from "./PassageEditor";
import {QuestionEditorModal} from "./QuestionEditorModal";
import {QuestionGroupsPanel} from "./QuestionGroupsPanel";
import {TestStructurePanel} from "./TestStructurePanel";

type TestBuilderClientProps = {
  testId: string;
  initialStructureId?: string;
  initialMode?: string;
};

type SelectedQuestionRef = {
  groupId: string;
  questionId: string;
};

type SlotRange = {
  from: number;
  to: number;
};

function makeCopyId(value: string) {
  return `${value}-copy-${Math.random().toString(36).slice(2, 8)}`;
}

function buildGroupTitle(from: number, to: number) {
  return `Questions ${from}-${to}`;
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function getOccupiedNumbers(groups: QuestionGroup[], excludeGroupId?: string) {
  const occupied = new Set<number>();
  for (const group of groups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    for (const question of group.questions) {
      occupied.add(question.number);
    }
  }
  return occupied;
}

function isRangeWithin(range: SlotRange, from: number, to: number) {
  return from >= range.from && to <= range.to && from <= to;
}

function isRangeFree(occupied: Set<number>, from: number, to: number) {
  for (let number = from; number <= to; number += 1) {
    if (occupied.has(number)) {
      return false;
    }
  }
  return true;
}

function normalizeGroup(group: QuestionGroup): QuestionGroup {
  const uniqueNumbers = uniqueSortedNumbers(group.questions.map((question) => question.number));
  if (!uniqueNumbers.length) {
    return group;
  }

  const questions = [...group.questions].sort((left, right) => left.number - right.number);
  const from = uniqueNumbers[0];
  const to = uniqueNumbers[uniqueNumbers.length - 1];
  return {
    ...group,
    from,
    to,
    title: buildGroupTitle(from, to),
    questions
  };
}

function findContiguousFreeRange(range: SlotRange, occupied: Set<number>, length: number) {
  if (length <= 0) return null;

  for (let start = range.from; start + length - 1 <= range.to; start += 1) {
    let hasCollision = false;
    for (let number = start; number < start + length; number += 1) {
      if (occupied.has(number)) {
        hasCollision = true;
        break;
      }
    }
    if (!hasCollision) {
      return {from: start, to: start + length - 1};
    }
  }

  return null;
}

function getBoundaryInsertNumber(group: QuestionGroup, range: SlotRange, occupiedByOthers: Set<number>) {
  const appendNumber = group.to + 1;
  if (appendNumber <= range.to && !occupiedByOthers.has(appendNumber)) {
    return appendNumber;
  }

  const prependNumber = group.from - 1;
  if (prependNumber >= range.from && !occupiedByOthers.has(prependNumber)) {
    return prependNumber;
  }

  return null;
}

export function TestBuilderClient({testId, initialStructureId, initialMode}: TestBuilderClientProps) {
  const t = useTranslations("adminTestBuilder");
  const [test, setTest] = useState(() => getInitialBuilderTest(testId));
  const [mode, setMode] = useState<BuilderMode>(() => (initialMode === "preview" ? "preview" : "editor"));
  const [activeStructureId, setActiveStructureId] = useState(() => {
    const initialTest = getInitialBuilderTest(testId);
    if (initialStructureId && initialTest.structures.some((item) => item.id === initialStructureId)) {
      return initialStructureId;
    }
    return initialTest.structures[0]?.id ?? "";
  });
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestionRef | null>(null);
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [contentBankData] = useState(() => getContentBankData());

  const activeStructure = useMemo(() => {
    return test.structures.find((item) => item.id === activeStructureId) ?? test.structures[0];
  }, [activeStructureId, test.structures]);

  const activeGroups = useMemo(() => {
    if (!activeStructure) {
      return [];
    }
    return test.questionGroupsByStructure[activeStructure.id] ?? [];
  }, [activeStructure, test.questionGroupsByStructure]);

  const selectedQuestionData = useMemo(() => {
    if (!selectedQuestion) {
      return null;
    }
    const group = activeGroups.find((item) => item.id === selectedQuestion.groupId);
    const question = group?.questions.find((item) => item.id === selectedQuestion.questionId);
    if (!group || !question) {
      return null;
    }
    return {group, question};
  }, [activeGroups, selectedQuestion]);

  const availableContentBankPassages = useMemo<ContentBankPassage[]>(() => {
    if (!activeStructure) return [];
    const assignedInOtherSlots = new Set(
      test.structures
        .filter((structure) => structure.id !== activeStructure.id)
        .map((structure) => structure.linkedPassageId)
        .filter((passageId): passageId is string => Boolean(passageId))
    );

    return contentBankData.passages
      .filter((passage) => passage.module === test.module)
      .filter((passage) => {
        if (passage.id === activeStructure.linkedPassageId) {
          return true;
        }
        return !assignedInOtherSlots.has(passage.id);
      });
  }, [activeStructure, contentBankData.passages, test.module, test.structures]);

  const passageVariantSets = useMemo<ContentBankVariantSet[]>(() => {
    if (!activeStructure?.linkedPassageId) return [];
    return getPassageVariantSets(activeStructure.linkedPassageId).filter((variant) => variant.module === test.module);
  }, [activeStructure, test.module]);

  const availableVariantSets = useMemo<ContentBankVariantSet[]>(() => {
    if (!activeStructure?.linkedPassageId) return [];
    return getCompatibleVariantsForSlot(activeStructure.linkedPassageId, test.module, activeStructure.index);
  }, [activeStructure, test.module]);

  const selectedVariantSet = useMemo(() => {
    if (!activeStructure?.linkedVariantSetId) return null;
    return availableVariantSets.find((variant) => variant.id === activeStructure.linkedVariantSetId) ?? null;
  }, [activeStructure, availableVariantSets]);

  const slotRequiredQuestions = useMemo(() => {
    if (!activeStructure) return 0;
    return getAllowedQuestionCount(test.module, activeStructure.index);
  }, [activeStructure, test.module]);

  const structureQuestionProgress = useMemo(() => {
    return test.structures.map((structure) => {
      const range = getStructureRange(structure);
      const required = range.to - range.from + 1;
      const groups = test.questionGroupsByStructure[structure.id] ?? [];
      const assignedSet = new Set<number>();
      let inRangeEntries = 0;
      let outOfRangeEntries = 0;

      for (const group of groups) {
        for (const question of group.questions) {
          if (question.number >= range.from && question.number <= range.to) {
            inRangeEntries += 1;
            assignedSet.add(question.number);
          } else {
            outOfRangeEntries += 1;
          }
        }
      }

      const assigned = assignedSet.size;
      const hasOverlap = inRangeEntries !== assigned;
      return {
        structureId: structure.id,
        structureIndex: structure.index,
        structureKind: structure.kind,
        assigned,
        required,
        entryCount: inRangeEntries,
        hasOverlap,
        outOfRangeEntries,
        complete: assigned === required && !hasOverlap && outOfRangeEntries === 0
      };
    });
  }, [test.questionGroupsByStructure, test.structures]);

  const questionProgressByStructureId = useMemo(() => {
    return structureQuestionProgress.reduce<Record<string, {assigned: number; required: number; complete: boolean}>>((accumulator, item) => {
      accumulator[item.structureId] = {
        assigned: item.assigned,
        required: item.required,
        complete: item.complete
      };
      return accumulator;
    }, {});
  }, [structureQuestionProgress]);

  const totalAssignedQuestions = useMemo(
    () => structureQuestionProgress.reduce((sum, item) => sum + item.assigned, 0),
    [structureQuestionProgress]
  );

  const totalRequiredQuestions = useMemo(
    () => structureQuestionProgress.reduce((sum, item) => sum + item.required, 0),
    [structureQuestionProgress]
  );

  const canPublishByQuestionCount = useMemo(() => {
    return totalAssignedQuestions === totalRequiredQuestions && structureQuestionProgress.every((item) => item.complete);
  }, [structureQuestionProgress, totalAssignedQuestions, totalRequiredQuestions]);

  const selectedQuestionLabel = selectedQuestionData ? t("questions.questionNumber", {number: selectedQuestionData.question.number}) : null;

  const updateGroupsForActiveStructure = (updater: (groups: QuestionGroup[]) => QuestionGroup[]) => {
    if (!activeStructure) {
      return;
    }

    setTest((current) => {
      const currentGroups = current.questionGroupsByStructure[activeStructure.id] ?? [];
      const nextGroups = updater(currentGroups);

      return {
        ...current,
        questionGroupsByStructure: {
          ...current.questionGroupsByStructure,
          [activeStructure.id]: nextGroups
        }
      };
    });
  };

  const updateQuestion = (groupId: string, questionId: string, updater: (question: BuilderQuestion) => BuilderQuestion) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              questions: group.questions.map((question) => (question.id === questionId ? updater(question) : question))
            }
          : group
      )
    );
  };

  const updateActiveStructure = (updater: (structure: typeof test.structures[number]) => typeof test.structures[number]) => {
    if (!activeStructure) return;

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === activeStructure.id ? updater(structure) : structure))
    }));
  };

  const handleCreateGroup = (type: QuestionType, from: number, to: number) => {
    if (!activeStructure) {
      return;
    }

    const range = getStructureRange(activeStructure);
    if (!isRangeWithin(range, from, to)) {
      return;
    }

    const group = createQuestionGroup(type, from, to);
    updateGroupsForActiveStructure((groups) => {
      const occupied = getOccupiedNumbers(groups);
      if (!isRangeFree(occupied, from, to)) {
        return groups;
      }
      return [...groups, normalizeGroup(group)];
    });
    setCollapsedGroups((current) => ({...current, [group.id]: false}));
  };

  const handleEditGroup = (groupId: string, type: QuestionType, from: number, to: number) => {
    if (!activeStructure) {
      return;
    }

    const range = getStructureRange(activeStructure);
    if (!isRangeWithin(range, from, to)) {
      return;
    }

    updateGroupsForActiveStructure((groups) => {
      const occupiedByOthers = getOccupiedNumbers(groups, groupId);
      if (!isRangeFree(occupiedByOthers, from, to)) {
        return groups;
      }

      return groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const questions: BuilderQuestion[] = [];
        for (let number = from; number <= to; number += 1) {
          const existing = group.questions.find((question) => question.number === number && question.type === type);
          questions.push(existing ? {...existing, number} : createDefaultQuestion(type, number));
        }

        return normalizeGroup({
          ...group,
          type,
          from,
          to,
          title: buildGroupTitle(from, to),
          questions
        });
      });
    });
  };

  const handleDuplicateGroup = (groupId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) => {
      const index = groups.findIndex((group) => group.id === groupId);
      if (index < 0) {
        return groups;
      }

      const source = normalizeGroup(groups[index]);
      const targetRange = findContiguousFreeRange(range, getOccupiedNumbers(groups), source.questions.length);
      if (!targetRange) {
        return groups;
      }

      const duplicate: QuestionGroup = {
        ...source,
        id: makeCopyId(source.id),
        title: `${buildGroupTitle(targetRange.from, targetRange.to)} ${t("groups.copySuffix")}`,
        from: targetRange.from,
        to: targetRange.to,
        questions: source.questions
          .sort((left, right) => left.number - right.number)
          .map((question, questionIndex) => ({
            ...question,
            id: makeCopyId(question.id),
            number: targetRange.from + questionIndex
          })),
        variantSetId: undefined
      };

      const next = [...groups];
      next.splice(index + 1, 0, normalizeGroup(duplicate));
      return next;
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    updateGroupsForActiveStructure((groups) => groups.filter((group) => group.id !== groupId));
    setSelectedQuestion((current) => (current?.groupId === groupId ? null : current));
    setQuestionEditorOpen(false);
  };

  const handleAddQuestion = (groupId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const normalized = normalizeGroup(group);
        const occupiedByOthers = getOccupiedNumbers(groups, groupId);
        const insertNumber = getBoundaryInsertNumber(normalized, range, occupiedByOthers);
        if (insertNumber === null) {
          return group;
        }

        const question = createDefaultQuestion(group.type, insertNumber);
        const questions = insertNumber < normalized.from ? [question, ...normalized.questions] : [...normalized.questions, question];
        return normalizeGroup({...normalized, questions});
      })
    );
  };

  const handleMoveQuestion = (groupId: string, questionId: string, direction: "up" | "down") => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const index = group.questions.findIndex((question) => question.id === questionId);
        if (index < 0) {
          return group;
        }
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= group.questions.length) {
          return group;
        }

        const reordered = [...group.questions];
        const [item] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, item);

        return {...group, questions: reordered};
      })
    );
  };

  const handleDuplicateQuestion = (groupId: string, questionId: string) => {
    if (!activeStructure) {
      return;
    }
    const range = getStructureRange(activeStructure);

    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const normalized = normalizeGroup(group);
        const occupiedByOthers = getOccupiedNumbers(groups, groupId);
        const nextNumber = getBoundaryInsertNumber(normalized, range, occupiedByOthers);
        if (nextNumber === null) {
          return group;
        }

        const source = normalized.questions.find((question) => question.id === questionId);
        if (!source) {
          return group;
        }

        const duplicate = {
          ...source,
          id: makeCopyId(source.id),
          number: nextNumber
        } as BuilderQuestion;

        const questions = nextNumber < normalized.from ? [duplicate, ...normalized.questions] : [...normalized.questions, duplicate];
        return normalizeGroup({...normalized, questions});
      })
    );
  };

  const handleDeleteQuestion = (groupId: string, questionId: string) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId || group.questions.length <= 1) {
          return group;
        }

        const questions = group.questions.filter((question) => question.id !== questionId);
        return normalizeGroup({...group, questions});
      })
    );

    setSelectedQuestion((current) => (current?.questionId === questionId ? null : current));
    setQuestionEditorOpen(false);
  };

  const handleAttachEvidence = (text: string) => {
    if (!selectedQuestion || !text.trim()) {
      return false;
    }

    updateQuestion(selectedQuestion.groupId, selectedQuestion.questionId, (question) => ({
      ...question,
      evidence: text.trim(),
      evidenceText: text.trim()
    }));
    return true;
  };

  const handleRenameStructure = (structureId: string, title: string) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, title} : structure))
    }));
  };

  const handleUpdateStructureContent = (structureId: string, content: string[]) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, content} : structure))
    }));
  };

  const handleUpdateAudioLabel = (structureId: string, audioLabel: string) => {
    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) => (structure.id === structureId ? {...structure, audioLabel} : structure))
    }));
  };

  const handleSelectContentBankPassage = (passageId: string) => {
    if (!activeStructure) return;
    const selectedInOtherSlot = test.structures.some(
      (structure) => structure.id !== activeStructure.id && structure.linkedPassageId === passageId
    );
    if (selectedInOtherSlot) {
      return;
    }

    const passage = availableContentBankPassages.find((item) => item.id === passageId);
    if (!passage) return;

    const currentGroups = test.questionGroupsByStructure[activeStructure.id] ?? [];
    if (currentGroups.length > 0 && hasQuestionContent(currentGroups)) {
      const shouldReplace = window.confirm(t("confirmReplaceGeneratedGroups"));
      if (!shouldReplace) return;
    }

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) =>
        structure.id === activeStructure.id
          ? {
              ...structure,
              linkedPassageId: passage.id,
              linkedVariantSetId: undefined,
              title: passage.title,
              content: passage.fullText.length ? [...passage.fullText] : [passage.previewText]
            }
          : structure
      ),
      questionGroupsByStructure: {
        ...current.questionGroupsByStructure,
        [activeStructure.id]: []
      }
    }));

    setSelectedQuestion(null);
    setQuestionEditorOpen(false);
  };

  const handleSelectVariantSet = (variantSetId: string) => {
    if (!activeStructure) return;
    if (!variantSetId) {
      updateActiveStructure((structure) => ({...structure, linkedVariantSetId: undefined}));
      return;
    }

    const variantSet = availableVariantSets.find((item) => item.id === variantSetId);
    if (!variantSet) return;

    const currentGroups = test.questionGroupsByStructure[activeStructure.id] ?? [];
    if (hasQuestionContent(currentGroups)) {
      const shouldReplace = window.confirm(t("confirmReplaceGeneratedGroups"));
      if (!shouldReplace) return;
    }

    const generatedGroups = generateQuestionGroupsFromVariant({
      module: test.module,
      slotIndex: activeStructure.index,
      variantSet
    });

    setTest((current) => ({
      ...current,
      structures: current.structures.map((structure) =>
        structure.id === activeStructure.id
          ? {
              ...structure,
              linkedPassageId: variantSet.passageId,
              linkedVariantSetId: variantSet.id
            }
          : structure
      ),
      questionGroupsByStructure: {
        ...current.questionGroupsByStructure,
        [activeStructure.id]: generatedGroups
      }
    }));

    setCollapsedGroups((current) => {
      const next = {...current};
      for (const group of generatedGroups) {
        next[group.id] = false;
      }
      return next;
    });
    setSelectedQuestion(null);
    setQuestionEditorOpen(false);
  };

  const handleSaveDraft = () => {
    setTest((current) => ({...current, status: "draft"}));
    console.info("[builder] saved as draft", test.id);
  };

  const handlePublish = () => {
    if (!canPublishByQuestionCount) {
      const pending = structureQuestionProgress
        .filter((item) => !item.complete)
        .map((item) => {
          const flags: string[] = [];
          if (item.hasOverlap) flags.push(t("validation.overlapIssue"));
          if (item.outOfRangeEntries > 0) flags.push(t("validation.outOfRangeIssue"));
          const issueLabel = flags.length ? ` (${flags.join(", ")})` : "";
          return `${t(`structure.labels.${item.structureKind}`, {index: item.structureIndex})}: ${item.assigned}/${item.required}${issueLabel}`;
        });
      const details = pending.length ? `\n\n${pending.join("\n")}` : "";
      window.alert(
        t("validation.publishQuestionCount", {
          current: totalAssignedQuestions,
          required: totalRequiredQuestions
        }) + details
      );
      return;
    }

    setTest((current) => ({...current, status: "published"}));
    console.info("[builder] published", test.id);
  };

  const openQuestionEditor = (groupId: string, questionId: string) => {
    setSelectedQuestion({groupId, questionId});
    setQuestionEditorOpen(true);
  };

  if (!activeStructure) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <BuilderTopbar
            bookName={test.book}
            module={test.module}
            mode={mode}
            status={test.status}
            questionProgressLabel={`${totalAssignedQuestions}/${totalRequiredQuestions}`}
            publishDisabled={!canPublishByQuestionCount}
            mobileNav={<AdminSidebarMobileNav />}
            onModeChange={setMode}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1760px] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_460px]">
              <TestStructurePanel
                module={test.module}
                structures={test.structures}
                activeStructureId={activeStructure.id}
                questionProgressByStructureId={questionProgressByStructureId}
                onSelect={(nextId) => {
                  setActiveStructureId(nextId);
                  setSelectedQuestion(null);
                  setQuestionEditorOpen(false);
                }}
                onRename={handleRenameStructure}
              />

              <PassageEditor
                mode={mode}
                module={test.module}
                structure={activeStructure}
                selectedQuestionLabel={selectedQuestionLabel}
                contentBankPassages={availableContentBankPassages}
                selectedPassageId={activeStructure.linkedPassageId ?? ""}
                onSelectContentBankPassage={handleSelectContentBankPassage}
                variantSets={availableVariantSets}
                hasAnyVariantSets={passageVariantSets.length > 0}
                requiredQuestionCount={slotRequiredQuestions}
                selectedVariantSetId={activeStructure.linkedVariantSetId ?? ""}
                selectedVariantSetName={selectedVariantSet?.name ?? null}
                onSelectVariantSet={handleSelectVariantSet}
                onUpdateContent={handleUpdateStructureContent}
                onUpdateAudioLabel={handleUpdateAudioLabel}
                onAttachEvidence={handleAttachEvidence}
              />

              <QuestionGroupsPanel
                mode={mode}
                module={test.module}
                activeStructure={activeStructure}
                groups={activeGroups}
                collapsedGroups={collapsedGroups}
                selectedQuestionId={selectedQuestion?.questionId ?? null}
                onCreateGroup={handleCreateGroup}
                onEditGroup={handleEditGroup}
                onDuplicateGroup={handleDuplicateGroup}
                onDeleteGroup={handleDeleteGroup}
                onToggleGroupCollapse={(groupId) => setCollapsedGroups((current) => ({...current, [groupId]: !current[groupId]}))}
                onAddQuestion={handleAddQuestion}
                onOpenQuestionEditor={openQuestionEditor}
                onSelectQuestion={(groupId, questionId) => setSelectedQuestion({groupId, questionId})}
                onMoveQuestion={handleMoveQuestion}
                onDuplicateQuestion={handleDuplicateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            </section>
          </main>
        </div>
      </div>

      <QuestionEditorModal
        open={questionEditorOpen && Boolean(selectedQuestionData)}
        question={selectedQuestionData?.question ?? null}
        onOpenChange={setQuestionEditorOpen}
        onQuestionChange={(nextQuestion) => {
          if (!selectedQuestion) {
            return;
          }
          updateQuestion(selectedQuestion.groupId, selectedQuestion.questionId, () => nextQuestion);
        }}
      />
    </div>
  );
}
