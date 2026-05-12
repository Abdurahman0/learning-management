"use client";

import type {ReactNode} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useLocale} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

type AdminBackendOnlyGateProps = {
  children: ReactNode;
};

function isBackendOnlySupportedAdminPath(pathWithoutLocale: string) {
  const allowedPrefixes = [
    "/admin",
    "/admin/analytics",
    "/admin/users",
    "/admin/tests",
    "/admin/content-bank",
    "/admin/feedback",
    "/admin/notifications",
    "/admin/reading-tests",
    "/admin/listening-tests",
    "/admin/question-bank",
    "/admin/settings"
  ];

  const blockedPrefixes = [
    "/admin/achievements",
    "/admin/reports",
    "/admin/subscriptions",
    "/admin/mistakes-analysis"
  ];

  if (blockedPrefixes.some((prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`))) {
    return false;
  }

  return allowedPrefixes.some((prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`));
}

export function AdminBackendOnlyGate({children}: AdminBackendOnlyGateProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const pathWithoutLocale = pathname.replace(/^\/(uz|en)(?=\/|$)/, "") || "/";
  const isSupported = isBackendOnlySupportedAdminPath(pathWithoutLocale);

  if (!isSupported) {
    return (
      <div className="mx-auto mt-10 w-full max-w-2xl px-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Feature temporarily hidden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>This admin page is disabled while backend-only integration is being completed and mock data is removed.</p>
            <Button asChild className="w-fit">
              <Link href={`/${locale}/admin`}>Back to admin dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
