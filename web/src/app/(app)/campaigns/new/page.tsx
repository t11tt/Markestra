"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Sparkles,
} from "lucide-react";
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
import {
  CAMPAIGN_TYPES,
  CampaignGoal,
  CampaignType,
  Channel,
  CHANNELS,
  GOALS,
} from "@/lib/types";

const EMOJI_PICKS = ["🍱", "☕", "🥮", "🍰", "🍜", "🍔", "🧋", "🎁", "🛍️", "✨"];

function NewCampaignInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const addCampaign = useStore((s) => s.addCampaign);

  const initialType = (params.get("type") as CampaignType) || null;
  const [step, setStep] = useState(initialType ? 1 : 0);
  const STEPS = [t("wiz.stepType"), t("wiz.stepProduct"), t("wiz.stepGoal")];

  const [type, setType] = useState<CampaignType | null>(initialType);
  const [productName, setProductName] = useState("");
  const [productDetail, setProductDetail] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("🍱");
  const [goal, setGoal] = useState<CampaignGoal>("to_store");
  const [channels, setChannels] = useState<Channel[]>(["xiaohongshu", "moments"]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleChannel = (c: Channel) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  }

  const isDataUrl = image.startsWith("data:");
  const canNext =
    step === 0
      ? !!type
      : step === 1
      ? productName.trim() && productDetail.trim() && price
      : channels.length > 0 && startDate && endDate;

  async function finish() {
    if (!type || saving) return;
    setSaving(true);
    const id = await addCampaign({
      name: `${productName} · ${t(`type.${type}`)}`,
      type,
      goal,
      status: "draft",
      productName: productName.trim(),
      productDetail: productDetail.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      startDate,
      endDate,
      channels,
      image,
      contents: [],
    });
    if (!id) {
      setSaving(false);
      return;
    }
    router.push(`/campaigns/view?id=${id}&generate=1`);
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("wiz.title")}
        subtitle={t("wiz.subtitle")}
        back={{ href: "/campaigns", label: t("common.back") }}
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    done
                      ? "bg-brand-500 text-white"
                      : active
                      ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                      : "bg-ink-900 text-subtle ring-1 ring-inset ring-line"
                  }`}
                >
                  {done ? <Check size={15} /> : i + 1}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    active || done ? "text-cream" : "text-subtle"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full ${
                    done ? "bg-brand-500" : "bg-[color:var(--color-line)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Card className="p-6 lg:p-8">
        {step === 0 && (
          <div className="animate-in">
            <h2 className="font-display text-xl text-cream">{t("wiz.s0Title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("wiz.s0Desc")}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {CAMPAIGN_TYPES.map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setType(tp.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    type === tp.id
                      ? "border-brand-500 bg-brand-500/10 ring-4 ring-brand-500/10"
                      : "border-line bg-ink-900 hover:border-brand-500/40"
                  }`}
                >
                  <div className="text-3xl">{tp.emoji}</div>
                  <div className="mt-3 font-semibold text-cream">
                    {t(`type.${tp.id}`)}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {t(`type.${tp.id}.desc`)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in space-y-5">
            <div>
              <h2 className="font-display text-xl text-cream">{t("wiz.s1Title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("wiz.s1Desc")}</p>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="sm:w-48">
                <div className="mb-1.5 text-sm font-medium text-muted">
                  {t("wiz.image")}
                </div>
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-ink-900 text-6xl">
                  {isDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    image
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {EMOJI_PICKS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setImage(e)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-ink-800 ${
                        image === e ? "bg-brand-500/10 ring-1 ring-brand-500/40" : ""
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-xs text-muted transition hover:border-brand-500/40 hover:text-brand-300">
                  <ImagePlus size={14} /> {t("wiz.upload")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageFile}
                  />
                </label>
              </div>

              <div className="flex-1 space-y-4">
                <Field label={t("wiz.name")} required>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t("wiz.namePh")}
                  />
                </Field>
                <Field label={t("wiz.content")} required hint={t("wiz.contentHint")}>
                  <Textarea
                    rows={3}
                    value={productDetail}
                    onChange={(e) => setProductDetail(e.target.value)}
                    placeholder={t("wiz.contentPh")}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("wiz.price")} required>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="68"
                    />
                  </Field>
                  <Field label={t("wiz.original")} hint={t("wiz.originalHint")}>
                    <Input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="88"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in space-y-6">
            <div>
              <h2 className="font-display text-xl text-cream">{t("wiz.s2Title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("wiz.s2Desc")}</p>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-muted">
                {t("wiz.goal")}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      goal === g.id
                        ? "border-brand-500 bg-brand-500/10 ring-4 ring-brand-500/10"
                        : "border-line hover:border-brand-500/40"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        goal === g.id
                          ? "border-brand-400 bg-brand-500"
                          : "border-ink-500"
                      }`}
                    >
                      {goal === g.id && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-cream">
                        {t(`goal.${g.id}`)}
                      </div>
                      <div className="text-xs text-muted">{t(`goal.${g.id}.desc`)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-muted">
                {t("wiz.channels")}
              </div>
              <div className="flex flex-wrap gap-3">
                {CHANNELS.map((c) => {
                  const on = channels.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChannel(c.id)}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 transition ${
                        on
                          ? "border-brand-500 bg-brand-500/10 ring-4 ring-brand-500/10"
                          : "border-line hover:border-brand-500/40"
                      }`}
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ background: c.color }}
                      >
                        {c.short}
                      </span>
                      <span className="text-sm font-medium text-cream">
                        {t(`channel.${c.id}`)}
                      </span>
                      {on && <Check size={15} className="text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("wiz.start")} required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label={t("wiz.end")} required>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
            icon={<ChevronLeft size={16} />}
          >
            {step === 0 ? t("common.cancel") : t("common.prev")}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              icon={<ChevronRight size={16} />}
            >
              {t("common.next")}
            </Button>
          ) : (
            <Button disabled={!canNext || saving} onClick={finish} icon={<Sparkles size={16} />}>
              {saving ? "…" : t("wiz.finish")}
            </Button>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<PageContainer>…</PageContainer>}>
      <NewCampaignInner />
    </Suspense>
  );
}
