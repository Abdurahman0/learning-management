import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: "default" | "destructive";
  className?: string;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmVariant = "default",
  className,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className={cn("w-full max-w-md p-5 shadow-xl", className)}>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}

