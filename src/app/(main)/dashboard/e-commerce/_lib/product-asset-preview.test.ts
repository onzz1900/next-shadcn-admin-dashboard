import { describe, expect, it } from "vitest";

import { getProductAssetPreview } from "./product-asset-preview";
import type { AssetPreviewImage } from "./product-asset-preview.types";

const missingAssetPreviewImage: AssetPreviewImage = {
  id: "asset-missing-demo",
  label: "缺失素材示例",
  status: "missing",
};

describe("product asset preview", () => {
  it("allows missing images without forcing preview fields", () => {
    expect(missingAssetPreviewImage.status).toBe("missing");
  });

  it("returns the douyin preview for the coffee gift box", () => {
    const preview = getProductAssetPreview("spu-hanger-coffee", "douyin");

    expect(preview?.cover.title).toBe("抖音封面主视觉");
    expect(preview?.gallery.title).toBe("抖音卖点组图");
    expect(preview?.detail.title).toBe("抖音详情长图");
  });

  it("returns the wechat preview for the coffee gift box", () => {
    const preview = getProductAssetPreview("spu-hanger-coffee", "wechat");

    expect(preview?.cover.title).toBe("视频号场景封面");
    expect(preview?.gallery.title).toBe("视频号生活方式组图");
    expect(preview?.detail.title).toBe("视频号详情长图");
  });

  it("keeps ready image metadata on both channel previews", () => {
    const douyinPreview = getProductAssetPreview("spu-hanger-coffee", "douyin");
    const wechatPreview = getProductAssetPreview("spu-hanger-coffee", "wechat");

    const images = [
      douyinPreview?.cover.image,
      douyinPreview?.gallery.items[0],
      douyinPreview?.detail.sections[0],
      wechatPreview?.cover.image,
      wechatPreview?.gallery.items[0],
      wechatPreview?.detail.sections[0],
    ];

    for (const image of images) {
      expect(image?.status).toBe("ready");

      if (image?.status !== "ready") {
        throw new Error("Expected channel preview images to be ready");
      }

      expect(image.previewUrl).toContain("data:image/svg+xml");
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
  });

  it("returns undefined for products without preview mocks", () => {
    expect(getProductAssetPreview("spu-jasmine-tea", "douyin")).toBeUndefined();
  });
});
