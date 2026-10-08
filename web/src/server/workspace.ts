import { prisma } from "./db";
import { mapBrand, mapCampaign, mapProduct } from "./map";
import type { Brand, Campaign, Product } from "@/lib/types";

export async function readWorkspace(workspaceId: string): Promise<{
  brand: Brand;
  products: Product[];
  campaigns: Campaign[];
  shopSlug: string;
}> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
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
    shopSlug: workspace.slug,
  };
}
