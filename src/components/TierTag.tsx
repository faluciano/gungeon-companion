import { tierLabel, type Quality } from "@/lib/ui";

export default function TierTag({ quality }: { quality: Quality }) {
  return (
    <span
      className={`tier-${quality.toLowerCase()} shrink-0 rounded-sm px-1 font-display text-[0.6rem] font-bold leading-4`}
      title={quality === "N" ? "No quality tier" : `Quality ${quality}`}
    >
      {tierLabel(quality)}
    </span>
  );
}
