import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { ImageError, persistImage } from "@/server/files";
import { asRecord, jsonError, readJson } from "@/server/http";
import { isChannel, isGoal, isStatus, isType, mapCampaign, money } from "@/server/map";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function campaignCode() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MK-${new Date().getFullYear()}-${suffix}`;
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const productDetail = typeof body.productDetail === "string" ? body.productDetail.trim() : "";
  const price = money(body.price);
  const originalPrice =
    body.originalPrice == null || body.originalPrice === "" ? null : money(body.originalPrice);
  const startDate = typeof body.startDate === "string" ? body.startDate : "";
  const endDate = typeof body.endDate === "string" ? body.endDate : "";
  const channels = Array.isArray(body.channels) ? body.channels.filter(isChannel) : [];
  const category = clip(body.category, 40);
  const offer = clip(body.offer, 80);
  const intent = clip(body.intent, 160);
  let image: string | null = null;
  let images: string[] = [];
  try {
    const uploaded = Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [];
    images = (await Promise.all(uploaded.map((item) => persistImage(item)))).filter(
      (item): item is string => Boolean(item)
    );
    if (typeof body.image === "string") image = await persistImage(body.image);
    image = images[0] ?? image;
  } catch (error) {
    if (error instanceof ImageError) return jsonError(error.message);
    throw error;
  }
  const productId = typeof body.productId === "string" ? body.productId : null;

  if (!isType(body.type) || !isGoal(body.goal)) return jsonError("活动类型或目标不正确");
  if (!name || !productName || !productDetail) return jsonError("请补全商品名称和内容");
  if (price === undefined) return jsonError("请填写有效价格");
  if (body.originalPrice != null && body.originalPrice !== "" && originalPrice === undefined) {
    return jsonError("原价格式不正确");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return jsonError("请填写活动起止日期");
  }
  if (channels.length === 0) return jsonError("至少选择一个渠道");

  const status = isStatus(body.status) ? body.status : "draft";

  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const campaign = await prisma.campaign.create({
          data: {
            workspaceId: actor.workspaceId,
            code: campaignCode(),
            name,
            type: body.type,
            goal: body.goal,
            status,
            productId,
            productName,
            productDetail,
            price,
            originalPrice,
            startDate,
            endDate,
            channels,
            image,
            images,
            category,
            offer,
            intent,
            contents: [],
          },
        });
        return Response.json(mapCampaign(campaign), { status: 201 });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < 4
        ) {
          continue;
        }
        throw error;
      }
    }
    return jsonError("创建活动失败", 500);
  } catch (error) {
    console.error(error);
    return jsonError("创建活动失败", 500);
  }
}
