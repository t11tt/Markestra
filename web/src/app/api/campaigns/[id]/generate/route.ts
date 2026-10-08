import { generateCampaign } from "@/server/generate";
import { jsonError } from "@/server/http";
import { isChannel } from "@/server/map";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const { id } = await context.params;
  let channel: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "channel" in body) {
      channel = typeof body.channel === "string" ? body.channel : undefined;
    }
  } catch {
    channel = undefined;
  }
  if (channel && !isChannel(channel)) return jsonError("渠道不正确");

  try {
    const result = await generateCampaign(
      id,
      actor.workspaceId,
      channel && isChannel(channel) ? channel : undefined
    );
    return Response.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "生成失败";
    const status = message === "找不到这个活动" ? 404 : 502;
    return jsonError(message, status);
  }
}
