"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  Download,
  Package2,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  CampaignGlyph,
  Card,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { Campaign, Channel, CHANNELS, ChannelContent, STATUS_META } from "@/lib/types";
import { PosterCanvas, PosterHandle } from "@/components/poster-canvas";
import { isPhotoSrc } from "@/lib/image";
import { POSTER_STYLES, capturePosterPng } from "@/lib/poster";
import { downloadAssetPack } from "@/lib/asset-pack";
import Image from "next/image";
import { nextPosterStyle } from "@/lib/poster-templates";
import { CampaignOps } from "@/components/campaign-ops";

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 1800);
  };
  const node = msg ? (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in rounded-xl border border-line bg-ink-800 px-4 py-2.5 text-sm font-medium text-cream shadow-pop">
      {msg}
    </div>
  ) : null;
  return { show, node };
}

function XhsPreview({ c, content, brand }: { c: Campaign; content: ChannelContent; brand: string }) {
  const isImg = isPhotoSrc(c.image);
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-3xl bg-white shadow-lg">
      <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 text-8xl">
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="h-full w-full object-cover" />
        ) : (
          c.image ?? "🍱"
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold leading-snug text-slate-900">{content.title}</h3>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">
          {content.body}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {content.tags.map((t) => (
            <span key={t} className="text-[13px] font-medium text-sky-600">#{t}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600" />
          <span className="text-xs text-slate-500">{brand}</span>
        </div>
      </div>
    </div>
  );
}

function MomentsPreview({ c, content, brand }: { c: Campaign; content: ChannelContent; brand: string }) {
  const isImg = isPhotoSrc(c.image);
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-4 shadow-lg">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-300 to-brand-600 text-sm font-bold text-white">
          {brand.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#576b95]">{brand}</div>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {content.body}
          </p>
          <div className="mt-2 w-32">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-slate-100 text-4xl">
              {isImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="h-full w-full object-cover" />
              ) : (
                c.image ?? "🍱"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DouyinPreview({ c, content, brand }: { c: Campaign; content: ChannelContent; brand: string }) {
  const isImg = isPhotoSrc(c.image);
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-3xl bg-slate-900 text-white shadow-lg">
      <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-90">
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="h-full w-full object-cover opacity-70" />
        ) : (
          c.image ?? "🎬"
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
        <div className="text-sm font-semibold">@{brand}</div>
        <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-white/90">
          {content.body}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {content.tags.map((t) => (
            <span key={t} className="text-xs text-white/80">#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Preview({ c, content, brand }: { c: Campaign; content: ChannelContent; brand: string }) {
  if (content.channel === "xiaohongshu") return <XhsPreview c={c} content={content} brand={brand} />;
  if (content.channel === "moments") return <MomentsPreview c={c} content={content} brand={brand} />;
  return <DouyinPreview c={c} content={content} brand={brand} />;
}

function GenSkeleton({ msg }: { msg: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm font-medium text-brand-300">
        <Sparkles size={16} className="animate-pulse" />
        {msg}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl border border-line bg-ink-900 p-4 shimmer">
          <div className="h-4 w-2/3 rounded bg-ink-700" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded bg-ink-700" />
            <div className="h-3 w-11/12 rounded bg-ink-700" />
            <div className="h-3 w-4/5 rounded bg-ink-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-subtle">{label}</div>
      <div className="mt-0.5 font-medium text-cream">{value}</div>
    </div>
  );
}

function WorkbenchInner() {
  const search = useSearchParams();
  const { t } = useI18n();
  const id = search.get("id") ?? "";

  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  const brand = useStore((s) => s.brand);
  const updateCampaign = useStore((s) => s.updateCampaign);
  const replaceCampaign = useStore((s) => s.replaceCampaign);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<{ code: string; channel: Channel; detail?: string }[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [active, setActive] = useState<Channel | null>(null);
  const [regenCh, setRegenCh] = useState<Channel | null>(null);
  const [versions, setVersions] = useState<{ id: string; title: string; createdAt: number }[]>([]);
  const [versionTick, setVersionTick] = useState(0);
  const posterLayout = campaign?.type ?? "combo";
  const posterStyle = campaign?.posterStyle ?? "tea";
  const [posterTitle, setPosterTitle] = useState("");
  const [posterCut, setPosterCut] = useState(false);
  const posterRef = useRef<PosterHandle | null>(null);
  const { show, node: toast } = useToast();
  const started = useRef(false);

  const runGenerate = async (channel?: Channel) => {
    if (!campaign || generating || regenCh) return;
    if (channel) setRegenCh(channel);
    else setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channel ? { channel } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("wb.genFailed"));
      replaceCampaign(data.campaign);
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setModel(typeof data.model === "string" ? data.model : null);
      setVersionTick((n) => n + 1);
      if (!channel) setActive(data.campaign.contents[0]?.channel ?? campaign.channels[0]);
      show(
        channel
          ? t("wb.toastRegenerated", { channel: t(`channel.${channel}`) })
          : t("wb.toastGenerated", { n: data.campaign.contents.length })
      );
    } catch (error) {
      setGenError(error instanceof Error ? error.message : t("wb.genFailed"));
    } finally {
      setGenerating(false);
      setRegenCh(null);
    }
  };


  useEffect(() => {
    if (!campaign || started.current) return;
    const timer = window.setTimeout(() => {
    if (active === null && campaign.contents.length > 0) {
      setActive(campaign.contents[0].channel);
    }
    if (search.get("generate") === "1" && campaign.contents.length === 0) {
      started.current = true;
      void runGenerate();
    }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign]);

  useEffect(() => {
    if (!id || !active) return;
    let cancelled = false;
    fetch(`/api/campaigns/${id}/versions?channel=${active}`)
      .then((res) => res.json())
      .then((rows) => {
        if (!cancelled && Array.isArray(rows)) setVersions(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, active, versionTick]);

  if (!campaign) {
    return (
      <PageContainer>
        <PageHeader title={t("wb.notFoundTitle")} back={{ href: "/campaigns", label: t("common.back") }} />
        <Card className="p-8 text-sm text-muted">{t("wb.notFoundDesc")}</Card>
      </PageContainer>
    );
  }

  const meta = STATUS_META[campaign.status];
  const activeContent = campaign.contents.find((c) => c.channel === active) ?? campaign.contents[0];
  const allConfirmed = campaign.contents.length > 0 && campaign.contents.every((c) => c.confirmed);

  const patchContent = (channel: Channel, patch: Partial<ChannelContent>) => {
    updateCampaign(campaign.id, {
      contents: campaign.contents.map((c) =>
        c.channel === channel ? { ...c, ...patch, confirmed: patch.confirmed ?? false } : c
      ),
    });
  };

  const restoreVersion = async (versionId: string) => {
    const res = await fetch(`/api/campaigns/${campaign.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setGenError(data.error || t("wb.genFailed"));
      return;
    }
    replaceCampaign(data.campaign);
    show(t("wb.toastRestored"));
  };

  const downloadPoster = async () => {
    if (!allConfirmed) return;
    const confirmed = campaign.contents.filter((item) => item.confirmed);
    const items = await Promise.all(
      confirmed.map(async (item) => ({
        channel: item.channel,
        png: await capturePosterPng({
          layout: posterLayout,
          style: posterStyle,
          label: t(`type.${posterLayout}`),
          title: posterTitle.trim() || item.title || campaign.productName,
          detail: campaign.productDetail,
          price: campaign.price,
          originalPrice: campaign.originalPrice,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          brand: brand.name,
          image: campaign.image,
          images: campaign.images,
          category: campaign.category,
          offer: campaign.offer,
          intent: campaign.intent,
        }),
      }))
    );
    const res = await fetch(`/api/campaigns/${campaign.id}/ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "export",
        items,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      show(data.error || t("wb.genFailed"));
      return;
    }
    downloadAssetPack(campaign.code,items.map((item)=>{
      const content=confirmed.find((c)=>c.channel===item.channel)!;
      return {...item,text:`${content.title}\n\n${content.body}\n\n${content.tags.map((tag)=>"#"+tag).join(" ")}\n${content.cta}`};
    }));
    window.dispatchEvent(new Event("markestra-ops"));
    show(t("wb.toastDownload"));
  };

  const copyContent = (c: ChannelContent) => {
    const text = `${c.title}\n\n${c.body}\n\n${c.tags.map((x) => "#" + x).join(" ")}`;
    navigator.clipboard?.writeText(text);
    show(t("wb.toastCopied"));
  };

  return (
    <PageContainer>
      {toast}
      <PageHeader
        back={{ href: "/campaigns", label: t("common.back") }}
        title={
          <span className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg text-3xl">
              <CampaignGlyph image={campaign.image} />
            </span>
            {campaign.name}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{campaign.code}</span>
            <span>·</span>
            <span>{t("wb.goal")}：{t(`goal.${campaign.goal}`)}</span>
            <span>·</span>
            <span>{campaign.startDate} → {campaign.endDate}</span>
          </span>
        }
        actions={<Badge tone={meta.tone} dot>{t(`status.${campaign.status}`)}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream">
              <Package2 size={16} className="text-brand-400" /> {t("wb.facts")}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Fact label={t("wb.target")} value={campaign.productName} />
              <Fact label={t("wb.goal")} value={t(`goal.${campaign.goal}`)} />
              <Field label={t("wb.price")}>
                <Input
                  type="number"
                  value={String(campaign.price)}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    if (!Number.isFinite(price) || price < 0 || price === campaign.price) return;
                    updateCampaign(campaign.id, { price });
                  }}
                />
              </Field>
              <Field label={t("wb.start")}>
                <Input
                  type="date"
                  value={campaign.startDate}
                  onChange={(e) => {
                    if (!e.target.value || e.target.value === campaign.startDate) return;
                    updateCampaign(campaign.id, { startDate: e.target.value });
                  }}
                />
              </Field>
              <Field label={t("wb.end")}>
                <Input
                  type="date"
                  value={campaign.endDate}
                  onChange={(e) => {
                    if (!e.target.value || e.target.value === campaign.endDate) return;
                    updateCampaign(campaign.id, { endDate: e.target.value });
                  }}
                />
              </Field>
              <div className="col-span-2 sm:col-span-3">
                <Fact label={t("wb.content")} value={campaign.productDetail} />
              </div>
              {campaign.category && (
                <Fact label={t("wiz.category")} value={campaign.category} />
              )}
              {campaign.offer && <Fact label={t("wiz.offer")} value={campaign.offer} />}
              {campaign.intent && (
                <div className="col-span-2 sm:col-span-3">
                  <Fact label={t("wiz.intent")} value={campaign.intent} />
                </div>
              )}
            </div>
          </Card>

          {generating ? (
            <GenSkeleton msg={t("wb.generatingMsg")} />
          ) : campaign.contents.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
                <Sparkles size={24} />
              </div>
              <h3 className="font-display text-lg text-cream">{t("wb.noContentTitle")}</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {t("wb.noContentDesc", {
                  channels: campaign.channels.map((ch) => t(`channel.${ch}`)).join(" / "),
                })}
              </p>
              <div className="mt-5 flex flex-col items-center gap-3">
                <Button onClick={() => void runGenerate()} icon={<Sparkles size={16} />}>
                  {genError ? t("wb.retry") : t("wb.generate")}
                </Button>
                {genError && <p className="max-w-sm text-sm text-bad">{genError}</p>}
              </div>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {campaign.contents.map((c) => {
                  const cm = CHANNELS.find((x) => x.id === c.channel)!;
                  const on = active === c.channel;
                  return (
                    <button
                      key={c.channel}
                      onClick={() => setActive(c.channel)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                        on
                          ? "bg-brand-500 text-white"
                          : "bg-ink-900 text-muted ring-1 ring-inset ring-line hover:bg-ink-800 hover:text-cream"
                      }`}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ background: cm.color }}
                      >
                        {cm.short}
                      </span>
                      {t(`channel.${c.channel}`)}
                      {c.confirmed && (
                        <CheckCircle2 size={14} className={on ? "text-white/70" : "text-ok"} />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeContent && (
                <Card className="p-5" key={activeContent.channel}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-cream">
                      {t("wb.editChannel", { channel: t(`channel.${activeContent.channel}`) })}
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void runGenerate(activeContent.channel)}
                      disabled={regenCh === activeContent.channel}
                      icon={
                        <RefreshCw
                          size={14}
                          className={regenCh === activeContent.channel ? "animate-spin" : ""}
                        />
                      }
                    >
                      {regenCh === activeContent.channel ? t("wb.regenerating") : t("wb.regenerate")}
                    </Button>
                  </div>

                  {genError && <p className="mb-3 text-sm text-bad">{genError}</p>}
                  {model && model !== "mock" && <p className="mb-3 text-xs text-ok">已由 {model} 生成 · 请核对后确认</p>}
                  {model === "mock" && (
                    <p className="mb-3 text-xs text-muted">{t("wb.mockNote")}</p>
                  )}
                  {warnings.filter((warning) => warning.channel === activeContent.channel).length > 0 && (
                    <ul className="mb-3 space-y-1 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">
                      {warnings
                        .filter((warning) => warning.channel === activeContent.channel)
                        .map((warning, index) => (
                          <li key={`${warning.code}-${index}`}>
                            {t(`wb.warn.${warning.code}`, {
                              detail: warning.detail ?? "",
                            })}
                          </li>
                        ))}
                    </ul>
                  )}

                  <div className="space-y-4">
                    <Field label={t("wb.fTitle")}>
                      <Input
                        value={activeContent.title}
                        onChange={(e) => patchContent(activeContent.channel, { title: e.target.value })}
                      />
                    </Field>
                    <Field label={t("wb.fBody")}>
                      <Textarea
                        rows={7}
                        value={activeContent.body}
                        onChange={(e) => patchContent(activeContent.channel, { body: e.target.value })}
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("wb.fTags")} hint={t("wb.fTagsHint")}>
                        <Input
                          value={activeContent.tags.join(", ")}
                          onChange={(e) =>
                            patchContent(activeContent.channel, {
                              tags: e.target.value.split(/[,，]/).map((x) => x.trim()).filter(Boolean),
                            })
                          }
                        />
                      </Field>
                      <Field label={t("wb.fCta")}>
                        <Input
                          value={activeContent.cta}
                          onChange={(e) => patchContent(activeContent.channel, { cta: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <Button variant="ghost" size="sm" onClick={() => copyContent(activeContent)} icon={<Copy size={14} />}>
                      {t("wb.copy")}
                    </Button>
                    {activeContent.confirmed ? (
                      <Badge tone="green" dot>
                        {t("wb.confirmed")}
                        {activeContent.versionId ? ` · ${activeContent.versionId.slice(-6)}` : ""}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => patchContent(activeContent.channel, { confirmed: true })}
                        icon={<Check size={14} />}
                      >
                        {t("wb.confirmThis")}
                      </Button>
                    )}
                  </div>
                  {versions.length > 0 && (
                    <div className="mt-4 border-t border-line pt-4">
                      <div className="mb-2 text-xs font-semibold text-subtle">{t("wb.versions")}</div>
                      <div className="space-y-1.5">
                        {versions.slice(0, 5).map((version) => (
                          <button
                            key={version.id}
                            onClick={() => void restoreVersion(version.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-xs text-muted transition hover:bg-ink-800 hover:text-cream"
                          >
                            <span className="truncate">{version.title}</span>
                            <span className="shrink-0 text-subtle">{t("wb.restore")}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <div className="mb-1 text-sm font-semibold text-cream">{t("wb.poster")}</div>
            <p className="mb-3 text-xs text-muted">{t("wb.posterHint")}</p>
            <div className="poster-picker">
              <section aria-labelledby="scene-template-label">
                <div className="poster-picker-heading">
                  <div>
                    <h3 id="scene-template-label">场景模板 <span>05</span></h3>
                    <p>自带材质与光影，生成时自动轮换</p>
                  </div>
                  <button type="button" className="poster-shuffle" onClick={() => updateCampaign(campaign.id, {posterStyle:nextPosterStyle(posterStyle)})}><RefreshCw size={12} /> 换一张</button>
                </div>
                <div className="template-gallery" role="group" aria-label="场景模板">
                  {POSTER_STYLES.filter((style) => "background" in style).map((style) => (
                    <button key={style.id} type="button" className="scene-template" aria-pressed={posterStyle === style.id} onClick={() => updateCampaign(campaign.id, {posterStyle:style.id})}>
                      <span className="template-thumbnail">
                        {"background" in style && <Image unoptimized src={style.background} alt="" width={240} height={180} />}
                        {posterStyle === style.id && <span className="template-check"><Check size={12} /></span>}
                      </span>
                      <span className="template-name">{style.name}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="classic-palette" aria-labelledby="classic-palette-label">
                <div className="poster-picker-heading">
                  <div><h3 id="classic-palette-label">经典配色 <span>04</span></h3><p>简洁色调，突出商品本身</p></div>
                </div>
                <div className="palette-options" role="group" aria-label="经典配色">
                  {POSTER_STYLES.filter((style) => !("background" in style)).map((style) => (
                    <button key={style.id} type="button" className="palette-option" aria-pressed={posterStyle === style.id} onClick={() => updateCampaign(campaign.id, {posterStyle:style.id})}>
                      <span className="palette-swatch" style={{background:style.color}}>{posterStyle === style.id && <Check size={16} />}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </section>
              <p className="poster-picker-note">已选：{POSTER_STYLES.find((style) => style.id === posterStyle)?.name} · 自动保存到此活动</p>
            </div>
            <div className="mb-4"><Field label="海报主标题" hint="可单独调整，不改变渠道文案"><Input value={posterTitle} onChange={(e) => setPosterTitle(e.target.value)} placeholder={campaign.productName} maxLength={40} /></Field></div>
            {!campaign.images?.length && !isPhotoSrc(campaign.image) && <p className="mb-3 text-xs text-warn">添加活动时上传商品实拍，可获得照片海报效果。</p>}
            <PosterCanvas
              handleRef={posterRef}
              onDraw={(result) => setPosterCut(result.titleTruncated || result.detailTruncated)}
              input={{
                layout: posterLayout,
          style: posterStyle,
                label: t(`type.${posterLayout}`),
                title: posterTitle.trim() || activeContent?.title || campaign.productName,
                detail: campaign.productDetail,
                price: campaign.price,
                originalPrice: campaign.originalPrice,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                brand: brand.name,
                image: campaign.image,
                images: campaign.images,
                category: campaign.category,
                offer: campaign.offer,
                intent: campaign.intent,
              }}
            />
            {posterCut && <p className="mt-2 text-xs text-warn">{t("wb.posterCut")}</p>}
          </Card>
          <Card className="p-5">
            <div className="mb-4 text-sm font-semibold text-cream">{t("wb.preview")}</div>
            {generating || !activeContent ? (
              <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-ink-900 text-sm text-subtle">
                {generating ? t("wb.previewGen") : t("wb.previewEmpty")}
              </div>
            ) : (
              <Preview c={campaign} content={activeContent} brand={brand.name} />
            )}
          </Card>

          {campaign.contents.length > 0 && !generating && (
            <Card className="p-5">
              <div className="mb-1 text-sm font-semibold text-cream">{t("wb.pack")}</div>
              <p className="mb-3 text-xs text-muted">
                {t("wb.packProgress", {
                  done: campaign.contents.filter((c) => c.confirmed).length,
                  total: campaign.contents.length,
                })}
              </p>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!allConfirmed}
                  onClick={() => void downloadPoster()}
                  icon={<Download size={15} />}
                >
                  {t("wb.downloadAll")}
                </Button>
                {!allConfirmed && (
                  <p className="text-center text-xs text-subtle">{t("wb.publishHint")}</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      <CampaignOps campaignId={campaign.id} channels={campaign.channels} />
    </PageContainer>
  );
}

export default function WorkbenchPage() {
  return (
    <Suspense fallback={<PageContainer>…</PageContainer>}>
      <WorkbenchInner />
    </Suspense>
  );
}
