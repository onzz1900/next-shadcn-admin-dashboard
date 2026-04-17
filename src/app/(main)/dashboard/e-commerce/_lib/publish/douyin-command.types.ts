import type {
  AssetItem,
  AuditStatus,
  ChannelPublicationView,
  ListingStatus,
  ProductStatus,
  PublicationStatus,
  SKUItem,
  SPUDetail,
} from "../product-center.types";
import type { DouyinDynamicField, DouyinDynamicPanelState } from "./douyin-dynamic.types";
import type { PublishFieldView, PublishView } from "./publish.types";

export type DouyinPublishCommandMode = "add" | "edit";

export interface DouyinPublishDraftField extends PublishFieldView {}

export interface DouyinPublishDraftAsset {
  assetId: string;
  type: AssetItem["type"];
  label: string;
  status: AssetItem["status"];
}

export interface DouyinPublishDraftSkuItem {
  skuId: string;
  skuName: string;
  skuCode: string;
  priceLabel: string;
  salePrice: string;
  stockNum: number;
  specValues: string[];
  thumbAssetId: string | null;
  sourceSellerSku: SKUItem["sellerSku"];
}

export interface DouyinCommandSkuListItem {
  sku_id: string;
  sku_name: string;
  sku_code: string;
  sale_price: string;
  stock_num: number;
  spec_values: string[];
  thumb_image: string | null;
}

export interface DouyinPublishDraftBaseSection {
  productId: string;
  productName: string;
  spuCode: string;
  brand: string;
  category: string;
  tags: string[];
  productStatus: ProductStatus;
  updatedAt: string;
  fields: DouyinPublishDraftField[];
}

export interface DouyinPublishDraftCategorySection {
  categoryId: string;
  categoryName: string;
  categoryPath: string;
  fields: DouyinDynamicField[];
}

export interface DouyinPublishDraftMediaSection {
  fields: DouyinPublishDraftField[];
  coverAssets: DouyinPublishDraftAsset[];
  galleryAssets: DouyinPublishDraftAsset[];
  detailAssets: DouyinPublishDraftAsset[];
}

export interface DouyinPublishDraftSkuSection {
  fields: DouyinPublishDraftField[];
  items: DouyinPublishDraftSkuItem[];
}

export interface DouyinPublishDraftDeliverySection {
  fields: DouyinPublishDraftField[];
  shop: string;
}

export interface DouyinPublishDraftRuleContext {
  title: string;
  summary: string;
  highlights: string[];
  blockers: string[];
  missingFields: string[];
  brandHint?: string;
  qualificationHint?: string;
  mediaHint?: string;
}

export interface DouyinPublishChannelState {
  channelId: ChannelPublicationView["channel"];
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
  rejectionReason?: string;
  lastSyncAt: string;
  commandMode: DouyinPublishCommandMode;
}

export interface DouyinPublishDraft {
  base: DouyinPublishDraftBaseSection;
  category: DouyinPublishDraftCategorySection;
  media: DouyinPublishDraftMediaSection;
  sku: DouyinPublishDraftSkuSection;
  delivery: DouyinPublishDraftDeliverySection;
  ruleContext: DouyinPublishDraftRuleContext;
  channelState: DouyinPublishChannelState;
}

export interface DouyinPublishDraftInput {
  publishView: PublishView;
  productSnapshot: SPUDetail;
  douyinState: DouyinDynamicPanelState;
  channelState: ChannelPublicationView<"douyin">;
}

export interface DouyinCommandBasePayload {
  productId: string;
  productName: string;
  spuCode: string;
  brand: string;
  category: string;
  tags: string[];
  productStatus: ProductStatus;
  updatedAt: string;
  fields: DouyinPublishDraftField[];
}

export interface DouyinCommandCategoryPayload {
  category_id: string;
  category_name: string;
  category_path: string;
  property_values: DouyinCommandPropertyValue[];
}

export interface DouyinCommandPropertyValue {
  property_id: string;
  property_label: string;
  property_values: string[];
  field_type: DouyinDynamicField["type"];
  required: boolean;
  filled: boolean;
  option_values?: string[];
}

export interface DouyinCommandMediaPayload {
  main_images: string[];
  detail_images: string[];
  gallery_images: string[];
}

export interface DouyinCommandSkuPayload {
  sku_list: DouyinCommandSkuListItem[];
  total_stock_num: number;
  sku_code_list: string[];
  priced_sku_count: number;
  image_bound_sku_count: number;
}

export interface DouyinCommandDeliveryPayload {
  shipping: DouyinCommandDeliveryField[];
  commitment: DouyinCommandDeliveryField[];
  status: DouyinCommandDeliveryField[];
}

export interface DouyinCommandDeliveryField {
  field_key: string;
  field_label: string;
  field_value: string;
  required: boolean;
  filled: boolean;
}

export interface DouyinCommandRulePayload {
  title: string;
  summary: string;
  highlights: string[];
  blockers: string[];
  missingFields: string[];
  brandHint?: string;
  qualificationHint?: string;
  mediaHint?: string;
}

export interface DouyinCommandChannelStatePayload {
  channelId: ChannelPublicationView["channel"];
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
  rejectionReason?: string;
  lastSyncAt: string;
  commandMode: DouyinPublishCommandMode;
}

export interface DouyinAddV2CommandPayload {
  base: DouyinCommandBasePayload;
  category: DouyinCommandCategoryPayload;
  media: DouyinCommandMediaPayload;
  sku: DouyinCommandSkuPayload;
  delivery: DouyinCommandDeliveryPayload;
  ruleContext: DouyinCommandRulePayload;
  channelState: DouyinCommandChannelStatePayload;
}

export interface DouyinEditV2CommandPayload extends DouyinAddV2CommandPayload {
  previousChannelState: DouyinCommandChannelStatePayload;
}

export interface DouyinAddV2Command {
  apiPath: "/product/addV2";
  mode: "add";
  payload: DouyinAddV2CommandPayload;
}

export interface DouyinEditV2Command {
  apiPath: "/product/editV2";
  mode: "edit";
  payload: DouyinEditV2CommandPayload;
}

export type DouyinCommand = DouyinAddV2Command | DouyinEditV2Command;
