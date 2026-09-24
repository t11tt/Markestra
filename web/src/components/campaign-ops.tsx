"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Channel } from "@/lib/types";

interface OpsData {
  parent: { id: string; code: string; name: string } | null;
  exports: { id: string; channel: string; title: string; price: number; createdAt: number }[];
  publications: { id: string; channel: string; publishedAt: string; link: string | null; note: string | null }[];
  metrics: {
    id: string;
    channel: string;
    metric: string;
    value: number;
    observedOn: string;
    window: string;
    source: string;
    demo: boolean;
  }[];
  reviews: {
    id: string;
    observation: string;
    limitation: string;
    suggestion: string;
    basis: string;
    createdAt: number;
  }[];
}

const CSV_SAMPLE = `channel,metric,value,observedOn,window,demo
xiaohongshu,views,120,2026-09-20,cumulative,false
xiaohongshu,inquiries,3,2026-09-20,cumulative,false`;

export function CampaignOps({
  campaignId,
  channels,
}: {
  campaignId: string;
  channels: Channel[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const replaceCampaign = useStore((s) => s.replaceCampaign);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>(channels[0] ?? "xiaohongshu");
  const [publishedAt, setPublishedAt] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [metric, setMetric] = useState("views");
  const [value, setValue] = useState("");
  const [observedOn, setObservedOn] = useState("");
  const [windowKind, setWindowKind] = useState("cumulative");
  const [demo, setDemo] = useState(false);
  const [csv, setCsv] = useState(CSV_SAMPLE);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}/ops`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("ops.failed"));
      return;
    }
    setOps(data);
    setError(null);
  }, [campaignId, t]);

  useEffect(() => {
    void load();
    const onChange = () => void load();
    window.addEventListener("markestra-ops", onChange);
    return () => window.removeEventListener("markestra-ops", onChange);
  }, [load]);

  async function post(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/ops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("ops.failed"));
      if (data.campaign) replaceCampaign(data.campaign);
      await load();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ops.failed"));
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-display text-lg text-cream">{t("ops.exportTitle")}</h2>
        <p className="mt-1 text-xs text-muted">{t("ops.exportHint")}</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {ops?.exports.length ? (
            ops.exports.map((row) => (
              <li key={row.id}>
                {t(`channel.${row.channel}`)} · ¥{row.price} · {row.title}
              </li>
            ))
          ) : (
            <li>{t("ops.empty")}</li>
          )}
        </ul>
        {ops?.parent && (
          <p className="mt-3 text-xs text-subtle">
            {t("ops.parent")} {ops.parent.code}
          </p>
        )}
        <Button
          className="mt-4"
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            const data = await post({ action: "next" });
            if (data?.campaign?.id) router.push(`/campaigns/view?id=${data.campaign.id}`);
          }}
        >
          {t("ops.next")}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg text-cream">{t("ops.publishTitle")}</h2>
        <div className="mt-3 grid gap-3">
          <Field label={t("ops.channel")}>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
              className="w-full rounded-xl border border-line bg-ink-900 px-3 py-2 text-sm text-cream"
            >
              {channels.map((item) => (
                <option key={item} value={item}>
                  {t(`channel.${item}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("ops.publishedAt")}>
            <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
          </Field>
          <Field label={t("ops.link")}>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          </Field>
          <Field label={t("ops.note")}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button
            disabled={busy || !publishedAt}
            onClick={() => void post({ action: "publish", channel, publishedAt, link, note })}
          >
            {t("ops.publish")}
          </Button>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {ops?.publications.map((row) => (
            <li key={row.id}>
              {t(`channel.${row.channel}`)} · {row.publishedAt.slice(0, 16).replace("T", " ")}
              {row.link ? ` · ${row.link}` : ""}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg text-cream">{t("ops.metricTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t("ops.metric")}>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink-900 px-3 py-2 text-sm text-cream"
            >
              <option value="views">{t("ops.views")}</option>
              <option value="saves">{t("ops.saves")}</option>
              <option value="inquiries">{t("ops.inquiries")}</option>
            </select>
          </Field>
          <Field label={t("ops.value")}>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label={t("ops.observedOn")}>
            <Input type="date" value={observedOn} onChange={(e) => setObservedOn(e.target.value)} />
          </Field>
          <Field label={t("ops.window")}>
            <select
              value={windowKind}
              onChange={(e) => setWindowKind(e.target.value)}
              className="w-full rounded-xl border border-line bg-ink-900 px-3 py-2 text-sm text-cream"
            >
              <option value="cumulative">{t("ops.cumulative")}</option>
              <option value="interval">{t("ops.interval")}</option>
            </select>
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          {t("ops.demo")}
        </label>
        <Button
          className="mt-3"
          disabled={busy || !value || !observedOn}
          onClick={() =>
            void post({
              action: "metric",
              channel,
              metric,
              value: Number(value),
              observedOn,
              window: windowKind,
              demo,
            })
          }
        >
          {t("ops.addMetric")}
        </Button>
        <Field label={t("ops.csv")} >
          <Textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} className="mt-3 font-mono text-xs" />
        </Field>
        <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => void post({ action: "import", csv })}>
          {t("ops.import")}
        </Button>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {ops?.metrics.map((row) => (
            <li key={row.id}>
              {row.demo ? t("ops.demoTag") : t("ops.realTag")} · {t(`channel.${row.channel}`)} · {t(`ops.${row.metric}`)}{" "}
              {row.value} · {row.observedOn} · {row.window === "cumulative" ? t("ops.cumulative") : t("ops.interval")}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg text-cream">{t("ops.reviewTitle")}</h2>
        <p className="mt-1 text-xs text-muted">{t("ops.reviewHint")}</p>
        <Button className="mt-3" disabled={busy} onClick={() => void post({ action: "review" })}>
          {t("ops.review")}
        </Button>
        <div className="mt-4 space-y-3">
          {ops?.reviews.map((row) => (
            <div key={row.id} className="rounded-xl bg-ink-900 p-3 text-sm">
              <p className="text-cream">{row.observation}</p>
              <p className="mt-2 text-muted">{row.limitation}</p>
              <p className="mt-2 text-brand-300">{row.suggestion}</p>
              <p className="mt-2 text-xs text-subtle">{row.basis}</p>
            </div>
          ))}
        </div>
      </Card>
      {error && <p className="text-sm text-bad lg:col-span-2">{error}</p>}
    </div>
  );
}
