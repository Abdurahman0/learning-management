"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {BookOpen, Clock3, FileText, Headphones, Mic, Paperclip, PenSquare, Send, Trash2} from "lucide-react";

import {getStudentAssignmentById, STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import type {StudentAssignmentStatus, StudentAssignmentUploadedFile, StudentModuleKey} from "@/types/student";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

type StudentAssignmentSubmissionClientProps = {
  assignmentId: string;
  nowTimestamp: number;
};

type NoticeTone = "info" | "success" | "warning" | "danger";

type Notice = {
  title: string;
  description: string;
  tone: NoticeTone;
};

type DraftPayload = {
  writingResponse: string;
  speakingNotes: string;
  answers: Record<string, string>;
  uploadedFiles: StudentAssignmentUploadedFile[];
  hasRecording: boolean;
  recordingSeconds: number;
  savedAt: string;
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/14 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/14 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/14 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/14 text-cyan-700 dark:text-cyan-200"
} as const;

const statusTone: Record<StudentAssignmentStatus, string> = {
  pending: "border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  submitted: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  reviewed: "border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  overdue: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200"
};

const noticeToneClass: Record<NoticeTone, string> = {
  info: "border-blue-400/35 bg-blue-500/10 text-blue-700 dark:text-blue-100",
  success: "border-emerald-400/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
  warning: "border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-100",
  danger: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-100"
};

const moduleIconMap: Record<StudentModuleKey, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenSquare,
  speaking: Mic
};

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
};

const isAudioName = (fileName: string) => /\.(mp3|wav|m4a)$/i.test(fileName);

const getDraftStorageKey = (assignmentId: string) => `ielts-master:assignment-submission:${assignmentId}`;

const readDraftFromStorage = (assignmentId: string): DraftPayload | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getDraftStorageKey(assignmentId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DraftPayload;
  } catch {
    window.localStorage.removeItem(getDraftStorageKey(assignmentId));
    return null;
  }
};

