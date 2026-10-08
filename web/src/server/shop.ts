import { Prisma } from "@prisma/client";
import type { ShopCatalog, ShopFulfillment, ShopOrder, ShopOrderStatus } from "@/lib/types";
import { displayImage } from "@/lib/image";
import { prisma } from "./db";
import { DEMO_SLUG } from "./demo";

const STATUSES: ShopOrderStatus[] = ["placed", "preparing", "completed", "cancelled"];

function todayInShanghai() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

function yuan(value: number) {
  return Math.round(value * 100) / 100;
}

export async function readCatalog(slug = DEMO_SLUG): Promise<(ShopCatalog & { slug: string }) | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      brand: true,
      products: { where: { listed: true }, orderBy: { createdAt: "asc" } },
      campaigns: true,
    },
  });
  if (!workspace?.brand) return null;
  const today = todayInShanghai();
  const offers = workspace.campaigns.filter(
    (campaign) =>
      (campaign.status === "review" || campaign.status === "published") &&
      campaign.startDate <= today &&
      campaign.endDate >= today
  );
  return {
    slug: workspace.slug,
    brand: {
      name: workspace.brand.name,
      address: workspace.brand.address,
      hours: workspace.brand.hours,
    },
    products: workspace.products.map((product) => {
      const offer = offers
        .filter(
          (campaign) =>
            campaign.productId === product.id || campaign.productName === product.name
        )
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const price = offer ? offer.price : product.price;
      const compareAt =
        product.originalPrice != null && product.originalPrice > price
          ? product.originalPrice
          : offer && product.price > price
            ? product.price
            : undefined;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        image: displayImage(product.image),
        price,
        compareAt,
        offer: offer ? { name: offer.name, endDate: offer.endDate } : undefined,
      };
    }),
  };
}

function orderCode() {
  return `SO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function placeOrder(input: {
  slug?: string;
  customerName: string;
  phone: string;
  fulfillment: ShopFulfillment;
  address?: string;
  note?: string;
  items: { productId: string; qty: number }[];
}): Promise<ShopOrder> {
  const catalog = await readCatalog(input.slug || DEMO_SLUG);
  if (!catalog) throw new Error("网店还没有准备好");
  const name = input.customerName.trim();
  const phone = input.phone.trim();
  if (name.length < 1 || name.length > 40) throw new Error("请填写联系人");
  if (!/^[\d+\-\s]{6,20}$/.test(phone)) throw new Error("请填写有效电话");
  if (input.fulfillment !== "pickup" && input.fulfillment !== "delivery") {
    throw new Error("请选择取货方式");
  }
  const address = input.address?.trim() || "";
  if (input.fulfillment === "delivery" && address.length < 4) {
    throw new Error("配送请填写地址");
  }
  const note = input.note?.trim().slice(0, 200) || "";
  const merged = new Map<string, number>();
  for (const item of input.items) {
    const qty = Math.floor(item.qty);
    if (!item.productId || qty < 1 || qty > 99) throw new Error("商品数量不正确");
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + qty);
  }
  if (merged.size === 0 || merged.size > 20) throw new Error("请先选择商品");

  const lines = [...merged.entries()].map(([productId, qty]) => {
    const product = catalog.products.find((row) => row.id === productId);
    if (!product) throw new Error("有商品已下架，请刷新网店");
    return { productId, name: product.name, price: product.price, qty };
  });
  const total = yuan(lines.reduce((sum, line) => sum + line.price * line.qty, 0));

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.shopOrder.create({
        data: {
          workspaceId: (
            await prisma.workspace.findUniqueOrThrow({
              where: { slug: catalog.slug },
              select: { id: true },
            })
          ).id,
          code: orderCode(),
          customerName: name,
          phone,
          fulfillment: input.fulfillment,
          address: input.fulfillment === "delivery" ? address : null,
          note: note || null,
          status: "placed",
          total,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              name: line.name,
              price: line.price,
              qty: line.qty,
            })),
          },
        },
        include: { items: true },
      });
      return mapOrder(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 4) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("下单失败");
}

function mapOrder(row: {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  fulfillment: string;
  address: string | null;
  note: string | null;
  status: string;
  total: number;
  createdAt: Date;
  items: { name: string; price: number; qty: number }[];
}): ShopOrder {
  const fulfillment: ShopFulfillment = row.fulfillment === "delivery" ? "delivery" : "pickup";
  const status: ShopOrderStatus = STATUSES.includes(row.status as ShopOrderStatus)
    ? (row.status as ShopOrderStatus)
    : "placed";
  return {
    id: row.id,
    code: row.code,
    customerName: row.customerName,
    phone: row.phone,
    fulfillment,
    address: row.address ?? undefined,
    note: row.note ?? undefined,
    status,
    total: row.total,
    createdAt: row.createdAt.getTime(),
    items: row.items.map((item) => ({ name: item.name, price: item.price, qty: item.qty })),
  };
}

export async function listOrders(workspaceId: string): Promise<ShopOrder[]> {
  const rows = await prisma.shopOrder.findMany({
    where: { workspaceId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(mapOrder);
}

export async function updateOrderStatus(
  workspaceId: string,
  id: string,
  status: ShopOrderStatus
): Promise<ShopOrder | null> {
  if (!STATUSES.includes(status)) return null;
  const existing = await prisma.shopOrder.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) return null;
  const saved = await prisma.shopOrder.update({
    where: { id },
    data: { status },
    include: { items: true },
  });
  return mapOrder(saved);
}
