import { Prisma, PrismaClient } from "@prisma/client";
import { genAll } from "../src/lib/mockAI";
import { hashPassword } from "../src/server/auth";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SLUG, DEMO_WORKSPACE_ID } from "../src/server/demo";
import { persistImage } from "../src/server/files";

const prisma = new PrismaClient();
const now = new Date("2026-09-23T00:00:00.000Z");

async function ensureDemoTrail() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: "c_latte" },
    include: { publications: true },
  });
  await prisma.campaign.updateMany({
    where: { id: "c_combo", endDate: "2026-10-08" },
    data: { endDate: "2026-10-31" },
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

async function ensureContentVersions() {
  const campaigns = await prisma.campaign.findMany({
    include: { versions: true, exports: true, publications: true },
  });
  for (const campaign of campaigns) {
    const contents = Array.isArray(campaign.contents) ? [...campaign.contents] : [];
    let changed = false;
    for (const item of contents) {
      if (!item || typeof item !== "object") continue;
      const row = item as {
        channel?: string;
        title?: string;
        body?: string;
        tags?: unknown;
        cta?: string;
        confirmed?: boolean;
        versionId?: string;
      };
      if (typeof row.channel !== "string" || typeof row.title !== "string" || typeof row.body !== "string") {
        continue;
      }
      if (row.versionId && campaign.versions.some((version) => version.id === row.versionId)) continue;
      const tags = Array.isArray(row.tags) ? row.tags.filter((tag) => typeof tag === "string") : [];
      const match = campaign.versions.find(
        (version) => version.channel === row.channel && version.title === row.title && version.body === row.body
      );
      const version =
        match ??
        (await prisma.contentVersion.create({
          data: {
            campaignId: campaign.id,
            channel: row.channel,
            title: row.title,
            body: row.body,
            tags,
            cta: typeof row.cta === "string" ? row.cta : "",
            confirmed: row.confirmed === true,
            source: "seed",
          },
        }));
      if (version.confirmed !== (row.confirmed === true)) {
        await prisma.contentVersion.update({
          where: { id: version.id },
          data: { confirmed: row.confirmed === true },
        });
      }
      row.versionId = version.id;
      changed = true;
      campaign.versions.push(version);
    }
    if (changed) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { contents: contents as unknown as Prisma.InputJsonValue },
      });
    }
    for (const record of campaign.exports) {
      if (record.versionId) continue;
      const content = contents.find(
        (item) => item && typeof item === "object" && (item as { channel?: string }).channel === record.channel
      ) as { versionId?: string } | undefined;
      if (!content?.versionId) continue;
      await prisma.exportRecord.update({
        where: { id: record.id },
        data: { versionId: content.versionId },
      });
    }
    for (const record of campaign.publications) {
      if (record.versionId) continue;
      const content = contents.find(
        (item) => item && typeof item === "object" && (item as { channel?: string }).channel === record.channel
      ) as { versionId?: string } | undefined;
      if (!content?.versionId) continue;
      await prisma.publication.update({
        where: { id: record.id },
        data: { versionId: content.versionId },
      });
    }
  }
}

async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return;
  await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      workspaceId: DEMO_WORKSPACE_ID,
    },
  });
}

async function moveDataUrlImages() {
  const products = await prisma.product.findMany({ where: { image: { startsWith: "data:" } } });
  for (const product of products) {
    if (!product.image) continue;
    await prisma.product.update({
      where: { id: product.id },
      data: { image: await persistImage(product.image) },
    });
  }
  const campaigns = await prisma.campaign.findMany({ where: { image: { startsWith: "data:" } } });
  for (const campaign of campaigns) {
    if (!campaign.image) continue;
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { image: await persistImage(campaign.image) },
    });
  }
}

async function main() {
  const existing = await prisma.workspace.findUnique({ where: { id: DEMO_WORKSPACE_ID } });
  if (existing) {
    if (existing.slug !== DEMO_SLUG) {
      await prisma.workspace.update({ where: { id: existing.id }, data: { slug: DEMO_SLUG } });
    }
    await ensureDemoTrail();
    await ensureContentVersions();
    await ensureDemoUser();
    await moveDataUrlImages();
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
      slug: DEMO_SLUG,
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
            endDate: "2026-10-31",
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
            }) as unknown as Prisma.InputJsonValue,
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
            }).map((content) => ({ ...content, confirmed: true })) as unknown as Prisma.InputJsonValue,
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
  await ensureContentVersions();
  await ensureDemoUser();
  await moveDataUrlImages();
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
