"use client";

import {CheckCircle2} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {
  GLOBAL_PLAN_SETTINGS,
  PLAN_DISTRIBUTION,
  RECENT_SUBSCRIPTION_ACTIONS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATS,
  type GlobalPlanSettings,
  type SubscriptionPlan
} from "@/data/admin-subscriptions";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {EditPlanDialog} from "./EditPlanDialog";
import {GlobalPlanSettingsCard} from "./GlobalPlanSettingsCard";
import {PlanCardsGrid} from "./PlanCardsGrid";
import {RecentSubscriptionActionsTable} from "./RecentSubscriptionActionsTable";
import {SubscriptionStatsCards} from "./SubscriptionStatsCards";
import {SubscriptionsHeader} from "./SubscriptionsHeader";

type SubscriptionEditableState = {
  plans: SubscriptionPlan[];
  settings: GlobalPlanSettings;
};

function clonePlans(plans: SubscriptionPlan[]) {
  return plans.map((plan) => ({
    ...plan,
    features: plan.features.map((feature) => ({...feature}))
  }));
}

function makeInitialState(): SubscriptionEditableState {
  return {
    plans: clonePlans(SUBSCRIPTION_PLANS),
    settings: {...GLOBAL_PLAN_SETTINGS}
  };
}

function toSnapshot(state: SubscriptionEditableState) {
  return JSON.stringify(state);
}

export function SubscriptionsPageClient() {
  const t = useTranslations("adminSubscriptions");
  const [searchValue, setSearchValue] = useState("");
  const [editable, setEditable] = useState<SubscriptionEditableState>(() => makeInitialState());
  const [savedSnapshot, setSavedSnapshot] = useState(() => toSnapshot(makeInitialState()));
  const [planDialogMode, setPlanDialogMode] = useState<"create" | "edit">("edit");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saveToastOpen, setSaveToastOpen] = useState(false);

  const currentSnapshot = useMemo(() => toSnapshot(editable), [editable]);
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

  const query = searchValue.trim().toLowerCase();

  const filteredActions = useMemo(() => {
    if (!query) {
      return RECENT_SUBSCRIPTION_ACTIONS;
    }

    return RECENT_SUBSCRIPTION_ACTIONS.filter(
      (item) => item.userName.toLowerCase().includes(query) || item.email.toLowerCase().includes(query)
    );
  }, [query]);

  const highlightedPlanIds = useMemo(() => {
    const next = new Set<string>();
    if (!query) {
      return next;
    }

    editable.plans.forEach((plan) => {
      if (
        plan.name.toLowerCase().includes(query) ||
        plan.tagline.toLowerCase().includes(query) ||
        plan.features.some((feature) => feature.label.toLowerCase().includes(query))
      ) {
        next.add(plan.id);
      }
    });

    return next;
  }, [editable.plans, query]);

  const editingPlan = useMemo(
    () => editable.plans.find((plan) => plan.id === editingPlanId) ?? null,
    [editable.plans, editingPlanId]
  );

  useEffect(() => {
    if (!saveToastOpen) {
      return;
    }

    const timer = window.setTimeout(() => setSaveToastOpen(false), 2400);
    return () => window.clearTimeout(timer);
  }, [saveToastOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <SubscriptionsHeader
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onCreatePlan={() => {
              setPlanDialogMode("create");
              setEditingPlanId(null);
              setEditOpen(true);
            }}
            onSaveChanges={() => {
              console.info("[admin-subscriptions] save-changes", editable);
              setSavedSnapshot(currentSnapshot);
              setSaveToastOpen(true);
            }}
            onResetChanges={() => {
              const parsed = JSON.parse(savedSnapshot) as SubscriptionEditableState;
              setEditable({
                plans: clonePlans(parsed.plans),
                settings: {...parsed.settings}
              });
            }}
            saveDisabled={!hasUnsavedChanges}
          />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <SubscriptionStatsCards stats={SUBSCRIPTION_STATS} />

            <PlanCardsGrid
              plans={editable.plans}
              highlightedPlanIds={highlightedPlanIds}
              onEditPlan={(plan) => {
                setPlanDialogMode("edit");
                setEditingPlanId(plan.id);
                setEditOpen(true);
              }}
            />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.6fr)]">
              <GlobalPlanSettingsCard
                settings={editable.settings}
                distribution={PLAN_DISTRIBUTION}
                onGuestTestLimitChange={(nextValue) =>
                  setEditable((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      guestTestLimit: nextValue
                    }
                  }))
                }
                onAiRecommendationsToggle={(nextValue) =>
                  setEditable((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      aiRecommendationsAccess: nextValue
                    }
                  }))
                }
                onPremiumExplanationsToggle={(nextValue) =>
                  setEditable((current) => ({
                    ...current,
                    settings: {
                      ...current.settings,
                      premiumExplanations: nextValue
                    }
                  }))
                }
              />

              <RecentSubscriptionActionsTable
                rows={filteredActions}
                onExportCsv={() => {
                  console.info("[admin-subscriptions] export-csv", {rows: filteredActions.length});
                }}
              />
            </section>
          </main>
        </div>
      </div>

      <EditPlanDialog
        open={editOpen}
        mode={planDialogMode}
        plan={editingPlan}
        existingPlanIds={editable.plans.map((plan) => plan.id)}
        onOpenChange={setEditOpen}
        onSave={(nextPlan, mode) => {
          if (mode === "create") {
            setEditable((current) => ({
              ...current,
              plans: [...current.plans, nextPlan]
            }));
            return;
          }

          setEditable((current) => ({
            ...current,
            plans: current.plans.map((item) => (item.id === nextPlan.id ? nextPlan : item))
          }));
        }}
      />

      <div aria-live="polite" className="pointer-events-none fixed top-20 right-4 z-[60]">
        {saveToastOpen ? (
          <div className="min-w-[260px] rounded-xl border border-emerald-500/35 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("toast.savedTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("toast.savedDescription")}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
