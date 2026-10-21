import { prisma } from "@/server/db";
import { ImageError, persistImage } from "@/server/files";
import { asRecord, jsonError, readJson } from "@/server/http";
import { mapProduct, money } from "@/server/map";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = money(body.price);
  const originalPrice = body.originalPrice == null || body.originalPrice === ""
    ? null
    : money(body.originalPrice);
  const stock = body.stock === undefined ? 100 : body.stock;
  if (typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < 0 || stock > 1000000) return jsonError("库存必须是 0 到 1000000 的整数");
  let image: string | null = null;
  if (typeof body.image === "string") {
    try {
      image = await persistImage(body.image);
    } catch (error) {
      if (error instanceof ImageError) return jsonError(error.message);
      throw error;
    }
  }

  if (!name) return jsonError("商品名称不能为空");
  if (price === undefined) return jsonError("请填写有效价格");
  if (body.originalPrice != null && body.originalPrice !== "" && originalPrice === undefined) {
    return jsonError("原价格式不正确");
  }

  try {
    const product = await prisma.product.create({
      data: {
        workspaceId: actor.workspaceId,
        name,
        description,
        price,
        stock,
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
