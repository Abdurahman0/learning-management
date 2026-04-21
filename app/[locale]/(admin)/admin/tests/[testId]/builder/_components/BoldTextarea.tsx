"use client";

import {Bold} from "lucide-react";
import {type KeyboardEvent, type MutableRefObject, useRef} from "react";

import {Button} from "@/components/ui/button";

type BoldTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  textareaRef?: MutableRefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

function applyBoldFormatting(
  element: HTMLTextAreaElement,
  value: string,
  setValue: (next: string) => void
) {
  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? 0;
  const selected = value.slice(start, end);
  const wrapped = `**${selected || "bold text"}**`;
  const next = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
  setValue(next);

  requestAnimationFrame(() => {
    element.focus();
    if (selected) {
      element.setSelectionRange(start + 2, start + 2 + selected.length);
      return;
    }
    element.setSelectionRange(start + 2, start + 11);
  });
}

export function BoldTextarea({value, onChange, className, placeholder, textareaRef, onKeyDown}: BoldTextareaProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const resolvedRef = textareaRef ?? localRef;

  const onBoldClick = () => {
    const element = resolvedRef.current;
    if (!element) return;
    applyBoldFormatting(element, value, onChange);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="h-7 w-7 rounded-md border-border/70 bg-background/40"
          onClick={onBoldClick}
          aria-label="Bold"
          title="Bold (Ctrl/Cmd+B)"
        >
          <Bold className="size-3.5" />
        </Button>
      </div>
      <textarea
        ref={resolvedRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
            event.preventDefault();
            applyBoldFormatting(event.currentTarget, value, onChange);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

