import { Badge } from "@/components/ui/badge";

import type { ProductAssetPreviewDetail } from "../../../_lib/product-asset-preview.types";
import { AssetPreviewEmptyState, AssetPreviewMediaSurface } from "./asset-preview-media-surface";

export function AssetPreviewDetailStrip({ detail }: { detail: ProductAssetPreviewDetail }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium text-sm">{detail.title}</div>
          <div className="text-muted-foreground text-xs leading-5">{detail.caption}</div>
        </div>
        <Badge variant="secondary">{detail.sections.length} 段</Badge>
      </div>
      {detail.sections.length > 0 ? (
        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
          {detail.sections.map((image, index) => (
            <section key={image.id} className="space-y-1.5">
              <div className="text-[11px] text-muted-foreground">{`详情段 ${index + 1} · ${image.label}`}</div>
              <AssetPreviewMediaSurface
                image={image}
                imageClassName="h-auto w-full object-cover"
                minHeightClassName="min-h-[260px]"
              />
            </section>
          ))}
        </div>
      ) : (
        <AssetPreviewEmptyState message="当前还没有详情长图预览。" />
      )}
    </section>
  );
}
