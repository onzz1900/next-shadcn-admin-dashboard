import Image from "next/image";

import { cn } from "@/lib/utils";

import type { AssetPreviewImage } from "../../../_lib/product-asset-preview.types";

interface AssetPreviewMediaSurfaceProps {
  image: AssetPreviewImage;
  frameClassName?: string;
  imageClassName?: string;
  minHeightClassName?: string;
}

export function AssetPreviewMediaSurface({
  image,
  frameClassName,
  imageClassName,
  minHeightClassName = "min-h-[180px]",
}: AssetPreviewMediaSurfaceProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-muted",
        image.status === "ready" ? null : minHeightClassName,
        frameClassName,
      )}
    >
      {image.status === "ready" ? (
        <Image
          alt={image.label}
          className={cn("block h-full w-full", imageClassName)}
          decoding="async"
          loading="lazy"
          src={image.previewUrl}
          unoptimized
          width={image.width}
          height={image.height}
        />
      ) : (
        <div
          className={cn("flex h-full flex-col items-center justify-center gap-2 px-4 text-center", minHeightClassName)}
        >
          <div className="rounded-full border border-muted-foreground/30 border-dashed bg-background px-3 py-1.5 text-muted-foreground text-xs">
            待补预览
          </div>
          <div className="max-w-[20rem] text-muted-foreground text-sm">{image.label}</div>
        </div>
      )}
    </div>
  );
}

export function AssetPreviewEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-6 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
