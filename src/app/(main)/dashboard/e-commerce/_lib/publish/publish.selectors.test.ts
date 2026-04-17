import { describe, expect, it } from "vitest";

import { getPublishView } from "./publish.selectors";

describe("publish selectors", () => {
  it("builds the shared publish domain with six common sections and both platforms", () => {
    const view = getPublishView("spu-hanger-coffee");

    expect(view?.productId).toBe("spu-hanger-coffee");
    expect(view?.common.sections.map((section) => section.id)).toEqual([
      "base",
      "media",
      "attributes",
      "sku",
      "pricing",
      "delivery",
    ]);
    expect(view?.common.sections.find((section) => section.id === "base")?.fields).toEqual([
      { key: "name", label: "商品名称", value: "冷萃挂耳咖啡礼盒" },
      { key: "brand", label: "品牌", value: "栖山实验室" },
    ]);
    expect(view?.platforms.map((platform) => platform.platformId)).toEqual(["douyin", "wechat"]);
    expect(view?.platforms).toEqual([
      expect.objectContaining({
        platformId: "douyin",
        status: "ready_to_list",
        extensionSections: [
          expect.objectContaining({ id: "category-properties" }),
          expect.objectContaining({ id: "brand-qualification" }),
          expect.objectContaining({ id: "media-requirements" }),
          expect.objectContaining({ id: "rule-constraints" }),
        ],
      }),
      expect.objectContaining({
        platformId: "wechat",
        status: "missing_fields",
        extensionSections: [
          expect.objectContaining({ id: "basic" }),
          expect.objectContaining({ id: "category" }),
          expect.objectContaining({ id: "media" }),
          expect.objectContaining({ id: "fulfillment" }),
          expect.objectContaining({ id: "sku" }),
          expect.objectContaining({ id: "compliance" }),
        ],
      }),
    ]);
  });

  it("exposes category-property and rule-driven blocks for douyin", () => {
    const view = getPublishView("spu-hanger-coffee");
    const douyin = view?.platforms.find((platform) => platform.platformId === "douyin");

    expect(douyin?.extensionSections.map((section) => section.id)).toEqual([
      "category-properties",
      "brand-qualification",
      "media-requirements",
      "rule-constraints",
    ]);
  });
});
