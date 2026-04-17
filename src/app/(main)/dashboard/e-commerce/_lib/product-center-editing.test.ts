import { describe, expect, it } from "vitest";

import { productCenterMock } from "./product-center.mock";
import type { SPUDetail } from "./product-center.types";
import {
  applyChannelFieldDraftMutation,
  buildChannelFieldDraft,
  saveChannelFieldDraft,
  validateChannelFieldDraft,
} from "./product-center-editing";
import {
  channelFieldEditingConfig,
  channelFieldGroupMeta,
  channelFieldGroupOrder,
} from "./product-center-editing.config";

function createWechatReadyProduct(): SPUDetail {
  return {
    ...productCenterMock[0],
    skus: productCenterMock[0].skus.map((sku, index) => ({
      ...sku,
      channelPublishing: {
        wechat: {
          skuId: sku.id,
          skuCode: sku.sellerSku,
          salePrice: sku.priceLabel.replace(/\D/g, ""),
          stockNum: sku.inventory,
          thumbImg: index === 0 ? "asset-coffee-cover" : "asset-coffee-gallery",
          skuAttrs: index === 0 ? ["经典拼配", "500g"] : ["花果拼配", "500g"],
        },
      },
    })),
    channels: {
      ...productCenterMock[0].channels,
      wechat: {
        channel: "wechat",
        publicationStatus: "missing_fields" as const,
        auditStatus: "not_submitted" as const,
        listingStatus: "not_listed" as const,
        missingFields: [],
        lastSyncAt: "2026-04-02 09:40",
        channelSpecificFields: [
          { fieldId: "outProductId", label: "外部商品 ID", value: "WX-001", state: "ready" as const },
          { fieldId: "title", label: "商品标题", value: "冷萃挂耳咖啡礼盒", state: "ready" as const },
          { fieldId: "shortTitle", label: "短标题", value: "冷萃挂耳礼盒", state: "ready" as const },
          { fieldId: "catsV2", label: "类目", value: "咖啡 > 挂耳咖啡", state: "ready" as const },
          { fieldId: "brandId", label: "品牌", value: "栖山实验室", state: "ready" as const },
          { fieldId: "categoryRuleSummary", label: "类目规则摘要", value: "一级类目已确认", state: "ready" as const },
          {
            fieldId: "headImages",
            label: "主图",
            value: "asset-coffee-cover\nasset-coffee-gallery",
            state: "ready" as const,
          },
          {
            fieldId: "detailImages",
            label: "详情图片",
            value: "asset-coffee-detail",
            state: "ready" as const,
          },
          { fieldId: "detailDescription", label: "详情文案", value: "整盒礼赠，适合冷萃场景", state: "ready" as const },
          { fieldId: "deliverMethod", label: "发货方式", value: "express", state: "ready" as const },
          { fieldId: "freightTemplate", label: "运费模板", value: "standard", state: "ready" as const },
          { fieldId: "weight", label: "重量", value: "1.25", state: "ready" as const },
          { fieldId: "attrsSummary", label: "参数摘要", value: "口味 / 规格已确认", state: "ready" as const },
          { fieldId: "qualificationSummary", label: "资质摘要", value: "资质齐全", state: "ready" as const },
          { fieldId: "sevenDayReturn", label: "七天退货", value: "true", state: "ready" as const },
          { fieldId: "freightInsurance", label: "运费险", value: "false", state: "ready" as const },
        ],
      },
    },
    assets: [
      { id: "asset-coffee-cover", type: "cover" as const, label: "封面图", status: "ready" as const },
      { id: "asset-coffee-gallery", type: "gallery" as const, label: "卖点组图", status: "ready" as const },
      { id: "asset-coffee-detail", type: "detail" as const, label: "详情长图", status: "ready" as const },
    ],
  };
}

function createDouyinLegacyLabelOnlyProduct(): SPUDetail {
  return {
    ...productCenterMock[0],
    channels: {
      ...productCenterMock[0].channels,
      douyin: {
        ...productCenterMock[0].channels.douyin,
        channelSpecificFields: [
          { label: "带货短标题", value: "春季上新冷萃挂耳礼盒", state: "ready" as const },
          { label: "推荐场景", value: "gift", state: "ready" as const },
          { label: "发货时效", value: "48h", state: "ready" as const },
          { label: "卖点视频", value: "15 秒商品视频", state: "ready" as const },
          { label: "卖点亮点", value: "冷萃风味\n双拼礼盒", state: "ready" as const },
          { label: "主推素材", value: "asset-coffee-cover", state: "ready" as const },
        ],
      },
    },
  };
}

