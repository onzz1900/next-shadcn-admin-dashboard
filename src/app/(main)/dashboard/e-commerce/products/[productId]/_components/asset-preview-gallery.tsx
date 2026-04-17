import { Badge } from "@/components/ui/badge";

import type { AssetPreviewImage, ProductAssetPreviewGallery } from "../../../_lib/product-asset-preview.types";
import { AssetPreviewEmptyState, AssetPreviewMediaSurface } from "./asset-preview-media-surface";

function AssetPreviewTile({ image }: { image: AssetPreviewImage }) {
  return (
    <div className="space-y-2">
      <AssetPreviewMediaSurface
        image={image}
        frameClassName={image.status === "ready" ? "aspect-[4/3]" : undefined}
        imageClassName="object-cover"
      />
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="truncate">{image.label}</div>
        <div className="text-muted-foreground text-xs">
          {image.status === "ready" ? `${image.width} x ${image.height}` : "布局预览待补"}
        </div>
      </div>
    </div>
  );
}

export function AssetPreviewGallery({ gallery }: { gallery: ProductAssetPreviewGallery }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="font-medium text-sm">{gallery.title}</div>
          <div className="text-muted-foreground text-xs leading-5">{gallery.caption}</div>
        </div>
        <Badge variant="secondary">{gallery.items.length} 张</Badge>
      </div>
      {gallery.items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {gallery.items.map((image) => (
            <div key={image.id}>
              <AssetPreviewTile image={image} />
            </div>
          ))}
        </div>
      ) : (
        <AssetPreviewEmptyState message="当前还没有卖点组图预览。" />
      )}
    </section>
  );
}
