import { readWorkspace } from "@/server/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await readWorkspace());
  } catch (error) {
    console.error(error);
    return Response.json({ error: "读取工作区失败，请确认本地数据库已启动" }, { status: 500 });
  }
}
