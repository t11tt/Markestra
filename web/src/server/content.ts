import type { ChannelContent } from "@/lib/types";
import { prisma } from "./db";
import { planContentChange, type StoredVersion } from "./drafts";

function tagsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === "string") : [];
}

function stored(row: {
  id: string;
  title: string;
  body: string;
  tags: unknown;
  cta: string;
  confirmed: boolean;
}): StoredVersion {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: tagsOf(row.tags),
    cta: row.cta,
    confirmed: row.confirmed,
  };
}

export async function syncChannelDrafts(campaignId: string, incoming: ChannelContent[]) {
  const versions = await prisma.contentVersion.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
  const next: ChannelContent[] = [];
  for (const item of incoming) {
    const byId = item.versionId ? versions.find((row) => row.id === item.versionId) : undefined;
    const latest = versions.find((row) => row.channel === item.channel);
    const current = byId ?? latest ?? null;
    const plan = planContentChange(current ? stored(current) : null, item);
    if (plan.action === "create") {
      const created = await prisma.contentVersion.create({
        data: {
          campaignId,
          channel: item.channel,
          title: item.title,
          body: item.body,
          tags: item.tags,
          cta: item.cta,
          confirmed: false,
          source: "edit",
        },
      });
      versions.unshift(created);
      next.push({ ...item, versionId: created.id, confirmed: false });
      continue;
    }
    if (plan.action === "confirm") {
      await prisma.contentVersion.update({ where: { id: plan.id }, data: { confirmed: true } });
      const row = versions.find((version) => version.id === plan.id);
      if (row) row.confirmed = true;
      next.push({ ...item, versionId: plan.id, confirmed: true });
      continue;
    }
    if (plan.action === "revoke") {
      await prisma.contentVersion.update({ where: { id: plan.id }, data: { confirmed: false } });
      const row = versions.find((version) => version.id === plan.id);
      if (row) row.confirmed = false;
      next.push({ ...item, versionId: plan.id, confirmed: false });
      continue;
    }
    next.push({ ...item, versionId: plan.id, confirmed: plan.confirmed });
  }
  return next;
}

export async function revokeConfirmedDrafts(campaignId: string, contents: ChannelContent[]) {
  await prisma.contentVersion.updateMany({
    where: { campaignId, confirmed: true },
    data: { confirmed: false },
  });
  return contents.map((item) => ({ ...item, confirmed: false }));
}
