import { randomBytes } from "node:crypto";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth";
import { asRecord, jsonError, readJson } from "@/server/http";
import { openSession } from "@/server/session";

export const dynamic = "force-dynamic";

function slug() {
  return `shop-${randomBytes(3).toString("hex")}`;
}

export async function POST(request: Request) {
  const body = asRecord(await readJson(request));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const shopName = typeof body?.shopName === "string" ? body.shopName.trim() : "";
  if (!shopName) return jsonError("请填写店名");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("邮箱格式不正确");
  if (password.length < 8) return jsonError("密码至少 8 位");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("这个邮箱已经注册过");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      workspace: {
        create: {
          id: `ws_${randomBytes(8).toString("hex")}`,
          slug: slug(),
          name: shopName,
          brand: {
            create: {
              name: shopName,
              address: "",
              hours: "",
              style: "",
              audience: "",
            },
          },
        },
      },
    },
  });
  await openSession(user.id);
  return Response.json({ ok: true }, { status: 201 });
}
