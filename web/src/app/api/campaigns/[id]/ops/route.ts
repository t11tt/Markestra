import {
  addMetric,
  createNextRound,
  importMetrics,
  readOps,
  recordExport,
  recordPublication,
  writeReview,
} from "@/server/ops";
import { asRecord, jsonError, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const ops = await readOps(id);
    if (!ops) return jsonError("找不到这个活动", 404);
    return Response.json(ops);
  } catch (error) {
    console.error(error);
    return jsonError("读取运营记录失败", 500);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = asRecord(await readJson(request));
  if (!body || typeof body.action !== "string") return jsonError("请求格式不正确");
  try {
    if (body.action === "export") {
      const items = Array.isArray(body.items) ? body.items : [];
      const ids = await recordExport(
        id,
        items.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const channel = (item as { channel?: string }).channel;
          return typeof channel === "string" ? [channel] : [];
        })
      );
      if (!ids) return jsonError("找不到这个活动", 404);
      return Response.json({ ids });
    }
    if (body.action === "publish") {
      const result = await recordPublication(id, {
        channel: String(body.channel ?? ""),
        publishedAt: String(body.publishedAt ?? ""),
        link: typeof body.link === "string" ? body.link : undefined,
        note: typeof body.note === "string" ? body.note : undefined,
      });
      if (!result) return jsonError("找不到这个活动或渠道", 404);
      return Response.json(result);
    }
    if (body.action === "metric") {
      const result = await addMetric(id, {
        channel: String(body.channel ?? ""),
        metric: String(body.metric ?? ""),
        value: Number(body.value),
        observedOn: String(body.observedOn ?? ""),
        window: String(body.window ?? ""),
        demo: Boolean(body.demo),
      });
      if (!result) return jsonError("找不到这个活动或渠道", 404);
      return Response.json(result);
    }
    if (body.action === "import") {
      const result = await importMetrics(id, String(body.csv ?? ""));
      return Response.json(result);
    }
    if (body.action === "review") {
      const note = await writeReview(id);
      if (!note) return jsonError("找不到这个活动", 404);
      return Response.json(note);
    }
    if (body.action === "next") {
      const campaign = await createNextRound(id);
      if (!campaign) return jsonError("找不到这个活动", 404);
      return Response.json({ campaign });
    }
    return jsonError("不认识的操作");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "保存失败";
    return jsonError(message, 400);
  }
}
