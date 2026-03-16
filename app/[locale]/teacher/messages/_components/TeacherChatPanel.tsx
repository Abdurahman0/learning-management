"use client";

import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Card} from "@/components/ui/card";
import type {TeacherMessagesConversationData, TeacherStudentsLastActivity} from "@/data/teacher/selectors";
import {cn} from "@/lib/utils";

import {TeacherChatHeader} from "./TeacherChatHeader";
import {TeacherMessageComposer} from "./TeacherMessageComposer";

type TeacherChatPanelProps = {
  conversationData: TeacherMessagesConversationData | null;
  teacherInitials: string;
  composerValue: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onBackToList?: () => void;
};

function formatRelative(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

export function TeacherChatPanel({
  conversationData,
  teacherInitials,
  composerValue,
  onComposerChange,
  onSend,
  onBackToList
}: TeacherChatPanelProps) {
  const t = useTranslations("teacherMessages");

  if (!conversationData) {
    return (
      <Card className="flex min-h-135 items-center justify-center rounded-2xl border-border/70 bg-card/75 p-6 text-center text-sm text-muted-foreground">
        {t("selectConversation")}
      </Card>
    );
  }

  return (
    <Card className="flex min-h-135 flex-col rounded-2xl border-border/70 bg-card/75 py-0">
      <TeacherChatHeader conversation={conversationData.conversation} onBackToList={onBackToList} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversationData.messages.map((message) => {
          const isTeacher = message.senderRole === "teacher";

          return (
            <div key={message.id} className={cn("flex gap-2", isTeacher ? "justify-end" : "justify-start")}>
              {!isTeacher ? (
                <Avatar size="sm" className="mt-auto">
                  <AvatarFallback className="bg-primary/14 text-primary">{conversationData.conversation.studentAvatarFallback}</AvatarFallback>
                </Avatar>
              ) : null}

              <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[78%]", isTeacher ? "bg-primary/85 text-primary-foreground" : "bg-muted/55 text-foreground")}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={cn("mt-1.5 text-[11px]", isTeacher ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {formatRelative(t, message.time)}
                </p>
              </div>

              {isTeacher ? (
                <Avatar size="sm" className="mt-auto">
                  <AvatarFallback className="bg-primary/18 text-primary">{teacherInitials}</AvatarFallback>
                </Avatar>
              ) : null}
            </div>
          );
        })}
      </div>

      <TeacherMessageComposer value={composerValue} onChange={onComposerChange} onSend={onSend} />
    </Card>
  );
}
