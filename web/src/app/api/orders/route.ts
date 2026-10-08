import { jsonError } from "@/server/http";
import { currentActor } from "@/server/session";
import { listOrders } from "@/server/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  return Response.json(await listOrders(actor.workspaceId));
}
