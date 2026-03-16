"use client";

import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {ScrollArea} from "@/components/ui/scroll-area";
import type {TeacherConversationListItem, TeacherStudentsLastActivity} from "@/data/teacher/selectors";
import {cn} from "@/lib/utils";

type TeacherConversationListProps = {
  conversations: TeacherConversationListItem[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
};

function formatRelative(t: ReturnType<typeof useTranslations>, value: TeacherStudentsLastActivity) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

export function TeacherConversationList({
  conversations,
  selectedConversationId,
  onSelect
}: TeacherConversationListProps) {
  const t = useTranslations("teacherMessages");

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-105 items-center justify-center rounded-xl border border-border/65 bg-background/35 p-4 text-center text-sm text-muted-foreground">
        {t("emptyConversations")}
      </div>
    );
  }

  return (
    <ScrollArea className="h-135 rounded-xl border border-border/65 bg-background/25">
      <div className="divide-y divide-border/55">
        {conversations.map((conversation) => {
          const active = conversation.id === selectedConversationId;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-3.5 text-left transition-colors",
                active
                  ? "bg-primary/12"
                  : "hover:bg-muted/35"
              )}
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/16 text-primary">{conversation.studentAvatarFallback}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{conversation.studentName}</p>
                    <span className={cn("size-1.5 rounded-full", conversation.isOnline ? "bg-emerald-400" : "bg-muted-foreground/55")} />
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{formatRelative(t, conversation.lastMessageTime)}</p>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm text-muted-foreground">{conversation.lastMessagePreview}</p>
                  {conversation.unreadCount > 0 ? (
                    <span className="inline-flex min-w-5 justify-center rounded-full border border-primary/35 bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
