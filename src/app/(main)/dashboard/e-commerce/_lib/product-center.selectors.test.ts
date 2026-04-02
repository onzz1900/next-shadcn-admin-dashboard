import { describe, expect, it } from "vitest";

import { productCenterMock } from "./product-center.mock";
import {
  filterProductSummaries,
  getProductById,
  getProductCenterMetrics,
  getPublicationWorkbenchRows,
} from "./product-center.selectors";

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
});
