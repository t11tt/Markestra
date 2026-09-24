// Core domain types for Markestra (frontend-only mock model)

export type Channel = "xiaohongshu" | "moments" | "douyin";

// Labels are resolved via i18n keys: `channel.<id>`, `goal.<id>`, `type.<id>`, `status.<id>`.
export const CHANNELS: { id: Channel; short: string; color: string }[] = [
  { id: "xiaohongshu", short: "红", color: "#ff2442" },
  { id: "moments", short: "微", color: "#07c160" },
  { id: "douyin", short: "抖", color: "#c9a24b" },
];

export type CampaignGoal = "to_store" | "orders" | "inquiry" | "trial";

export const GOALS: { id: CampaignGoal }[] = [
  { id: "to_store" },
  { id: "orders" },
  { id: "inquiry" },
  { id: "trial" },
];

export type CampaignType = "new_product" | "combo" | "festival";

export const CAMPAIGN_TYPES: { id: CampaignType; emoji: string }[] = [
  { id: "new_product", emoji: "🆕" },
  { id: "combo", emoji: "🍱" },
  { id: "festival", emoji: "🎉" },
];

export type CampaignStatus = "draft" | "generating" | "review" | "published";

export const STATUS_META: Record<
  CampaignStatus,
  { tone: "gray" | "amber" | "blue" | "green" }
> = {
  draft: { tone: "gray" },
  generating: { tone: "amber" },
  review: { tone: "blue" },
  published: { tone: "green" },
};

export interface Brand {
  name: string;
  address: string;
  hours: string;
  style: string; // 品牌风格 / 语气
  audience: string; // 目标受众
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image?: string; // dataURL or emoji
}

export interface ChannelContent {
  channel: Channel;
  title: string;
  body: string;
  tags: string[];
  cta: string;
  confirmed: boolean;
}

export interface Campaign {
  id: string;
  code: string; // 活动编号
  name: string;
  type: CampaignType;
  goal: CampaignGoal;
  status: CampaignStatus;
  productName: string;
  productDetail: string;
  price: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  channels: Channel[];
  image?: string;
  contents: ChannelContent[];
  createdAt: number;
  updatedAt: number;
  // simple result metrics (mock)
  metrics?: { views: number; saves: number; inquiries: number };
}
