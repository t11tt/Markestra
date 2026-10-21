"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Megaphone, Plus, Search, Calendar, Trash2, ArrowUpRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, CampaignGlyph, Card, EmptyState, PageContainer, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { isPhotoSrc } from "@/lib/image";
import { SegmentedControl } from "@/components/segmented-control";
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
  const list = useMemo(() => campaigns
    .filter((c) => filter === "all" || c.status === filter)
    .filter((c) => !q.trim() || (c.name + c.code + c.productName).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt), [campaigns, filter, q]);
  const count = (id: CampaignStatus | "all") => id === "all" ? campaigns.length : campaigns.filter((c) => c.status === id).length;

  return (
    <PageContainer>
      <PageHeader title={t("camp.title")} subtitle={t("camp.subtitle")}
        actions={<Button href="/campaigns/new" icon={<Plus size={16} />}>{t("camp.create")}</Button>} />
      <div className="campaign-toolbar flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl value={filter} onChange={setFilter} label={t("camp.colStatus")}
          items={filters.map((item) => ({ ...item, count: count(item.id) }))} />
        <div className="relative sm:w-64">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("camp.searchPh")}
            aria-label={t("camp.searchPh")}
            className="campaign-search w-full border border-line bg-ink-900 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-subtle outline-none" />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Megaphone size={24} />} title={t("camp.emptyTitle")} desc={t("camp.emptyDesc")}
          action={<Button href="/campaigns/new" icon={<Plus size={16} />}>{t("nav.create")}</Button>} />
      ) : (
        <div className="campaign-grid">
          {list.map((c, index) => {
            const meta = STATUS_META[c.status];
            const photo = isPhotoSrc(c.image);
            return (
              <Card key={c.id} as="section" className="campaign-tile" style={{ animationDelay: `${Math.min(index, 6) * 65}ms` }}>
                <Link href={`/campaigns/view?id=${c.id}`} className={`campaign-art ${photo ? "" : "campaign-art-plain"}`} aria-label={c.name}>
                  {photo ? <CampaignGlyph image={c.image} /> : <>
                    <span className="campaign-art-caption">{c.productName}</span>
                    <span className="campaign-art-glyph" aria-hidden="true"><CampaignGlyph image={c.image} /></span>
                  </>}
                  <span className="campaign-art-top">
                    <span className="campaign-number">{String(index + 1).padStart(2, "0")} / CAMPAIGN</span>
                    <span className="campaign-status"><Badge tone={meta.tone} dot>{t(`status.${c.status}`)}</Badge></span>
                  </span>
                </Link>
                <div className="campaign-tile-body">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="campaign-tile-code">{c.code}</span>
                    <span className="campaign-tile-price">¥{c.price}</span>
                  </div>
                  <h2><Link href={`/campaigns/view?id=${c.id}`} className="campaign-tile-name">{c.name}</Link></h2>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Calendar size={12} />{c.startDate} → {c.endDate}</div>
                  <div className="campaign-tile-footer">
                    <div className="flex gap-1.5">{c.channels.map((channel) => {
                      const cm = CHANNELS.find((item) => item.id === channel)!;
                      return <span key={channel} title={t(`channel.${channel}`)} className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: cm.color }}>{cm.short}</span>;
                    })}</div>
                    <div className="flex items-center gap-3">
                      <button type="button" className="campaign-delete" aria-label={`${t("common.delete")} ${c.name}`} onClick={() => {
                        if (confirm(t("camp.deleteConfirm", { name: c.name }))) void removeCampaign(c.id);
                      }}><Trash2 size={14} /></button>
                      <Link href={`/campaigns/view?id=${c.id}`} aria-label={c.name} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-cream transition hover:rotate-45"><ArrowUpRight size={17} /></Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
