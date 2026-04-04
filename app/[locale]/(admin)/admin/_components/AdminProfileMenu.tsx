"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
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
import {cn} from "@/lib/utils";

type AdminProfileMenuProps = {
  compact?: boolean;
  visibility?: "desktop" | "mobile" | "all";
  className?: string;
};

type AdminProfileState = {
  name: string;
  role: string;
  email: string;
  initials: string;
};

function getInitials(name: string) {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!tokens.length) return "A";
  return tokens.map((token) => token.charAt(0).toUpperCase()).join("");
}

export function AdminProfileMenu({compact = false, visibility = "desktop", className}: AdminProfileMenuProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<AdminProfileState>({
    name: "Admin",
    role: "Admin",
    email: "",
    initials: "A"
  });

  const visibilityClassName =
    visibility === "mobile"
      ? "flex md:hidden"
      : visibility === "all"
        ? "flex"
        : "hidden md:flex";

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", {cache: "no-store"});
        if (!response.ok) return;
        const payload = (await response.json()) as {
          full_name?: unknown;
          email?: unknown;
          is_staff?: unknown;
        };
        if (!active) return;

        const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
        const email = typeof payload.email === "string" ? payload.email.trim() : "";
        const isStaff = typeof payload.is_staff === "boolean" ? payload.is_staff : true;

        const resolvedName = fullName || "Admin";
        setProfile({
          name: resolvedName,
          role: isStaff ? "Admin" : "Student",
          email,
          initials: getInitials(resolvedName) || "A"
        });
      } catch {
        // Keep existing profile if request fails.
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleCopyEmail = async () => {
    const valueToCopy = profile.email || "admin@gmail.com";
    try {
      await navigator.clipboard.writeText(valueToCopy);
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
            "h-auto items-center rounded-xl p-1 hover:bg-muted/60",
            visibilityClassName,
            compact ? "gap-0.5" : "gap-2.5 pl-2 pr-1",
            className
          )}
          aria-label="Open admin menu"
        >
          {compact ? null : (
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.role}</p>
            </div>
          )}
          <Avatar className="ring-2 ring-border/70" size="lg">
            <AvatarFallback className="bg-primary/18 text-primary">{profile.initials}</AvatarFallback>
          </Avatar>
          {compact ? null : <ChevronDown className="size-4 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{profile.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{profile.role}</p>
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
