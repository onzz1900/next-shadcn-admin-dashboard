import { productAssetPreviewMock } from "./product-asset-preview.mock";
import type { ProductAssetPreview } from "./product-asset-preview.types";
import type { ChannelId } from "./product-center.types";

export function getProductAssetPreview(productId: string, channelId: ChannelId): ProductAssetPreview | undefined {
  return productAssetPreviewMock[productId]?.[channelId];
}
