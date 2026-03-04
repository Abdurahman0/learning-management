"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  value: string;
  placeholder: string;
  showLabel: string;
  hideLabel: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoComplete?: string;
};

export function PasswordField({
  id,
  value,
  placeholder,
  showLabel,
  hideLabel,
  onChange,
  invalid,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid ? "true" : "false"}
        className={cn("h-11 rounded-xl pl-9 pr-10", invalid && "border-destructive")}
      />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? hideLabel : showLabel}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </Button>
    </div>
  );
}
