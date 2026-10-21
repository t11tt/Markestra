"use client";

import { useState } from "react";
import { Package, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageContainer,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { readPhotoFile } from "@/lib/photos";
import type { Product } from "@/lib/types";
import { isPhotoSrc } from "@/lib/image";

const EMOJI = ["🍱", "☕", "🥮", "🍰", "🍜", "🍔", "🧋", "🎁"];

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);
  const setProductListed = useStore((s) => s.setProductListed);
  const { t } = useI18n();

  const [editing, setEditing] = useState<string | null>(null);
  const [stock, setStock] = useState("100");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [original, setOriginal] = useState("");
  const [emoji, setEmoji] = useState("🍱");

  const reset = () => {
    setEditing(null);
    setStock("100");
    setFormError("");
    setName("");
    setDesc("");
    setPrice("");
    setOriginal("");
    setEmoji("🍱");
    setOpen(false);
  };

  const editProduct = (product:Product) => {
    setEditing(product.id); setName(product.name); setDesc(product.description);setPrice(String(product.price));setOriginal(product.originalPrice == null ? "":String(product.originalPrice));setEmoji(product.image || "🍱");setStock(String(product.stock));setFormError("");setOpen(true);
  };
  const save = async () => {
    if(saving) return;
    if(!name.trim() || !price || !Number.isFinite(Number(price)) || Number(price)<0 || !Number.isSafeInteger(Number(stock)) || Number(stock)<0) {setFormError("请填写名称、有效价格和非负整数库存");return;}
    setSaving(true);
    const data={ name:name.trim(),description:desc.trim(),price:Number(price),originalPrice:original ? Number(original):undefined,image:emoji,stock:Number(stock) };
    if(editing) await updateProduct(editing,{...data,originalPrice:original ? Number(original):null}); else await addProduct(data);
    setSaving(false);
    const error=useStore.getState().error;
    if(error) setFormError(error); else reset();
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("prod.title")}
        subtitle={t("prod.subtitle")}
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
            {t("prod.add")}
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title={t("prod.emptyTitle")}
          desc={t("prod.emptyDesc")}
          action={
            <Button onClick={() => setOpen(true)} icon={<Plus size={16} />}>
              {t("prod.add")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="group overflow-hidden">
              <div className={`product-art flex aspect-[16/10] items-center justify-center text-6xl ${isPhotoSrc(p.image) ? "has-photo" : ""}`}>
                {isPhotoSrc(p.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  p.image
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-cream">{p.name}</h3>
                  <button
                    onClick={() => removeProduct(p.id)}
                    className="rounded-lg p-1.5 text-subtle opacity-0 transition hover:bg-bad/10 hover:text-bad group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs"><span className={p.stock ? "text-muted":"text-bad"}>库存 {p.stock}</span><button onClick={() => editProduct(p)} className="text-brand-300">编辑商品</button></div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-brand-300">¥{p.price}</span>
                    {p.originalPrice && (
                      <span className="text-sm text-subtle line-through">¥{p.originalPrice}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void setProductListed(p.id, !p.listed)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      p.listed
                        ? "bg-ok/10 text-ok ring-ok/20"
                        : "bg-ink-800 text-subtle ring-line"
                    }`}
                  >
                    {p.listed ? t("prod.listed") : t("prod.unlisted")}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={reset} />
          <Card className="relative z-10 w-full max-w-lg animate-in p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-cream">{editing ? "编辑商品" : t("prod.modalTitle")}</h2>
              <button onClick={reset} className="rounded-lg p-1.5 text-subtle hover:bg-ink-800">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-sm font-medium text-muted">{t("prod.icon")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-ink-800 ${
                        emoji === e ? "bg-brand-500/10 ring-1 ring-brand-500/40" : ""
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="商品实拍"><Input type="file" accept="image/*" onChange={async(e) => { const file=e.target.files?.[0];if(!file) return; try {setEmoji(await readPhotoFile(file));} catch {setFormError("图片读取失败，请重试");} }} /></Field>
              <Field label="可售库存" required><Input type="number" min={0} max={1000000} step={1} value={stock} onChange={(e)=>setStock(e.target.value)} /></Field>
              {formError && <p className="text-sm text-bad">{formError}</p>}
              <Field label={t("prod.name")} required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("prod.namePh")} />
              </Field>
              <Field label={t("prod.desc")}>
                <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("prod.descPh")} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("prod.price")} required>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="68" />
                </Field>
                <Field label={t("prod.original")} hint={t("common.optional")}>
                  <Input type="number" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="88" />
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={reset}>
                {t("common.cancel")}
              </Button>
              <Button onClick={save} disabled={saving || !name.trim() || !price}>
                {t("prod.saveProduct")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
