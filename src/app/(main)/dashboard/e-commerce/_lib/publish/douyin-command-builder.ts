import type {
  DouyinAddV2Command,
  DouyinCommandSkuListItem,
  DouyinEditV2Command,
  DouyinPublishCommandMode,
  DouyinPublishDraft,
} from "./douyin-command.types";

function isFilled(value: string) {
  return value.trim().length > 0;
}

function mapBasePayload(draft: DouyinPublishDraft) {
  return {
    productId: draft.base.productId,
    productName: draft.base.productName,
    spuCode: draft.base.spuCode,
    brand: draft.base.brand,
    category: draft.base.category,
    tags: [...draft.base.tags],
    productStatus: draft.base.productStatus,
    updatedAt: draft.base.updatedAt,
    fields: draft.base.fields.map((field) => ({ ...field })),
  };
}

function mapCategoryPayload(draft: DouyinPublishDraft) {
  const propertyValues = draft.category.fields.map((field) => ({
    property_id: field.fieldId,
    property_label: field.label,
    property_values: field.value.trim().length > 0 ? [field.value] : [],
    field_type: field.type,
    required: field.required,
    filled: isFilled(field.value),
    option_values: field.options?.map((option) => option.value),
  }));

  return {
    category_id: draft.category.categoryId,
    category_name: draft.category.categoryName,
    category_path: draft.category.categoryPath,
    property_values: propertyValues,
  };
}

function mapMediaPayload(draft: DouyinPublishDraft) {
  const coverImageIds = draft.media.coverAssets.map((asset) => asset.assetId);
  const galleryImageIds = draft.media.galleryAssets.map((asset) => asset.assetId);
  const detailImageIds = draft.media.detailAssets.map((asset) => asset.assetId);
  const mainImages = [...coverImageIds, ...galleryImageIds];

  return {
    main_images: mainImages,
    detail_images: [...detailImageIds],
    gallery_images: [...galleryImageIds],
  };
}

function mapSkuPayload(draft: DouyinPublishDraft) {
  const skuList: DouyinCommandSkuListItem[] = draft.sku.items.map((item) => ({
    sku_id: item.skuId,
    sku_name: item.skuName,
    sku_code: item.skuCode,
    sale_price: item.salePrice,
    stock_num: item.stockNum,
    spec_values: [...item.specValues],
    thumb_image: item.thumbAssetId,
  }));

  return {
    sku_list: skuList,
    total_stock_num: skuList.reduce((sum, item) => sum + item.stock_num, 0),
    sku_code_list: skuList.map((item) => item.sku_code),
    priced_sku_count: skuList.filter((item) => item.sale_price.trim().length > 0).length,
    image_bound_sku_count: skuList.filter((item) => item.thumb_image !== null).length,
  };
}

function mapDeliveryPayload(draft: DouyinPublishDraft) {
  const mappedFields = draft.delivery.fields.map((field) => ({
    field_key: field.key,
    field_label: field.label,
    field_value: field.value,
    required: field.required,
    filled: isFilled(field.value),
  }));

  return {
    shipping: mappedFields.filter((field) =>
      ["shop", "deliverMethod", "freightTemplate", "weight"].includes(field.field_key),
    ),
    commitment: mappedFields.filter((field) => field.field_key === "deliveryCommitment"),
    status: mappedFields.filter((field) => field.field_key === "status"),
  };
}

function mapRulePayload(draft: DouyinPublishDraft) {
  return {
    title: draft.ruleContext.title,
    summary: draft.ruleContext.summary,
    highlights: [...draft.ruleContext.highlights],
    blockers: [...draft.ruleContext.blockers],
    missingFields: [...draft.ruleContext.missingFields],
    brandHint: draft.ruleContext.brandHint,
    qualificationHint: draft.ruleContext.qualificationHint,
    mediaHint: draft.ruleContext.mediaHint,
  };
}

function mapChannelStatePayload(draft: DouyinPublishDraft, commandMode: DouyinPublishCommandMode) {
  return {
    ...draft.channelState,
    missingFields: [...draft.channelState.missingFields],
    commandMode,
  };
}

function buildDouyinCommandPayload(draft: DouyinPublishDraft, commandMode: DouyinPublishCommandMode) {
  return {
    base: mapBasePayload(draft),
    category: mapCategoryPayload(draft),
    media: mapMediaPayload(draft),
    sku: mapSkuPayload(draft),
    delivery: mapDeliveryPayload(draft),
    ruleContext: mapRulePayload(draft),
    channelState: mapChannelStatePayload(draft, commandMode),
  };
}

export function buildDouyinAddV2Command(draft: DouyinPublishDraft): DouyinAddV2Command {
  if (draft.channelState.commandMode !== "add") {
    throw new Error(`Expected Douyin draft commandMode to be add, received ${draft.channelState.commandMode}`);
  }

  return {
    apiPath: "/product/addV2",
    mode: "add",
    payload: buildDouyinCommandPayload(draft, "add"),
  };
}

export function buildDouyinEditV2Command(draft: DouyinPublishDraft): DouyinEditV2Command {
  if (draft.channelState.commandMode !== "edit") {
    throw new Error(`Expected Douyin draft commandMode to be edit, received ${draft.channelState.commandMode}`);
  }

  return {
    apiPath: "/product/editV2",
    mode: "edit",
    payload: {
      ...buildDouyinCommandPayload(draft, "edit"),
      previousChannelState: mapChannelStatePayload(draft, draft.channelState.commandMode),
    },
  };
}
