"use client";

import type {SubscriptionPlan} from "@/data/admin-subscriptions";

import {PlanCard} from "./PlanCard";

type PlanCardsGridProps = {
  plans: SubscriptionPlan[];
  highlightedPlanIds: Set<string>;
  onEditPlan: (plan: SubscriptionPlan) => void;
};

export function PlanCardsGrid({plans, highlightedPlanIds, onEditPlan}: PlanCardsGridProps) {
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-4">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} highlighted={highlightedPlanIds.has(plan.id)} onEdit={onEditPlan} />
      ))}
    </section>
  );
}

