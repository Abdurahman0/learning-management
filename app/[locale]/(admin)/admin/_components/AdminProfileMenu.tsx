"use client";

import Link from "next/link";
import {useState} from "react";
import {ChevronDown, Copy, LayoutDashboard, LogOut, Users} from "lucide-react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {adminProfile} from "@/data/admin-dashboard";
import {cn} from "@/lib/utils";

type AdminProfileMenuProps = {
  compact?: boolean;
  className?: string;
};

export function AdminProfileMenu({compact = false, className}: AdminProfileMenuProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("admin@gmail.com");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleSignOut = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {method: "POST"});
    } finally {
      router.replace(`/${locale}/login`);
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "hidden h-auto items-center rounded-xl p-1 hover:bg-muted/60 md:flex",
            compact ? "gap-0.5" : "gap-2.5 pl-2 pr-1",
            className
          )}
          aria-label="Open admin menu"
        >
          {compact ? null : (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{adminProfile.name}</p>
              <p className="text-xs text-muted-foreground">{adminProfile.role}</p>
            </div>
          )}
          <Avatar className="ring-2 ring-border/70" size="lg">
            <AvatarFallback className="bg-primary/18 text-primary">{adminProfile.initials}</AvatarFallback>
          </Avatar>
          {compact ? null : <ChevronDown className="size-4 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{adminProfile.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{adminProfile.role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/admin`}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/admin/users`}>
            <Users className="size-4" />
            Users
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleCopyEmail();
          }}
        >
          <Copy className="size-4" />
          Copy Login Email
          <DropdownMenuShortcut>{copied ? "Copied" : "Ctrl+C"}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="text-rose-600 focus:text-rose-600"
        >
          <LogOut className="size-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
