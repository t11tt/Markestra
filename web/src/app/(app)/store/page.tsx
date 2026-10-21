"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, PageContainer, PageHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { ShopOrder, ShopOrderStatus } from "@/lib/types";

const STATUSES: ShopOrderStatus[] = ["placed", "preparing", "completed", "cancelled"];

function yuan(value: number) {
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

export default function StorePage() {
  const { t } = useI18n();
  const products = useStore((s) => s.products);
  const shopSlug = useStore((s) => s.shopSlug);
  const setProductListed = useStore((s) => s.setProductListed);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/orders");
    const body = (await res.json()) as ShopOrder[] | { error?: string };
    if (!res.ok || !Array.isArray(body)) {
      setError(t("store.loadError"));
      return;
    }
    setOrders(body);
    setError(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (id: string, status: ShopOrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await res.json()) as ShopOrder & { error?: string };
    if (!res.ok) {
      setError(body.error || t("store.loadError"));
      return;
    }
    void useStore.getState().load();
    setOrders((current) => current.map((order) => (order.id === id ? body : order)));
  };

  const openCount = orders.filter((order) => order.status === "placed" || order.status === "preparing").length;

  return (
    <PageContainer>
      <PageHeader
        title={t("store.title")}
        subtitle={t("store.subtitle")}
        actions={
          <Link href={shopSlug ? `/shop?slug=${encodeURIComponent(shopSlug)}` : "/shop"}>
            <Button icon={<ExternalLink size={16} />}>{t("store.open")}</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="p-5">
          <h2 className="font-display text-lg text-cream">{t("store.shelf")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("store.shelfHint")}</p>
          <div className="mt-4 space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => void setProductListed(product.id, !product.listed)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-left text-sm"
              >
                <span className="truncate text-cream">{product.name}</span>
                <span className={product.listed ? "text-ok" : "text-subtle"}>
                  {product.listed ? t("prod.listed") : t("prod.unlisted")}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-cream">{t("store.orders", { n: openCount })}</h2>
          </div>
          {orders.length === 0 ? (
            <Card className="p-8 text-sm text-muted">{t("store.empty")}</Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm text-brand-300">{order.code}</div>
                      <div className="mt-1 text-sm text-cream">
                        {order.customerName} · {order.phone}
                      </div>
                      <div className="mt-1 text-xs text-subtle">
                        {t(order.fulfillment === "delivery" ? "shop.delivery" : "shop.pickup")}
                        {order.address ? ` · ${order.address}` : ""}
                        {order.note ? ` · ${order.note}` : ""}
                      </div>
                    </div>
                    <Badge tone={order.status === "cancelled" ? "gray" : order.status === "completed" ? "green" : "blue"}>
                      {t(`store.status.${order.status}`)}
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.name}`}>
                        {item.name} × {item.qty} · {yuan(item.price * item.qty)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-cream">{yuan(order.total)}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={order.status === status || !({placed:["preparing","cancelled"],preparing:["completed","cancelled"],completed:[],cancelled:[]} as Record<string,string[]>)[order.status].includes(status)}
                          onClick={() => void setStatus(order.id, status)}
                          className={`rounded-lg px-2 py-1 text-xs ${
                            order.status === status
                              ? "bg-brand-500/15 text-brand-300"
                              : "bg-ink-800 text-muted hover:text-cream"
                          }`}
                        >
                          {t(`store.status.${status}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
