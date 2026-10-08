"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo, Mark } from "@/components/logo";
import { PageAurora } from "@/components/page-aurora";
import { LineRhythm } from "@/components/line-rhythm";
import { Button, Field, Input, LanguageSwitcher } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (path: string, payload: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "登录失败");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  };

  const enter = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === "signup") {
      void submit("/api/auth/signup", { shopName, email, password });
      return;
    }
    void submit("/api/auth/login", { email, password });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PageAurora className="page-aurora-pane" />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
      <div className="login-seam hidden lg:block" aria-hidden />
      {/* form side */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
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
            {mode === "signup" && (
              <Field label={t("login.shopName")}>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t("login.shopNamePh")}
                />
              </Field>
            )}
            <Field label={t("login.email")}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPh")}
              />
            </Field>
            <Field label={t("login.password")} hint={mode === "signup" ? t("login.passwordHint") : undefined}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPh")}
              />
            </Field>
            {error && <p className="text-sm text-bad">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy} icon={<ArrowRight size={16} />}>
              {mode === "signup" ? t("login.create") : t("login.signin")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-subtle">
            <div className="h-px flex-1 bg-line" />
            {t("login.or")}
            <div className="h-px flex-1 bg-line" />
          </div>

          <Button variant="secondary" className="w-full" disabled={busy} onClick={() => void submit("/api/auth/demo", {})}>
            {t("login.demo")}
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "signup" ? t("login.haveAccount") : t("login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
              }}
              className="font-medium text-brand-300 transition hover:text-brand-200"
            >
              {mode === "signup" ? t("login.backToSignin") : t("login.signup")}
            </button>
          </p>
        </div>

        <p className="mx-auto max-w-sm text-center text-xs text-subtle">
          {t("login.terms")}
        </p>
      </div>

      {/* art side */}
      <div className="relative hidden lg:block">
        <LineRhythm className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
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
    </div>
  );
}
