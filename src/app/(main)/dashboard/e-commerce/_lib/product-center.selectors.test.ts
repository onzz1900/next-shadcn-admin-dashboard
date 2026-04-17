import { describe, expect, it } from "vitest";

import { productCenterMock } from "./product-center.mock";
import {
  filterProductSummaries,
  getProductById,
  getProductCenterMetrics,
  getPublicationWorkbenchRows,
} from "./product-center.selectors";
import { saveChannelFieldDraft } from "./product-center-editing";

describe("productCenter selectors", () => {
  it("computes homepage metrics from shared mock data", () => {
    expect(getProductCenterMetrics(productCenterMock)).toEqual({
      totalProducts: 3,
      missingContent: 2,
      readyToPublish: 1,
      inReview: 1,
      syncErrors: 1,
    });
  });

  it("filters products by search keyword and channel state", () => {
    expect(
      filterProductSummaries(productCenterMock, {
        search: "挂耳",
        productStatus: "all",
        channel: "all",
        channelState: "all",
      }).map((item) => item.id),
    ).toEqual(["spu-hanger-coffee"]);

    expect(
      filterProductSummaries(productCenterMock, {
        search: "",
        productStatus: "all",
        channel: "wechat",
        channelState: "sync_error",
      }).map((item) => item.id),
    ).toEqual(["spu-jasmine-tea"]);

    const selectedChannelNotStarted = [
      {
        ...productCenterMock[0],
        channels: {
          ...productCenterMock[0].channels,
          douyin: {
            ...productCenterMock[0].channels.douyin,
            publicationStatus: "not_started" as const,
          },
        },
      },
    ];

    expect(
      filterProductSummaries(selectedChannelNotStarted, {
        search: "",
        productStatus: "all",
        channel: "douyin",
        channelState: "not_started",
      }).map((item) => item.id),
    ).toEqual(["spu-hanger-coffee"]);
  });

  it("finds a product detail by id", () => {
    expect(getProductById(productCenterMock, "spu-hanger-coffee")?.name).toBe("冷萃挂耳咖啡礼盒");
  });

  it("flattens actionable publication rows for the workbench", () => {
    const rows = getPublicationWorkbenchRows([
      ...productCenterMock,
      {
        ...productCenterMock[0],
        id: "spu-hanger-coffee-rejected",
        channels: {
          ...productCenterMock[0].channels,
          wechat: {
            ...productCenterMock[0].channels.wechat,
            publicationStatus: "rejected" as const,
            rejectionReason: "驳回：视频号标题不符合规范。",
          },
        },
      },
    ]);

    expect(rows).toHaveLength(8);
    expect(rows[0].channel).toBe("douyin");
    expect(rows.some((row) => row.publicationStatus === "ready_to_list")).toBe(true);
    expect(rows.some((row) => row.productId === "spu-coffee-trial" && row.channel === "wechat")).toBe(true);
    expect(rows.some((row) => row.publicationStatus === "rejected" && row.channel === "wechat")).toBe(true);
  });

  it("reflects a saved richer channel draft in product filters and workbench rows", () => {
    const savedProduct = saveChannelFieldDraft(
      productCenterMock[0],
      "wechat",
      {
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
          detailDescription: "补齐视频号字段",
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
          attrsSummary: "补齐视频号字段\n完善保存后状态",
          qualificationSummary: "食品经营许可已备案",
          sevenDayReturn: true,
          freightInsurance: true,
        },
      },
      { syncAt: "2026-04-02 11:00" },
    ).product;

    const productsAfterSave = productCenterMock.map((product) =>
      product.id === savedProduct.id ? savedProduct : product,
    );

    expect(
      filterProductSummaries(productCenterMock, {
        search: "",
        productStatus: "all",
        channel: "wechat",
        channelState: "ready_to_list",
      }).some((item) => item.id === "spu-hanger-coffee"),
    ).toBe(false);

    expect(
      filterProductSummaries(productsAfterSave, {
        search: "",
        productStatus: "all",
        channel: "wechat",
        channelState: "ready_to_list",
      }).some((item) => item.id === "spu-hanger-coffee"),
    ).toBe(true);

    expect(
      getPublicationWorkbenchRows(productsAfterSave).some(
        (row) =>
          row.productId === "spu-hanger-coffee" &&
          row.channel === "wechat" &&
          row.publicationStatus === "ready_to_list",
      ),
    ).toBe(true);
  });
});
