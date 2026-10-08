import { cookies } from "next/headers";
import { prisma } from "./db";
import { hashToken, newToken } from "./auth";

const COOKIE = "mk_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export interface Actor {
  userId: string;
  workspaceId: string;
  email: string;
}

export async function currentActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return {
    userId: session.userId,
    workspaceId: session.user.workspaceId,
    email: session.user.email,
  };
}

export async function openSession(userId: string) {
  const token = newToken();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + MAX_AGE * 1000),
    },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function closeSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(COOKIE);
}
