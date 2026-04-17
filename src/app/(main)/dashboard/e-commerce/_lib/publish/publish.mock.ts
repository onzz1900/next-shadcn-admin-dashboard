import { productCenterMock } from "../product-center.mock";
import type { SPUDetail } from "../product-center.types";
import type { PublishMockContext, PublishSectionView, PublishView } from "./publish.types";

export const publishMock: PublishMockContext = {
  douyin: {
    categoryName: "咖啡冲饮 > 挂耳咖啡",
    ruleHighlights: ["主图需 1:1", "品牌资质必填", "销售属性需完整"],
  },
};

function buildPriceBand(product: SPUDetail) {
  if (product.skus.length === 0) {
    return "未配置";
  }

  const uniquePrices = Array.from(new Set(product.skus.map((sku) => sku.priceLabel)));

  if (uniquePrices.length === 1) {
    return uniquePrices[0];
  }

  return `${uniquePrices[0]} ~ ${uniquePrices.at(-1)}`;
}

function buildCommonSections(product: SPUDetail): PublishSectionView[] {
  const readyAssets = product.assets.filter((asset) => asset.status === "ready").length;
  const totalInventory = product.skus.reduce((sum, sku) => sum + sku.inventory, 0);

  return [
    {
      id: "base",
      title: "基础信息",
      description: "先确认商品主档信息，再展开各平台发布配置。",
      fields: [
        { key: "name", label: "商品名称", value: product.name },
        { key: "brand", label: "品牌", value: product.brand },
      ],
    },
    {
      id: "media",
      title: "通用素材",
      description: "这里保留跨平台可复用的素材入口。",
      fields: [
        { key: "assetCount", label: "素材槽位", value: `${product.assets.length} 项` },
        { key: "assetReady", label: "可复用素材", value: `${readyAssets} / ${product.assets.length}` },
      ],
    },
    {
      id: "attributes",
      title: "通用属性",
      description: "统一承载跨平台通用类目与属性信息。",
      fields: [
        { key: "category", label: "商品类目", value: product.category },
        { key: "tags", label: "主档标签", value: product.tags.join(" / ") },
      ],
    },
    {
      id: "sku",
      title: "SKU 基础",
      description: "统一承载商品 SKU 基础信息。",
      fields: [
        { key: "skuCount", label: "SKU 数量", value: String(product.skus.length) },
        { key: "sellerSku", label: "首个商家编码", value: product.skus[0]?.sellerSku ?? "未配置" },
      ],
    },
    {
      id: "pricing",
      title: "默认价格库存",
      description: "统一承载商品价格基线。",
      fields: [
        { key: "priceBand", label: "价格带", value: buildPriceBand(product) },
        { key: "inventory", label: "总库存", value: `${totalInventory}` },
      ],
    },
    {
      id: "delivery",
      title: "默认履约",
      description: "统一承载发货与履约基线。",
      fields: [
        { key: "shop", label: "默认发货店铺", value: product.shop },
        { key: "deliverMethod", label: "发货方式", value: "express" },
        { key: "freightTemplate", label: "运费模板", value: "standard" },
        { key: "weight", label: "重量", value: "0.8" },
        { key: "deliveryCommitment", label: "履约承诺", value: "48h" },
        { key: "status", label: "主档状态", value: product.productStatus },
      ],
    },
  ];
}

function buildPlatformSections(productId: string) {
  const product = productCenterMock.find((item) => item.id === productId);

  if (!product) {
    return [];
  }

  return Object.values(product.channels).map((channel) => ({
    platformId: channel.channel,
    title: channel.channel === "douyin" ? "抖店配置" : "视频号配置",
    summary: channel.channel === "douyin" ? "保留抖店平台专属入口。" : "保留视频号平台专属入口。",
    status: channel.publicationStatus,
    missingFields: channel.missingFields,
    extensionSections: [],
  }));
}

function buildValidationItems(platforms: PublishView["platforms"]) {
  const missingFields = platforms.flatMap((platform) => platform.missingFields);

  if (missingFields.length === 0) {
    return [{ label: "校验结果", value: "当前没有显式阻塞项。" }];
  }

  return [
    { label: "缺失字段", value: `${missingFields.length} 项` },
    { label: "首个阻塞项", value: missingFields[0] },
  ];
}

export function createPublishView(productId: string): PublishView | undefined {
  const product = productCenterMock.find((item) => item.id === productId);

  if (!product) {
    return undefined;
  }

  const platforms = buildPlatformSections(productId);

  return {
    productId: product.id,
    productName: product.name,
    spuCode: product.spuCode,
    common: {
      sections: buildCommonSections(product),
    },
    platforms,
    validation: {
      title: "发布校验",
      items: buildValidationItems(platforms),
    },
  };
}
