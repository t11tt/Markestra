import { prisma } from "@/server/db";
import { verifyPassword } from "@/server/auth";
import { asRecord, jsonError, readJson } from "@/server/http";
import { openSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = asRecord(await readJson(request));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return jsonError("请填写邮箱和密码");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("邮箱或密码不正确", 401);
  }
  await openSession(user.id);
  return Response.json({ ok: true });
}
