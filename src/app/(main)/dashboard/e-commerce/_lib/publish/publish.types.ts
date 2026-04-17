import type { ChannelId } from "../product-center.types";

export type PublishSectionId = "base" | "media" | "attributes" | "sku" | "pricing" | "delivery";

export interface PublishPlatformExtensionSection {
  id: string;
  title: string;
  description: string;
}

export interface PublishFieldView {
  key: string;
  label: string;
  value: string;
}

export interface PublishSectionView {
  id: PublishSectionId;
  title: string;
  description: string;
  fields: PublishFieldView[];
}

export interface PlatformPublishView {
  platformId: ChannelId;
  title: string;
  summary: string;
  status: string;
  missingFields: string[];
  extensionSections: PublishPlatformExtensionSection[];
}

export interface PublishValidationItem {
  label: string;
  value: string;
}

export interface PublishView {
  productId: string;
  productName: string;
  spuCode: string;
  common: {
    sections: PublishSectionView[];
  };
  platforms: PlatformPublishView[];
  validation: {
    title: string;
    items: PublishValidationItem[];
  };
}

export interface PublishMockContext {
  douyin: {
    categoryName: string;
    ruleHighlights: string[];
  };
}
