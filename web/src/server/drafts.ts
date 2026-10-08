export interface DraftText {
  channel: string;
  title: string;
  body: string;
  tags: string[];
  cta: string;
  confirmed: boolean;
  versionId?: string;
}

export interface StoredVersion {
  id: string;
  title: string;
  body: string;
  tags: string[];
  cta: string;
  confirmed: boolean;
}

export type DraftPlan =
  | { action: "create" }
  | { action: "confirm"; id: string }
  | { action: "revoke"; id: string }
  | { action: "keep"; id: string; confirmed: boolean };

function sameText(
  current: { title: string; body: string; tags: string[]; cta: string },
  next: { title: string; body: string; tags: string[]; cta: string }
) {
  return (
    current.title === next.title &&
    current.body === next.body &&
    current.cta === next.cta &&
    current.tags.join("\u0001") === next.tags.join("\u0001")
  );
}

/** A text change is a new unconfirmed draft. Confirm and revoke stay on the same version. */
export function planContentChange(current: StoredVersion | null, next: DraftText): DraftPlan {
  if (!current || !sameText(current, next)) return { action: "create" };
  if (next.confirmed && !current.confirmed) return { action: "confirm", id: current.id };
  if (!next.confirmed && current.confirmed) return { action: "revoke", id: current.id };
  return { action: "keep", id: current.id, confirmed: current.confirmed };
}

export function factsChanged(
  before: { price: number; originalPrice: number | null; startDate: string; endDate: string },
  after: { price: number; originalPrice: number | null; startDate: string; endDate: string }
) {
  return (
    before.price !== after.price ||
    before.originalPrice !== after.originalPrice ||
    before.startDate !== after.startDate ||
    before.endDate !== after.endDate
  );
}
