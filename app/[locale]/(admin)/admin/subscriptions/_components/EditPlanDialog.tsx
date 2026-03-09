"use client";

import {useEffect, useState} from "react";
import {Plus, Trash2} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import type {PlanId, SubscriptionPlan} from "@/data/admin-subscriptions";

type EditPlanDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  plan: SubscriptionPlan | null;
  existingPlanIds: string[];
  onOpenChange: (open: boolean) => void;
  onSave: (nextPlan: SubscriptionPlan, mode: "create" | "edit") => void;
};

function slugifyPlanId(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return normalized || "plan";
}

function createPlanId(name: string, existingPlanIds: string[]): PlanId {
  const used = new Set(existingPlanIds.map((id) => id.toLowerCase()));
  const base = `custom-${slugifyPlanId(name)}`;
  let candidate = base;
  let suffix = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate as PlanId;
}

function createEmptyDraft(): SubscriptionPlan {
  return {
    id: "new-plan",
    name: "",
    tagline: "",
    price: 0,
    billingPeriod: "month",
    highlight: false,
    badge: "",
    features: [{id: "new-plan-feature-1", label: "", included: true}]
  };
}

export function EditPlanDialog({open, mode, plan, existingPlanIds, onOpenChange, onSave}: EditPlanDialogProps) {
  const t = useTranslations("adminSubscriptions");
  const [draft, setDraft] = useState<SubscriptionPlan | null>(plan);
  const [newFeatureLabel, setNewFeatureLabel] = useState("");

  useEffect(() => {
    if (mode === "edit" && plan) {
      setDraft({
        ...plan,
        features: plan.features.map((feature) => ({...feature}))
      });
    } else {
      setDraft(createEmptyDraft());
    }
    setNewFeatureLabel("");
  }, [mode, plan, open]);

  const saveDisabled =
    !draft || !draft.name.trim() || !draft.tagline.trim() || draft.price < 0 || !draft.features.some((feature) => feature.label.trim());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto border-l border-border/70 bg-background/95 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b border-border/70 p-5 pr-14">
          <SheetTitle className="text-xl">{mode === "create" ? t("createDialog.title") : t("editDialog.title")}</SheetTitle>
          <SheetDescription>{mode === "create" ? t("createDialog.description") : t("editDialog.description")}</SheetDescription>
        </SheetHeader>

        {draft ? (
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("editDialog.fields.planName")}</p>
              <Input
                value={draft.name}
                onChange={(event) => setDraft((current) => (current ? {...current, name: event.target.value} : current))}
                className="h-11 rounded-xl border-border/70 bg-card/55 text-base"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("editDialog.fields.tagline")}</p>
              <Input
                value={draft.tagline}
                onChange={(event) => setDraft((current) => (current ? {...current, tagline: event.target.value} : current))}
                className="h-11 rounded-xl border-border/70 bg-card/55 text-base"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("editDialog.fields.price")}</p>
                <Input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            price: Math.max(0, Number(event.target.value || 0))
                          }
                        : current
                    )
                  }
                  className="h-11 rounded-xl border-border/70 bg-card/55 text-base"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("editDialog.fields.billingPeriod")}</p>
                <div className="grid h-11 grid-cols-2 overflow-hidden rounded-xl border border-border/70 bg-card/55 p-1">
                  <Button
                    type="button"
                    variant={draft.billingPeriod === "forever" ? "default" : "ghost"}
                    className="h-full rounded-lg"
                    onClick={() => setDraft((current) => (current ? {...current, billingPeriod: "forever"} : current))}
                  >
                    {t("billing.forever")}
                  </Button>
                  <Button
                    type="button"
                    variant={draft.billingPeriod === "month" ? "default" : "ghost"}
                    className="h-full rounded-lg"
                    onClick={() => setDraft((current) => (current ? {...current, billingPeriod: "month"} : current))}
                  >
                    {t("billing.month")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("editDialog.fields.features")}</p>

              <div className="space-y-2">
                {draft.features.map((feature, index) => (
                  <div key={feature.id} className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/45 p-2">
                    <Checkbox
                      checked={feature.included}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                features: current.features.map((item) =>
                                  item.id === feature.id ? {...item, included: event.target.checked} : item
                                )
                              }
                            : current
                        )
                      }
                      className="size-4"
                    />
                    <Input
                      value={feature.label}
                      onChange={(event) =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                features: current.features.map((item) =>
                                  item.id === feature.id ? {...item, label: event.target.value} : item
                                )
                              }
                            : current
                        )
                      }
                      className="h-10 rounded-lg border-border/70 bg-background/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-muted-foreground"
                      onClick={() =>
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                features: current.features.filter((item) => item.id !== feature.id)
                              }
                            : current
                        )
                      }
                      aria-label={t("editDialog.removeFeature")}
                      disabled={draft.features.length <= 1 && index === 0}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newFeatureLabel}
                  onChange={(event) => setNewFeatureLabel(event.target.value)}
                  placeholder={t("editDialog.newFeaturePlaceholder")}
                  className="h-10 rounded-lg border-border/70 bg-background/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-border/70"
                  onClick={() => {
                    const label = newFeatureLabel.trim();
                    if (!label) return;

                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            features: [
                              ...current.features,
                              {
                                id: `${current.id}-feature-${current.features.length + 1}`,
                                label,
                                included: true
                              }
                            ]
                          }
                        : current
                    );
                    setNewFeatureLabel("");
                  }}
                >
                  <Plus className="size-4" />
                  {t("editDialog.addFeature")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <SheetFooter className="border-t border-border/70">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!draft) return;
              const cleanedFeatures = draft.features
                .map((feature, index) => ({
                  id: feature.id || `${draft.id}-feature-${index + 1}`,
                  label: feature.label.trim(),
                  included: feature.included
                }))
                .filter((feature) => feature.label.length > 0);
              const features = cleanedFeatures.length ? cleanedFeatures : [{id: `${draft.id}-feature-1`, label: "Feature", included: true}];

              if (mode === "create") {
                const id = createPlanId(draft.name, existingPlanIds);
                onSave(
                  {
                    ...draft,
                    id,
                    name: draft.name.trim(),
                    tagline: draft.tagline.trim(),
                    badge: draft.badge?.trim() || undefined,
                    features: features.map((feature, index) => ({
                      ...feature,
                      id: `${id}-feature-${index + 1}`
                    }))
                  },
                  mode
                );
              } else {
                onSave(
                  {
                    ...draft,
                    name: draft.name.trim(),
                    tagline: draft.tagline.trim(),
                    badge: draft.badge?.trim() || undefined,
                    features
                  },
                  mode
                );
              }
              onOpenChange(false);
            }}
            disabled={saveDisabled}
          >
            {mode === "create" ? t("createDialog.createAction") : t("common.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

