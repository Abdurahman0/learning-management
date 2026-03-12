"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherModulePerformance} from "@/data/teacher/selectors";

type TeacherModulePerformanceCardProps = {
  modules: TeacherModulePerformance[];
};

function barClass(module: TeacherModulePerformance["module"]) {
  if (module === "listening") {
    return "bg-violet-400";
  }

  if (module === "writing") {
    return "bg-amber-400";
  }

  if (module === "speaking") {
    return "bg-emerald-400";
  }

  return "bg-primary";
}

export function TeacherModulePerformanceCard({modules}: TeacherModulePerformanceCardProps) {
  const t = useTranslations("teacherAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("performanceByModule")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {modules.map((item) => (
          <div key={item.module} className="space-y-1.5">
            <div className="text-sm">{t(`modules.${item.module}`)}</div>

            <div>
              <div className="h-2 rounded-full bg-muted/70">
                <div
                  className={`h-2 rounded-full ${barClass(item.module)}`}
                  style={{width: `${(item.value / 9) * 100}%`}}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
