"use client";

import {BookText, Headphones, Lock} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import type {BuilderStructureItem, TestModule} from "@/data/admin-test-builder";
import {MODULE_RULES} from "@/data/admin-test-builder";
import {cn} from "@/lib/utils";

type TestStructurePanelProps = {
  module: TestModule;
  structures: BuilderStructureItem[];
  activeStructureId: string;
  onSelect: (structureId: string) => void;
  onRename: (structureId: string, title: string) => void;
};

export function TestStructurePanel({module, structures, activeStructureId, onSelect, onRename}: TestStructurePanelProps) {
  const t = useTranslations("adminTestBuilder");
  const constraint = MODULE_RULES[module];

  return (
    <Card className="rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="border-b border-border/70 pt-5 pb-4">
        <CardTitle className="text-sm tracking-[0.14em] text-muted-foreground uppercase">{t("structure.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 pb-5">
        {structures.map((item) => {
          const active = item.id === activeStructureId;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                active ? "border-primary/50 bg-primary/12" : "border-border/70 bg-background/45 hover:bg-muted/30"
              )}
              onClick={() => onSelect(item.id)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {t(`structure.labels.${item.kind}`, {index: item.index})}
                </p>
                <Badge className="rounded-md border border-border/70 bg-muted/35 px-1.5 py-0 text-[10px] text-muted-foreground">
                  {item.questionRangeLabel}
                </Badge>
              </div>

              <Input
                value={item.title}
                onChange={(event) => onRename(item.id, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="h-9 rounded-lg border-border/70 bg-background/60 font-medium"
              />
            </button>
          );
        })}

        <div className="space-y-2 rounded-2xl border border-dashed border-border/80 bg-background/30 px-3 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-muted-foreground">
              {module === "reading" ? <BookText className="size-4" /> : <Headphones className="size-4" />}
            </span>
            <p className="text-xs text-muted-foreground">{t(constraint.labelKey)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45" disabled>
              <Lock className="size-3.5" />
              {t("structure.actions.add")}
            </Button>
            <Button type="button" variant="outline" className="h-8 rounded-lg border-border/70 bg-background/45" disabled>
              <Lock className="size-3.5" />
              {t("structure.actions.remove")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
