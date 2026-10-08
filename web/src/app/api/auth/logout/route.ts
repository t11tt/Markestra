import { closeSession } from "@/server/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await closeSession();
  return Response.json({ ok: true });
}
