"use client";

import {useEffect, useState} from "react";
import {CheckCircle2, Crown, Plus, Save, Trash2} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  DEFAULT_PREMIUM_CONFIG,
  loadPremiumConfig,
  savePremiumConfig,
  type PremiumPaymentConfig,
} from "@/src/config/premiumPayment";

export function PremiumPaymentSettingsCard() {
  const [config, setConfig] = useState<PremiumPaymentConfig>(DEFAULT_PREMIUM_CONFIG);
  const [saved, setSaved] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    setConfig(loadPremiumConfig());
  }, []);

  const handleSave = () => {
    savePremiumConfig(config);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const updateField = <K extends keyof PremiumPaymentConfig>(key: K, value: PremiumPaymentConfig[K]) => {
    setConfig((prev) => ({...prev, [key]: value}));
  };

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    updateField("features", [...config.features, trimmed]);
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    updateField("features", config.features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const next = [...config.features];
    next[index] = value;
    updateField("features", next);
  };

  return (
    <Card className="rounded-3xl border-border/70 bg-card/70 py-0">
      <CardHeader className="flex flex-row items-center gap-2 pt-5 pb-3">
        <Crown className="size-5 text-amber-500" />
        <CardTitle className="text-xl font-semibold tracking-tight">Premium Payment Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <p className="text-sm text-muted-foreground">
          Shown on the student upgrade page. Students contact you on Telegram to pay and receive premium access.
        </p>

        {/* Price row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</Label>
            <Input
              value={config.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="50"
              className="rounded-xl border-border/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</Label>
            <Input
              value={config.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              placeholder="USD"
              className="rounded-xl border-border/70"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period</Label>
            <Input
              value={config.period}
              onChange={(e) => updateField("period", e.target.value)}
              placeholder="month"
              className="rounded-xl border-border/70"
            />
          </div>
        </div>

        {/* Telegram */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telegram</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Link (t.me/...)</Label>
              <Input
                value={config.telegramUrl}
                onChange={(e) => updateField("telegramUrl", e.target.value)}
                placeholder="https://t.me/yourusername"
                className="rounded-xl border-border/70"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Button label</Label>
              <Input
                value={config.telegramLabel}
                onChange={(e) => updateField("telegramLabel", e.target.value)}
                placeholder="Contact on Telegram"
                className="rounded-xl border-border/70"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Included features</p>
          <div className="space-y-2">
            {config.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="rounded-xl border-border/70 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFeature(index)}
                  className="shrink-0 rounded-lg text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
              placeholder="Add a feature..."
              className="rounded-xl border-border/70 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={addFeature}
              className="shrink-0 rounded-lg"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 border-t border-border/70 pt-4">
          <Button
            type="button"
            onClick={handleSave}
            className="h-10 rounded-xl px-5 font-semibold"
          >
            <Save className="size-4" />
            Save settings
          </Button>
          {saved ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="size-4" />
              Saved
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
