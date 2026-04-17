import type { ProductAssetPreviewCover } from "../../../_lib/product-asset-preview.types";
import { AssetPreviewMediaSurface } from "./asset-preview-media-surface";

export function AssetPreviewCover({ cover }: { cover: ProductAssetPreviewCover }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card/60 p-4">
      <div className="space-y-1">
        <div className="font-medium text-sm">{cover.title}</div>
        <div className="text-muted-foreground text-xs leading-5">{cover.caption}</div>
      </div>
      <AssetPreviewMediaSurface
        image={cover.image}
        frameClassName={cover.image.status === "ready" ? "aspect-[4/3]" : undefined}
        imageClassName="object-cover"
        minHeightClassName="min-h-[240px]"
      />
      <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
        <span className="truncate">{cover.image.label}</span>
        {cover.image.status === "ready" ? (
          <span>
            {cover.image.width} x {cover.image.height}
          </span>
        ) : (
          <span>布局预览待补</span>
        )}
      </div>
    </section>
  );
}
