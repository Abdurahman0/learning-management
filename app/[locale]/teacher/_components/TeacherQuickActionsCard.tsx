"use client";

import type {LucideIcon} from "lucide-react";
import {ChevronRight, ClipboardCheck, MessageSquare, PlusCircle} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {teacherQuickActions, type TeacherQuickActionKey} from "@/data/teacher-dashboard";

const actionIcons: Record<TeacherQuickActionKey, LucideIcon> = {
  createAssignment: PlusCircle,
  reviewSubmissions: ClipboardCheck,
  messageStudents: MessageSquare
};

export function TeacherQuickActionsCard() {
  const t = useTranslations("teacherDashboard");
  const locale = useLocale();
  const router = useRouter();

  const handleAction = (action: TeacherQuickActionKey) => {
    if (action === "createAssignment") {
      router.push(`/${locale}/teacher/assignments`);
      return;
    }

    if (action === "reviewSubmissions") {
      router.push(`/${locale}/teacher/reviews?source=dashboard`);
      return;
    }

    router.push(`/${locale}/teacher/messages?source=dashboard`);
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-3">
        <CardTitle className="text-xl">{t("quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 pb-5">
        {teacherQuickActions.map((action, index) => {
          const Icon = actionIcons[action];
          const isPrimary = index === 0;

          return (
            <Button
              key={action}
              type="button"
              onClick={() => handleAction(action)}
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
