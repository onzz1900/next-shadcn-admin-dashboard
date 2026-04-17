import type { AssetItem, SKUItem, SPUDetail } from "../product-center.types";
import type {
  DouyinPublishDraft,
  DouyinPublishDraftAsset,
  DouyinPublishDraftField,
  DouyinPublishDraftInput,
  DouyinPublishDraftSkuItem,
} from "./douyin-command.types";
import type { DouyinDynamicField, DouyinDynamicPanelState } from "./douyin-dynamic.types";
import type { PublishSectionView, PublishView } from "./publish.types";

function cloneField(field: DouyinDynamicField): DouyinDynamicField {
  return {
    ...field,
    options: field.options?.map((option) => ({ ...option })),
  };
}

function cloneFields(fields: PublishSectionView["fields"]): DouyinPublishDraftField[] {
  return fields.map((field) => ({ ...field }));
}

function mapAsset(asset: AssetItem): DouyinPublishDraftAsset {
  return {
    assetId: asset.id,
    type: asset.type,
    label: asset.label,
    status: asset.status,
  };
}

function normalizeSalePrice(priceLabel: string) {
  const normalized = priceLabel.replace(/[^\d.]/g, "");

  return normalized.length > 0 ? normalized : priceLabel;
}

function buildSkuThumbAssetIds(assets: AssetItem[]) {
  const availableAssets = assets.filter((asset) => asset.status === "ready");

  if (availableAssets.length === 0) {
    return [];
  }

  return availableAssets.map((asset) => asset.id);
}

function mapSkuItem(sku: SKUItem, index: number, assets: AssetItem[]): DouyinPublishDraftSkuItem {
  const availableAssetIds = buildSkuThumbAssetIds(assets);
  const thumbAssetId = (() => {
    if (availableAssetIds.length === 0) {
      return null;
    }

    return availableAssetIds[index % availableAssetIds.length] ?? null;
  })();

  return {
    skuId: sku.id,
    skuName: sku.name,
    skuCode: sku.sellerSku,
    priceLabel: sku.priceLabel,
    salePrice: normalizeSalePrice(sku.priceLabel),
    stockNum: sku.inventory,
    specValues: [sku.name],
    thumbAssetId,
    sourceSellerSku: sku.sellerSku,
  };
}

function buildBaseSection(publishView: PublishView, productSnapshot: SPUDetail): DouyinPublishDraft["base"] {
  const section = publishView.common.sections.find((item) => item.id === "base");

  return {
    productId: publishView.productId,
    productName: publishView.productName,
    spuCode: publishView.spuCode,
    brand: productSnapshot.brand,
    category: productSnapshot.category,
    tags: productSnapshot.tags,
    productStatus: productSnapshot.productStatus,
    updatedAt: productSnapshot.updatedAt,
    fields: cloneFields(section?.fields ?? []),
  };
}

function buildMediaSection(publishView: PublishView, productSnapshot: SPUDetail): DouyinPublishDraft["media"] {
  const section = publishView.common.sections.find((item) => item.id === "media");

  return {
    fields: cloneFields(section?.fields ?? []),
    coverAssets: productSnapshot.assets.filter((asset) => asset.type === "cover").map(mapAsset),
    galleryAssets: productSnapshot.assets.filter((asset) => asset.type === "gallery").map(mapAsset),
    detailAssets: productSnapshot.assets.filter((asset) => asset.type === "detail").map(mapAsset),
  };
}

function buildSkuSection(publishView: PublishView, productSnapshot: SPUDetail): DouyinPublishDraft["sku"] {
  const section = publishView.common.sections.find((item) => item.id === "sku");

  return {
    fields: cloneFields(section?.fields ?? []),
    items: productSnapshot.skus.map((sku, index) => mapSkuItem(sku, index, productSnapshot.assets)),
  };
}

function buildDeliverySection(publishView: PublishView, productSnapshot: SPUDetail): DouyinPublishDraft["delivery"] {
  const section = publishView.common.sections.find((item) => item.id === "delivery");

  return {
    fields: cloneFields(section?.fields ?? []),
    shop: productSnapshot.shop,
  };
}

function buildCategorySection(douyinState: DouyinDynamicPanelState): DouyinPublishDraft["category"] {
  const category = douyinState.category ?? {
    categoryId: douyinState.categoryId ?? "unknown",
    categoryName: "未选择类目",
    categoryPath: "未选择类目",
  };

  return {
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    categoryPath: category.categoryPath,
    fields: douyinState.fields.map(cloneField),
  };
}

function buildRuleContext(douyinState: DouyinDynamicPanelState): DouyinPublishDraft["ruleContext"] {
  return {
    title: douyinState.rules.title,
    summary: douyinState.rules.summary,
    highlights: [...douyinState.rules.highlights],
    blockers: [...douyinState.rules.blockers],
    missingFields: [...douyinState.missingFields],
    brandHint: douyinState.rules.brandHint,
    qualificationHint: douyinState.rules.qualificationHint,
    mediaHint: douyinState.rules.mediaHint,
  };
}

function buildChannelState(channelState: DouyinPublishDraftInput["channelState"]): DouyinPublishDraft["channelState"] {
  return {
    channelId: channelState.channel,
    publicationStatus: channelState.publicationStatus,
    auditStatus: channelState.auditStatus,
    listingStatus: channelState.listingStatus,
    missingFields: [...channelState.missingFields],
    rejectionReason: channelState.rejectionReason,
    lastSyncAt: channelState.lastSyncAt,
    commandMode: channelState.publicationStatus === "not_started" ? "add" : "edit",
  };
}

export function buildDouyinPublishDraft({
  publishView,
  productSnapshot,
  douyinState,
  channelState,
}: DouyinPublishDraftInput): DouyinPublishDraft {
  return {
    base: buildBaseSection(publishView, productSnapshot),
    category: buildCategorySection(douyinState),
    media: buildMediaSection(publishView, productSnapshot),
    sku: buildSkuSection(publishView, productSnapshot),
    delivery: buildDeliverySection(publishView, productSnapshot),
    ruleContext: buildRuleContext(douyinState),
    channelState: buildChannelState(channelState),
  };
}
