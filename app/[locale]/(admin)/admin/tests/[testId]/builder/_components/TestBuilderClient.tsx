"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import type {BuilderQuestion, QuestionGroup, QuestionType} from "@/data/admin-test-builder";
import {createDefaultQuestion, createQuestionGroup, getInitialBuilderTest, getStructureRange, type BuilderMode} from "@/data/admin-test-builder";

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

function makeCopyId(value: string) {
  return `${value}-copy-${Math.random().toString(36).slice(2, 8)}`;
}

function buildGroupTitle(from: number, to: number) {
  return `Questions ${from}-${to}`;
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

  const handleCreateGroup = (type: QuestionType, from: number, to: number) => {
    const group = createQuestionGroup(type, from, to);
    updateGroupsForActiveStructure((groups) => [...groups, group]);
    setCollapsedGroups((current) => ({...current, [group.id]: false}));
  };

  const handleEditGroup = (groupId: string, type: QuestionType, from: number, to: number) => {
    updateGroupsForActiveStructure((groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const questions: BuilderQuestion[] = [];
        for (let number = from; number <= to; number += 1) {
          const existing = group.questions.find((question) => question.number === number && question.type === type);
          questions.push(existing ? {...existing, number} : createDefaultQuestion(type, number));
        }

        return {
          ...group,
          type,
          from,
          to,
          title: buildGroupTitle(from, to),
          questions
        };
      })
    );
  };

  const handleDuplicateGroup = (groupId: string) => {
    updateGroupsForActiveStructure((groups) => {
      const index = groups.findIndex((group) => group.id === groupId);
      if (index < 0) {
        return groups;
      }

      const source = groups[index];
      const duplicate: QuestionGroup = {
        ...source,
        id: makeCopyId(source.id),
        title: `${source.title} ${t("groups.copySuffix")}`,
        questions: source.questions.map((question) => ({...question, id: makeCopyId(question.id)}))
      };

      const next = [...groups];
      next.splice(index + 1, 0, duplicate);
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
        if (group.id !== groupId || group.to >= range.to) {
          return group;
        }
        const nextNumber = group.to + 1;
        return {
          ...group,
          to: nextNumber,
          title: buildGroupTitle(group.from, nextNumber),
          questions: [...group.questions, createDefaultQuestion(group.type, nextNumber)]
        };
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
        if (group.id !== groupId || group.to >= range.to) {
          return group;
        }

        const source = group.questions.find((question) => question.id === questionId);
        if (!source) {
          return group;
        }

        const nextNumber = group.to + 1;
        const duplicate = {
          ...source,
          id: makeCopyId(source.id),
          number: nextNumber
        } as BuilderQuestion;

        return {
          ...group,
          to: nextNumber,
          title: buildGroupTitle(group.from, nextNumber),
          questions: [...group.questions, duplicate]
        };
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
        const numbers = questions.map((question) => question.number);
        const from = Math.min(...numbers);
        const to = Math.max(...numbers);

        return {
          ...group,
          from,
          to,
          title: buildGroupTitle(from, to),
          questions
        };
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

  const handleSaveDraft = () => {
    setTest((current) => ({...current, status: "draft"}));
    console.info("[builder] saved as draft", test.id);
  };

  const handlePublish = () => {
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
