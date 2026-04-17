import type { ChannelId } from "./product-center.types";

type AssetPreviewImageBase = {
  id: string;
  label: string;
};

export type AssetPreviewImage =
  | (AssetPreviewImageBase & {
      status: "ready";
      previewUrl: string;
      width: number;
      height: number;
    })
  | (AssetPreviewImageBase & {
      status: "missing";
    });

export interface ProductAssetPreviewCover {
  title: string;
  caption: string;
  image: AssetPreviewImage;
}

export interface ProductAssetPreviewGallery {
  title: string;
  caption: string;
  items: AssetPreviewImage[];
}

export interface ProductAssetPreviewDetail {
  title: string;
  caption: string;
  sections: AssetPreviewImage[];
}

export interface ProductAssetPreview {
  cover: ProductAssetPreviewCover;
  gallery: ProductAssetPreviewGallery;
  detail: ProductAssetPreviewDetail;
}

export type ChannelAssetPreviewMap = Partial<Record<ChannelId, ProductAssetPreview>>;
export type ProductAssetPreviewMap = Partial<Record<string, ChannelAssetPreviewMap>>;
