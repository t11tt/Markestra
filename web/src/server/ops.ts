import { Prisma } from "@prisma/client";
import type { ChannelContent } from "@/lib/types";
import { prisma } from "./db";
import { saveDataUrl } from "./files";
import { dedupeKey, realSummary } from "./metrics";
import { isChannel, mapCampaign } from "./map";

const METRICS = ["views", "saves", "inquiries"] as const;
type MetricName = (typeof METRICS)[number];

function isMetric(value: string): value is MetricName {
  return METRICS.includes(value as MetricName);
}

async function ownedCampaign(id: string, workspaceId: string) {
  return prisma.campaign.findFirst({
    where: { id, workspaceId },
  });
}

function asDrafts(value: unknown): ChannelContent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<ChannelContent>;
    if (!isChannel(row.channel)) return [];
    if (typeof row.title !== "string" || typeof row.body !== "string") return [];
    return [
      {
        channel: row.channel,
        title: row.title,
        body: row.body,
        tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
        cta: typeof row.cta === "string" ? row.cta : "",
        confirmed: row.confirmed === true,
        versionId: typeof row.versionId === "string" ? row.versionId : undefined,
      },
    ];
  });
}

async function confirmedVersion(campaignId: string, contents: ChannelContent[], channel: string) {
  const content = contents.find((item) => item.channel === channel && item.confirmed && item.versionId);
  if (!content?.versionId) throw new Error("请先确认这一版文案");
  const version = await prisma.contentVersion.findFirst({
    where: { id: content.versionId, campaignId, channel, confirmed: true },
  });
  if (!version || version.title !== content.title || version.body !== content.body) {
    throw new Error("确认的版本和当前文案不一致");
  }
  return version;
}

export async function readOps(campaignId: string, workspaceId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      exports: { orderBy: { createdAt: "desc" }, take: 20 },
      publications: { orderBy: { publishedAt: "desc" }, take: 20 },
      metricEntries: { orderBy: { observedOn: "desc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!campaign) return null;
  return {
    parent: campaign.parent,
    exports: campaign.exports.map((row) => ({
      id: row.id,
      channel: row.channel,
      title: row.title,
      price: row.price,
      versionId: row.versionId,
      posterFile: row.posterFile,
      createdAt: row.createdAt.getTime(),
    })),
    publications: campaign.publications.map((row) => ({
      id: row.id,
      channel: row.channel,
      publishedAt: row.publishedAt.toISOString(),
      link: row.link,
      note: row.note,
      versionId: row.versionId,
    })),
    metrics: campaign.metricEntries.map((row) => ({
      id: row.id,
      channel: row.channel,
      metric: row.metric,
      value: row.value,
      observedOn: row.observedOn,
      window: row.window,
      source: row.source,
      demo: row.demo,
    })),
    reviews: campaign.reviews.map((row) => ({
      id: row.id,
      observation: row.observation,
      limitation: row.limitation,
      suggestion: row.suggestion,
      basis: row.basis,
      createdAt: row.createdAt.getTime(),
    })),
  };
}

export async function recordExport(
  campaignId: string,
  workspaceId: string,
  items: { channel: string; png?: string }[]
) {
  const campaign = await ownedCampaign(campaignId, workspaceId);
  if (!campaign) return null;
  const confirmed = asDrafts(campaign.contents).filter((row) => row.confirmed);
  const selected = items.length
    ? confirmed.filter((row) => items.some((item) => item.channel === row.channel))
    : confirmed;
  if (selected.length === 0) throw new Error("确认全部渠道后才能导出");
  const saved = [];
  for (const item of selected) {
    const version = await confirmedVersion(campaignId, confirmed, item.channel);
    const png = items.find((entry) => entry.channel === item.channel)?.png;
    const posterFile = png ? await saveDataUrl(png) : null;
    saved.push(
      await prisma.exportRecord.create({
        data: {
          campaignId,
          versionId: version.id,
          channel: item.channel,
          title: version.title,
          body: version.body,
          price: campaign.price,
          posterFile,
        },
      })
    );
  }
  return saved.map((row) => row.id);
}

export async function recordPublication(
  campaignId: string,
  workspaceId: string,
  input: { channel: string; publishedAt: string; link?: string; note?: string }
) {
  const campaign = await ownedCampaign(campaignId, workspaceId);
  if (!campaign || !isChannel(input.channel)) return null;
  const publishedAt = new Date(input.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) throw new Error("发布时间不正确");
  const version = await confirmedVersion(campaignId, asDrafts(campaign.contents), input.channel);
  const row = await prisma.publication.create({
    data: {
      campaignId,
      versionId: version.id,
      channel: input.channel,
      publishedAt,
      link: input.link?.trim() || null,
      note: input.note?.trim() || null,
    },
  });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "published" },
  });
  return {
    id: row.id,
    campaign: mapCampaign(await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } })),
  };
}

