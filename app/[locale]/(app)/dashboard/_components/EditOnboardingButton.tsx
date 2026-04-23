"use client";

import {PencilLine} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {openOnboardingWizard} from "@/lib/onboarding-storage";
import {cn} from "@/lib/utils";

type EditOnboardingButtonProps = {
  className?: string;
};

export function EditOnboardingButton({className}: EditOnboardingButtonProps) {
  const t = useTranslations("auth.onboarding");

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => openOnboardingWizard()}
      className={cn(
        "h-10 rounded-xl border-border/70 bg-background/40 px-3.5 text-sm font-semibold hover:bg-muted/40 sm:h-11 sm:px-4",
        className
      )}
      title={t("actions.edit")}
    >
      <PencilLine className="size-4" />
      {t("actions.edit")}
    </Button>
  );
}

