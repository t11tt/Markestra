import { jsonError } from "@/server/http";
import { currentActor } from "@/server/session";
import { readWorkspace } from "@/server/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return jsonError("请先登录", 401);
  try {
    const workspace = await readWorkspace(actor.workspaceId);
    return Response.json({ ...workspace, email: actor.email });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "读取工作区失败，请确认本地数据库已启动" }, { status: 500 });
  }
}
