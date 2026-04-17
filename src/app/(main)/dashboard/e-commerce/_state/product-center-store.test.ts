import { describe, expect, it } from "vitest";

import { productCenterMock } from "../_lib/product-center.mock";
import type { SPUDetail } from "../_lib/product-center.types";
import { buildChannelFieldDraft } from "../_lib/product-center-editing";
import { createProductCenterStore } from "./product-center-store";

function createWechatReadyProduct(): SPUDetail {
  return {
    ...productCenterMock[0],
    skus: productCenterMock[0].skus.map((sku, index) => ({
      ...sku,
      channelPublishing: {
        wechat: {
          skuId: sku.id,
          skuCode: sku.sellerSku,
          salePrice: index === 0 ? "5900" : "6900",
          stockNum: sku.inventory,
          thumbImg: index === 0 ? "asset-coffee-cover" : "asset-coffee-gallery",
          skuAttrs: index === 0 ? ["口味:经典拼配"] : ["口味:花果拼配"],
        },
      },
    })),
    channels: {
      ...productCenterMock[0].channels,
      wechat: {
        channel: "wechat",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
        lastSyncAt: "2026-04-02 09:40",
        channelSpecificFields: [
          { fieldId: "outProductId", label: "外部商品 ID", value: "WX-001", state: "ready" },
          { fieldId: "title", label: "商品标题", value: "冷萃挂耳咖啡礼盒", state: "ready" },
          { fieldId: "shortTitle", label: "短标题", value: "冷萃挂耳礼盒", state: "ready" },
          { fieldId: "catsV2", label: "类目", value: "咖啡 > 挂耳咖啡", state: "ready" },
          { fieldId: "brandId", label: "品牌", value: "栖山实验室", state: "ready" },
          { fieldId: "categoryRuleSummary", label: "类目规则摘要", value: "一级类目已确认", state: "ready" },
          { fieldId: "headImages", label: "主图", value: "asset-coffee-cover\nasset-coffee-gallery", state: "ready" },
          { fieldId: "detailImages", label: "详情图片", value: "asset-coffee-detail", state: "ready" },
          { fieldId: "detailDescription", label: "详情文案", value: "整盒礼赠，适合冷萃场景", state: "ready" },
          { fieldId: "deliverMethod", label: "发货方式", value: "express", state: "ready" },
          { fieldId: "freightTemplate", label: "运费模板", value: "standard", state: "ready" },
          { fieldId: "weight", label: "重量", value: "1.25", state: "ready" },
          { fieldId: "attrsSummary", label: "参数摘要", value: "口味 / 规格已确认", state: "ready" },
          { fieldId: "qualificationSummary", label: "资质摘要", value: "资质齐全", state: "ready" },
          { fieldId: "sevenDayReturn", label: "七天退货", value: "true", state: "ready" },
          { fieldId: "freightInsurance", label: "运费险", value: "true", state: "ready" },
        ],
      },
    },
  };
}

