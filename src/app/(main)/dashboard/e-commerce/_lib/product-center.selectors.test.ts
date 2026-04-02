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
  });

  it("finds a product detail by id", () => {
    expect(getProductById(productCenterMock, "spu-hanger-coffee")?.name).toBe("冷萃挂耳咖啡礼盒");
  });

  it("flattens actionable publication rows for the workbench", () => {
    expect(getPublicationWorkbenchRows(productCenterMock)).toHaveLength(4);
    expect(getPublicationWorkbenchRows(productCenterMock)[0].channel).toBe("douyin");
  });
});
