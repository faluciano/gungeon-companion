"use client";

import { useState } from "react";
import { tierClass, tierLabel, type Quality } from "@/lib/ui";

/**
 * Ammonomicon sprite for an item, framed in its quality tier colour. Falls back
 * to the tier letter badge if the item has no icon or the image fails to load.
 * Sprites are hotlinked from the community wiki CDN and rendered pixel-crisp.
 */
export default function ItemIcon({
  name,
  imageUrl,
  quality,
  size = 40,
}: {
  name: string;
  imageUrl: string | null;
  quality: Quality;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(imageUrl) && !errored;

  return (
    <span
      className={`item-icon relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border tier-${quality.toLowerCase()}`}
      style={{ width: size, height: size, borderColor: "currentColor" }}
      title={`${name} · ${quality === "N" ? "No quality tier" : `Quality ${quality}`}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- hotlinked wiki sprite; next/image optimization would proxy/charge for external CDN
        <img
          src={imageUrl as string}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="h-full w-full object-contain p-1"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
      ) : (
        <span className={`${tierClass(quality)} !border-0 !bg-transparent !shadow-none`}>
          {tierLabel(quality)}
        </span>
      )}
    </span>
  );
}
