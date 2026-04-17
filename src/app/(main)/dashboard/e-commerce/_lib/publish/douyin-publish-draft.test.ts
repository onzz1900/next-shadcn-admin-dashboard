import { describe, expect, it } from "vitest";

import { productCenterMock } from "../product-center.mock";
import type { SPUDetail } from "../product-center.types";
import { createDouyinDynamicPanelState, switchDouyinCategory, updateDouyinDynamicValue } from "./douyin-dynamic";
import { buildDouyinPublishDraft } from "./douyin-publish-draft";
import { createPublishView } from "./publish.mock";

describe("buildDouyinPublishDraft", () => {
  it("builds the default coffee draft with all sections populated", () => {
    const publishView = createPublishView("spu-hanger-coffee");
    const productSnapshot = productCenterMock.find((item) => item.id === "spu-hanger-coffee");

    if (!publishView || !productSnapshot) {
      throw new Error("Expected coffee fixtures");
    }

    const draft = buildDouyinPublishDraft({
      publishView,
      productSnapshot,
      douyinState: updateDouyinDynamicValue(createDouyinDynamicPanelState("coffee-drip"), "brandName", "抖店品牌A"),
      channelState: {
        ...productSnapshot.channels.douyin,
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: ["自定义字段"],
        rejectionReason: "同步失败",
        lastSyncAt: "2026-04-05 12:00",
      },
    });

    expect(draft.base).toEqual(
      expect.objectContaining({
        productId: "spu-hanger-coffee",
        productName: "冷萃挂耳咖啡礼盒",
        spuCode: "SPU-COFFEE-001",
        brand: "栖山实验室",
        category: "咖啡冲饮",
        tags: ["礼盒", "短视频主推", "新品"],
        productStatus: "ready",
        updatedAt: "2026-04-02 10:20",
      }),
    );
    expect(draft.base.brand).not.toBe("抖店品牌A");
    expect(draft.base.fields).toEqual([
      { key: "name", label: "商品名称", value: "冷萃挂耳咖啡礼盒" },
      { key: "brand", label: "品牌", value: "栖山实验室" },
    ]);
    expect(draft.category).toEqual(
      expect.objectContaining({
        categoryId: "coffee-drip",
        categoryName: "挂耳咖啡",
        categoryPath: "咖啡冲饮 > 挂耳咖啡",
      }),
    );
    expect(draft.media.coverAssets).toEqual([
      { assetId: "asset-coffee-cover", type: "cover", label: "封面图", status: "ready" },
    ]);
    expect(draft.media.galleryAssets).toEqual([
      { assetId: "asset-coffee-gallery", type: "gallery", label: "卖点组图", status: "ready" },
    ]);
    expect(draft.media.detailAssets).toEqual([
      { assetId: "asset-coffee-detail", type: "detail", label: "详情长图", status: "ready" },
    ]);
    expect(draft.sku.items).toEqual([
      expect.objectContaining({
        skuId: "sku-coffee-01",
        skuName: "经典拼配",
        skuCode: "DRIP-CLASSIC",
        priceLabel: "¥59.00",
        salePrice: "59.00",
        stockNum: 182,
        specValues: ["经典拼配"],
        thumbAssetId: "asset-coffee-cover",
      }),
      expect.objectContaining({
        skuId: "sku-coffee-02",
        skuName: "花果拼配",
        skuCode: "DRIP-FRUITY",
        priceLabel: "¥69.00",
        salePrice: "69.00",
        stockNum: 96,
        specValues: ["花果拼配"],
        thumbAssetId: "asset-coffee-gallery",
      }),
    ]);
    expect(draft.delivery.fields).toEqual([
      { key: "shop", label: "默认发货店铺", value: "抖音旗舰店" },
      { key: "status", label: "主档状态", value: "ready" },
    ]);
    expect(draft.ruleContext).toEqual(
      expect.objectContaining({
        title: "挂耳咖啡规则",
        summary: "挂耳咖啡类目需要先补齐品牌和规格，再继续抖店发布流程。",
        highlights: ["主图建议保持 1:1", "品牌资质需可追溯", "规格净含量必须明确"],
        blockers: ["品牌资质"],
        missingFields: ["规格净含量"],
        brandHint: "建议补充品牌信息以便后续审核。",
        qualificationHint: "品牌资质为空时会阻断提交。",
        mediaHint: "主图建议保持 1:1 规范。",
      }),
    );
    expect(draft.channelState).toEqual(
      expect.objectContaining({
        channelId: "douyin",
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: ["自定义字段"],
        rejectionReason: "同步失败",
        lastSyncAt: "2026-04-05 12:00",
        commandMode: "edit",
      }),
    );
  });

  it("switches category and rules when Douyin local state switches", () => {
    const publishView = createPublishView("spu-hanger-coffee");
    const productSnapshot = productCenterMock.find((item) => item.id === "spu-hanger-coffee");

    if (!publishView || !productSnapshot) {
      throw new Error("Expected coffee fixtures");
    }

    const teaState = switchDouyinCategory("tea-concentrate");
    const draft = buildDouyinPublishDraft({
      publishView,
      productSnapshot,
      douyinState: teaState,
      channelState: productSnapshot.channels.douyin,
    });

    expect(draft.category).toEqual(
      expect.objectContaining({
        categoryId: "tea-concentrate",
        categoryName: "浓缩茶饮",
        categoryPath: "茶饮冲调 > 浓缩茶饮",
      }),
    );
    expect(draft.category.fields.map((field) => field.fieldId)).toEqual([
      "categoryPath",
      "brandName",
      "concentrateType",
      "originNote",
    ]);
    expect(draft.ruleContext).toEqual(
      expect.objectContaining({
        title: "浓缩茶饮规则",
        highlights: ["类目属性已齐备", "支持直接提交流程", "规则区保持最小阻塞"],
        blockers: [],
        missingFields: [],
      }),
    );
    expect(draft.base.brand).toBe("栖山实验室");
    expect(draft.base.productName).toBe("冷萃挂耳咖啡礼盒");
  });

  it("keeps channel metadata separate from common sections", () => {
    const publishView = createPublishView("spu-jasmine-tea");
    const productSnapshot = productCenterMock.find((item) => item.id === "spu-jasmine-tea");

    if (!publishView || !productSnapshot) {
      throw new Error("Expected tea fixtures");
    }

    const alteredSnapshot: SPUDetail = {
      ...productSnapshot,
      brand: "山野调饮",
    };

    const draft = buildDouyinPublishDraft({
      publishView,
      productSnapshot: alteredSnapshot,
      douyinState: updateDouyinDynamicValue(createDouyinDynamicPanelState("coffee-drip"), "brandName", "抖店品牌A"),
      channelState: {
        ...productSnapshot.channels.douyin,
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: ["自定义字段"],
        rejectionReason: "同步失败",
        lastSyncAt: "2026-04-05 12:00",
      },
    });

    expect(draft.base.productName).toBe("茉莉轻乳茶浓缩液");
    expect(draft.base.brand).toBe("山野调饮");
    expect(draft.channelState).toEqual(
      expect.objectContaining({
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: ["自定义字段"],
        rejectionReason: "同步失败",
        lastSyncAt: "2026-04-05 12:00",
        commandMode: "edit",
      }),
    );
    expect(draft.ruleContext.blockers).toEqual(["品牌资质"]);
  });
});
