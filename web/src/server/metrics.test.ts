import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { importPlan, pickLatest, realSummary, type MetricRow } from "./metrics";

const campaignId = "c_test";

function row(partial: Partial<MetricRow> & Pick<MetricRow, "metric" | "value" | "observedOn" | "window">): MetricRow {
  return {
    channel: "xiaohongshu",
    demo: false,
    ...partial,
  };
}

describe("metric rules", () => {
  it("keeps the latest cumulative value and adds interval values", () => {
    const rows = [
      row({ metric: "views", value: 100, observedOn: "2026-09-01", window: "cumulative" }),
      row({ metric: "views", value: 80, observedOn: "2026-09-20", window: "cumulative" }),
      row({ metric: "inquiries", value: 2, observedOn: "2026-09-01", window: "interval" }),
      row({ metric: "inquiries", value: 5, observedOn: "2026-09-08", window: "interval" }),
    ];
    assert.equal(pickLatest(rows, "views", false), 80);
    assert.equal(pickLatest(rows, "inquiries", false), 7);
  });

  it("does not mix demo rows into real figures", () => {
    const rows = [
      row({ metric: "views", value: 8120, observedOn: "2026-09-20", window: "cumulative", demo: true }),
      row({ metric: "views", value: 12, observedOn: "2026-09-18", window: "cumulative", demo: false }),
      row({ metric: "saves", value: 542, observedOn: "2026-09-20", window: "cumulative", demo: true }),
    ];
    const [figure] = realSummary(["xiaohongshu"], rows);
    assert.equal(figure.views, 12);
    assert.equal(figure.saves, undefined);
    assert.equal(figure.inquiries, undefined);
  });

  it("does not double a repeated import", () => {
    const sample = {
      channel: "xiaohongshu",
      metric: "views",
      value: 120,
      observedOn: "2026-09-20",
      window: "cumulative",
      demo: false,
    };
    const first = importPlan(campaignId, new Set(), [sample, sample]);
    assert.deepEqual(
      { inserted: first.inserted, skipped: first.skipped },
      { inserted: 1, skipped: 1 }
    );
    const second = importPlan(campaignId, first.keys, [sample]);
    assert.deepEqual(
      { inserted: second.inserted, skipped: second.skipped },
      { inserted: 0, skipped: 1 }
    );
  });

  it("keeps a demo import from entering the review numbers", () => {
    const demoRow = {
      channel: "xiaohongshu",
      metric: "views",
      value: 8120,
      observedOn: "2026-09-20",
      window: "cumulative",
      demo: true,
    };
    const planned = importPlan(campaignId, new Set(), [demoRow]);
    assert.equal(planned.inserted, 1);
    const [figure] = realSummary(["xiaohongshu"], planned.accepted.map((item) => ({ ...item })));
    assert.equal(figure.views, undefined);
  });
});
