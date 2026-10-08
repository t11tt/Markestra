import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { factsChanged, planContentChange, type StoredVersion } from "./drafts";

const current: StoredVersion = {
  id: "ver_1",
  title: "秋日拿铁",
  body: "现价 26",
  tags: ["探店"],
  cta: "到店",
  confirmed: true,
};

const text = {
  channel: "xiaohongshu",
  title: current.title,
  body: current.body,
  tags: ["探店"],
  cta: current.cta,
  confirmed: true,
  versionId: current.id,
};

describe("content drafts", () => {
  it("creates a new draft when the title changes", () => {
    const plan = planContentChange(current, { ...text, title: "秋日拿铁 · 改" });
    assert.equal(plan.action, "create");
  });

  it("confirms the same version when the text is unchanged", () => {
    const plan = planContentChange({ ...current, confirmed: false }, { ...text, confirmed: true });
    assert.deepEqual(plan, { action: "confirm", id: "ver_1" });
  });

  it("sends a confirmed draft back to unconfirmed when the price or dates change", () => {
    const before = { price: 26, originalPrice: 32, startDate: "2026-09-10", endDate: "2026-09-30" };
    assert.equal(factsChanged(before, { ...before, price: 28 }), true);
    assert.equal(factsChanged(before, { ...before, endDate: "2026-10-31" }), true);
    assert.equal(factsChanged(before, before), false);
  });
});
