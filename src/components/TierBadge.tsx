import { tierClass, tierLabel, type Quality } from "@/lib/ui";

export default function TierBadge({ quality }: { quality: Quality }) {
  return (
    <span
      className={tierClass(quality)}
      title={quality === "N" ? "No quality tier" : `Quality ${quality}`}
    >
      {tierLabel(quality)}
    </span>
  );
}
