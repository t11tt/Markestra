"use client";

import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function BrandPage() {
  const brand = useStore((s) => s.brand);
  const updateBrand = useStore((s) => s.updateBrand);
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(brand);
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const ok = await updateBrand(form);
    if (!ok) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <PageContainer>
      <PageHeader title={t("br.title")} subtitle={t("br.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <div className="space-y-5">
            <Field label={t("br.name")} required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label={t("br.address")} required>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label={t("br.hours")}>
              <Input value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            </Field>
            <Field label={t("br.style")} hint={t("br.styleHint")}>
              <Textarea rows={2} value={form.style} onChange={(e) => set("style", e.target.value)} />
            </Field>
            <Field label={t("br.audience")}>
              <Textarea rows={2} value={form.audience} onChange={(e) => set("audience", e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
            {saved && (
              <span className="flex items-center gap-1 text-sm font-medium text-ok">
                <Check size={15} /> {t("common.saved")}
              </span>
            )}
            <Button onClick={save}>{t("br.saveInfo")}</Button>
          </div>
        </Card>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="relative overflow-hidden p-5">
              <div className="glowfield opacity-60" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-xl font-bold text-white">
                  {form.name.slice(0, 1)}
                </div>
                <div>
                  <div className="font-display text-base text-cream">{form.name}</div>
                  <div className="text-xs text-muted">{form.hours}</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 border-t border-line p-5 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 text-subtle" />
                <div>
                  <div className="text-xs text-subtle">{t("br.addressLabel")}</div>
                  <div className="text-muted">{form.address}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t("br.styleLabel")}</div>
                <div className="mt-0.5 text-muted">{form.style}</div>
              </div>
              <div>
                <div className="text-xs text-subtle">{t("br.audienceLabel")}</div>
                <div className="mt-0.5 text-muted">{form.audience}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
