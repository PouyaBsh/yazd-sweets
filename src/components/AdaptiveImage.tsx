"use client";

import Image from "next/image";
import { AnimatePresence, motion, type MotionProps } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { HOVER_ZOOM, SPRING } from "@/lib/motion";
import { webpImageLoader } from "@/lib/image-loader";
import { assetPath, cn } from "@/lib/utils";
import { KhatamStar } from "@/components/ui/Ornaments";

type HoverMode = "self" | "parent" | "none";
type Status = "loading" | "loaded" | "error";

export interface AdaptiveImageProps {
  src: string;
  alt: string;
  /**
   * Tailwind aspect class that locks the frame, e.g. "aspect-[4/3]" (default), "aspect-square".
   * Pass "h-full" (or "") when the parent already defines the frame size.
   * Whatever photo you drop into /public/images — portrait, square, ultrawide, 4K or tiny —
   * the frame never changes; the photo is cropped with object-cover inside it.
   */
  aspectRatio?: string;
  className?: string;
  imageClassName?: string;
  /** Tailwind object-position class, e.g. "object-center", "object-top". */
  objectPosition?: string;
  sizes?: string;
  /** Above-the-fold photo: fetched with high priority (every photo is fetched up-front anyway so
   *  the boot loader can wait for all of them and scrolling never shows a half-loaded image). */
  eager?: boolean;
  /**
   * "self"   → zooms when the image itself is hovered (default)
   * "parent" → zooms when a parent motion element enters its "hover" variant
   * "none"   → no zoom
   */
  hoverZoom?: HoverMode;
  rounded?: string;
}

/**
 * Adaptive, layout-proof image frame:
 *   relative + overflow-hidden wrapper with an explicit aspect ratio
 *   → next/image (unoptimized, fill) with object-cover
 *   → shimmer skeleton while loading
 *   → graceful fallback graphic on error
 *   → spring zoom on hover
 */
export function AdaptiveImage(props: AdaptiveImageProps) {
  // Re-mount on src change so loading state always resets cleanly.
  return <AdaptiveImageFrame key={props.src} {...props} />;
}

function AdaptiveImageFrame({
  src,
  alt,
  aspectRatio = "aspect-[4/3]",
  className,
  imageClassName,
  objectPosition = "object-center",
  sizes = "(max-width: 640px) 256px, (max-width: 1024px) 50vw, 33vw",
  eager = false,
  hoverZoom = "self",
  rounded,
}: AdaptiveImageProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [resolvedSrc, setResolvedSrc] = useState(src);
  // the loader serves AVIF variants; a browser that can't decode them retries with the WebP copies
  const [webp, setWebp] = useState(false);
  const triedPlaceholder = useRef(false);

  const handleError = useCallback(() => {
    if (!webp && src.startsWith("/images/")) {
      setWebp(true);
      return;
    }
    if (triedPlaceholder.current) {
      setStatus("error");
      return;
    }
    triedPlaceholder.current = true;
    // The image script writes SVG placeholders under the original photo name when a
    // photo is missing. Browsers refuse to decode SVG served as an image/* raster type, so read the file
    // and hand it back as a proper SVG data URL. Anything else → fallback graphic.
    fetch(assetPath(src))
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        if (text.slice(0, 2000).includes("<svg")) {
          setResolvedSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [src, webp]);

  const selfHover: MotionProps = hoverZoom === "self" ? { initial: "rest", animate: "rest", whileHover: "hover" } : {};

  return (
    <motion.div {...selfHover} className={cn("relative isolate w-full overflow-hidden bg-sand", aspectRatio, rounded, className)}>
      <motion.div variants={hoverZoom === "none" ? undefined : HOVER_ZOOM} className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: status === "loaded" ? 1 : 0 }}
          transition={SPRING}
        >
          {status !== "error" && (
            <Image
              src={resolvedSrc}
              alt={alt}
              fill
              loader={webp ? webpImageLoader : undefined}
              sizes={sizes}
              loading="eager"
              fetchPriority={eager ? "high" : "low"}
              draggable={false}
              onLoad={() => setStatus("loaded")}
              onError={handleError}
              className={cn("h-full w-full object-cover", objectPosition, imageClassName)}
            />
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            key="skeleton"
            aria-hidden
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="absolute inset-0 overflow-hidden bg-sand"
          >
            <div className="absolute inset-0 animate-shimmer bg-linear-to-l from-transparent via-card/80 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {status === "error" && (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sand p-4 text-center"
        >
          <KhatamStar className="h-10 w-10 text-terracotta/70" />
          <span className="max-w-[18ch] text-xs leading-6 text-umber">{alt}</span>
        </div>
      )}
    </motion.div>
  );
}
