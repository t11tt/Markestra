"use client";

import Link from "next/link";
import {
  Megaphone,
  Eye,
  Bookmark,
  MessageSquare,
  ArrowRight,
  Plus,
  FileText,
  Download,
  BarChart3,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, CampaignGlyph, Card, PageContainer } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { CAMPAIGN_TYPES, STATUS_META, CHANNELS, Campaign } from "@/lib/types";

function StatCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/15">
          {icon}
        </div>
        {delta && (
          <span className="rounded-full bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 font-display text-2xl text-cream">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const campaigns = useStore((s) => s.campaigns);
  const brand = useStore((s) => s.brand);
  const { t } = useI18n();

  const sum = (f: (c: Campaign) => number) => campaigns.reduce((a, c) => a + f(c), 0);
  const totalViews = sum((c) => c.metrics?.views ?? 0);
  const totalSaves = sum((c) => c.metrics?.saves ?? 0);
  const totalInq = sum((c) => c.metrics?.inquiries ?? 0);
  const pending = campaigns.filter((c) => c.status === "review").length;
  const recent = [...campaigns].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const steps = [
    { icon: FileText, label: t("landing.step1") },
    { icon: Sparkles, label: t("landing.step2") },
    { icon: Megaphone, label: t("landing.step3") },
    { icon: Download, label: t("landing.step4") },
    { icon: BarChart3, label: t("landing.step5") },
  ];

  return (
    <PageContainer>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-ink-900 grain">
        <div className="glowfield opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/40 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div>
            <p className="text-sm font-medium text-brand-300">
              {t("dash.greeting", { name: brand.name })}
            </p>
            <h1 className="mt-1.5 font-display text-3xl text-cream text-balance">
              {t("dash.heroTitle")}
            </h1>
            <p className="mt-2.5 max-w-lg text-sm text-muted text-pretty">
              {t("dash.heroSub")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(94,106,210,0.9)] ring-1 ring-inset ring-white/10 transition hover:bg-brand-500 active:scale-[.98]"
              >
                <Plus size={16} /> {t("nav.create")}
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink-900/60 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-ink-800"
              >
                {t("dash.viewAll")}
              </Link>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1 rounded-2xl border border-line bg-ink-900/50 p-3 backdrop-blur-sm xl:flex">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                    <s.icon size={16} />
                  </div>
                  <span className="text-[11px] text-muted">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={14} className="text-subtle" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Megaphone size={18} />}
          label={t("dash.statCampaigns")}
          value={String(campaigns.length)}
          delta={pending ? t("dash.pending", { n: pending }) : undefined}
        />
        <StatCard
          icon={<Eye size={18} />}
          label={t("dash.statViews")}
          value={totalViews.toLocaleString()}
          delta="+12.4%"
        />
        <StatCard
          icon={<Bookmark size={18} />}
          label={t("dash.statSaves")}
          value={totalSaves.toLocaleString()}
          delta="+8.1%"
        />
        <StatCard
          icon={<MessageSquare size={18} />}
          label={t("dash.statInquiries")}
          value={totalInq.toLocaleString()}
          delta="+5.3%"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg text-cream">{t("dash.recent")}</h2>
            <Link
              href="/campaigns"
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              {t("common.all")}
            </Link>
          </div>
          <div className="-mx-3">
            {recent.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <Link
                  key={c.id}
                  href={`/campaigns/view?id=${c.id}`}
                  className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-ink-800"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-800 text-xl ring-1 ring-inset ring-line">
                    <CampaignGlyph image={c.image} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-cream">
                      {c.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
                      <span className="font-mono">{c.code}</span>
                      <span>·</span>
                      <span>
                        {c.channels
                          .map((ch) => t(`channel.${ch}`))
                          .join(" / ")}
                      </span>
                    </div>
                  </div>
                  <Badge tone={meta.tone} dot>
                    {t(`status.${c.status}`)}
                  </Badge>
                  <ArrowRight size={16} className="text-subtle" />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-display text-lg text-cream">
            {t("dash.quickstart")}
          </h2>
          <div className="space-y-2.5">
            {CAMPAIGN_TYPES.map((t2) => (
              <Link
                key={t2.id}
                href={`/campaigns/new?type=${t2.id}`}
                className="group flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand-500/40 hover:bg-brand-500/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-xl ring-1 ring-inset ring-line">
                  {t2.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-cream">
                    {t(`type.${t2.id}`)}
                  </div>
                  <div className="truncate text-xs text-subtle">
                    {t(`type.${t2.id}.desc`)}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-400"
                />
              </Link>
            ))}
          </div>
          <Link
            href="/campaigns/new"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm text-muted transition hover:border-brand-500/40 hover:text-brand-300"
          >
            <Wand2 size={15} /> {t("nav.create")}
          </Link>
        </Card>
      </div>
    </PageContainer>
  );
}
