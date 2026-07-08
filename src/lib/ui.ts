export type Quality = "D" | "C" | "B" | "A" | "S" | "N";
export type ItemType = "gun" | "passive" | "active";

export function tierClass(q: Quality): string {
  return `tier tier-${q.toLowerCase()}`;
}

export function tierLabel(q: Quality): string {
  return q === "N" ? "—" : q;
}

const TYPE_META: Record<ItemType, { label: string; glyph: string }> = {
  gun: { label: "Gun", glyph: "▣" },
  passive: { label: "Passive", glyph: "◈" },
  active: { label: "Active", glyph: "◆" },
};

export function typeLabel(t: ItemType): string {
  return TYPE_META[t].label;
}

export function typeGlyph(t: ItemType): string {
  return TYPE_META[t].glyph;
}

export type SynergyStatus = "active" | "one_away" | "potential";

export function statusChipClass(status: SynergyStatus): string {
  return status === "active"
    ? "chip chip-active"
    : status === "one_away"
      ? "chip chip-ready"
      : "chip chip-potential";
}

export function statusLabel(status: SynergyStatus): string {
  return status === "active" ? "Active" : status === "one_away" ? "One away" : "Potential";
}
