import { prisma } from "@/server/db";
import { DEMO_WORKSPACE_ID } from "@/server/demo";
import { asRecord, jsonError, readJson } from "@/server/http";
import { mapProduct, money } from "@/server/map";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const data: {
    name?: string;
    description?: string;
    price?: number;
    originalPrice?: number | null;
    image?: string | null;
  } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
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
  if (typeof body.image === "string") data.image = body.image;
  if (Object.keys(data).length === 0) return jsonError("没有可保存的修改");

  try {
    const existing = await prisma.product.findFirst({
      where: { id, workspaceId: DEMO_WORKSPACE_ID },
    });
    if (!existing) return jsonError("找不到这个商品", 404);
    const product = await prisma.product.update({ where: { id }, data });
    return Response.json(mapProduct(product));
  } catch (error) {
    console.error(error);
    return jsonError("保存商品失败", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const existing = await prisma.product.findFirst({
      where: { id, workspaceId: DEMO_WORKSPACE_ID },
    });
    if (!existing) return jsonError("找不到这个商品", 404);
    await prisma.product.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("删除商品失败", 500);
  }
}
