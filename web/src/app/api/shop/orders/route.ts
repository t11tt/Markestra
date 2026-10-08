import { jsonError, readJson, asRecord } from "@/server/http";
import { placeOrder } from "@/server/shop";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");
  const items = Array.isArray(body.items) ? body.items : [];
  const parsed = items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { productId?: unknown; qty?: unknown };
    if (typeof row.productId !== "string") return [];
    return [{ productId: row.productId, qty: Number(row.qty) }];
  });
  try {
    const order = await placeOrder({
      customerName: typeof body.customerName === "string" ? body.customerName : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      fulfillment: body.fulfillment === "delivery" ? "delivery" : "pickup",
      address: typeof body.address === "string" ? body.address : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      note: typeof body.note === "string" ? body.note : undefined,
      items: parsed,
    });
    return Response.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "下单失败";
    return jsonError(message);
  }
}
