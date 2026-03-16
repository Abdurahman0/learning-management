"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileAudio,
  FileImage,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Trash2,
  UserCircle2,
  Users
} from "lucide-react";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
  STUDENT_MESSAGE_ATTACHMENT_PRESETS,
  STUDENT_TEACHER_CONVERSATIONS,
  getStudentAssignmentsByIds,
  getStudentConversationMessages,
  getStudentTeacherProfileById,
  getStudentTeacherNameById
} from "@/data/student/messages";
import {STUDENT_ASSIGNMENT_TEACHERS} from "@/data/student/assignments";
import type {StudentMessageAttachment, StudentTeacherConversation, StudentTeacherMessage} from "@/types/student";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

type MobilePanel = "conversations" | "chat" | "teacher";

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const attachmentTone = {
  pdf: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200",
  essay: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  audio: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200",
  image: "border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200"
} as const;

const attachmentIcon = {
  pdf: FileText,
  essay: FileText,
  audio: FileAudio,
  image: FileImage
} as const;

const sortByNewest = (items: StudentTeacherConversation[]) =>
  [...items].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());

export function StudentMessagesWithTeacherClient() {
  const t = useTranslations("studentMessages");
  const locale = useLocale();
  const router = useRouter();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<StudentMessageAttachment[]>([]);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("conversations");
  const [timeTick, setTimeTick] = useState(() => new Date().getTime());

  const [conversations, setConversations] = useState<StudentTeacherConversation[]>(() => sortByNewest(STUDENT_TEACHER_CONVERSATIONS));
  const [activeConversationId, setActiveConversationId] = useState<string>(() => STUDENT_TEACHER_CONVERSATIONS[0]?.id ?? "");
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, StudentTeacherMessage[]>>(() => {
    const initial: Record<string, StudentTeacherMessage[]> = {};
    for (const conversation of STUDENT_TEACHER_CONVERSATIONS) {
      initial[conversation.id] = getStudentConversationMessages(conversation.id);
    }
    return initial;
  });
  const attachmentIdRef = useRef(0);
  const messageIdRef = useRef(0);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "en-US", {
        hour: "numeric",
        minute: "2-digit"
      }),
    [locale]
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "uz" ? "uz-UZ" : "en-US", {
        month: "short",
        day: "numeric"
      }),
    [locale]
  );

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const activeTeacher = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    return STUDENT_ASSIGNMENT_TEACHERS[activeConversation.teacherId] ?? null;
  }, [activeConversation]);

  const activeTeacherProfile = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    return getStudentTeacherProfileById(activeConversation.teacherId);
  }, [activeConversation]);

  const activeAssignments = useMemo(() => {
    if (!activeConversation) {
      return [];
    }

    return getStudentAssignmentsByIds(activeConversation.assignmentIds);
  }, [activeConversation]);

  const activeMessages = useMemo(() => {
    if (!activeConversation) {
      return [];
    }

    return messagesByConversation[activeConversation.id] ?? [];
  }, [activeConversation, messagesByConversation]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
  }, [activeConversationId, activeMessages.length]);

  const getConversationPreview = useCallback((conversation: StudentTeacherConversation) => {
    if (conversation.lastMessagePreview) {
      return conversation.lastMessagePreview;
    }

    if (conversation.lastMessagePreviewKey) {
      return t(conversation.lastMessagePreviewKey);
    }

    return t("conversations.emptyPreview");
  }, [t]);

  const getMessageText = (message: StudentTeacherMessage) => {
    if (message.text) {
      return message.text;
    }

    if (message.textKey) {
      return t(message.textKey);
    }

    return "";
  };

  const filteredConversations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const teacherName = getStudentTeacherNameById(conversation.teacherId).toLowerCase();
      const topic = t(conversation.topicKey).toLowerCase();
      const preview = getConversationPreview(conversation).toLowerCase();
      return teacherName.includes(normalized) || topic.includes(normalized) || preview.includes(normalized);
    });
  }, [conversations, searchQuery, t, getConversationPreview]);

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  const formatRelative = (dateValue: string) => {
    const diffMs = timeTick - new Date(dateValue).getTime();
    const minuteMs = 60_000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < minuteMs) {
      return t("relative.justNow");
    }

    if (diffMs < hourMs) {
      return t("relative.minutesAgo", {value: Math.max(1, Math.floor(diffMs / minuteMs))});
    }

    if (diffMs < dayMs) {
      return t("relative.hoursAgo", {value: Math.max(1, Math.floor(diffMs / hourMs))});
    }

    if (diffMs < dayMs * 2) {
      return t("relative.yesterday");
    }

    if (diffMs < dayMs * 7) {
      return t("relative.daysAgo", {value: Math.max(2, Math.floor(diffMs / dayMs))});
    }

    return dateFormatter.format(new Date(dateValue));
  };

  const setConversationActive = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobilePanel("chat");
    setConversations((current) =>
      current.map((conversation) => (conversation.id === conversationId ? {...conversation, unreadCount: 0} : conversation))
    );
  };

  const addAttachmentPreset = (presetId: string) => {
    const preset = STUDENT_MESSAGE_ATTACHMENT_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    if (pendingAttachments.length >= 3) {
      pushNotice(t("feedback.attachLimit.title"), t("feedback.attachLimit.description"));
      return;
    }

    const nextAttachment: StudentMessageAttachment = {
      id: `attachment-${++attachmentIdRef.current}-${preset.id}`,
      type: preset.type,
      name: preset.fileName,
      sizeKb: preset.sizeKb
    };

    setPendingAttachments((current) => [...current, nextAttachment]);
    pushNotice(t("feedback.attachmentAdded.title"), t("feedback.attachmentAdded.description", {name: preset.fileName}));
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments((current) => current.filter((item) => item.id !== attachmentId));
  };

  const handleSendMessage = () => {
    if (!activeConversation) {
      return;
    }

    const text = composerValue.trim();
    if (!text && pendingAttachments.length === 0) {
      return;
    }

    const createdAt = new Date().toISOString();
    const nextMessage: StudentTeacherMessage = {
      id: `message-local-${++messageIdRef.current}`,
      conversationId: activeConversation.id,
      sender: "student",
      text: text || t("composer.attachmentOnlyMessage"),
      createdAt,
      attachments: pendingAttachments.length ? pendingAttachments : undefined
    };

    setMessagesByConversation((current) => ({
      ...current,
      [activeConversation.id]: [...(current[activeConversation.id] ?? []), nextMessage]
    }));

    setConversations((current) =>
      sortByNewest(
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                unreadCount: 0,
                lastMessageAt: createdAt,
                lastMessagePreview: text || t("composer.attachmentPreview")
              }
            : conversation
        )
      )
    );

    setComposerValue("");
    setPendingAttachments([]);
    pushNotice(t("feedback.sent.title"), t("feedback.sent.description"));
  };

  const handleViewProfile = () => {
    if (!activeTeacher) {
      return;
    }

    pushNotice(t("feedback.profile.title"), t("feedback.profile.description", {teacher: activeTeacher.name}));
  };

  const handleOpenAssignments = () => {
    if (!activeConversation) {
      return;
    }

    router.push(`/${locale}/assignments?teacher=${activeConversation.teacherId}`);
  };

  const handleClearChat = () => {
    if (!activeConversation) {
      return;
    }

    setMessagesByConversation((current) => ({...current, [activeConversation.id]: []}));
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              lastMessagePreview: t("conversations.clearedPreview"),
              lastMessageAt: new Date().toISOString()
            }
          : conversation
      )
    );
    pushNotice(t("feedback.clear.title"), t("feedback.clear.description"));
  };

  const handleQuickAction = (action: "profile" | "sendAssignment" | "schedule") => {
    if (action === "profile") {
      handleViewProfile();
      return;
    }

    if (action === "sendAssignment") {
      router.push(`/${locale}/assignments`);
      return;
    }

    pushNotice(t("feedback.schedule.title"), t("feedback.schedule.description"));
  };

  const openAssignment = (assignmentId: string, status: string) => {
    if (status === "reviewed") {
      router.push(`/${locale}/assignments/${assignmentId}/feedback`);
      return;
    }

    router.push(`/${locale}/assignments/${assignmentId}/submit`);
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
        </header>

        {notice ? (
          <Card className="rounded-xl border border-blue-400/35 bg-blue-500/10 shadow-none">
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid grid-cols-3 gap-2 xl:hidden">
          <Button
            type="button"
            variant={mobilePanel === "conversations" ? "default" : "outline"}
            className={cn(
              "h-9 rounded-xl px-2 text-xs",
              mobilePanel === "conversations"
                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                : "border-border/70 bg-background/70"
            )}
            onClick={() => setMobilePanel("conversations")}
          >
            {t("mobile.tabs.conversations")}
          </Button>
          <Button
            type="button"
            variant={mobilePanel === "chat" ? "default" : "outline"}
            className={cn(
              "h-9 rounded-xl px-2 text-xs",
              mobilePanel === "chat"
                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                : "border-border/70 bg-background/70"
            )}
            onClick={() => setMobilePanel("chat")}
          >
            {t("mobile.tabs.chat")}
          </Button>
          <Button
            type="button"
            variant={mobilePanel === "teacher" ? "default" : "outline"}
            className={cn(
              "h-9 rounded-xl px-2 text-xs",
              mobilePanel === "teacher"
                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                : "border-border/70 bg-background/70"
            )}
            onClick={() => setMobilePanel("teacher")}
          >
            {t("mobile.tabs.teacher")}
          </Button>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <Card className={cn(cardClassName, "min-w-0 p-0", mobilePanel !== "conversations" ? "hidden xl:block" : "")}>
            <CardHeader className="space-y-3 border-b border-border/70 p-4">
              <CardTitle className="text-lg font-semibold tracking-tight">{t("conversations.title")}</CardTitle>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("conversations.searchPlaceholder")}
                  className="h-10 rounded-xl border-border/70 bg-background/70 pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-95 sm:h-115 xl:h-165">
                <div className="space-y-2 p-3">
                  {filteredConversations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                      {t("conversations.empty")}
                    </div>
                  ) : null}

                  {filteredConversations.map((conversation) => {
                    const teacherName = getStudentTeacherNameById(conversation.teacherId);
                    const active = conversation.id === activeConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        className={cn(
                          "flex w-full min-w-0 flex-col gap-2 rounded-xl border px-3 py-3 text-left transition-colors",
                          active
                            ? "border-indigo-400/55 bg-indigo-500/12"
                            : "border-border/70 bg-background/60 hover:border-primary/35"
                        )}
                        onClick={() => setConversationActive(conversation.id)}
                      >
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{teacherName}</p>
                            <p className="text-xs text-muted-foreground">{formatRelative(conversation.lastMessageAt)}</p>
                          </div>
                          {conversation.unreadCount > 0 ? (
                            <Badge className="border border-indigo-400/35 bg-indigo-500/14 text-indigo-700 dark:text-indigo-200">
                              {t("conversations.unreadCount", {count: conversation.unreadCount})}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 min-w-0 wrap-break-word text-sm text-muted-foreground">{getConversationPreview(conversation)}</p>
                        <Badge variant="outline" className="w-fit border-border/70 bg-background/75 text-xs text-muted-foreground">
                          {t(conversation.topicKey)}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "min-w-0 p-0", mobilePanel !== "chat" ? "hidden xl:flex xl:flex-col" : "")}>
            {activeConversation && activeTeacher ? (
              <>
                <CardHeader className="space-y-4 border-b border-border/70 p-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <Avatar size="lg" className="ring-2 ring-border/70">
                      <AvatarFallback className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">
                        {activeTeacher.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{activeTeacher.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{t(activeTeacherProfile?.roleKey ?? "labels.teacherRole")}</p>
                    </div>
                    <Badge variant="outline" className="border-border/70 bg-background/75 text-xs">
                      {t(activeConversation.topicKey)}
                    </Badge>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button type="button" variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70 text-xs sm:text-sm" onClick={handleViewProfile}>
                      <UserCircle2 className="size-4" />
                      {t("chat.actions.viewProfile")}
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70 text-xs sm:text-sm" onClick={handleOpenAssignments}>
                      <Link2 className="size-4" />
                      {t("chat.actions.openAssignments")}
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70 text-xs sm:text-sm" onClick={handleClearChat}>
                      <Trash2 className="size-4" />
                      {t("chat.actions.clearChat")}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
                  <ScrollArea className="h-80 rounded-xl border border-border/70 bg-background/65 p-3 sm:h-105 xl:h-130">
                    <div className="space-y-3">
                      {activeMessages.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-4 py-5 text-sm text-muted-foreground">
                          {t("chat.empty")}
                        </div>
                      ) : null}

                      {activeMessages.map((message) => {
                        const messageText = getMessageText(message);
                        const isTeacher = message.sender === "teacher";

                        return (
                          <div key={message.id} className={cn("flex min-w-0 gap-2", isTeacher ? "justify-start" : "justify-end")}>
                            {isTeacher ? (
                              <Avatar size="sm" className="mt-0.5 ring-1 ring-border/70">
                                <AvatarFallback className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">
                                  {activeTeacher.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            ) : null}

                            <div
                              className={cn(
                                "min-w-0 max-w-[88%] rounded-xl border px-3 py-2",
                                isTeacher
                                  ? "border-border/70 bg-card/80"
                                  : "border-indigo-400/40 bg-indigo-500/14"
                              )}
                            >
                              <p className="wrap-break-word text-sm leading-relaxed text-foreground/95">{messageText}</p>

                              {message.attachments?.length ? (
                                <div className="mt-2 space-y-1.5">
                                  {message.attachments.map((attachment) => {
                                    const AttachmentIcon = attachmentIcon[attachment.type];

                                    return (
                                      <div
                                        key={attachment.id}
                                        className={cn(
                                          "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                                          attachmentTone[attachment.type]
                                        )}
                                      >
                                        <AttachmentIcon className="size-3.5 shrink-0" />
                                        <p className="min-w-0 truncate">{attachment.name}</p>
                                        <span className="ml-auto shrink-0 text-[11px] opacity-80">{t("chat.attachmentSize", {size: attachment.sizeKb})}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}

                              <p className="mt-1.5 text-[11px] text-muted-foreground">{timeFormatter.format(new Date(message.createdAt))}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={scrollAnchorRef} />
                    </div>
                  </ScrollArea>

                  {pendingAttachments.length ? (
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {pendingAttachments.map((attachment) => {
                        const AttachmentIcon = attachmentIcon[attachment.type];

                        return (
                          <span
                            key={attachment.id}
                            className={cn(
                              "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                              attachmentTone[attachment.type]
                            )}
                          >
                            <AttachmentIcon className="size-3 shrink-0" />
                            <span className="truncate">{attachment.name}</span>
                            <button
                              type="button"
                              className="inline-flex size-4 items-center justify-center rounded-full border border-current/35 text-[10px]"
                              onClick={() => removePendingAttachment(attachment.id)}
                              aria-label={t("composer.removeAttachment")}
                            >
                              x
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={composerValue}
                      onChange={(event) => setComposerValue(event.target.value)}
                      placeholder={t("composer.placeholder")}
                      className="h-10 min-w-0 rounded-xl border-border/70 bg-background/70"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex w-full gap-2 sm:w-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="h-10 flex-1 rounded-xl border-border/70 bg-background/70 sm:w-10 sm:flex-none sm:px-0">
                            <Paperclip className="size-4" />
                            <span className="sm:hidden">{t("composer.attach")}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {STUDENT_MESSAGE_ATTACHMENT_PRESETS.map((preset) => (
                            <DropdownMenuItem key={preset.id} onClick={() => addAttachmentPreset(preset.id)}>
                              {preset.type === "audio" ? <FileAudio className="size-4" /> : null}
                              {preset.type === "essay" ? <FileText className="size-4" /> : null}
                              {preset.type === "image" ? <ImageIcon className="size-4" /> : null}
                              {t(preset.labelKey)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        className="h-10 flex-1 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 sm:w-auto sm:px-4"
                        onClick={handleSendMessage}
                      >
                        <Send className="size-4" />
                        {t("composer.send")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("chat.selectConversation")}</p>
              </CardContent>
            )}
          </Card>

          <aside className={cn("min-w-0 space-y-4", mobilePanel !== "teacher" ? "hidden xl:block" : "")}>
            <Card className={cn(cardClassName, "min-w-0")}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">{t("teacherInfo.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTeacher && activeTeacherProfile ? (
                  <>
                    <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar size="lg" className="ring-2 ring-border/70">
                          <AvatarFallback className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-200">
                            {activeTeacher.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-foreground">{activeTeacher.name}</p>
                          <p className="wrap-break-word text-sm text-muted-foreground">{t(activeTeacherProfile.roleKey)}</p>
                        </div>
                      </div>
                      <p className="mt-3 wrap-break-word text-sm text-muted-foreground">{t(activeTeacherProfile.expertiseKey)}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border/70 bg-background/70 p-2">
                          <p className="text-xs text-muted-foreground">{t("teacherInfo.students")}</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{activeTeacherProfile.studentsCount}</p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/70 p-2">
                          <p className="text-xs text-muted-foreground">{t("teacherInfo.reviewsCompleted")}</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{activeTeacherProfile.reviewsCompleted}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button type="button" variant="outline" className="h-9 w-full rounded-xl border-border/70 bg-background/70" onClick={() => handleQuickAction("profile")}>
                        <UserCircle2 className="size-4" />
                        {t("teacherInfo.actions.viewProfile")}
                      </Button>
                      <Button type="button" variant="outline" className="h-9 w-full rounded-xl border-border/70 bg-background/70" onClick={() => handleQuickAction("sendAssignment")}>
                        <CheckCircle2 className="size-4" />
                        {t("teacherInfo.actions.sendAssignment")}
                      </Button>
                      <Button type="button" variant="outline" className="h-9 w-full rounded-xl border-border/70 bg-background/70" onClick={() => handleQuickAction("schedule")}>
                        <CalendarClock className="size-4" />
                        {t("teacherInfo.actions.scheduleSession")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("teacherInfo.empty")}</p>
                )}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "min-w-0")}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">{t("teacherInfo.recentAssignments")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("teacherInfo.noAssignments")}</p>
                ) : null}

                {activeAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    className="flex w-full min-w-0 flex-col gap-1 rounded-xl border border-border/70 bg-background/65 px-3 py-2 text-left transition-colors hover:border-primary/35"
                    onClick={() => openAssignment(assignment.id, assignment.status)}
                  >
                    <p className="line-clamp-2 wrap-break-word text-sm font-medium text-foreground">{assignment.title}</p>
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={cn("border", moduleBadgeTone[assignment.module])}>{t(`modules.${assignment.module}`)}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {formatRelative(assignment.dueAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "min-w-0")}>
              <CardContent className="space-y-2 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageCircle className="size-4 text-indigo-600 dark:text-indigo-300" />
                  {t("context.title")}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("context.description")}</p>
                <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/65 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {t("context.connectedAssignments", {count: activeAssignments.length})}
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}
