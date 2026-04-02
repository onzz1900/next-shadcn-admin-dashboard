export type ChannelId = "douyin" | "wechat";
export type ProductStatus = "draft" | "ready" | "archived";
export type PublicationStatus =
  | "not_started"
  | "missing_fields"
  | "ready_to_list"
  | "in_review"
  | "rejected"
  | "live"
  | "offline"
  | "sync_error";
export type AuditStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type ListingStatus = "not_listed" | "listed" | "delisted";

export interface ChannelFieldState {
  label: string;
  value: string;
  state: "ready" | "missing" | "warning";
}

export interface ChannelPublicationView {
  channel: ChannelId;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
  rejectionReason?: string;
  lastSyncAt: string;
  channelSpecificFields: ChannelFieldState[];
}

export interface SKUItem {
  id: string;
  name: string;
  sellerSku: string;
  priceLabel: string;
  inventory: number;
}

export interface AssetItem {
  id: string;
  type: "cover" | "gallery" | "detail";
  label: string;
  status: "ready" | "missing";
}

export interface SPUSummary {
  id: string;
  spuCode: string;
  name: string;
  category: string;
  brand: string;
  shop: string;
  skuCount: number;
  completionPercent: number;
  productStatus: ProductStatus;
  updatedAt: string;
  channels: Record<ChannelId, ChannelPublicationView>;
}

export interface SPUDetail extends SPUSummary {
  description: string;
  tags: string[];
  skus: SKUItem[];
  assets: AssetItem[];
}

export interface ProductCenterFilters {
  search: string;
  productStatus: "all" | ProductStatus;
  channel: "all" | ChannelId;
  channelState: "all" | PublicationStatus;
}

export interface ProductCenterMetrics {
  totalProducts: number;
  missingContent: number;
  readyToPublish: number;
  inReview: number;
  syncErrors: number;
}

export interface PublicationWorkbenchRow {
  productId: string;
  productName: string;
  channel: ChannelId;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  blocker: string;
  updatedAt: string;
}
