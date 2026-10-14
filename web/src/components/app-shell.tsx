"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  Megaphone,
  Package,
  Store,
  ShoppingBag,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/ui";

const nav = [
  { href: "/dashboard", key: "nav.overview", icon: LayoutGrid, exact: true },
  { href: "/campaigns", key: "nav.campaigns", icon: Megaphone },
  { href: "/products", key: "nav.products", icon: Package },
  { href: "/store", key: "nav.store", icon: ShoppingBag },
  { href: "/brand", key: "nav.brand", icon: Store },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const root = navRef.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>("[data-active='true']");
      if (!active) {
        setPill(null);
        return;
      }
      const rootBox = root.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      const pad = Number.parseFloat(getComputedStyle(root).paddingTop) || 0;
      setPill({ top: box.top - rootBox.top - pad, height: box.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  return (
    <div className="relative z-10 flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo className="h-9" />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/campaigns/new"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(94,106,210,0.9)] ring-1 ring-inset ring-white/10 transition hover:bg-brand-500 active:scale-[.98]"
        >
          <Plus size={16} /> {t("nav.create")}
        </Link>
      </div>

      <nav ref={navRef} className="relative flex-1 space-y-1 px-3 py-2">
        {pill && (
          <span className="nav-liquid" style={{ top: pill.top, height: pill.height }} />
        )}
        {nav.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active ? "true" : "false"}
              onClick={onNavigate}
              className={`group relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "text-cream" : "text-muted hover:text-cream"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-brand-200" : "text-subtle group-hover:text-muted"}
              />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-semibold text-cream">
            <span className="flex h-1.5 items-end gap-0.5">
              <span className="eq-bar inline-block h-2 w-0.5 bg-brand-400" style={{ animationDelay: "0ms" }} />
              <span className="eq-bar inline-block h-3 w-0.5 bg-brand-400" style={{ animationDelay: "150ms" }} />
              <span className="eq-bar inline-block h-1.5 w-0.5 bg-brand-400" style={{ animationDelay: "300ms" }} />
            </span>
            {t("nav.quota")}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {t("nav.quotaUsed", { used: 12, total: 50 })}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
            <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const brand = useStore((s) => s.brand);
  const email = useStore((s) => s.email);
  const hydrated = useStore((s) => s.hydrated);
  const error = useStore((s) => s.error);
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void useStore.getState().load();
  }, []);

  if (!hydrated) {
    return (
      <div className="mk-skin app-stage flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted">{error ?? "正在读取工作区…"}</p>
        {error && (
          <button
            onClick={() => void useStore.getState().load()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mk-skin app-stage relative flex min-h-screen">
      <aside className="app-glass sticky top-0 z-20 hidden h-screen w-64 shrink-0 overflow-hidden border-r border-white/10 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="app-glass absolute left-0 top-0 h-full w-64 overflow-hidden border-r border-white/10 shadow-xl animate-in">
            <button
              className="absolute right-3 top-4 rounded-lg p-1.5 text-subtle hover:bg-ink-800"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="app-glass relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 backdrop-blur-xl lg:px-6">
          <button
            className="rounded-lg p-2 text-muted hover:bg-ink-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-1 items-center justify-end gap-2">
            <LanguageSwitcher locale={locale} setLocale={setLocale} />
            <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-300 to-brand-600 font-display text-sm font-bold text-white">
                {brand.name.slice(0, 1)}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <div className="text-sm font-semibold text-cream">
                  {brand.name}
                </div>
                <div className="text-[11px] text-subtle">
                  {email || t("nav.workspace")}
                </div>
              </div>
            </div>
            <button
              className="rounded-lg p-2 text-muted transition hover:bg-ink-800 hover:text-cream"
              title={t("nav.signOut")}
              onClick={() => {
                void fetch("/api/auth/logout", { method: "POST" }).then(() => {
                  router.push("/login");
                  router.refresh();
                });
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {error && (
          <div className="border-b border-bad/30 bg-bad/10 px-4 py-2 text-sm text-bad lg:px-6">
            {error}
          </div>
        )}
        <main className="flex-1">
          <div key={pathname} className="page-rise">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