export async function addMetric(
  campaignId: string,
  workspaceId: string,
  input: {
    channel: string;
    metric: string;
    value: number;
    observedOn: string;
    window: string;
    demo: boolean;
    source?: string;
  }
) {
  const campaign = await ownedCampaign(campaignId, workspaceId);
  if (!campaign || !isChannel(input.channel) || !isMetric(input.metric)) return null;
  if (!Number.isFinite(input.value) || input.value < 0) throw new Error("指标数值不正确");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.observedOn)) throw new Error("观察日期不正确");
  if (input.window !== "cumulative" && input.window !== "interval") throw new Error("统计口径不正确");
  const key = dedupeKey({
    campaignId,
    channel: input.channel,
    metric: input.metric,
    observedOn: input.observedOn,
    window: input.window,
    demo: input.demo,
  });
  const existing = await prisma.metricEntry.findUnique({ where: { dedupeKey: key } });
  if (existing) return { inserted: 0, skipped: 1 };
  await prisma.metricEntry.create({
    data: {
      campaignId,
      channel: input.channel,
      metric: input.metric,
      value: input.value,
      observedOn: input.observedOn,
      window: input.window,
      source: input.source || "manual",
      demo: input.demo,
      dedupeKey: key,
    },
  });
  return { inserted: 1, skipped: 0 };
}

export async function importMetrics(campaignId: string, workspaceId: string, csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV 至少要有表头和一行数据");
  const header = lines[0].split(",").map((cell) => cell.trim());
  const required = ["channel", "metric", "value", "observedOn", "window", "demo"];
  if (required.some((name) => !header.includes(name))) {
    throw new Error("CSV 表头需要 channel,metric,value,observedOn,window,demo");
  }
  let inserted = 0;
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((cell) => cell.trim());
    const row = Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
    const result = await addMetric(campaignId, workspaceId, {
      channel: row.channel,
      metric: row.metric,
      value: Number(row.value),
      observedOn: row.observedOn,
      window: row.window,
      demo: row.demo === "true" || row.demo === "1",
      source: "csv",
    });
    if (!result) throw new Error(`无法导入这一行：${line}`);
    inserted += result.inserted;
    skipped += result.skipped;
  }
  return { inserted, skipped };
}

function channelLabel(channel: string) {
  if (channel === "xiaohongshu") return "小红书";
  if (channel === "moments") return "朋友圈";
  if (channel === "douyin") return "抖音";
  return channel;
}

export async function writeReview(campaignId: string, workspaceId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId },
    include: { metricEntries: true, publications: true },
  });
  if (!campaign) return null;
  const channels = (Array.isArray(campaign.channels) ? campaign.channels : []).filter(isChannel);
  const figures = realSummary(channels, campaign.metricEntries);
  const realBits: string[] = [];
  const missing: string[] = [];
  for (const figure of figures) {
    const channel = figure.channel;
    const views = figure.views;
    const saves = figure.saves;
    const inquiries = figure.inquiries;
    if (views == null && saves == null && inquiries == null) {
      missing.push(`${channelLabel(channel)} 还没有真实结果`);
      continue;
    }
    realBits.push(
      `${channelLabel(channel)}：阅读 ${views ?? "未获得"}，收藏 ${saves ?? "未获得"}，询问 ${inquiries ?? "未获得"}`
    );
    if (inquiries == null) missing.push(`${channelLabel(channel)} 没有询问或到店记录，不能判断转化`);
  }
  const demoCount = campaign.metricEntries.filter((row) => row.demo).length;
  const observation =
    realBits.length > 0
      ? realBits.join("。") + "。"
      : "还没有可引用的真实结果。";
  const limitation = [
    missing.length > 0 ? `${missing.join("。")}。` : "",
    demoCount > 0 ? `另有 ${demoCount} 条演示数据，不和真实结果混在一起计算。` : "",
    campaign.publications.length === 0 ? "还没有发布记录，无法把结果对应到某一次发布。" : "",
  ]
    .filter(Boolean)
    .join("");
  const suggestion =
    realBits.length === 0
      ? "下一轮先发布并记录一个渠道的阅读和询问，再比较文案。"
      : "下一轮只改行动提示，其他资料保持不变，并继续记录询问数。";
  const basis = campaign.metricEntries
    .filter((row) => !row.demo)
    .map((row) => `${row.channel}/${row.metric}/${row.observedOn}=${row.value}`)
    .join(", ");
  const note = await prisma.reviewNote.create({
    data: {
      campaignId,
      observation,
      limitation: limitation || "数据口径已按累计值取最新一条、区间值相加。",
      suggestion,
      basis: basis || "无真实指标",
    },
  });
  return {
    id: note.id,
    observation: note.observation,
    limitation: note.limitation,
    suggestion: note.suggestion,
    basis: note.basis,
    createdAt: note.createdAt.getTime(),
  };
}

function campaignCode() {
  return `MK-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function createNextRound(campaignId: string, workspaceId: string) {
  const current = await ownedCampaign(campaignId, workspaceId);
  if (!current) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.campaign.create({
        data: {
          workspaceId: current.workspaceId,
          code: campaignCode(),
          name: `${current.name} · 下一轮`,
          type: current.type,
          goal: current.goal,
          status: "draft",
          productId: current.productId,
          productName: current.productName,
          productDetail: current.productDetail,
          price: current.price,
          originalPrice: current.originalPrice,
          startDate: current.startDate,
          endDate: current.endDate,
          channels: current.channels as Prisma.InputJsonValue,
          image: current.image,
          images: current.images as Prisma.InputJsonValue,
          category: current.category,
          offer: current.offer,
          intent: current.intent,
          contents: [],
          parentId: current.id,
        },
      });
      return mapCampaign(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 4) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("创建下一轮失败");
}
