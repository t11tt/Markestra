import { prisma } from "./db";
import { DEMO_WORKSPACE_ID } from "./demo";
import { mapBrand, mapCampaign, mapProduct } from "./map";
import type { Brand, Campaign, Product } from "@/lib/types";

export async function readWorkspace(): Promise<{
  brand: Brand;
  products: Product[];
  campaigns: Campaign[];
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: DEMO_WORKSPACE_ID },
    include: {
      brand: true,
      products: { orderBy: { createdAt: "desc" } },
      campaigns: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!workspace?.brand) {
    throw new Error("演示工作区还没有准备好");
  }
  return {
    brand: mapBrand(workspace.brand),
    products: workspace.products.map(mapProduct),
    campaigns: workspace.campaigns.map(mapCampaign),
  };
}
