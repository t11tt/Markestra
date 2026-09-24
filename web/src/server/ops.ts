import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { DEMO_WORKSPACE_ID } from "./demo";
import { isChannel, mapCampaign } from "./map";

const METRICS = ["views", "saves", "inquiries"] as const;
type MetricName = (typeof METRICS)[number];

function isMetric(value: string): value is MetricName {
  return METRICS.includes(value as MetricName);
}

async function ownedCampaign(id: string) {
  return prisma.campaign.findFirst({
    where: { id, workspaceId: DEMO_WORKSPACE_ID },
  });
}

function dedupeKey(input: {
  campaignId: string;
  channel: string;
  metric: string;
  observedOn: string;
  window: string;
  demo: boolean;
}) {
  return [input.campaignId, input.channel, input.metric, input.observedOn, input.window, input.demo ? "demo" : "real"].join("|");
}

export async function readOps(campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: DEMO_WORKSPACE_ID },
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
      createdAt: row.createdAt.getTime(),
    })),
    publications: campaign.publications.map((row) => ({
      id: row.id,
      channel: row.channel,
      publishedAt: row.publishedAt.toISOString(),
      link: row.link,
      note: row.note,
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

export async function recordExport(campaignId: string, channels: string[]) {
  const campaign = await ownedCampaign(campaignId);
  if (!campaign) return null;
  const confirmed = (Array.isArray(campaign.contents) ? campaign.contents : []).filter(
    (row): row is { channel: string; title: string; body: string; confirmed: boolean } =>
      !!row &&
      typeof row === "object" &&
      isChannel((row as { channel?: string }).channel) &&
      (row as { confirmed?: boolean }).confirmed === true &&
      typeof (row as { title?: string }).title === "string" &&
      typeof (row as { body?: string }).body === "string"
  );
  const selected = channels.length
    ? confirmed.filter((row) => channels.includes(row.channel))
    : confirmed;
  if (selected.length === 0) throw new Error("确认全部渠道后才能导出");
  const saved = [];
  for (const item of selected) {
    saved.push(
      await prisma.exportRecord.create({
        data: {
          campaignId,
          channel: item.channel,
          title: item.title,
          body: item.body,
          price: campaign.price,
        },
      })
    );
  }
  return saved.map((row) => row.id);
}

export async function recordPublication(
  campaignId: string,
  input: { channel: string; publishedAt: string; link?: string; note?: string }
) {
  const campaign = await ownedCampaign(campaignId);
  if (!campaign || !isChannel(input.channel)) return null;
  const publishedAt = new Date(input.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) throw new Error("发布时间不正确");
  const row = await prisma.publication.create({
    data: {
      campaignId,
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
  const campaign = await ownedCampaign(campaignId);
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

export async function importMetrics(campaignId: string, csv: string) {
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
    const result = await addMetric(campaignId, {
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

function pickLatest(
  rows: { metric: string; observedOn: string; value: number; window: string; demo: boolean }[],
  metric: string,
  demo: boolean
) {
  const matching = rows.filter((row) => row.metric === metric && row.demo === demo);
  const cumulative = matching
    .filter((row) => row.window === "cumulative")
    .sort((a, b) => a.observedOn.localeCompare(b.observedOn));
  if (cumulative.length > 0) return cumulative[cumulative.length - 1].value;
  const interval = matching.filter((row) => row.window === "interval");
  if (interval.length === 0) return undefined;
  return interval.reduce((sum, row) => sum + row.value, 0);
}

export async function writeReview(campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: DEMO_WORKSPACE_ID },
    include: { metricEntries: true, publications: true },
  });
  if (!campaign) return null;
  const channels = (Array.isArray(campaign.channels) ? campaign.channels : []).filter(isChannel);
  const realBits: string[] = [];
  const missing: string[] = [];
  for (const channel of channels) {
    const rows = campaign.metricEntries.filter((row) => row.channel === channel);
    const views = pickLatest(rows, "views", false);
    const saves = pickLatest(rows, "saves", false);
    const inquiries = pickLatest(rows, "inquiries", false);
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

export async function createNextRound(campaignId: string) {
  const current = await ownedCampaign(campaignId);
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
