"use client";

import { Button } from "@/components/ui/button";

type GoogleButtonProps = {
  label: string;
  disabled?: boolean;
};

export function GoogleButton({ label, disabled }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-xl border-border bg-background/80 text-sm font-semibold hover:bg-accent/40"
      disabled={disabled}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.8-.1-1.1H12z"
        />
      </svg>
      {label}
    </Button>
  );
}
