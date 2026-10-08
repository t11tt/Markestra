import { prisma } from "@/server/db";
import { DEMO_EMAIL } from "@/server/demo";
import { jsonError } from "@/server/http";
import { openSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) return jsonError("演示账号还没有准备好", 404);
  await openSession(user.id);
  return Response.json({ ok: true });
}
