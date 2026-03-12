"use client";

import Link from "next/link";
import {MoreVertical, Phone, UserRound, Video} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import type {TeacherConversationListItem} from "@/data/teacher/selectors";

type TeacherChatHeaderProps = {
  conversation: TeacherConversationListItem;
  onBackToList?: () => void;
};

export function TeacherChatHeader({conversation, onBackToList}: TeacherChatHeaderProps) {
  const t = useTranslations("teacherMessages");
  const locale = useLocale();
  const profileHref = `/${locale}/teacher/students/${conversation.studentId}`;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border/65 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {onBackToList ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-lg text-muted-foreground md:hidden"
            onClick={onBackToList}
          >
            <span className="text-base leading-none">←</span>
            <span className="sr-only">{t("conversations")}</span>
          </Button>
        ) : null}

        <Link href={profileHref} className="flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/35">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/18 text-primary">{conversation.studentAvatarFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{conversation.studentName}</p>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-1.5 rounded-full ${conversation.isOnline ? "bg-emerald-400" : "bg-muted-foreground/55"}`} />
              {conversation.isOnline ? t("online") : t("offline")}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Button asChild type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground">
          <Link href={profileHref} aria-label={t("viewStudentProfile")}>
            <UserRound className="size-4" />
          </Link>
        </Button>
        <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground">
          <Phone className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground">
          <Video className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="size-8 rounded-lg text-muted-foreground">
          <MoreVertical className="size-4" />
        </Button>
      </div>
    </header>
  );
}
