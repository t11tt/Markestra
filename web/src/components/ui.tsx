"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "gray" | "amber" | "blue" | "green" | "red";

const toneMap: Record<Tone, string> = {
  gray: "bg-ink-700 text-muted ring-line",
  amber: "bg-warn/10 text-warn ring-warn/25",
  blue: "bg-cool/10 text-cool ring-cool/25",
  green: "bg-ok/10 text-ok ring-ok/25",
  red: "bg-bad/10 text-bad ring-bad/25",
};

export function Badge({
  tone = "gray",
  children,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneMap[tone]}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnMap: Record<BtnVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-[0_8px_24px_-12px_rgba(94,106,210,0.9)] ring-1 ring-inset ring-white/10 active:scale-[.98]",
  secondary:
    "bg-ink-800 text-cream ring-1 ring-inset ring-line hover:bg-ink-700 hover:ring-line-strong active:scale-[.98]",
  ghost: "text-muted hover:bg-ink-800 hover:text-cream active:scale-[.98]",
  danger: "bg-bad text-white hover:brightness-110 active:scale-[.98]",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md";
  icon?: ReactNode;
  href?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  href,
  className = "",
  children,
  ...rest
}: BtnProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-40 disabled:pointer-events-none ${
    size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm"
  } ${btnMap[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1 text-sm font-medium text-muted">
        {label}
        {required && <span className="text-brand-400">*</span>}
        {hint && <span className="font-normal text-subtle">· {hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2.5 text-sm text-cream placeholder:text-subtle outline-none transition focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`${inputBase} resize-y leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-9">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-7">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm text-subtle transition hover:text-cream"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-cream text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted text-pretty">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink-900/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 ring-1 ring-inset ring-brand-500/20">
        {icon}
      </div>
      <h3 className="font-display text-lg text-cream">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CampaignGlyph({ image }: { image?: string }) {
  if (image?.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="h-full w-full object-cover" />;
  }
  return image || "♪";
}

export function LanguageSwitcher({
  locale,
  setLocale,
  className = "",
}: {
  locale: "zh" | "en";
  setLocale: (l: "zh" | "en") => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-line bg-ink-900/60 p-0.5 text-xs ${className}`}
    >
      {(["zh", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2.5 py-1 font-medium transition ${
            locale === l
              ? "bg-brand-600 text-white"
              : "text-muted hover:text-cream"
          }`}
        >
          {l === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}
