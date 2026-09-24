import { prisma } from "@/server/db";
import { DEMO_WORKSPACE_ID } from "@/server/demo";
import { asRecord, jsonError, readJson } from "@/server/http";
import { mapBrand } from "@/server/map";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PUT(request: Request) {
  const body = asRecord(await readJson(request));
  if (!body) return jsonError("请求格式不正确");

  const name = text(body.name);
  const address = text(body.address);
  const hours = text(body.hours);
  const style = text(body.style);
  const audience = text(body.audience);
  if (!name || !address) return jsonError("店名和地址不能为空");

  try {
    const brand = await prisma.brand.update({
      where: { workspaceId: DEMO_WORKSPACE_ID },
      data: { name, address, hours, style, audience },
    });
    return Response.json(mapBrand(brand));
  } catch (error) {
    console.error(error);
    return jsonError("保存店铺资料失败", 500);
  }
}
