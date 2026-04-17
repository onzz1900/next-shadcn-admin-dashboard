import type { AssetItem, ChannelId, PublicationStatus, SPUDetail } from "./product-center.types";

export type EditableChannelId = Extract<ChannelId, "douyin" | "wechat">;
export type ChannelFieldGroupId = "basic" | "category" | "media" | "fulfillment" | "sku" | "compliance";
export type ChannelFieldType =
  | "text"
  | "textarea"
  | "select"
  | "asset"
  | "asset-array"
  | "string-array"
  | "number"
  | "boolean";
export type ChannelFieldDraftValue = string | string[] | number | boolean;

export interface ChannelFieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChannelFieldDefinition {
  fieldId: string;
  key: string;
  label: string;
  required: boolean;
  group: ChannelFieldGroupId;
  type: ChannelFieldType;
  description?: string;
  placeholder?: string;
  options?: readonly ChannelFieldOption[];
  assetTypes?: readonly AssetItem["type"][];
}

export interface ChannelFieldDraftRow {
  rowId?: string;
  skuId?: string;
  sellerSku?: string;
  name?: string;
  fields: Record<string, ChannelFieldDraftValue>;
}

export interface ChannelFieldGroupDraft {
  label?: string;
  description?: string;
  rows?: ChannelFieldDraftRow[];
  [fieldKey: string]: ChannelFieldDraftValue | ChannelFieldDraftRow[] | string | undefined;
}

export interface ChannelFieldDraft {
  basic: ChannelFieldGroupDraft;
  category: ChannelFieldGroupDraft;
  media: ChannelFieldGroupDraft;
  fulfillment: ChannelFieldGroupDraft;
  sku: ChannelFieldGroupDraft;
  compliance: ChannelFieldGroupDraft;
}

export type ChannelFieldGroupConfig = Record<ChannelFieldGroupId, readonly ChannelFieldDefinition[]>;

export interface ChannelFieldGroupMeta {
  label: string;
  description: string;
}

export type ChannelFieldGroupMetaMap = Record<ChannelFieldGroupId, ChannelFieldGroupMeta>;

export interface ChannelFieldChannelConfig {
  groups: ChannelFieldGroupConfig;
}

export type ChannelFieldEditingConfig = Record<EditableChannelId, ChannelFieldChannelConfig>;

export interface ChannelFieldValidationResult {
  isValid: boolean;
  missingFields: string[];
}

export interface ChannelFieldMutationOptions {
  syncAt?: string;
}

export interface ChannelFieldMutationResult {
  product: SPUDetail;
  publicationStatus: PublicationStatus;
  missingFields: string[];
  lastSyncAt: string;
}
