"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button, Field, Input } from "@/components/ui";
import { isPhotoSrc } from "@/lib/image";
import type { ShopCatalog, ShopFulfillment, ShopOrder, ShopProduct } from "@/lib/types";

function yuan(value: number) {
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function Mark({ image }: { image?: string }) {
  if (isPhotoSrc(image)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" className="h-full w-full object-cover" />
    );
  }
  return <span className="text-3xl">{image || "·"}</span>;
}

export default function ShopPage() {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<ShopFulfillment>("pickup");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [slug] = useState(() => {
    if (typeof window === "undefined") return "shiguang";
    return new URLSearchParams(window.location.search).get("slug") || "shiguang";
  });

  useEffect(() => {
    void fetch(`/api/shop?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const body = (await res.json()) as ShopCatalog & { error?: string };
        if (!res.ok) throw new Error(body.error || t("shop.loadError"));
        setCatalog(body);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t("shop.loadError"));
      });
  }, [slug, t]);

  const lines = useMemo(() => {
    if (!catalog) return [];
    return catalog.products
      .map((product) => ({ product, qty: qty[product.id] ?? 0 }))
      .filter((line) => line.qty > 0);
  }, [catalog, qty]);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);

  const change = (product: ShopProduct, next: number) => {
    setQty((current) => ({ ...current, [product.id]: Math.max(0, Math.min(99, next)) }));
  };

  const submit = async () => {
    if (!catalog || lines.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          fulfillment,
          address,
          slug,
          note,
          items: lines.map((line) => ({ productId: line.product.id, qty: line.qty })),
        }),
      });
      const body = (await res.json()) as ShopOrder & { error?: string };
      if (!res.ok) throw new Error(body.error || t("shop.orderError"));
      setOrder(body);
      setQty({});
    } catch (err) {
      setError(err instanceof Error ? err.message : t("shop.orderError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mk-skin min-h-screen bg-canvas text-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <div>
            <div className="text-xs font-medium text-brand-300">{t("shop.kicker")}</div>
            <h1 className="font-display text-lg text-cream">{catalog?.brand.name || t("shop.loading")}</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-muted transition hover:text-cream">
            {t("shop.backstage")}
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <section>
          {catalog && (
            <p className="text-sm text-muted">
              {catalog.brand.address}
              <span className="px-2 text-subtle">/</span>
              {catalog.brand.hours}
            </p>
          )}
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t("shop.intro")}</p>

          {error && (
            <p className="mt-4 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
          )}

          <div className="mt-6 space-y-3">
            {catalog?.products.map((product) => {
              const current = qty[product.id] ?? 0;
              return (
                <article key={product.id} className="card flex gap-4 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-800 text-3xl ring-1 ring-inset ring-line">
                    <Mark image={product.image} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-cream">{product.name}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{product.description}</p>
                    {product.offer && (
                      <p className="mt-1 text-xs text-brand-300">
                        {t("shop.offer", { name: product.offer.name, date: product.offer.endDate })}
                      </p>
                    )}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-brand-300">{yuan(product.price)}</span>
                      {product.compareAt != null && (
                        <span className="text-sm text-subtle line-through">{yuan(product.compareAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-center">
                    <button
                      type="button"
                      aria-label={t("shop.less")}
                      onClick={() => change(product, current - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-800 text-muted transition hover:text-cream"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm tabular-nums text-cream">{current}</span>
                    <button
                      type="button"
                      aria-label={t("shop.more")}
                      onClick={() => change(product, current + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white ring-1 ring-inset ring-white/10 transition hover:bg-brand-500"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
            {catalog && catalog.products.length === 0 && (
              <p className="py-10 text-sm text-muted">{t("shop.empty")}</p>
            )}
          </div>
        </section>

        <aside id="checkout" className="card h-fit p-5 lg:sticky lg:top-24">
          {order ? (
            <div>
              <div className="text-xs font-medium text-subtle">{t("shop.placed")}</div>
              <div className="mt-1 font-mono text-lg text-brand-300">{order.code}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("shop.placedHint")}</p>
              <ul className="mt-4 space-y-1 text-sm text-cream">
                {order.items.map((item) => (
                  <li key={item.name} className="flex justify-between gap-3">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span>{yuan(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold text-cream">
                <span>{t("shop.total")}</span>
                <span>{yuan(order.total)}</span>
              </div>
              <button
                type="button"
                onClick={() => setOrder(null)}
                className="mt-4 text-sm font-medium text-brand-300 transition hover:text-brand-200"
              >
                {t("shop.another")}
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-cream">
                <ShoppingBag size={16} className="text-brand-300" />
                {t("shop.cart", { n: count })}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex justify-between gap-3">
                    <span>
                      {line.product.name} × {line.qty}
                    </span>
                    <span className="text-cream">{yuan(line.product.price * line.qty)}</span>
                  </li>
                ))}
                {lines.length === 0 && <li>{t("shop.cartEmpty")}</li>}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-semibold text-cream">
                <span>{t("shop.total")}</span>
                <span>{yuan(total)}</span>
              </div>

              <Field label={t("shop.name")}>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <div className="mt-3">
                <Field label={t("shop.phone")}>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                </Field>
              </div>
              <div className="mt-3 flex gap-2">
                {(["pickup", "delivery"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFulfillment(mode)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      fulfillment === mode
                        ? "bg-brand-600 text-white ring-1 ring-inset ring-white/10"
                        : "bg-ink-800 text-muted ring-1 ring-inset ring-line hover:text-cream"
                    }`}
                  >
                    {t(mode === "pickup" ? "shop.pickup" : "shop.delivery")}
                  </button>
                ))}
              </div>
              {fulfillment === "delivery" && (
                <div className="mt-3">
                  <Field label={t("shop.address")}>
                    <Input value={address} onChange={(event) => setAddress(event.target.value)} />
                  </Field>
                </div>
              )}
              <div className="mt-3">
                <Field label={t("shop.note")}>
                  <Input value={note} onChange={(event) => setNote(event.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={busy || count === 0} className="mt-4 w-full">
                {busy ? t("shop.submitting") : t("shop.submit")}
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-subtle">{t("shop.payNote")}</p>
            </form>
          )}
        </aside>
      </main>
    </div>
  );
}