function createSkuRows(product: {
  skus: Array<{
    id: string;
    sellerSku: string;
    name: string;
    priceLabel: string;
    inventory: number;
    channelPublishing?: {
      wechat?: {
        skuId: string;
        skuCode: string;
        salePrice: string;
        stockNum: number;
        thumbImg: string;
        skuAttrs: string[];
      };
    };
  }>;
}) {
  return product.skus.map((sku) => ({
    rowId: sku.id,
    skuId: sku.id,
    sellerSku: sku.sellerSku,
    name: sku.name,
    fields: {
      skuId: sku.id,
      skuCode: sku.channelPublishing?.wechat?.skuCode ?? sku.sellerSku,
      salePrice: sku.channelPublishing?.wechat?.salePrice ?? sku.priceLabel.replace(/\D/g, ""),
      stockNum: sku.channelPublishing?.wechat?.stockNum ?? sku.inventory,
      thumbImg: sku.channelPublishing?.wechat?.thumbImg ?? "",
      skuAttrs: sku.channelPublishing?.wechat?.skuAttrs ?? [],
    },
  }));
}

describe("product center channel field editing", () => {
  it("exposes the wechat six-stage schema in order with the expected field ids", () => {
    expect(Object.keys(channelFieldEditingConfig)).toEqual(["douyin", "wechat"]);
    expect(channelFieldGroupOrder).toEqual(["basic", "category", "media", "fulfillment", "sku", "compliance"]);
    expect(channelFieldGroupMeta.basic).toEqual({
      label: "发品基础",
      description: "对齐 out_product_id、title、short_title。",
    });

    expect(Object.keys(channelFieldEditingConfig.wechat.groups)).toEqual(channelFieldGroupOrder);
    expect(channelFieldEditingConfig.wechat.groups.basic.map((field) => field.fieldId)).toEqual([
      "outProductId",
      "title",
      "shortTitle",
    ]);
    expect(channelFieldEditingConfig.wechat.groups.category.map((field) => field.fieldId)).toEqual([
      "catsV2",
      "brandId",
      "categoryRuleSummary",
    ]);
    expect(channelFieldEditingConfig.wechat.groups.media.map((field) => field.fieldId)).toEqual([
      "headImages",
      "detailImages",
      "detailDescription",
    ]);
    expect(channelFieldEditingConfig.wechat.groups.fulfillment.map((field) => field.fieldId)).toEqual([
      "deliverMethod",
      "freightTemplate",
      "weight",
    ]);
    expect(channelFieldEditingConfig.wechat.groups.sku).toEqual([]);
    expect(channelFieldEditingConfig.wechat.groups.compliance.map((field) => field.fieldId)).toEqual([
      "attrsSummary",
      "qualificationSummary",
      "sevenDayReturn",
      "freightInsurance",
    ]);
  });

  it("builds a six-group draft for douyin through label fallback when field ids are absent", () => {
    expect(buildChannelFieldDraft(createDouyinLegacyLabelOnlyProduct(), "douyin")).toEqual({
      basic: {
        shortTitle: "春季上新冷萃挂耳礼盒",
        recommendedScene: "gift",
      },
      category: {},
      media: {
        salesVideo: "15 秒商品视频",
        salesHighlights: ["冷萃风味", "双拼礼盒"],
        heroAsset: "asset-coffee-cover",
      },
      fulfillment: {
        deliveryCommitment: "48h",
      },
      sku: {
        rows: [],
      },
      compliance: {},
    });
  });

  it("rehydrates and saves wechat asset-array, number, boolean, and sku rows", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    const skuRows = createSkuRows(productWithWechatSchema);

    expect(buildChannelFieldDraft(productWithWechatSchema, "wechat")).toEqual({
      basic: {
        outProductId: "WX-001",
        title: "冷萃挂耳咖啡礼盒",
        shortTitle: "冷萃挂耳礼盒",
      },
      category: {
        catsV2: "咖啡 > 挂耳咖啡",
        brandId: "栖山实验室",
        categoryRuleSummary: "一级类目已确认",
      },
      media: {
        headImages: ["asset-coffee-cover", "asset-coffee-gallery"],
        detailImages: ["asset-coffee-detail"],
        detailDescription: "整盒礼赠，适合冷萃场景",
      },
      fulfillment: {
        deliverMethod: "express",
        freightTemplate: "standard",
        weight: 1.25,
      },
      sku: {
        rows: skuRows,
      },
      compliance: {
        attrsSummary: "口味 / 规格已确认",
        qualificationSummary: "资质齐全",
        sevenDayReturn: true,
        freightInsurance: false,
      },
    });

    const result = saveChannelFieldDraft(
      productWithWechatSchema,
      "wechat",
      {
        basic: {
          outProductId: "WX-001",
          title: "冷萃挂耳咖啡礼盒",
          shortTitle: "冷萃挂耳礼盒",
        },
        category: {
          catsV2: "咖啡 > 挂耳咖啡",
          brandId: "栖山实验室",
          categoryRuleSummary: "一级类目已确认",
        },
        media: {
          headImages: ["asset-coffee-cover", "asset-coffee-gallery"],
          detailImages: ["asset-coffee-detail"],
          detailDescription: "整盒礼赠，适合冷萃场景",
        },
        fulfillment: {
          deliverMethod: "express",
          freightTemplate: "standard",
          weight: 1.25,
        },
        sku: {
          rows: skuRows,
        },
        compliance: {
          attrsSummary: "口味 / 规格已确认",
          qualificationSummary: "资质齐全",
          sevenDayReturn: true,
          freightInsurance: false,
        },
      },
      { syncAt: "2026-04-02 11:00" },
    );

    expect(result.publicationStatus).toBe("ready_to_list");
    expect(result.missingFields).toEqual([]);
    expect(result.lastSyncAt).toBe("2026-04-02 11:00");
    expect(result.product.skus[0]).toMatchObject({
      channelPublishing: {
        wechat: {
          skuId: "sku-coffee-01",
          skuCode: "DRIP-CLASSIC",
          salePrice: "5900",
          stockNum: 182,
          thumbImg: "asset-coffee-cover",
          skuAttrs: ["经典拼配", "500g"],
        },
      },
    });
    expect(result.product.channels.wechat.channelSpecificFields).toEqual([
      { fieldId: "outProductId", label: "外部商品 ID", value: "WX-001", state: "ready" },
      { fieldId: "title", label: "商品标题", value: "冷萃挂耳咖啡礼盒", state: "ready" },
      { fieldId: "shortTitle", label: "短标题", value: "冷萃挂耳礼盒", state: "ready" },
      { fieldId: "catsV2", label: "类目", value: "咖啡 > 挂耳咖啡", state: "ready" },
      { fieldId: "brandId", label: "品牌", value: "栖山实验室", state: "ready" },
      { fieldId: "categoryRuleSummary", label: "类目规则摘要", value: "一级类目已确认", state: "ready" },
      { fieldId: "headImages", label: "主图", value: "封面图\n卖点组图", state: "ready" },
      { fieldId: "detailImages", label: "详情图片", value: "详情长图", state: "ready" },
      { fieldId: "detailDescription", label: "详情文案", value: "整盒礼赠，适合冷萃场景", state: "ready" },
      { fieldId: "deliverMethod", label: "发货方式", value: "快递发货", state: "ready" },
      { fieldId: "freightTemplate", label: "运费模板", value: "标准模板", state: "ready" },
      { fieldId: "weight", label: "重量", value: "1.25", state: "ready" },
      { fieldId: "attrsSummary", label: "参数摘要", value: "口味 / 规格已确认", state: "ready" },
      { fieldId: "qualificationSummary", label: "资质摘要", value: "资质齐全", state: "ready" },
      { fieldId: "sevenDayReturn", label: "七天退货", value: "true", state: "ready" },
      { fieldId: "freightInsurance", label: "运费险", value: "false", state: "ready" },
    ]);
  });

  it("keeps wechat publication missing when sku rows are incomplete", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    const draft = buildChannelFieldDraft(productWithWechatSchema, "wechat");
    draft.sku.rows = [
      {
        rowId: "sku-coffee-01",
        skuId: "sku-coffee-01",
        sellerSku: "DRIP-CLASSIC",
        name: "经典拼配",
        fields: {
          skuId: "sku-coffee-01",
          skuCode: "DRIP-CLASSIC",
          salePrice: "5900",
          stockNum: 182,
          thumbImg: "",
          skuAttrs: [],
        },
      },
    ];

    const result = saveChannelFieldDraft(productWithWechatSchema, "wechat", draft, { syncAt: "2026-04-02 11:15" });

    expect(result.publicationStatus).toBe("missing_fields");
    expect(result.missingFields).toContain("SKU 发售信息");
    expect(result.product.skus[0].channelPublishing?.wechat).toEqual(
      productWithWechatSchema.skus[0].channelPublishing?.wechat,
    );
  });

  it("flags missing required fields in validation", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    expect(
      validateChannelFieldDraft(productWithWechatSchema, "wechat", {
        basic: {
          outProductId: "",
          title: "",
          shortTitle: "",
        },
        category: {
          catsV2: "",
          brandId: "",
          categoryRuleSummary: "",
        },
        media: {
          headImages: [],
          detailImages: [],
          detailDescription: "",
        },
        fulfillment: {
          deliverMethod: "",
          freightTemplate: "",
          weight: "",
        },
        sku: {
          rows: createSkuRows(productWithWechatSchema),
        },
        compliance: {
          attrsSummary: "",
          qualificationSummary: "",
          sevenDayReturn: "",
          freightInsurance: "",
        },
      }),
    ).toEqual({
      isValid: false,
      missingFields: [
        "外部商品 ID",
        "商品标题",
        "短标题",
        "类目",
        "品牌",
        "类目规则摘要",
        "主图",
        "详情图片",
        "详情文案",
        "发货方式",
        "运费模板",
        "重量",
        "参数摘要",
        "资质摘要",
        "七天退货",
        "运费险",
      ],
    });
  });

  it("treats invalid typed required values as missing instead of ready_to_list", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    const draft = buildChannelFieldDraft(productWithWechatSchema, "wechat");
    draft.fulfillment.weight = "abc" as unknown as number;
    draft.fulfillment.deliverMethod = "unknown";
    draft.compliance.sevenDayReturn = "maybe" as unknown as boolean;
    draft.media.headImages = ["asset-not-found"];
    draft.sku.rows[0].fields.salePrice = "¥59.00";

    const result = saveChannelFieldDraft(productWithWechatSchema, "wechat", draft, { syncAt: "2026-04-02 11:30" });

    expect(result.publicationStatus).toBe("missing_fields");
    expect(result.missingFields).toEqual(
      expect.arrayContaining(["发货方式", "主图", "重量", "七天退货", "SKU 发售信息"]),
    );
  });

  it("falls back to label matching when a stale field id is present", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    const staleEntry = productWithWechatSchema.channels.wechat.channelSpecificFields[0];
    productWithWechatSchema.channels.wechat.channelSpecificFields[0] = {
      ...staleEntry,
      fieldId: "legacy-out-product-id",
      label: "外部商品 ID",
      value: "WX-001",
    };

    expect(buildChannelFieldDraft(productWithWechatSchema, "wechat").basic?.outProductId).toBe("WX-001");
  });

  it("treats empty or incomplete sku rows as missing", () => {
    const productWithWechatSchema = createWechatReadyProduct();
    const draft = buildChannelFieldDraft(productWithWechatSchema, "wechat");
    draft.sku.rows = [
      {
        rowId: "sku-coffee-01",
        skuId: "sku-coffee-01",
        sellerSku: "DRIP-CLASSIC",
        name: "经典拼配",
        fields: {
          skuId: "sku-coffee-01",
          skuCode: "DRIP-CLASSIC",
          salePrice: "¥59.00",
          stockNum: 182,
          thumbImg: "",
          skuAttrs: [],
        },
      },
    ];

    const result = saveChannelFieldDraft(productWithWechatSchema, "wechat", draft, { syncAt: "2026-04-02 11:45" });

    expect(result.publicationStatus).toBe("missing_fields");
    expect(result.missingFields).toEqual(expect.arrayContaining(["SKU 发售信息"]));
  });

  it("rejects negative or fractional wechat sku stock numbers", () => {
    for (const invalidStockNum of [-1, 1.5]) {
      const productWithWechatSchema = createWechatReadyProduct();
      const draft = buildChannelFieldDraft(productWithWechatSchema, "wechat");
      draft.sku.rows[0].fields.stockNum = invalidStockNum;

      const result = saveChannelFieldDraft(productWithWechatSchema, "wechat", draft, { syncAt: "2026-04-02 11:50" });

      expect(result.publicationStatus).toBe("missing_fields");
      expect(result.missingFields).toEqual(expect.arrayContaining(["SKU 发售信息"]));
      expect(result.product.skus[0].channelPublishing?.wechat).toEqual(
        productWithWechatSchema.skus[0].channelPublishing?.wechat,
      );
    }
  });

  it("keeps the alias export wired to the same mutation engine", () => {
    expect(applyChannelFieldDraftMutation).toBe(saveChannelFieldDraft);
  });
});
