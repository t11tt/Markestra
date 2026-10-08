import { jsonError, readJson, asRecord } from "@/server/http";
import { currentActor } from "@/server/session";
import { updateOrderStatus } from "@/server/shop";
import type { ShopOrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: ShopOrderStatus[] = ["placed", "preparing", "completed", "cancelled"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const { id } = await context.params;
  const body = asRecord(await readJson(request));
  if (!body || typeof body.status !== "string" || !STATUSES.includes(body.status as ShopOrderStatus)) {
    return jsonError("订单状态不正确");
  }
  const order = await updateOrderStatus(actor.workspaceId, id, body.status as ShopOrderStatus);
  if (!order) return jsonError("找不到这笔订单", 404);
  return Response.json(order);
}
