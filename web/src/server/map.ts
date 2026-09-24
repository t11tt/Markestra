import type { Brand, Campaign, Product } from "@prisma/client";
import type {
  Brand as BrandDto,
  Campaign as CampaignDto,
  CampaignGoal,
  CampaignStatus,
  CampaignType,
  Channel as ChannelId,
  ChannelContent as ContentDto,
  Product as ProductDto,
} from "@/lib/types";

const CHANNELS: ChannelId[] = ["xiaohongshu", "moments", "douyin"];
const GOALS: CampaignGoal[] = ["to_store", "orders", "inquiry", "trial"];
const TYPES: CampaignType[] = ["new_product", "combo", "festival"];
const STATUSES: CampaignStatus[] = ["draft", "generating", "review", "published"];

export function mapBrand(row: Brand): BrandDto {
  return {
    name: row.name,
    address: row.address,
    hours: row.hours,
    style: row.style,
    audience: row.audience,
  };
}

export function mapProduct(row: Product): ProductDto {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    description: row.description,
    image: row.image ?? undefined,
  };
}

function asChannels(value: unknown): ChannelId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is ChannelId => CHANNELS.includes(v as ChannelId));
}

function asContents(value: unknown): ContentDto[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<ContentDto>;
    if (!CHANNELS.includes(row.channel as ChannelId)) return [];
    if (typeof row.title !== "string" || typeof row.body !== "string") return [];
    return [
      {
        channel: row.channel as ChannelId,
        title: row.title,
        body: row.body,
        tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === "string") : [],
        cta: typeof row.cta === "string" ? row.cta : "",
        confirmed: Boolean(row.confirmed),
      },
    ];
  });
}

function asMetrics(value: unknown): CampaignDto["metrics"] {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const views = Number(row.views);
  const saves = Number(row.saves);
  const inquiries = Number(row.inquiries);
  if (![views, saves, inquiries].every(Number.isFinite)) return undefined;
  return { views, saves, inquiries };
}

export function mapCampaign(row: Campaign): CampaignDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: TYPES.includes(row.type as CampaignType) ? (row.type as CampaignType) : "combo",
    goal: GOALS.includes(row.goal as CampaignGoal) ? (row.goal as CampaignGoal) : "to_store",
    status: STATUSES.includes(row.status as CampaignStatus)
      ? (row.status as CampaignStatus)
      : "draft",
    productName: row.productName,
    productDetail: row.productDetail,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    startDate: row.startDate,
    endDate: row.endDate,
    channels: asChannels(row.channels),
    image: row.image ?? undefined,
    contents: asContents(row.contents),
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    metrics: asMetrics(row.metrics),
  };
}

export function isChannel(value: unknown): value is ChannelId {
  return CHANNELS.includes(value as ChannelId);
}

export function isGoal(value: unknown): value is CampaignGoal {
  return GOALS.includes(value as CampaignGoal);
}

export function isType(value: unknown): value is CampaignType {
  return TYPES.includes(value as CampaignType);
}

export function isStatus(value: unknown): value is CampaignStatus {
  return STATUSES.includes(value as CampaignStatus);
}

export function money(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}
