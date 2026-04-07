import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingModalProps {
  open: boolean;
  message?: string;
  className?: string;
}

export function LoadingModal({ open, message, className }: LoadingModalProps) {
  if (!open) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in",
        className
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-2xl border border-border/50">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-primary/20" />
        </div>
        {message && (
          <p className="text-sm font-medium text-foreground tracking-tight animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
