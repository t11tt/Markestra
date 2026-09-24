import { prisma } from "@/server/db";
import { DEMO_WORKSPACE_ID } from "@/server/demo";
import { asRecord, jsonError, readJson } from "@/server/http";
import { mapProduct, money } from "@/server/map";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = money(body.price);
  const originalPrice = body.originalPrice == null || body.originalPrice === ""
    ? null
    : money(body.originalPrice);
  const image = typeof body.image === "string" ? body.image : null;

  if (!name) return jsonError("商品名称不能为空");
  if (price === undefined) return jsonError("请填写有效价格");
  if (body.originalPrice != null && body.originalPrice !== "" && originalPrice === undefined) {
    return jsonError("原价格式不正确");
  }

  try {
    const product = await prisma.product.create({
      data: {
        workspaceId: DEMO_WORKSPACE_ID,
        name,
        description,
        price,
        originalPrice,
        image,
      },
    });
    return Response.json(mapProduct(product), { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("保存商品失败", 500);
  }
}
