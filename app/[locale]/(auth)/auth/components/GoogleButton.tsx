"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";

type GoogleButtonProps = {
  label: string;
  disabled?: boolean;
};

export function GoogleButton({ label, disabled }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, isLoading } = useGoogleSignIn({
    onSuccess: () => {
      console.log("Logged in with Google!");
    }
  });

  useEffect(() => {
    const google = (window as any).google;
    if (isReady && containerRef.current && google) {
      google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: containerRef.current.offsetWidth,
      });
    }
  }, [isReady]);

  return (
    <div className="relative w-full">
      <div 
        ref={containerRef} 
        className="google-button-container relative z-10 w-full overflow-hidden opacity-0"
        style={{ height: "44px" }}
      />
      <Button
        type="button"
        variant="outline"
        className="absolute top-0 left-0 h-11 w-full rounded-xl border-border bg-background/80 text-sm font-semibold hover:bg-accent/40"
        disabled={disabled || isLoading}
        aria-label={label}
      >
        <svg viewBox="0 0 24 24" className="mr-2 size-4.5" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.8-.1-1.1H12z"
          />
        </svg>
        {isLoading ? "..." : label}
      </Button>
    </div>
  );
}
