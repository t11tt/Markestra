import { DEMO_SLUG } from "@/server/demo";
import { readCatalog } from "@/server/shop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || DEMO_SLUG;
  const catalog = await readCatalog(slug);
  if (!catalog) return Response.json({ error: "网店还没有准备好" }, { status: 404 });
  return Response.json(catalog);
}
