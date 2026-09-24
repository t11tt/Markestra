"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo, Mark } from "@/components/logo";
import { LineRhythm } from "@/components/line-rhythm";
import { Button, Field, Input, LanguageSwitcher } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const enter = (e?: React.FormEvent) => {
    e?.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-subtle transition hover:text-cream"
          >
            <ArrowLeft size={15} /> {t("login.back")}
          </Link>
          <LanguageSwitcher locale={locale} setLocale={setLocale} />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Logo size={34} />
          <h1 className="mt-8 font-display text-3xl text-cream text-balance">
            {t("login.title")}
          </h1>
          <p className="mt-2 text-sm text-muted text-pretty">{t("login.sub")}</p>

          <form onSubmit={enter} className="mt-8 space-y-4">
            <Field label={t("login.email")}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPh")}
              />
            </Field>
            <Field label={t("login.password")}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPh")}
              />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-line bg-ink-900 accent-[color:var(--color-brand-600)]"
                />
                {t("login.remember")}
              </label>
              <button type="button" className="text-brand-300 transition hover:text-brand-200">
                {t("login.forgot")}
              </button>
            </div>

            <Button type="submit" className="w-full" icon={<ArrowRight size={16} />}>
              {t("login.signin")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-subtle">
            <div className="h-px flex-1 bg-line" />
            {t("login.or")}
            <div className="h-px flex-1 bg-line" />
          </div>

          <Button variant="secondary" className="w-full" onClick={() => enter()}>
            {t("login.demo")}
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            {t("login.noAccount")}{" "}
            <button
              onClick={() => enter()}
              className="font-medium text-brand-300 transition hover:text-brand-200"
            >
              {t("login.signup")}
            </button>
          </p>
        </div>

        <p className="mx-auto max-w-sm text-center text-xs text-subtle">
          {t("login.terms")}
        </p>
      </div>

      {/* art side */}
      <div className="relative hidden overflow-hidden border-l border-line bg-ink-950 lg:block grain">
        <div className="glowfield opacity-90" />
        <LineRhythm className="absolute inset-0 h-full w-full opacity-80" />
        {/* vignette for depth */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent_40%,rgba(8,9,10,0.55)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Mark size={22} glow /> market · orchestra
          </div>

          <div>
            <div className="mb-6 flex h-9 items-end gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  className="eq-bar inline-block w-1 rounded-full bg-gradient-to-t from-brand-700 to-brand-300"
                  style={{ height: 36, animationDelay: `${i * 110}ms` }}
                />
              ))}
            </div>
            <p className="max-w-md font-display text-[26px] leading-snug text-cream text-balance">
              {t("login.quote")}
            </p>
          </div>

          <div className="text-sm text-subtle">Markestra</div>
        </div>
      </div>
    </div>
  );
}
