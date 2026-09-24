"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Eye,
  ShieldCheck,
  BarChart3,
  Wand2,
  FileText,
  Megaphone,
  Download,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo, Mark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/ui";

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* glow behind window */}
      <div className="glowfield opacity-80" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/80 shadow-pop backdrop-blur-xl grain">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <div className="ml-3 flex items-center gap-2 rounded-md bg-ink-800 px-2.5 py-1 text-[11px] text-subtle">
            <Mark size={13} /> markestra.app / workbench
          </div>
        </div>
        <div className="grid grid-cols-[1fr_150px] gap-0">
          {/* main */}
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-sm text-cream">
                  双人午餐套餐 · 到店引流
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-subtle">
                  MK-2026-A1C0 · ¥68
                </div>
              </div>
              <span className="rounded-full bg-cool/10 px-2 py-0.5 text-[11px] font-medium text-cool ring-1 ring-inset ring-cool/25">
                待确认
              </span>
            </div>
            <div className="mt-4 flex gap-1.5">
              {["小红书", "朋友圈", "抖音"].map((c, i) => (
                <span
                  key={c}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                    i === 0
                      ? "bg-brand-600 text-white"
                      : "bg-ink-800 text-muted ring-1 ring-inset ring-line"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="h-2.5 w-4/5 rounded-full bg-ink-700" />
              <div className="h-2.5 w-full rounded-full bg-ink-700" />
              <div className="h-2.5 w-11/12 rounded-full bg-ink-700" />
              <div className="h-2.5 w-2/3 rounded-full bg-ink-700" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                <Sparkles size={12} /> 生成内容
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
                重新生成
              </span>
            </div>
          </div>
          {/* mini phone preview */}
          <div className="border-l border-line p-4">
            <div className="mx-auto w-full overflow-hidden rounded-xl bg-white">
              <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-rose-100 to-amber-100 text-4xl">
                🍱
              </div>
              <div className="space-y-1.5 p-2.5">
                <div className="h-2 w-4/5 rounded-full bg-slate-300" />
                <div className="h-1.5 w-full rounded-full bg-slate-200" />
                <div className="h-1.5 w-5/6 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-ink-900/50 p-6 transition hover:border-line-strong">
      <div className="pointer-events-none absolute -inset-px opacity-0 transition group-hover:opacity-100">
        <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-brand-600/15 blur-3xl" />
      </div>
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-inset ring-brand-500/20">
          {icon}
        </div>
        <h3 className="mt-4 font-display text-base text-cream">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t, locale, setLocale } = useI18n();

  const features = [
    { icon: <Wand2 size={18} />, title: t("landing.f1Title"), desc: t("landing.f1Desc") },
    { icon: <Eye size={18} />, title: t("landing.f2Title"), desc: t("landing.f2Desc") },
    { icon: <ShieldCheck size={18} />, title: t("landing.f3Title"), desc: t("landing.f3Desc") },
    { icon: <BarChart3 size={18} />, title: t("landing.f4Title"), desc: t("landing.f4Desc") },
  ];
  const steps = [
    { icon: FileText, label: t("landing.step1"), desc: t("landing.step1Desc") },
    { icon: Sparkles, label: t("landing.step2"), desc: t("landing.step2Desc") },
    { icon: Megaphone, label: t("landing.step3"), desc: t("landing.step3Desc") },
    { icon: Download, label: t("landing.step4"), desc: t("landing.step4Desc") },
    { icon: BarChart3, label: t("landing.step5"), desc: t("landing.step5Desc") },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Logo size={30} />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#why" className="transition hover:text-cream">{t("landing.navWhy")}</a>
            <a href="#features" className="transition hover:text-cream">{t("landing.navFeatures")}</a>
            <a href="#flow" className="transition hover:text-cream">{t("landing.navFlow")}</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher locale={locale} setLocale={setLocale} />
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-cream sm:block"
            >
              {t("landing.signin")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 shadow-[0_8px_24px_-12px_rgba(94,106,210,0.9)] transition hover:bg-brand-500"
            >
              {t("landing.enter")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative">
        <div className="glowfield opacity-90" />
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 text-center lg:px-8 lg:pt-24">
          <div className="rise mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-ink-900/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur">
            <span className="flex h-1.5 items-end gap-0.5">
              <span className="eq-bar inline-block h-2 w-0.5 bg-brand-400" style={{ animationDelay: "0ms" }} />
              <span className="eq-bar inline-block h-3 w-0.5 bg-brand-400" style={{ animationDelay: "150ms" }} />
              <span className="eq-bar inline-block h-1.5 w-0.5 bg-brand-400" style={{ animationDelay: "300ms" }} />
            </span>
            {t("landing.badge")}
          </div>

          <h1 className="rise mx-auto mt-6 max-w-4xl font-display text-4xl leading-[1.08] text-cream text-balance sm:text-5xl lg:text-6xl" style={{ animationDelay: "60ms" }}>
            {t("landing.heroTitleA")}{" "}
            <span className="accent-gradient-text">{t("landing.heroTitleB")}</span>{" "}
            {t("landing.heroTitleC")}
          </h1>

          <p className="rise mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted text-pretty" style={{ animationDelay: "120ms" }}>
            {t("landing.heroSub")}
          </p>

          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "180ms" }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 shadow-[0_12px_36px_-12px_rgba(94,106,210,0.9)] transition hover:bg-brand-500 active:scale-[.98]"
            >
              {t("landing.primaryCta")} <ArrowRight size={16} />
            </Link>
            <a
              href="#flow"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-ink-900/50 px-5 py-3 text-sm font-semibold text-cream backdrop-blur transition hover:bg-ink-800"
            >
              {t("landing.secondaryCta")}
            </a>
          </div>

          <p className="rise mt-5 text-xs text-subtle" style={{ animationDelay: "220ms" }}>
            {t("landing.trust")}
          </p>

          <div className="rise mt-14" style={{ animationDelay: "280ms" }}>
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* why */}
      <section id="why" className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <h2 className="text-center font-display text-3xl text-cream text-balance">
          {t("landing.whyTitle")}
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            { k: "Market", t: t("landing.whyMarket"), d: t("landing.whyMarketDesc") },
            { k: "Orchestra", t: t("landing.whyOrchestra"), d: t("landing.whyOrchestraDesc") },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl border border-line bg-ink-900/50 p-7">
              <div className="font-display text-2xl accent-gradient-text">{x.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl text-cream text-balance">
            {t("landing.featuresTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted text-pretty">
            {t("landing.featuresSub")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* flow */}
      <section id="flow" className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8">
        <h2 className="text-center font-display text-3xl text-cream text-balance">
          {t("landing.flowTitle")}
        </h2>
        <div className="relative mt-12">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s.label} className="relative text-center">
                <div className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink-850 text-brand-300 shadow-card">
                  <s.icon size={18} />
                </div>
                <div className="mt-3 font-display text-sm text-cream">
                  <span className="text-subtle">{i + 1}. </span>
                  {s.label}
                </div>
                <div className="mt-1 text-xs text-muted">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-ink-900 p-10 text-center grain lg:p-16">
          <div className="glowfield opacity-90" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl text-cream text-balance lg:text-4xl">
              {t("landing.finalTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted text-pretty">
              {t("landing.finalSub")}
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/10 shadow-[0_12px_36px_-12px_rgba(94,106,210,0.9)] transition hover:bg-brand-500 active:scale-[.98]"
              >
                {t("landing.primaryCta")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-subtle sm:flex-row lg:px-8">
          <Logo size={26} />
          <p className="text-pretty">{t("landing.footer")}</p>
          <p>© {new Date().getFullYear()} Markestra</p>
        </div>
      </footer>
    </div>
  );
}
