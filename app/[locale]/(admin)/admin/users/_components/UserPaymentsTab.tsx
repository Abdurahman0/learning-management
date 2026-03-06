"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import type {PaymentItem} from "@/data/admin-users";

type UserPaymentsTabProps = {
  items: PaymentItem[];
};

const paymentStatusClassName = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-300"
} as const;

function formatDate(dateString: string, t: (key: string, values?: Record<string, string | number>) => string) {
  const [year, monthStr, dayStr] = dateString.split("-");
  const monthIndex = Number(monthStr) - 1;
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const month = monthKeys[monthIndex] ?? "jan";

  return `${t(`dates.months.${month}`)} ${Number(dayStr || "1")}, ${year}`;
}

export function UserPaymentsTab({items}: UserPaymentsTabProps) {
  const t = useTranslations("adminUsers");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardContent className="pt-4 pb-2">
        <div className="overflow-x-auto">
          <Table className="min-w-[530px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.columns.title")}</TableHead>
                <TableHead>{t("payments.columns.amount")}</TableHead>
                <TableHead>{t("payments.columns.status")}</TableHead>
                <TableHead>{t("payments.columns.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      <Badge className={`border px-2.5 py-0.5 text-[10px] tracking-wide uppercase ${paymentStatusClassName[item.status]}`}>
                        {t(`paymentStatus.${item.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.date, t)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    {t("payments.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

