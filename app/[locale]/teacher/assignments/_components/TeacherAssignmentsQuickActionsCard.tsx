"use client";

import type {LucideIcon} from "lucide-react";
import {ChevronRight, ClipboardCheck, MessageSquare, PlusCircle} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

type QuickActionKey = "createTask" | "allSubmissions" | "messageGroup";

type TeacherAssignmentsQuickActionsCardProps = {
  onAction: (action: QuickActionKey) => void;
};

const actionIcons: Record<QuickActionKey, LucideIcon> = {
  createTask: PlusCircle,
  allSubmissions: ClipboardCheck,
  messageGroup: MessageSquare
};

const quickActions: QuickActionKey[] = ["createTask", "allSubmissions", "messageGroup"];

export function TeacherAssignmentsQuickActionsCard({onAction}: TeacherAssignmentsQuickActionsCardProps) {
  const t = useTranslations("teacherAssignments");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("quickActions")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5 pb-5">
        {quickActions.map((action, index) => {
          const Icon = actionIcons[action];
          const isPrimary = index === 0;

          return (
            <Button
              key={action}
              type="button"
              onClick={() => onAction(action)}
              variant={isPrimary ? "default" : "secondary"}
              className="h-12 w-full justify-between rounded-xl text-base"
            >
              <span className="inline-flex items-center gap-2.5">
                <Icon className="size-4.5" />
                {t(action)}
              </span>
              <ChevronRight className="size-4" />
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
