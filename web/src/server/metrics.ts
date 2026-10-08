export interface MetricRow {
  channel: string;
  metric: string;
  value: number;
  observedOn: string;
  window: string;
  demo: boolean;
}

export interface MetricInput {
  channel: string;
  metric: string;
  value: number;
  observedOn: string;
  window: string;
  demo: boolean;
}

export function dedupeKey(input: {
  campaignId: string;
  channel: string;
  metric: string;
  observedOn: string;
  window: string;
  demo: boolean;
}) {
  return [
    input.campaignId,
    input.channel,
    input.metric,
    input.observedOn,
    input.window,
    input.demo ? "demo" : "real",
  ].join("|");
}

/** Cumulative rows keep the latest observation date. Interval rows add up. Demo and real stay apart. */
export function pickLatest(rows: MetricRow[], metric: string, demo: boolean) {
  const matching = rows.filter((row) => row.metric === metric && row.demo === demo);
  const cumulative = matching
    .filter((row) => row.window === "cumulative")
    .sort((a, b) => a.observedOn.localeCompare(b.observedOn));
  if (cumulative.length > 0) return cumulative[cumulative.length - 1].value;
  const interval = matching.filter((row) => row.window === "interval");
  if (interval.length === 0) return undefined;
  return interval.reduce((sum, row) => sum + row.value, 0);
}

export interface ChannelFigures {
  channel: string;
  views?: number;
  saves?: number;
  inquiries?: number;
}

/** Numbers a review is allowed to quote. Demo rows are ignored. */
export function realSummary(channels: string[], rows: MetricRow[]): ChannelFigures[] {
  return channels.map((channel) => {
    const mine = rows.filter((row) => row.channel === channel);
    return {
      channel,
      views: pickLatest(mine, "views", false),
      saves: pickLatest(mine, "saves", false),
      inquiries: pickLatest(mine, "inquiries", false),
    };
  });
}

export function importPlan(campaignId: string, existing: Set<string>, rows: MetricInput[]) {
  const keys = new Set(existing);
  let inserted = 0;
  let skipped = 0;
  const accepted: MetricInput[] = [];
  for (const row of rows) {
    const key = dedupeKey({ campaignId, ...row });
    if (keys.has(key)) {
      skipped += 1;
      continue;
    }
    keys.add(key);
    inserted += 1;
    accepted.push(row);
  }
  return { inserted, skipped, keys, accepted };
}