export function StudentAssignmentSubmissionClient({assignmentId, nowTimestamp}: StudentAssignmentSubmissionClientProps) {
  const t = useTranslations("studentAssignmentSubmission");
  const locale = useLocale();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assignment = useMemo(() => getStudentAssignmentById(assignmentId), [assignmentId]);
  const teacher = assignment ? STUDENT_ASSIGNMENT_TEACHERS[assignment.teacherId] : null;
  const submission = assignment?.submission;
  const initialDraft = useMemo(() => (assignment ? readDraftFromStorage(assignment.id) : null), [assignment]);

  const [currentStatus, setCurrentStatus] = useState<StudentAssignmentStatus>(assignment?.status ?? "pending");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDraft?.savedAt ?? null);

  const [writingResponse, setWritingResponse] = useState(initialDraft?.writingResponse ?? submission?.existingDraft ?? "");
  const [speakingNotes, setSpeakingNotes] = useState(initialDraft?.speakingNotes ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(initialDraft?.answers ?? submission?.existingAnswers ?? {});
  const [uploadedFiles, setUploadedFiles] = useState<StudentAssignmentUploadedFile[]>(
    initialDraft?.uploadedFiles ?? submission?.existingUploadedFiles ?? []
  );
  const [hasRecording, setHasRecording] = useState(Boolean(initialDraft?.hasRecording));
  const [recordingSeconds, setRecordingSeconds] = useState(initialDraft?.recordingSeconds ?? 0);
  const [isRecording, setIsRecording] = useState(false);
  const speakingConfig = submission?.speakingConfig;
  const recordingLimit = speakingConfig?.recordingLimitSeconds ?? 0;

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = window.setInterval(() => {
      setRecordingSeconds((current) => {
        const next = current + 1;

        if (recordingLimit && next >= recordingLimit) {
          window.clearInterval(interval);
          setIsRecording(false);
          setHasRecording(true);
          setHasUnsavedChanges(true);
          setNotice({
            tone: "warning",
            title: t("feedback.recordingLimit.title"),
            description: t("feedback.recordingLimit.description")
          });
          return recordingLimit;
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording, recordingLimit, t]);

  const writingWordCount = useMemo(() => countWords(writingResponse), [writingResponse]);

  const activeQuestionSet = useMemo(() => {
    if (!submission) {
      return null;
    }

    if (submission.assignmentType === "questionSet") {
      return submission.questionSetConfig ?? null;
    }

    if (submission.assignmentType === "mixed") {
      return submission.mixedQuestionSetConfig ?? null;
    }

    return null;
  }, [submission]);

  const answeredCount = useMemo(() => {
    if (!activeQuestionSet) {
      return 0;
    }

    return activeQuestionSet.questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length;
  }, [activeQuestionSet, answers]);

  const speakingReady = hasRecording || uploadedFiles.some((file) => isAudioName(file.name));

  const dueMeta = useMemo(() => {
    if (!assignment) {
      return null;
    }

    if (assignment.isAnytime) {
      return {label: t("header.anytime"), isOverdue: false};
    }

    const dueTs = new Date(assignment.dueAt).getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const diff = Math.ceil((dueTs - nowTimestamp) / dayMs);

    if (diff >= 0) {
      return {label: t("header.remainingDays", {days: Math.max(1, diff)}), isOverdue: false};
    }

    return {label: t("header.overdueDays", {days: Math.abs(diff)}), isOverdue: true};
  }, [assignment, nowTimestamp, t]);

  const pushNotice = (next: Notice) => {
    setNotice(next);
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const addFiles = (list: FileList | null) => {
    if (!list || !submission || !assignment) {
      return;
    }

    const attachmentRule = submission.attachment;
    if (!attachmentRule.enabled) {
      return;
    }

    const accepted = new Set(attachmentRule.acceptedExtensions.map((item) => item.replace(".", "").toLowerCase()));
    const currentCount = uploadedFiles.length;
    const nextFiles: StudentAssignmentUploadedFile[] = [];

    for (const file of Array.from(list)) {
      if (currentCount + nextFiles.length >= attachmentRule.maxFiles) {
        pushNotice({
          tone: "warning",
          title: t("feedback.maxFiles.title"),
          description: t("feedback.maxFiles.description", {count: attachmentRule.maxFiles})
        });
        break;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !accepted.has(extension)) {
        pushNotice({
          tone: "danger",
          title: t("feedback.fileType.title"),
          description: t("feedback.fileType.description")
        });
        continue;
      }

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > attachmentRule.maxSizeMb) {
        pushNotice({
          tone: "danger",
          title: t("feedback.fileSize.title"),
          description: t("feedback.fileSize.description", {size: attachmentRule.maxSizeMb})
        });
        continue;
      }

      nextFiles.push({
        id: `new-file-${Date.now()}-${nextFiles.length}`,
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        source: "new"
      });
    }

    if (!nextFiles.length) {
      return;
    }

    setUploadedFiles((current) => [...current, ...nextFiles]);
    setHasUnsavedChanges(true);
    pushNotice({
      tone: "success",
      title: t("feedback.upload.title"),
      description: t("feedback.upload.description", {count: nextFiles.length})
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((current) => current.filter((file) => file.id !== fileId));
    setHasUnsavedChanges(true);
    pushNotice({
      tone: "info",
      title: t("feedback.fileRemoved.title"),
      description: t("feedback.fileRemoved.description")
    });
  };

  const saveDraft = () => {
    if (!assignment) {
      return;
    }

    const payload: DraftPayload = {
      writingResponse,
      speakingNotes,
      answers,
      uploadedFiles,
      hasRecording,
      recordingSeconds,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem(getDraftStorageKey(assignment.id), JSON.stringify(payload));
    setLastSavedAt(payload.savedAt);
    setHasUnsavedChanges(false);
    pushNotice({
      tone: "success",
      title: t("feedback.draftSaved.title"),
      description: t("feedback.draftSaved.description")
    });
  };

  const validateBeforeSubmit = () => {
    if (!submission) {
      return t("validation.missingSubmission");
    }

    if (submission.assignmentType === "writing") {
      const minWords = submission.writingConfig?.minimumWords ?? 80;
      if (writingWordCount < minWords) {
        return t("validation.writing", {min: minWords});
      }
      return null;
    }

    if (submission.assignmentType === "speaking") {
      if (!speakingReady) {
        return t("validation.speaking");
      }
      return null;
    }

    if (submission.assignmentType === "questionSet") {
      const minAnswered = submission.questionSetConfig?.minAnswered ?? 1;
      if (answeredCount < minAnswered) {
        return t("validation.questionSet", {min: minAnswered});
      }
      return null;
    }

    const mixedWords = countWords(writingResponse);
    const minMixedWords = submission.mixedWritingConfig?.minimumWords ?? 40;
    const mixedMinAnswers = submission.mixedQuestionSetConfig?.minAnswered ?? 1;

    if (mixedWords < minMixedWords) {
      return t("validation.mixedWriting", {min: minMixedWords});
    }

    if (answeredCount < mixedMinAnswers) {
      return t("validation.mixedQuestions", {min: mixedMinAnswers});
    }

    return null;
  };

  const submitAssignment = () => {
    const validationError = validateBeforeSubmit();

    if (validationError) {
      pushNotice({
        tone: "danger",
        title: t("feedback.submitFailed.title"),
        description: validationError
      });
      return;
    }

    saveDraft();
    setCurrentStatus("submitted");
    pushNotice({
      tone: "success",
      title: t("feedback.submitSuccess.title"),
      description: t("feedback.submitSuccess.description")
    });

    window.setTimeout(() => {
      router.push(`/${locale}/assignments?submitted=${assignmentId}`);
    }, 1000);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(t("confirm.cancelWithChanges"));
      if (!confirmed) {
        return;
      }
    }

    router.push(`/${locale}/assignments`);
  };

  const startRecording = () => {
    if (isRecording) {
      return;
    }

    setRecordingSeconds(0);
    setIsRecording(true);
    setHasUnsavedChanges(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingSeconds > 0) {
      setHasRecording(true);
      setHasUnsavedChanges(true);
    }
  };

  const replayRecording = () => {
    if (!speakingReady) {
      pushNotice({
        tone: "warning",
        title: t("feedback.replayEmpty.title"),
        description: t("feedback.replayEmpty.description")
      });
      return;
    }

    pushNotice({
      tone: "info",
      title: t("feedback.replay.title"),
      description: t("feedback.replay.description")
    });
  };

  if (!assignment || !submission || !teacher) {
    return (
      <main className="mx-auto min-w-0 w-full max-w-[1480px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
        <Card className={cn(cardClassName, "mx-auto max-w-2xl p-6 sm:p-8")}>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("empty.notFound.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty.notFound.description")}</p>
          <Button className="mt-5 h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/assignments`)}>
            {t("actions.backToAssignments")}
          </Button>
        </Card>
      </main>
    );
  }

  const ModuleIcon = moduleIconMap[assignment.module];
  const fileAccept = submission.attachment.acceptedExtensions.map((item) => (item.startsWith(".") ? item : `.${item}`)).join(",");

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1700px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        {notice ? (
          <Card className={cn("rounded-xl shadow-none", noticeToneClass[notice.tone])}>
            <CardContent className="p-3">
              <p className="text-sm font-semibold">{notice.title}</p>
              <p className="text-sm opacity-90">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <Card className={cn(cardClassName, "p-4 sm:p-5")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("border", moduleBadgeTone[assignment.module])}>
                  <ModuleIcon className="mr-1.5 size-3.5" />
                  {t(`modules.${assignment.module}`)}
                </Badge>
                <span className="text-sm text-muted-foreground">{t("header.assignedBy", {name: teacher.name})}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{assignment.title}</h1>
            </div>

            <div className="space-y-2 text-left lg:text-right">
              <p className={cn("inline-flex items-center gap-1.5 text-sm font-medium", dueMeta?.isOverdue ? "text-rose-600 dark:text-rose-300" : "text-amber-600 dark:text-amber-300")}>
                <Clock3 className="size-4" />
                {dueMeta?.label}
              </p>
              <div>
                <Badge className={cn("border font-semibold uppercase", statusTone[currentStatus])}>{t(`status.${currentStatus}`)}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
          <section className="space-y-4">
            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                  <FileText className="size-5 text-indigo-600 dark:text-indigo-300" />
                  {t("instructions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0 pt-4">
                <p className="text-[15px] leading-relaxed text-foreground/90">{t(submission.instructionsKey)}</p>
                {submission.teacherNoteKey ? (
                  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("instructions.teacherNote")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{t(submission.teacherNoteKey)}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 p-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t(`workspace.typeTitles.${submission.assignmentType}`)}</CardTitle>
                {submission.assignmentType === "writing" || submission.assignmentType === "mixed" ? (
                  <p className="text-sm text-muted-foreground">
                    {t("workspace.writing.wordCount", {count: writingWordCount})}
                    {" | "}
                    {t("workspace.writing.goal", {
                      min: submission.assignmentType === "mixed" ? submission.mixedWritingConfig?.goalMinWords ?? 80 : submission.writingConfig?.goalMinWords ?? 250,
                      max: submission.assignmentType === "mixed" ? submission.mixedWritingConfig?.goalMaxWords ?? 130 : submission.writingConfig?.goalMaxWords ?? 300
                    })}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4 p-0 pt-4">
                {submission.assignmentType === "writing" ? (
                  <textarea
                    value={writingResponse}
                    onChange={(event) => {
                      setWritingResponse(event.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder={t(submission.writingConfig?.placeholderKey ?? "workspace.writing.placeholderTask2")}
                    className="min-h-[320px] w-full resize-y rounded-xl border border-border/70 bg-background/70 p-4 text-[15px] leading-relaxed text-foreground outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40"
                  />
                ) : null}

                {submission.assignmentType === "speaking" ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("workspace.speaking.prompt")}</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{t(submission.speakingConfig?.promptKey ?? "workspace.speaking.defaultPrompt")}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button className="h-9 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={startRecording} disabled={isRecording}>
                        <Mic className="size-4" />
                        {t("workspace.speaking.start")}
                      </Button>
                      <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70" onClick={stopRecording} disabled={!isRecording}>
                        {t("workspace.speaking.stop")}
                      </Button>
                      <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70" onClick={replayRecording}>
                        {t("workspace.speaking.replay")}
                      </Button>
                      <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70" onClick={openPicker}>
                        <Paperclip className="size-4" />
                        {t("workspace.speaking.uploadAudio")}
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                      {t("workspace.speaking.recordingTime", {time: formatSeconds(recordingSeconds)})}
                      {" / "}
                      {t("workspace.speaking.recordingLimit", {time: formatSeconds(recordingLimit)})}
                    </div>

                    <textarea
                      value={speakingNotes}
                      onChange={(event) => {
                        setSpeakingNotes(event.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder={t(submission.speakingConfig?.notesPlaceholderKey ?? "workspace.speaking.notesPlaceholder")}
                      className="min-h-[140px] w-full resize-y rounded-xl border border-border/70 bg-background/70 p-4 text-sm leading-relaxed text-foreground outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40"
                    />
                  </div>
                ) : null}

                {submission.assignmentType === "questionSet" || submission.assignmentType === "mixed" ? (
                  <div className="space-y-4">
                    {submission.assignmentType === "mixed" ? (
                      <textarea
                        value={writingResponse}
                        onChange={(event) => {
                          setWritingResponse(event.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder={t(submission.mixedWritingConfig?.placeholderKey ?? "workspace.mixed.reflectionPlaceholder")}
                        className="min-h-[170px] w-full resize-y rounded-xl border border-border/70 bg-background/70 p-4 text-sm leading-relaxed text-foreground outline-none transition focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/40"
                      />
                    ) : null}

                    {activeQuestionSet?.questions.map((question, index) => {
                      const value = answers[question.id] ?? "";

                      return (
                        <div key={question.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                          <p className="text-sm font-medium text-foreground">
                            {index + 1}. {t(question.promptKey)}
                          </p>

                          {question.inputType === "multipleChoice" ? (
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(question.options ?? []).map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={cn(
                                    "h-10 rounded-lg border px-3 text-left text-sm transition",
                                    value === option.value
                                      ? "border-indigo-400/55 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200"
                                      : "border-border/70 bg-background/75 text-foreground hover:bg-muted/60"
                                  )}
                                  onClick={() => {
                                    setAnswers((current) => ({...current, [question.id]: option.value}));
                                    setHasUnsavedChanges(true);
                                  }}
                                >
                                  {t(option.labelKey)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <Input
                              value={value}
                              onChange={(event) => {
                                setAnswers((current) => ({...current, [question.id]: event.target.value}));
                                setHasUnsavedChanges(true);
                              }}
                              placeholder={t(question.placeholderKey ?? "workspace.questionSet.defaults.shortAnswerPlaceholder")}
                              className="mt-3 h-10 rounded-lg border-border/70 bg-background/75"
                            />
                          )}
                        </div>
                      );
                    })}

                    <p className="text-sm text-muted-foreground">
                      {t("workspace.questionSet.progress", {
                        answered: answeredCount,
                        total: activeQuestionSet?.questions.length ?? 0
                      })}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                  <Paperclip className="size-5 text-indigo-600 dark:text-indigo-300" />
                  {t("attachments.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-0 pt-4">
                <input ref={fileInputRef} type="file" className="hidden" multiple accept={fileAccept} onChange={handleFileChange} />

                <div
                  role="button"
                  tabIndex={0}
                  className="w-full rounded-xl border border-dashed border-border/70 bg-background/60 p-5 text-center transition hover:bg-muted/45"
                  onClick={openPicker}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPicker();
                    }
                  }}
                >
                  <p className="mx-auto inline-flex size-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200">
                    <Paperclip className="size-4" />
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">{t("attachments.dropzone")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("attachments.helper", {
                      size: submission.attachment.maxSizeMb,
                      count: submission.attachment.maxFiles
                    })}
                  </p>
                  <span className="mt-3 inline-flex h-9 items-center rounded-xl border border-border/70 bg-background/70 px-4 text-sm font-medium text-foreground">
                    {t("attachments.uploadButton")}
                  </span>
                </div>

                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("attachments.empty")}</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{t("attachments.fileSize", {size: file.sizeKb})}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300"
                          onClick={() => removeFile(file.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("quickTips.title")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <ul className="space-y-2 text-sm text-foreground/90">
                  {submission.quickTipKeys.map((tipKey) => (
                    <li key={tipKey} className="flex items-start gap-2">
                      <span className="mt-1 inline-block size-1.5 rounded-full bg-indigo-500" />
                      <span>{t(tipKey)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "p-4 sm:p-5")}>
              <CardHeader className="p-0">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">{t("support.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-0 pt-3 text-sm text-muted-foreground">
                <p>{t("support.item1")}</p>
                <p>{t("support.item2")}</p>
                <p>{t("support.item3")}</p>
              </CardContent>
            </Card>
          </aside>
        </section>

        <Card className={cn(cardClassName, "p-3 sm:p-4")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {lastSavedAt ? t("footer.lastSaved", {date: new Date(lastSavedAt).toLocaleString(locale === "uz" ? "uz-UZ" : "en-US")}) : t("footer.notSavedYet")}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
              <Button type="button" variant="outline" className="h-10 rounded-xl border-border/70 bg-background/70" onClick={handleCancel}>
                {t("actions.cancel")}
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-xl border-border/70 bg-background/70" onClick={saveDraft}>
                {t("actions.saveDraft")}
              </Button>
              <Button type="button" className="h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={submitAssignment}>
                {t("actions.submit")}
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
