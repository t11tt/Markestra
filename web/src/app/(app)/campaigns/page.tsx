"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Megaphone, Plus, Search, Calendar, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  CampaignGlyph,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { CHANNELS, CampaignStatus, STATUS_META } from "@/lib/types";

export default function CampaignsPage() {
  const campaigns = useStore((s) => s.campaigns);
  const removeCampaign = useStore((s) => s.removeCampaign);
  const { t } = useI18n();
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [q, setQ] = useState("");

  const filters: { id: CampaignStatus | "all"; label: string }[] = [
    { id: "all", label: t("common.all") },
    { id: "draft", label: t("status.draft") },
    { id: "review", label: t("status.review") },
    { id: "published", label: t("status.published") },
  ];

  const list = useMemo(() => {
    return campaigns
      .filter((c) => (filter === "all" ? true : c.status === filter))
      .filter((c) =>
        q.trim()
          ? (c.name + c.code + c.productName).toLowerCase().includes(q.toLowerCase())
          : true
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [campaigns, filter, q]);

  const count = (id: CampaignStatus | "all") =>
    id === "all" ? campaigns.length : campaigns.filter((c) => c.status === id).length;

  return (
    <PageContainer>
      <PageHeader
        title={t("camp.title")}
        subtitle={t("camp.subtitle")}
        actions={
          <Button href="/campaigns/new" icon={<Plus size={16} />}>
            {t("camp.create")}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? "bg-brand-500 text-white"
                  : "bg-ink-900 text-muted ring-1 ring-inset ring-line hover:bg-ink-800 hover:text-cream"
              }`}
            >
              {f.label}
              <span
                className={`ml-1.5 text-xs ${
                  filter === f.id ? "text-white/60" : "text-subtle"
                }`}
              >
                {count(f.id)}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("camp.searchPh")}
            className="w-full rounded-xl border border-line bg-ink-900 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-subtle outline-none transition focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={24} />}
          title={t("camp.emptyTitle")}
          desc={t("camp.emptyDesc")}
          action={
            <Button href="/campaigns/new" icon={<Plus size={16} />}>
              {t("nav.create")}
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_140px_170px_120px_40px] gap-4 border-b border-line bg-ink-900/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-subtle md:grid">
            <div>{t("camp.colCampaign")}</div>
            <div>{t("camp.colChannels")}</div>
            <div>{t("camp.colDates")}</div>
            <div>{t("camp.colStatus")}</div>
            <div />
          </div>
          <div className="divide-y divide-[color:var(--color-line)]">
            {list.map((c) => {
              const meta = STATUS_META[c.status];
              return (
                <div
                  key={c.id}
                  className="group grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-ink-800/50 md:grid-cols-[1fr_140px_170px_120px_40px] md:items-center md:gap-4"
                >
                  <Link href={`/campaigns/view?id=${c.id}`} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-800 text-xl ring-1 ring-inset ring-line">
                      <CampaignGlyph image={c.image} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-cream">
                        {c.name}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-subtle">
                        {c.code} · ¥{c.price}
                      </div>
                    </div>
                  </Link>

                  <div className="flex gap-1">
                    {c.channels.map((ch) => {
                      const cm = CHANNELS.find((x) => x.id === ch)!;
                      return (
                        <span
                          key={ch}
                          title={t(`channel.${ch}`)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white"
                          style={{ background: cm.color }}
                        >
                          {cm.short}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={13} className="text-subtle" />
                    {c.startDate} → {c.endDate}
                  </div>

                  <div>
                    <Badge tone={meta.tone} dot>
                      {t(`status.${c.status}`)}
                    </Badge>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(t("camp.deleteConfirm", { name: c.name })))
                        removeCampaign(c.id);
                    }}
                    className="justify-self-start rounded-lg p-2 text-subtle opacity-0 transition hover:bg-bad/10 hover:text-bad group-hover:opacity-100 md:justify-self-end"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
