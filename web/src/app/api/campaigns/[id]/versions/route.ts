import { listVersions, restoreVersion } from "@/server/generate";
import { asRecord, jsonError, readJson } from "@/server/http";
import { isChannel } from "@/server/map";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const { id } = await context.params;
  const channel = new URL(request.url).searchParams.get("channel") ?? undefined;
  if (channel && !isChannel(channel)) return jsonError("渠道不正确");
  try {
    const versions = await listVersions(
      id,
      actor.workspaceId,
      channel && isChannel(channel) ? channel : undefined
    );
    if (!versions) return jsonError("找不到这个活动", 404);
    return Response.json(versions);
  } catch (error) {
    console.error(error);
    return jsonError("读取版本失败", 500);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  const { id } = await context.params;
  const body = asRecord(await readJson(request));
  const versionId = body && typeof body.versionId === "string" ? body.versionId : "";
  if (!versionId) return jsonError("请选择要找回的版本");
  try {
    const campaign = await restoreVersion(id, actor.workspaceId, versionId);
    if (!campaign) return jsonError("找不到这个版本", 404);
    return Response.json({ campaign });
  } catch (error) {
    console.error(error);
    return jsonError("找回版本失败", 500);
  }
}
