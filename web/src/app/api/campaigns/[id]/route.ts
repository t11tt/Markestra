import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { revokeConfirmedDrafts, syncChannelDrafts } from "@/server/content";
import { factsChanged } from "@/server/drafts";
import { ImageError, persistImage } from "@/server/files";
import { asRecord, jsonError, readJson } from "@/server/http";
import { isStatus, mapCampaign, money } from "@/server/map";
import { currentActor } from "@/server/session";
import type { ChannelContent } from "@/lib/types";
import { isPosterStyle } from "@/lib/poster-templates";

export const dynamic = "force-dynamic";

function asContents(value: unknown): ChannelContent[] | null {
  if (!Array.isArray(value)) return null;
  const contents: ChannelContent[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Partial<ChannelContent>;
    if (row.channel !== "xiaohongshu" && row.channel !== "moments" && row.channel !== "douyin") {
      return null;
    }
    if (typeof row.title !== "string" || typeof row.body !== "string" || typeof row.cta !== "string") {
      return null;
    }
    contents.push({
      channel: row.channel,
      title: row.title,
      body: row.body,
      tags: Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [],
      cta: row.cta,
      confirmed: Boolean(row.confirmed),
      versionId: typeof row.versionId === "string" ? row.versionId : undefined,
    });
  }
  return contents;
}

function asMetrics(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const views = Number(row.views);
  const saves = Number(row.saves);
  const inquiries = Number(row.inquiries);
  if (![views, saves, inquiries].every((n) => Number.isFinite(n) && n >= 0)) return undefined;
  return { views, saves, inquiries };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const { id } = await context.params;
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const data: Prisma.CampaignUpdateInput = {};
  if ("posterStyle" in body) {
    if (!isPosterStyle(body.posterStyle)) return jsonError("海报模板不正确");
    data.posterStyle = body.posterStyle;
  }
  let nextContents: ChannelContent[] | undefined;
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (isStatus(body.status)) data.status = body.status;
  if ("contents" in body) {
    const contents = asContents(body.contents);
    if (!contents) return jsonError("文案格式不正确");
    nextContents = contents;
  }
  if ("metrics" in body) {
    const metrics = asMetrics(body.metrics);
    if (!metrics) return jsonError("结果数据格式不正确");
    data.metrics = metrics;
  }
  if (typeof body.productName === "string") data.productName = body.productName.trim();
  if (typeof body.productDetail === "string") data.productDetail = body.productDetail.trim();
  if ("price" in body) {
    const price = money(body.price);
    if (price === undefined) return jsonError("请填写有效价格");
    data.price = price;
  }
  if ("originalPrice" in body) {
    if (body.originalPrice == null || body.originalPrice === "") data.originalPrice = null;
    else {
      const originalPrice = money(body.originalPrice);
      if (originalPrice === undefined) return jsonError("原价格式不正确");
      data.originalPrice = originalPrice;
    }
  }
  if (typeof body.startDate === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) return jsonError("开始日期不正确");
    data.startDate = body.startDate;
  }
  if (typeof body.endDate === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.endDate)) return jsonError("结束日期不正确");
    data.endDate = body.endDate;
  }
  if (typeof body.image === "string") {
    try {
      data.image = await persistImage(body.image);
    } catch (error) {
      if (error instanceof ImageError) return jsonError(error.message);
      throw error;
    }
  }

  if (Object.keys(data).length === 0 && !nextContents) return jsonError("没有可保存的修改");

  try {
    const existing = await prisma.campaign.findFirst({
      where: { id, workspaceId: actor.workspaceId },
    });
    if (!existing) return jsonError("找不到这个活动", 404);
    if (nextContents) {
      nextContents = await syncChannelDrafts(id, nextContents);
    }
    const price = typeof data.price === "number" ? data.price : existing.price;
    const originalPrice =
      data.originalPrice === null
        ? null
        : typeof data.originalPrice === "number"
          ? data.originalPrice
          : existing.originalPrice;
    const startDate = typeof data.startDate === "string" ? data.startDate : existing.startDate;
    const endDate = typeof data.endDate === "string" ? data.endDate : existing.endDate;
    if (
      factsChanged(
        {
          price: existing.price,
          originalPrice: existing.originalPrice,
          startDate: existing.startDate,
          endDate: existing.endDate,
        },
        { price, originalPrice, startDate, endDate }
      )
    ) {
      const base = nextContents ?? asContents(existing.contents) ?? [];
      nextContents = await revokeConfirmedDrafts(id, base);
    }
    if (nextContents) data.contents = nextContents as unknown as Prisma.InputJsonValue;
    const campaign = await prisma.campaign.update({ where: { id }, data });
    return Response.json(mapCampaign(campaign));
  } catch (error) {
    console.error(error);
    return jsonError("保存活动失败", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const actor = await currentActor();
    if (!actor) return jsonError("请先登录", 401);
    const existing = await prisma.campaign.findFirst({
      where: { id, workspaceId: actor.workspaceId },
    });
    if (!existing) return jsonError("找不到这个活动", 404);
    await prisma.campaign.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("删除活动失败", 500);
  }
}
