import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { DEMO_WORKSPACE_ID } from "@/server/demo";
import { asRecord, jsonError, readJson } from "@/server/http";
import { isChannel, isGoal, isStatus, isType, mapCampaign, money } from "@/server/map";

export const dynamic = "force-dynamic";

function campaignCode() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MK-${new Date().getFullYear()}-${suffix}`;
}

export async function POST(request: Request) {
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
  const image = typeof body.image === "string" ? body.image : null;
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
            workspaceId: DEMO_WORKSPACE_ID,
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
