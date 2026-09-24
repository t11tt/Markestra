import { Prisma } from "@prisma/client";
import { genChannelContent } from "@/lib/mockAI";
import type { Channel, ChannelContent } from "@/lib/types";
import { prisma } from "./db";
import { DEMO_WORKSPACE_ID } from "./demo";
import { isChannel, mapCampaign } from "./map";

export const PROMPT_VERSION = "content-v1";

const CHANNELS: Channel[] = ["xiaohongshu", "moments", "douyin"];

export interface FactWarning {
  code: "original_price" | "unknown_price" | "gift" | "date";
  channel: Channel;
  detail?: string;
}

interface Snapshot {
  productName: string;
  productDetail: string;
  price: number;
  originalPrice: number | null;
  startDate: string;
  endDate: string;
  goal: string;
  channels: Channel[];
  brandName: string;
  address: string;
  style: string;
  audience: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function parseContents(value: unknown): ChannelContent[] | null {
  if (!value || typeof value !== "object") return null;
  const contents = (value as { contents?: unknown }).contents;
  if (!Array.isArray(contents)) return null;
  const parsed: ChannelContent[] = [];
  for (const item of contents) {
    if (!item || typeof item !== "object") return null;
    const row = item as Partial<ChannelContent>;
    if (!isChannel(row.channel)) return null;
    if (typeof row.title !== "string" || typeof row.body !== "string" || typeof row.cta !== "string") {
      return null;
    }
    if (!row.title.trim() || !row.body.trim()) return null;
    parsed.push({
      channel: row.channel,
      title: row.title.trim(),
      body: row.body.trim(),
      tags: Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [],
      cta: row.cta.trim(),
      confirmed: Boolean(row.confirmed),
    });
  }
  return parsed;
}

function asContents(value: unknown, expected: Channel[]): ChannelContent[] | null {
  const parsed = parseContents(value);
  if (!parsed) return null;
  if (expected.some((channel) => !parsed.some((item) => item.channel === channel))) return null;
  return parsed.filter((item) => expected.includes(item.channel));
}

export function checkFacts(contents: ChannelContent[], facts: Snapshot): FactWarning[] {
  const warnings: FactWarning[] = [];
  const source = [facts.productName, facts.productDetail, facts.brandName, facts.address].join("\n");
  const gifts = ["买一送一", "免费送", "赠品", "第二杯半价", "第二份免费"];
  for (const content of contents) {
    const text = `${content.title}\n${content.body}\n${content.cta}`;
    if (facts.originalPrice == null && text.includes("原价")) {
      warnings.push({ code: "original_price", channel: content.channel });
    }
    for (const match of text.matchAll(/[¥￥]\s*(\d+(?:\.\d+)?)/g)) {
      const price = Number(match[1]);
      const allowed = price === facts.price || (facts.originalPrice != null && price === facts.originalPrice);
      if (!allowed) {
        warnings.push({ code: "unknown_price", channel: content.channel, detail: match[1] });
      }
    }
    for (const gift of gifts) {
      if (text.includes(gift) && !source.includes(gift)) {
        warnings.push({ code: "gift", channel: content.channel, detail: gift });
      }
    }
    for (const date of text.match(/\d{4}-\d{2}-\d{2}/g) ?? []) {
      if (date !== facts.startDate && date !== facts.endDate) {
        warnings.push({ code: "date", channel: content.channel, detail: date });
      }
    }
  }
  return warnings;
}

function qwenTarget(key: string) {
  if (process.env.DASHSCOPE_BASE_URL) {
    return {
      base: process.env.DASHSCOPE_BASE_URL,
      model: process.env.DASHSCOPE_MODEL || "qwen-plus",
    };
  }
  if (key.startsWith("sk-ws-")) {
    return {
      base: "https://maas.qianwenaiapi.com/compatible-mode/v1",
      model: process.env.DASHSCOPE_MODEL || "qwen3.7-plus",
    };
  }
  return {
    base: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: process.env.DASHSCOPE_MODEL || "qwen-plus",
  };
}

function hideKey(text: string) {
  return text.replace(/sk-[A-Za-z0-9._=-]+/g, "sk-***");
}

async function callQwen(snapshot: Snapshot, channels: Channel[]): Promise<unknown> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) return null;
  const { base, model } = qwenTarget(key);
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(40000),
    body: JSON.stringify({
      model,
      temperature: 0.4,
      enable_thinking: false,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是餐饮商家的营销文案助手。只依据用户给出的事实写文案。不要编造赠品、折扣、原价或日期。价格必须与资料一致。只返回 JSON。",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: "先给出统一方案，再为每个渠道写文案。",
            facts: snapshot,
            channels,
            jsonShape: {
              plan: { audience: "", sellingPoints: [], theme: "", cta: "", missing: [] },
              contents: [{ channel: "xiaohongshu", title: "", body: "", tags: [], cta: "" }],
            },
          }),
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`千问请求失败（${response.status}）${hideKey(detail).slice(0, 180)}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content ?? "";
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

function mockContents(snapshot: Snapshot, channels: Channel[], seed: number): unknown {
  return {
    plan: { audience: snapshot.audience, theme: snapshot.productName, missing: [] },
    contents: channels.map((channel, index) =>
      genChannelContent(
        channel,
        {
          productName: snapshot.productName,
          productDetail: snapshot.productDetail,
          price: snapshot.price,
          originalPrice: snapshot.originalPrice ?? undefined,
          goal: snapshot.goal,
          brandName: snapshot.brandName,
          address: snapshot.address,
        },
        seed + index
      )
    ),
  };
}

async function loadCampaign(id: string) {
  return prisma.campaign.findFirst({
    where: { id, workspaceId: DEMO_WORKSPACE_ID },
    include: { workspace: { include: { brand: true } } },
  });
}

async function finishFromLatest(campaignId: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const running = await prisma.generation.findFirst({
      where: { campaignId, status: "running" },
    });
    if (!running) break;
    await sleep(500);
  }
  const latest = await prisma.generation.findFirst({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: DEMO_WORKSPACE_ID },
  });
  if (!campaign) throw new Error("找不到这个活动");
  if (latest?.status === "failed") throw new Error(latest.error || "生成失败");
  const warnings = Array.isArray((latest?.output as { warnings?: unknown } | null)?.warnings)
    ? ((latest?.output as { warnings: FactWarning[] }).warnings ?? [])
    : [];
  return {
    campaign: mapCampaign(campaign),
    warnings,
    model: latest?.model ?? "mock",
    generationId: latest?.id ?? "",
  };
}

export async function generateCampaign(campaignId: string, onlyChannel?: Channel) {
  await prisma.generation.updateMany({
    where: {
      campaignId,
      status: "running",
      createdAt: { lt: new Date(Date.now() - 90_000) },
    },
    data: { status: "failed", error: "生成超时" },
  });

  const campaign = await loadCampaign(campaignId);
  if (!campaign?.workspace.brand) throw new Error("找不到这个活动");

  const requested = (Array.isArray(campaign.channels) ? campaign.channels : []).filter(isChannel);
  const channels = onlyChannel ? requested.filter((channel) => channel === onlyChannel) : requested;
  if (channels.length === 0) throw new Error("没有可生成的渠道");

  const snapshot: Snapshot = {
    productName: campaign.productName,
    productDetail: campaign.productDetail,
    price: campaign.price,
    originalPrice: campaign.originalPrice,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    goal: campaign.goal,
    channels,
    brandName: campaign.workspace.brand.name,
    address: campaign.workspace.brand.address,
    style: campaign.workspace.brand.style,
    audience: campaign.workspace.brand.audience,
  };

  const modelName = process.env.DASHSCOPE_API_KEY
    ? qwenTarget(process.env.DASHSCOPE_API_KEY).model
    : "mock";

  let generation;
  try {
    generation = await prisma.generation.create({
      data: {
        campaignId,
        model: modelName,
        promptVersion: PROMPT_VERSION,
        inputSnapshot: snapshot,
        status: "running",
      },
    });
  } catch (error) {
    if (isUnique(error)) return finishFromLatest(campaignId);
    throw error;
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "generating" },
  });

  try {
    const raw = process.env.DASHSCOPE_API_KEY
      ? await callQwen(snapshot, channels)
      : mockContents(snapshot, channels, onlyChannel ? Date.now() % 7 : 0);
    const generated = asContents(raw, channels);
    if (!generated) throw new Error("模型返回的格式不正确");
    const warnings = checkFacts(generated, snapshot);
    const current = parseContents({ contents: campaign.contents }) ?? [];
    const merged = onlyChannel
      ? [
          ...current.filter((item) => item.channel !== onlyChannel),
          ...generated,
        ].sort((a, b) => channelsIndex(a.channel) - channelsIndex(b.channel))
      : generated;

    await prisma.$transaction([
      prisma.contentVersion.createMany({
        data: generated.map((content) => ({
          campaignId,
          channel: content.channel,
          title: content.title,
          body: content.body,
          tags: content.tags,
          cta: content.cta,
          confirmed: false,
          source: "generation",
          generationId: generation.id,
        })),
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: { contents: merged, status: "review" },
      }),
      prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: "succeeded",
          output: { plan: (raw as { plan?: unknown })?.plan ?? null, contents: generated, warnings },
        },
      }),
    ]);

    const saved = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    return {
      campaign: mapCampaign(saved),
      warnings,
      model: modelName,
      generationId: generation.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: "failed", error: message },
    });
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: currentStatusAfterFailure(campaign.contents) },
    });
    throw new Error(message);
  }
}

function channelsIndex(channel: Channel) {
  return CHANNELS.indexOf(channel);
}

function currentStatusAfterFailure(contents: unknown) {
  return Array.isArray(contents) && contents.length > 0 ? "review" : "draft";
}

export async function listVersions(campaignId: string, channel?: Channel) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, workspaceId: DEMO_WORKSPACE_ID },
    select: { id: true },
  });
  if (!campaign) return null;
  const rows = await prisma.contentVersion.findMany({
    where: { campaignId, ...(channel ? { channel } : {}) },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [],
    cta: row.cta,
    confirmed: row.confirmed,
    source: row.source,
    createdAt: row.createdAt.getTime(),
  }));
}

export async function restoreVersion(campaignId: string, versionId: string) {
  const version = await prisma.contentVersion.findFirst({
    where: { id: versionId, campaignId, campaign: { workspaceId: DEMO_WORKSPACE_ID } },
  });
  if (!version || !isChannel(version.channel)) return null;
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const current = parseContents({ contents: campaign.contents }) ?? [];
  const restored: ChannelContent = {
    channel: version.channel,
    title: version.title,
    body: version.body,
    tags: Array.isArray(version.tags) ? version.tags.filter((tag) => typeof tag === "string") : [],
    cta: version.cta,
    confirmed: false,
  };
  const contents = current.some((item) => item.channel === version.channel)
    ? current.map((item) => (item.channel === version.channel ? restored : item))
    : [...current, restored];
  const saved = await prisma.campaign.update({
    where: { id: campaignId },
    data: { contents, status: "review" },
  });
  return mapCampaign(saved);
}
