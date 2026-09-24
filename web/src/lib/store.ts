"use client";

import { create } from "zustand";
import { Brand, Campaign, Product } from "./types";

const emptyBrand: Brand = {
  name: "",
  address: "",
  hours: "",
  style: "",
  audience: "",
};

type CampaignPatch = Partial<Campaign>;
const pendingCampaigns = new Map<string, CampaignPatch>();
const campaignTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error || "请求失败");
  return body as T;
}

async function flushCampaign(id: string) {
  const patch = pendingCampaigns.get(id);
  if (!patch) return;
  pendingCampaigns.delete(id);
  try {
    await api(`/api/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    useStore.setState({ error: null });
  } catch (error) {
    useStore.setState({
      error: error instanceof Error ? error.message : "保存活动失败",
    });
  }
}

function queueCampaignSave(id: string, patch: CampaignPatch) {
  pendingCampaigns.set(id, { ...pendingCampaigns.get(id), ...patch });
  const existing = campaignTimers.get(id);
  if (existing) clearTimeout(existing);
  const immediate = patch.status !== undefined || patch.metrics !== undefined;
  const timer = setTimeout(() => {
    campaignTimers.delete(id);
    void flushCampaign(id);
  }, immediate ? 0 : 350);
  campaignTimers.set(id, timer);
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    for (const id of pendingCampaigns.keys()) {
      const timer = campaignTimers.get(id);
      if (timer) clearTimeout(timer);
      campaignTimers.delete(id);
      void flushCampaign(id);
    }
  });
}

export interface AppState {
  hydrated: boolean;
  error: string | null;
  brand: Brand;
  products: Product[];
  campaigns: Campaign[];
  load: () => Promise<void>;
  updateBrand: (b: Partial<Brand>) => Promise<boolean>;
  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addCampaign: (
    c: Omit<Campaign, "id" | "code" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateCampaign: (id: string, patch: CampaignPatch) => void;
  replaceCampaign: (campaign: Campaign) => void;
  removeCampaign: (id: string) => Promise<void>;
  getCampaign: (id: string) => Campaign | undefined;
}

export const useStore = create<AppState>()((set, get) => ({
  hydrated: false,
  error: null,
  brand: emptyBrand,
  products: [],
  campaigns: [],
  load: async () => {
    try {
      const data = await api<{
        brand: Brand;
        products: Product[];
        campaigns: Campaign[];
      }>("/api/state");
      window.localStorage.removeItem("markestra-store-v1");
      set({ ...data, hydrated: true, error: null });
    } catch (error) {
      set({
        hydrated: false,
        error: error instanceof Error ? error.message : "读取工作区失败",
      });
    }
  },
  updateBrand: async (b) => {
    const next = { ...get().brand, ...b };
    try {
      const brand = await api<Brand>("/api/brand", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      set({ brand, error: null });
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "保存店铺资料失败" });
      return false;
    }
  },
  addProduct: async (p) => {
    try {
      const product = await api<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(p),
      });
      set((s) => ({ products: [product, ...s.products], error: null }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "保存商品失败" });
    }
  },
  removeProduct: async (id) => {
    const previous = get().products;
    set({ products: previous.filter((p) => p.id !== id) });
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      set({ error: null });
    } catch (error) {
      set({
        products: previous,
        error: error instanceof Error ? error.message : "删除商品失败",
      });
    }
  },
  addCampaign: async (c) => {
    try {
      const campaign = await api<Campaign>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(c),
      });
      set((s) => ({ campaigns: [campaign, ...s.campaigns], error: null }));
      return campaign.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "创建活动失败" });
      return "";
    }
  },
  updateCampaign: (id, patch) => {
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      ),
    }));
    queueCampaignSave(id, patch);
  },
  replaceCampaign: (campaign) => {
    const timer = campaignTimers.get(campaign.id);
    if (timer) clearTimeout(timer);
    campaignTimers.delete(campaign.id);
    pendingCampaigns.delete(campaign.id);
    set((state) => ({
      campaigns: state.campaigns.some((item) => item.id === campaign.id)
        ? state.campaigns.map((item) => (item.id === campaign.id ? campaign : item))
        : [campaign, ...state.campaigns],
      error: null,
    }));
  },
  removeCampaign: async (id) => {
    const timer = campaignTimers.get(id);
    if (timer) clearTimeout(timer);
    campaignTimers.delete(id);
    pendingCampaigns.delete(id);
    const previous = get().campaigns;
    set({ campaigns: previous.filter((c) => c.id !== id) });
    try {
      await api(`/api/campaigns/${id}`, { method: "DELETE" });
      set({ error: null });
    } catch (error) {
      set({
        campaigns: previous,
        error: error instanceof Error ? error.message : "删除活动失败",
      });
    }
  },
  getCampaign: (id) => get().campaigns.find((c) => c.id === id),
}));
