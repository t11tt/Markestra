import { PrismaClient } from "@prisma/client";
import { genAll } from "../src/lib/mockAI";
import { DEMO_WORKSPACE_ID } from "../src/server/demo";

const prisma = new PrismaClient();
const now = new Date("2026-09-23T00:00:00.000Z");

async function ensureDemoTrail() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: "c_latte" },
    include: { publications: true },
  });
  if (!campaign || campaign.publications.length > 0) return;
  const contents = Array.isArray(campaign.contents) ? campaign.contents : [];
  const first = contents.find(
    (item) => item && typeof item === "object" && (item as { channel?: string }).channel === "xiaohongshu"
  ) as { title?: string; body?: string } | undefined;
  await prisma.exportRecord.create({
    data: {
      campaignId: campaign.id,
      channel: "xiaohongshu",
      title: first?.title || "秋日栗子拿铁",
      body: first?.body || "秋季新品，绵密栗子风味",
      price: campaign.price,
    },
  });
  await prisma.publication.create({
    data: {
      campaignId: campaign.id,
      channel: "xiaohongshu",
      publishedAt: new Date("2026-09-12T10:00:00.000Z"),
      link: "https://example.com/latte",
      note: "演示发布",
    },
  });
  const metrics = [
    ["views", 8120],
    ["saves", 542],
    ["inquiries", 47],
  ] as const;
  for (const [metric, value] of metrics) {
    await prisma.metricEntry.create({
      data: {
        campaignId: campaign.id,
        channel: "xiaohongshu",
        metric,
        value,
        observedOn: "2026-09-20",
        window: "cumulative",
        source: "seed",
        demo: true,
        dedupeKey: `c_latte|xiaohongshu|${metric}|2026-09-20|cumulative|demo`,
      },
    });
  }
  await prisma.reviewNote.create({
    data: {
      campaignId: campaign.id,
      observation: "演示数据：小红书阅读 8120，收藏 542，询问 47。",
      limitation: "这些是演示数据，不能当成真实投放结果。还没有真实阅读和询问记录。",
      suggestion: "下一轮先发布并记录一个渠道的阅读和询问，再比较文案。",
      basis: "seed demo",
    },
  });
}

async function main() {
  const existing = await prisma.workspace.findUnique({ where: { id: DEMO_WORKSPACE_ID } });
  if (existing) {
    await ensureDemoTrail();
    console.log("demo workspace already present, trail checked");
    return;
  }

  const brand = {
    name: "拾光食堂",
    address: "杭州市西湖区文三路 100 号",
    hours: "周一至周日 10:00 - 21:00",
    style: "温暖治愈、家常亲切，语气轻松不浮夸",
    audience: "周边写字楼白领、附近居民、大学生",
  };

  await prisma.workspace.create({
    data: {
      id: DEMO_WORKSPACE_ID,
      name: brand.name,
      brand: { create: brand },
      products: {
        create: [
          {
            id: "p_latte",
            name: "秋日限定栗子拿铁",
            price: 26,
            originalPrice: 32,
            description: "秋季新品，绵密栗子风味，冷热皆可",
            image: "☕",
            createdAt: new Date(now.getTime() - 86400000),
            updatedAt: now,
          },
          {
            id: "p_combo",
            name: "双人午餐套餐",
            price: 68,
            originalPrice: 88,
            description: "两份招牌主食 + 两杯现磨饮品，工作日限定",
            image: "🍱",
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      campaigns: {
        create: [
          {
            id: "c_combo",
            code: "MK-2026-A1C0",
            name: "双人午餐套餐 · 到店引流",
            type: "combo",
            goal: "to_store",
            status: "review",
            productId: "p_combo",
            productName: "双人午餐套餐",
            productDetail: "两份招牌主食 + 两杯现磨饮品，工作日限定",
            price: 68,
            originalPrice: 88,
            startDate: "2026-09-24",
            endDate: "2026-10-08",
            channels: ["xiaohongshu", "moments"],
            image: "🍱",
            contents: genAll(["xiaohongshu", "moments"], {
              productName: "双人午餐套餐",
              productDetail: "两份招牌主食 + 两杯现磨饮品，工作日限定",
              price: 68,
              originalPrice: 88,
              goal: "to_store",
              brandName: brand.name,
              address: brand.address,
            }),
            metrics: { views: 3240, saves: 186, inquiries: 12 },
            createdAt: new Date(now.getTime() - 86400000 * 2),
            updatedAt: new Date(now.getTime() - 3600000 * 5),
          },
          {
            id: "c_latte",
            code: "MK-2026-B2D1",
            name: "秋日栗子拿铁 · 新品种草",
            type: "new_product",
            goal: "orders",
            status: "published",
            productId: "p_latte",
            productName: "秋日限定栗子拿铁",
            productDetail: "秋季新品，绵密栗子风味，冷热皆可",
            price: 26,
            originalPrice: 32,
            startDate: "2026-09-10",
            endDate: "2026-09-30",
            channels: ["xiaohongshu", "moments", "douyin"],
            image: "☕",
            contents: genAll(["xiaohongshu", "moments", "douyin"], {
              productName: "秋日限定栗子拿铁",
              productDetail: "秋季新品，绵密栗子风味，冷热皆可",
              price: 26,
              originalPrice: 32,
              goal: "orders",
              brandName: brand.name,
              address: brand.address,
            }).map((content) => ({ ...content, confirmed: true })),
            metrics: { views: 8120, saves: 542, inquiries: 47 },
            createdAt: new Date(now.getTime() - 86400000 * 8),
            updatedAt: new Date(now.getTime() - 86400000 * 3),
          },
          {
            id: "c_mooncake",
            code: "MK-2026-C3E2",
            name: "中秋团圆礼盒 · 节日活动",
            type: "festival",
            goal: "orders",
            status: "draft",
            productName: "中秋团圆礼盒",
            productDetail: "6 枚流心月饼礼盒，送礼自留两相宜",
            price: 158,
            startDate: "2026-09-20",
            endDate: "2026-10-06",
            channels: ["xiaohongshu"],
            image: "🥮",
            contents: [],
            createdAt: new Date(now.getTime() - 86400000),
            updatedAt: new Date(now.getTime() - 86400000),
          },
        ],
      },
    },
  });

  await ensureDemoTrail();
  console.log("seeded demo workspace");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
