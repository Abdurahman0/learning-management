"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {CheckCircle2, ExternalLink, Pencil, Plus, Search, Trash2} from "lucide-react";

import {AdminSidebar} from "../../_components/AdminSidebar";
import {AdminTopbar} from "../../_components/AdminTopbar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmModal} from "@/components/ui/confirm-modal";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {SiteToast, type SiteToastNotice} from "@/components/ui/site-toast";
import {Switch} from "@/components/ui/switch";
import {adminPackagesService, type AdminPackage, type AdminPackageTier, type AdminPackageWritePayload} from "@/src/services/admin/packages.service";

const EMPTY_FORM: AdminPackageWritePayload = {
  name: "",
  tier: "SILVER",
  price: "",
  has_discount: false,
  discounted_price: null,
  purchase_url: "",
  is_active: true
};

const TIERS: AdminPackageTier[] = ["SILVER", "GOLD", "PLATINUM"];

function formatUzs(value: string | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

function validateForm(form: AdminPackageWritePayload) {
  const price = Number(form.price);
  const discountedPrice = form.discounted_price == null || form.discounted_price === "" ? null : Number(form.discounted_price);
  if (!form.name.trim()) return "Package name is required.";
  if (!Number.isFinite(price) || price <= 0) return "Price must be greater than 0.";
  if (!form.purchase_url.trim()) return "Purchase link is required.";
  if (form.has_discount) {
    if (discountedPrice == null || !Number.isFinite(discountedPrice)) return "Discounted price is required when discount is enabled.";
    if (discountedPrice >= price) return "Discounted price must be lower than the original price.";
  }
  if (!form.has_discount && form.discounted_price) return "Turn discount on or clear the discounted price.";
  return null;
}

export function SubscriptionsPageClient() {
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | AdminPackageTier>("all");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "all">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPackage | null>(null);
  const [deleting, setDeleting] = useState<AdminPackage | null>(null);
  const [form, setForm] = useState<AdminPackageWritePayload>(EMPTY_FORM);
  const [notice, setNotice] = useState<SiteToastNotice | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminPackagesService.list({page: 1, pageSize: 200});
      setPackages(response.results);
    } catch {
      setNotice({tone: "error", title: "Could not load packages", description: "The package endpoint did not return usable data."});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeTierSet = useMemo(() => new Set(packages.filter((item) => item.is_active).map((item) => item.tier)), [packages]);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packages.filter((item) => {
      if (tierFilter !== "all" && item.tier !== tierFilter) return false;
      if (activeFilter === "active" && !item.is_active) return false;
      if (activeFilter === "inactive" && item.is_active) return false;
      if (!query) return true;
      return [item.name, item.tier_display, item.purchase_url].join(" ").toLowerCase().includes(query);
    });
  }, [activeFilter, packages, search, tierFilter]);

  const openCreate = () => {
    const firstAvailableTier = TIERS.find((tier) => !activeTierSet.has(tier)) ?? "SILVER";
    setEditing(null);
    setForm({...EMPTY_FORM, tier: firstAvailableTier});
    setSheetOpen(true);
  };

  const openEdit = (item: AdminPackage) => {
    setEditing(item);
    setForm({
      name: item.name,
      tier: item.tier,
      price: item.price,
      has_discount: item.has_discount,
      discounted_price: item.discounted_price,
      purchase_url: item.purchase_url,
      is_active: item.is_active
    });
    setSheetOpen(true);
  };

  const savePackage = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setNotice({tone: "error", title: "Package is not valid", description: validationError});
      return;
    }

    setSaving(true);
    try {
      const payload: AdminPackageWritePayload = {
        ...form,
        name: form.name.trim(),
        purchase_url: form.purchase_url.trim(),
        discounted_price: form.has_discount ? form.discounted_price : null
      };
      const saved = editing
        ? await adminPackagesService.update(editing.id, payload)
        : await adminPackagesService.create(payload);
      setPackages((current) => {
        if (editing) return current.map((item) => (item.id === saved.id ? saved : item));
        return [saved, ...current];
      });
      setSheetOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setNotice({tone: "success", title: "Package saved", description: "Package changes are now active."});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend rejected the package request.";
      setNotice({tone: "error", title: "Could not save package", description: message});
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async () => {
    if (!deleting) return;
    try {
      await adminPackagesService.delete(deleting.id);
      setPackages((current) => current.map((item) => (item.id === deleting.id ? {...item, is_active: false} : item)));
      setDeleting(null);
      setNotice({tone: "success", title: "Package retired", description: "Existing subscribers keep access until expiry."});
    } catch {
      setNotice({tone: "error", title: "Could not retire package", description: "The backend rejected the delete request."});
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            title="Subscriptions"
            search={{value: search, onValueChange: setSearch, placeholder: "Search packages..."}}
            actions={
              <Button type="button" className="rounded-xl" onClick={openCreate}>
                <Plus className="size-4" />
                New package
              </Button>
            }
          />
          <main className="mx-auto w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {TIERS.map((tier) => {
                const active = packages.find((item) => item.tier === tier && item.is_active);
                return (
                  <Card key={tier} className="border-border/70 bg-card/70 shadow-none">
                    <CardContent className="px-5 py-4">
                      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{tier}</p>
                      <p className="mt-2 text-lg font-semibold">{active?.name ?? "No active package"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{active ? formatUzs(active.effective_price) : "Tier is free to create"}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-border/70 bg-card/70 shadow-none">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Package library</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Select value={tierFilter} onValueChange={(value) => setTierFilter(value as "all" | AdminPackageTier)}>
                      <SelectTrigger className="h-10 w-[160px] rounded-xl border-border/70 bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tiers</SelectItem>
                        {TIERS.map((tier) => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as "active" | "inactive" | "all")}>
                      <SelectTrigger className="h-10 w-[160px] rounded-xl border-border/70 bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Retired</SelectItem>
                        <SelectItem value="all">All statuses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">Loading packages...</div>
                ) : filteredPackages.length ? (
                  filteredPackages.map((item) => (
                    <div key={item.id} className="grid gap-4 rounded-2xl border border-border/70 bg-background/45 p-4 lg:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">{item.name}</h3>
                          <Badge className="rounded-full bg-primary/12 text-primary">{item.tier_display || item.tier}</Badge>
                          <Badge variant={item.is_active ? "default" : "outline"} className="rounded-full">
                            {item.is_active ? "Active" : "Retired"}
                          </Badge>
                          {item.has_discount ? <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">Discount</Badge> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>{formatUzs(item.effective_price)}</span>
                          {item.has_discount ? <span className="line-through">{formatUzs(item.price)}</span> : null}
                          {item.purchase_url ? (
                            <a href={item.purchase_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">
                              Purchase link <ExternalLink className="size-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => openEdit(item)}>
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        {item.is_active ? (
                          <Button type="button" variant="outline" className="rounded-xl text-rose-600 dark:text-rose-300" onClick={() => setDeleting(item)}>
                            <Trash2 className="size-4" />
                            Retire
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-10 text-center text-sm text-muted-foreground">No packages match the current filters.</div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-[520px] overflow-y-auto border-l border-border/70 bg-background/95 p-0">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit package" : "Create package"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm((current) => ({...current, name: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            <div className="space-y-2"><Label>Tier</Label><Select value={form.tier} onValueChange={(value) => setForm((current) => ({...current, tier: value as AdminPackageTier}))}><SelectTrigger className="rounded-xl border-border/70 bg-card/55"><SelectValue /></SelectTrigger><SelectContent>{TIERS.map((tier) => <SelectItem key={tier} value={tier} disabled={!editing && activeTierSet.has(tier)}>{tier}{!editing && activeTierSet.has(tier) ? " already active" : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Price UZS</Label><Input inputMode="numeric" value={form.price} onChange={(event) => setForm((current) => ({...current, price: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
              <div className="space-y-2"><Label>Discounted price</Label><Input inputMode="numeric" value={form.discounted_price ?? ""} disabled={!form.has_discount} onChange={(event) => setForm((current) => ({...current, discounted_price: event.target.value || null}))} className="rounded-xl border-border/70 bg-card/55" /></div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/55 px-4 py-3">
              <div><p className="font-medium">Discount</p><p className="text-sm text-muted-foreground">Discounted price must be lower than price.</p></div>
              <Switch checked={form.has_discount} onCheckedChange={(checked) => setForm((current) => ({...current, has_discount: checked, discounted_price: checked ? current.discounted_price : null}))} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/55 px-4 py-3">
              <div><p className="font-medium">Active</p><p className="text-sm text-muted-foreground">Inactive packages cannot be assigned to new users.</p></div>
              <Switch checked={Boolean(form.is_active)} onCheckedChange={(checked) => setForm((current) => ({...current, is_active: checked}))} />
            </div>
            <div className="space-y-2"><Label>Purchase URL</Label><Input value={form.purchase_url} onChange={(event) => setForm((current) => ({...current, purchase_url: event.target.value}))} className="rounded-xl border-border/70 bg-card/55" /></div>
          </div>
          <SheetFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void savePackage()}>
              <CheckCircle2 className="size-4" />
              {saving ? "Saving..." : "Save package"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        open={Boolean(deleting)}
        title="Retire package?"
        description={`Retire "${deleting?.name ?? ""}"? Existing subscribers keep access until their subscription expires.`}
        confirmText="Retire package"
        cancelText="Cancel"
        confirmVariant="destructive"
        onCancel={() => setDeleting(null)}
        onConfirm={() => void deletePackage()}
      />
      <SiteToast notice={notice} />
    </div>
  );
}