describe("product center store", () => {
  it("clones the mock data for each store instance", () => {
    const storeA = createProductCenterStore();
    const storeB = createProductCenterStore();

    expect(storeA.getState().products).not.toBe(productCenterMock);
    expect(storeB.getState().products).not.toBe(productCenterMock);
    expect(storeA.getState().products).not.toBe(storeB.getState().products);
    expect(storeA.getState().products[0]).not.toBe(storeB.getState().products[0]);
  });

  it("deep clones nested sku channel publishing data across store instances", () => {
    const storeA = createProductCenterStore();
    const storeB = createProductCenterStore();

    const skuPublishingA = storeA.getState().products[0].skus[0].channelPublishing?.wechat;
    const skuPublishingB = storeB.getState().products[0].skus[0].channelPublishing?.wechat;

    expect(skuPublishingA).toBeDefined();
    expect(skuPublishingB).toBeDefined();
    expect(skuPublishingA).not.toBe(skuPublishingB);
    expect(skuPublishingA?.skuAttrs).not.toBe(skuPublishingB?.skuAttrs);
  });

  it("exposes shared product data and derived selectors", () => {
    const store = createProductCenterStore();

    expect(store.getState().products).toHaveLength(productCenterMock.length);
    expect(store.getState().getProductById("spu-hanger-coffee")?.name).toBe("冷萃挂耳咖啡礼盒");
    expect(store.getState().getMetrics()).toEqual({
      totalProducts: 3,
      missingContent: 2,
      readyToPublish: 1,
      inReview: 1,
      syncErrors: 1,
    });
    expect(
      store
        .getState()
        .getFilteredProducts({
          search: "咖啡",
          productStatus: "all",
          channel: "all",
          channelState: "all",
        })
        .map((item) => item.id),
    ).toEqual(["spu-hanger-coffee", "spu-coffee-trial"]);
    expect(store.getState().getWorkbenchRows()).toHaveLength(6);
  });

  it("persists a channel draft into the shared products collection", () => {
    const store = createProductCenterStore([createWechatReadyProduct(), ...productCenterMock.slice(1)]);

    store.getState().saveDraft("spu-hanger-coffee", "wechat", {
      basic: {
        outProductId: "WX-COFFEE-001",
        title: "冷萃挂耳咖啡礼盒",
        shortTitle: "冷萃挂耳礼盒",
      },
      category: {
        catsV2: "coffee-gift",
        brandId: "qishan-lab",
        categoryRuleSummary: "口味、规格必填",
      },
      media: {
        headImages: ["asset-coffee-cover", "asset-coffee-gallery"],
        detailImages: ["asset-coffee-detail"],
        detailDescription: "礼盒详情页文案",
      },
      fulfillment: {
        deliverMethod: "express",
        freightTemplate: "standard",
        weight: 0.8,
      },
      sku: {
        rows: [
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
              thumbImg: "asset-coffee-cover",
              skuAttrs: ["口味:经典拼配"],
            },
          },
          {
            rowId: "sku-coffee-02",
            skuId: "sku-coffee-02",
            sellerSku: "DRIP-FRUITY",
            name: "花果拼配",
            fields: {
              skuId: "sku-coffee-02",
              skuCode: "DRIP-FRUITY",
              salePrice: "6900",
              stockNum: 96,
              thumbImg: "asset-coffee-gallery",
              skuAttrs: ["口味:花果拼配"],
            },
          },
        ],
      },
      compliance: {
        attrsSummary: "口味:经典拼配\n规格:10袋/盒",
        qualificationSummary: "食品经营许可已备案",
        sevenDayReturn: true,
        freightInsurance: true,
      },
    });

    expect(store.getState().getProductById("spu-hanger-coffee")?.channels.wechat.publicationStatus).toBe(
      "ready_to_list",
    );
    expect(store.getState().getProductById("spu-hanger-coffee")?.channels.wechat.channelSpecificFields).toEqual(
      expect.arrayContaining([
        { fieldId: "outProductId", label: "外部商品 ID", value: "WX-COFFEE-001", state: "ready" },
        { fieldId: "headImages", label: "主图", value: "封面图\n卖点组图", state: "ready" },
        { fieldId: "freightTemplate", label: "运费模板", value: "标准模板", state: "ready" },
        { fieldId: "sevenDayReturn", label: "七天退货", value: "true", state: "ready" },
      ]),
    );
    const updatedProduct = store.getState().getProductById("spu-hanger-coffee");

    expect(updatedProduct).toBeDefined();
    expect(buildChannelFieldDraft(updatedProduct as NonNullable<typeof updatedProduct>, "wechat")).toEqual({
      basic: {
        outProductId: "WX-COFFEE-001",
        title: "冷萃挂耳咖啡礼盒",
        shortTitle: "冷萃挂耳礼盒",
      },
      category: {
        catsV2: "coffee-gift",
        brandId: "qishan-lab",
        categoryRuleSummary: "口味、规格必填",
      },
      media: {
        headImages: ["asset-coffee-cover", "asset-coffee-gallery"],
        detailImages: ["asset-coffee-detail"],
        detailDescription: "礼盒详情页文案",
      },
      fulfillment: {
        deliverMethod: "express",
        freightTemplate: "standard",
        weight: 0.8,
      },
      sku: {
        rows: [
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
              thumbImg: "asset-coffee-cover",
              skuAttrs: ["口味:经典拼配"],
            },
          },
          {
            rowId: "sku-coffee-02",
            skuId: "sku-coffee-02",
            sellerSku: "DRIP-FRUITY",
            name: "花果拼配",
            fields: {
              skuId: "sku-coffee-02",
              skuCode: "DRIP-FRUITY",
              salePrice: "6900",
              stockNum: 96,
              thumbImg: "asset-coffee-gallery",
              skuAttrs: ["口味:花果拼配"],
            },
          },
        ],
      },
      compliance: {
        attrsSummary: "口味:经典拼配\n规格:10袋/盒",
        qualificationSummary: "食品经营许可已备案",
        sevenDayReturn: true,
        freightInsurance: true,
      },
    });
    expect(updatedProduct?.skus[0].channelPublishing?.wechat).toEqual({
      skuId: "sku-coffee-01",
      skuCode: "DRIP-CLASSIC",
      salePrice: "5900",
      stockNum: 182,
      thumbImg: "asset-coffee-cover",
      skuAttrs: ["口味:经典拼配"],
    });
    expect(
      store
        .getState()
        .getWorkbenchRows()
        .some((row) => row.productId === "spu-hanger-coffee" && row.channel === "wechat"),
    ).toBe(true);
  });

  it("throws when saving a draft for an unknown product", () => {
    const store = createProductCenterStore();

    expect(() =>
      store.getState().saveDraft("missing-product", "wechat", {
        basic: {
          outProductId: "WX-MISSING-001",
          title: "缺失商品",
          shortTitle: "缺失商品",
        },
        category: {
          catsV2: "coffee-gift",
          brandId: "qishan-lab",
          categoryRuleSummary: "口味、规格必填",
        },
        media: {
          headImages: ["asset-trial-cover"],
          detailImages: [],
          detailDescription: "",
        },
        fulfillment: {
          deliverMethod: "express",
          freightTemplate: "standard",
          weight: 0.5,
        },
        sku: {
          rows: [],
        },
        compliance: {
          attrsSummary: "",
          qualificationSummary: "",
          sevenDayReturn: true,
          freightInsurance: true,
        },
      }),
    ).toThrow("Product missing-product not found");
  });

  it("retries a failed channel sync into ready to list", () => {
    const store = createProductCenterStore();

    store.getState().retryChannelSync("spu-jasmine-tea", "wechat", "2026-04-03 06:20");

    const updatedChannel = store.getState().getProductById("spu-jasmine-tea")?.channels.wechat;

    expect(updatedChannel).toBeDefined();
    expect(updatedChannel?.publicationStatus).toBe("ready_to_list");
    expect(updatedChannel?.listingStatus).toBe("not_listed");
    expect(updatedChannel?.rejectionReason).toBeUndefined();
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-03 06:20");
    expect(updatedChannel?.channelSpecificFields).toContainEqual({
      fieldId: "priceBand",
      label: "价格带",
      value: "已同步",
      state: "ready",
    });
  });

  it("submits a channel for review", () => {
    const store = createProductCenterStore([createWechatReadyProduct(), ...productCenterMock.slice(1)]);

    store.getState().submitChannelForReview("spu-hanger-coffee", "wechat", "2026-04-03 07:00");

    const updatedChannel = store.getState().getProductById("spu-hanger-coffee")?.channels.wechat;

    expect(updatedChannel).toBeDefined();
    expect(updatedChannel?.publicationStatus).toBe("in_review");
    expect(updatedChannel?.auditStatus).toBe("pending");
    expect(updatedChannel?.listingStatus).toBe("not_listed");
    expect(updatedChannel?.rejectionReason).toBeUndefined();
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-03 07:00");
  });

  it("rejects submitting a channel for review when fields are still missing", () => {
    const store = createProductCenterStore();

    expect(() => store.getState().submitChannelForReview("spu-hanger-coffee", "wechat", "2026-04-03 07:00")).toThrow(
      "Cannot submit spu-hanger-coffee/wechat for review while fields are missing",
    );

    const channel = store.getState().getProductById("spu-hanger-coffee")?.channels.wechat;
    expect(channel?.publicationStatus).toBe("missing_fields");
    expect(channel?.auditStatus).toBe("not_submitted");
    expect(channel?.listingStatus).toBe("not_listed");
  });

  it("updates only the channel sync time", () => {
    const store = createProductCenterStore();

    const before = store.getState().getProductById("spu-hanger-coffee")?.channels.douyin;

    store.getState().updateChannel("spu-hanger-coffee", "douyin", "2026-04-03 07:10");

    const updatedChannel = store.getState().getProductById("spu-hanger-coffee")?.channels.douyin;

    expect(updatedChannel).toBeDefined();
    expect(updatedChannel?.publicationStatus).toBe(before?.publicationStatus);
    expect(updatedChannel?.auditStatus).toBe(before?.auditStatus);
    expect(updatedChannel?.listingStatus).toBe(before?.listingStatus);
    expect(updatedChannel?.rejectionReason).toBe(before?.rejectionReason);
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-03 07:10");
  });

  it("lists a ready channel into live", () => {
    const store = createProductCenterStore();

    store.getState().listChannel("spu-hanger-coffee", "douyin", "2026-04-03 06:40");

    const updatedChannel = store.getState().getProductById("spu-hanger-coffee")?.channels.douyin;

    expect(updatedChannel).toBeDefined();
    expect(updatedChannel?.publicationStatus).toBe("live");
    expect(updatedChannel?.listingStatus).toBe("listed");
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-03 06:40");
  });

  it("delists a live channel into offline", () => {
    const store = createProductCenterStore();

    store.getState().delistChannel("spu-coffee-trial", "douyin", "2026-04-03 06:50");

    const updatedChannel = store.getState().getProductById("spu-coffee-trial")?.channels.douyin;

    expect(updatedChannel).toBeDefined();
    expect(updatedChannel?.publicationStatus).toBe("offline");
    expect(updatedChannel?.listingStatus).toBe("delisted");
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-03 06:50");
  });
});
