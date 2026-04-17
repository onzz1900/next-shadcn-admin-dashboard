import { describe, expect, it } from "vitest";

import { productCenterMock } from "../product-center.mock";
import { buildDouyinAddV2Command, buildDouyinEditV2Command } from "./douyin-command-builder";
import { createDouyinDynamicPanelState, switchDouyinCategory, updateDouyinDynamicValue } from "./douyin-dynamic";
import { buildDouyinPublishDraft } from "./douyin-publish-draft";
import { createPublishView } from "./publish.mock";

describe("douyin command builder", () => {
  const publishView = createPublishView("spu-hanger-coffee");
  const productSnapshot = productCenterMock.find((item) => item.id === "spu-hanger-coffee");

  if (!publishView || !productSnapshot) {
    throw new Error("Expected coffee fixtures");
  }

  const editDraft = buildDouyinPublishDraft({
    publishView,
    productSnapshot,
    douyinState: createDouyinDynamicPanelState("coffee-drip"),
    channelState: productSnapshot.channels.douyin,
  });

  const addDraft = buildDouyinPublishDraft({
    publishView,
    productSnapshot,
    douyinState: createDouyinDynamicPanelState("coffee-drip"),
    channelState: {
      ...productSnapshot.channels.douyin,
      publicationStatus: "not_started",
      auditStatus: "not_submitted",
      listingStatus: "not_listed",
      missingFields: [],
    },
  });

  it("builds an addV2 command from the draft payload", () => {
    const command = buildDouyinAddV2Command(addDraft);

    expect(command.apiPath).toBe("/product/addV2");
    expect(command.mode).toBe("add");
    expect(command.payload.base).toEqual(
      expect.objectContaining({
        productId: "spu-hanger-coffee",
        productName: "冷萃挂耳咖啡礼盒",
        spuCode: "SPU-COFFEE-001",
        brand: "栖山实验室",
      }),
    );
    expect(command.payload.category).toEqual(
      expect.objectContaining({
        category_id: "coffee-drip",
        category_name: "挂耳咖啡",
        category_path: "咖啡冲饮 > 挂耳咖啡",
        property_values: expect.arrayContaining([
          expect.objectContaining({
            property_id: "categoryPath",
            property_label: "类目路径",
            property_values: ["咖啡冲饮 > 挂耳咖啡"],
            required: true,
            filled: true,
          }),
          expect.objectContaining({
            property_id: "brandName",
            property_label: "品牌名称",
            property_values: [],
            required: true,
            filled: false,
          }),
          expect.objectContaining({
            property_id: "packSpec",
            property_label: "规格净含量",
            property_values: [],
            option_values: ["6g*10", "8g*10", "10g*10"],
            required: true,
            filled: false,
          }),
        ]),
      }),
    );
    expect(command.payload.media).toEqual(
      expect.objectContaining({
        main_images: ["asset-coffee-cover", "asset-coffee-gallery"],
        detail_images: ["asset-coffee-detail"],
        gallery_images: ["asset-coffee-gallery"],
      }),
    );
    expect(command.payload.category).not.toHaveProperty("categoryId");
    expect(command.payload.category.property_values[0]).not.toHaveProperty("value");
    expect(command.payload.category).not.toHaveProperty("select_properties");
    expect(command.payload.media).not.toHaveProperty("coverAssets");
    expect(command.payload.media).not.toHaveProperty("totalAssetCount");
    expect(command.payload.sku).toEqual(
      expect.objectContaining({
        sku_list: expect.arrayContaining([
          expect.objectContaining({
            sku_id: "sku-coffee-01",
            sku_name: "经典拼配",
            sku_code: "DRIP-CLASSIC",
            sale_price: "59.00",
            stock_num: 182,
            spec_values: ["经典拼配"],
            thumb_image: "asset-coffee-cover",
          }),
        ]),
        total_stock_num: 278,
        sku_code_list: ["DRIP-CLASSIC", "DRIP-FRUITY"],
        priced_sku_count: 2,
        image_bound_sku_count: 2,
      }),
    );
    expect(command.payload.sku.sku_list[0]).not.toHaveProperty("skuId");
    expect(command.payload.sku.sku_list[0]).not.toHaveProperty("salePrice");
    expect(command.payload.delivery).toEqual(
      expect.objectContaining({
        shipping: expect.arrayContaining([
          expect.objectContaining({
            field_key: "shop",
            field_label: "默认发货店铺",
            field_value: "抖音旗舰店",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "deliverMethod",
            field_label: "发货方式",
            field_value: "express",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "freightTemplate",
            field_label: "运费模板",
            field_value: "standard",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "weight",
            field_label: "重量",
            field_value: "0.8",
            filled: true,
          }),
        ]),
        commitment: expect.arrayContaining([
          expect.objectContaining({
            field_key: "deliveryCommitment",
            field_label: "履约承诺",
            field_value: "48h",
            filled: true,
          }),
        ]),
        status: expect.arrayContaining([
          expect.objectContaining({
            field_key: "status",
            field_label: "主档状态",
            field_value: "ready",
            filled: true,
          }),
        ]),
      }),
    );
    expect(command.payload.delivery).not.toHaveProperty("shop");
    expect(command.payload.delivery.status).toHaveLength(1);
    expect(command.payload.delivery.commitment).toHaveLength(1);
    expect(command.payload.delivery.shipping).toHaveLength(4);
    expect(command.payload.ruleContext).toEqual(
      expect.objectContaining({
        title: "挂耳咖啡规则",
        blockers: ["品牌资质"],
        missingFields: ["品牌名称", "规格净含量"],
      }),
    );
    expect(command.payload.channelState.commandMode).toBe("add");
  });

  it("builds an editV2 command with the same draft sections but edit semantics", () => {
    const command = buildDouyinEditV2Command(editDraft);

    expect(command.apiPath).toBe("/product/editV2");
    expect(command.mode).toBe("edit");
    expect(command.payload.base.productName).toBe("冷萃挂耳咖啡礼盒");
    expect(command.payload.category).toEqual(
      expect.objectContaining({
        category_id: "coffee-drip",
        category_path: "咖啡冲饮 > 挂耳咖啡",
        property_values: expect.arrayContaining([
          expect.objectContaining({
            property_id: "brandQualification",
            property_label: "品牌资质",
            property_values: [],
            required: false,
            filled: false,
          }),
        ]),
      }),
    );
    expect(command.payload.media).toEqual(
      expect.objectContaining({
        main_images: ["asset-coffee-cover", "asset-coffee-gallery"],
        detail_images: ["asset-coffee-detail"],
        gallery_images: ["asset-coffee-gallery"],
      }),
    );
    expect(command.payload.channelState.commandMode).toBe("edit");
    expect(command.payload.previousChannelState).toEqual(
      expect.objectContaining({
        channelId: "douyin",
        publicationStatus: "ready_to_list",
        auditStatus: "approved",
        listingStatus: "not_listed",
        commandMode: "edit",
      }),
    );
    expect(command.payload.sku).toEqual(
      expect.objectContaining({
        sku_list: expect.arrayContaining([
          expect.objectContaining({
            sku_id: "sku-coffee-01",
            sku_name: "经典拼配",
            sku_code: "DRIP-CLASSIC",
            sale_price: "59.00",
            stock_num: 182,
            spec_values: ["经典拼配"],
            thumb_image: "asset-coffee-cover",
          }),
        ]),
        total_stock_num: 278,
        sku_code_list: ["DRIP-CLASSIC", "DRIP-FRUITY"],
        priced_sku_count: 2,
        image_bound_sku_count: 2,
      }),
    );
    expect(command.payload.delivery).toEqual(
      expect.objectContaining({
        shipping: expect.arrayContaining([
          expect.objectContaining({
            field_key: "shop",
            field_label: "默认发货店铺",
            field_value: "抖音旗舰店",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "deliverMethod",
            field_label: "发货方式",
            field_value: "express",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "freightTemplate",
            field_label: "运费模板",
            field_value: "standard",
            filled: true,
          }),
          expect.objectContaining({
            field_key: "weight",
            field_label: "重量",
            field_value: "0.8",
            filled: true,
          }),
        ]),
        commitment: expect.arrayContaining([
          expect.objectContaining({
            field_key: "deliveryCommitment",
            field_label: "履约承诺",
            field_value: "48h",
            filled: true,
          }),
        ]),
        status: expect.arrayContaining([
          expect.objectContaining({
            field_key: "status",
            field_label: "主档状态",
            field_value: "ready",
            filled: true,
          }),
        ]),
      }),
    );
  });

  it("throws when addV2 receives a non-add draft", () => {
    expect(() => buildDouyinAddV2Command(editDraft)).toThrow("Expected Douyin draft commandMode to be add");
  });

  it("throws when editV2 receives a non-edit draft", () => {
    expect(() => buildDouyinEditV2Command(addDraft)).toThrow("Expected Douyin draft commandMode to be edit");
  });

  it("preserves category and rule context when the Douyin local state switches", () => {
    const teaDraft = buildDouyinPublishDraft({
      publishView,
      productSnapshot,
      douyinState: switchDouyinCategory("tea-concentrate"),
      channelState: {
        ...productSnapshot.channels.douyin,
        publicationStatus: "not_started",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
      },
    });
    const command = buildDouyinAddV2Command(teaDraft);

    expect(command.payload.category).toEqual(
      expect.objectContaining({
        category_id: "tea-concentrate",
        category_name: "浓缩茶饮",
        category_path: "茶饮冲调 > 浓缩茶饮",
        property_values: expect.arrayContaining([
          expect.objectContaining({
            property_id: "brandName",
            property_label: "品牌名称",
            property_values: ["山野茶研"],
            required: true,
            filled: true,
          }),
          expect.objectContaining({
            property_id: "concentrateType",
            property_label: "浓缩形态",
            property_values: ["tea-liquid"],
            option_values: ["tea-liquid", "tea-powder"],
            required: true,
            filled: true,
          }),
          expect.objectContaining({
            property_id: "originNote",
            property_label: "产地说明",
            property_values: ["产地与批次信息已同步。"],
            required: false,
            filled: true,
          }),
        ]),
      }),
    );
    expect(command.payload.ruleContext).toEqual(
      expect.objectContaining({
        title: "浓缩茶饮规则",
        blockers: [],
        missingFields: [],
      }),
    );
    expect(command.payload.media).toEqual(
      expect.objectContaining({
        main_images: ["asset-coffee-cover", "asset-coffee-gallery"],
        detail_images: ["asset-coffee-detail"],
        gallery_images: ["asset-coffee-gallery"],
      }),
    );
  });

  it("keeps command metadata separate from the draft source when channel state changes", () => {
    const teaSnapshot = {
      ...productSnapshot,
      brand: "山野调饮",
    };
    const teaPublishView = createPublishView("spu-jasmine-tea");
    if (!teaPublishView) {
      throw new Error("Expected tea publish view fixture");
    }

    const teaDraft = buildDouyinPublishDraft({
      publishView: teaPublishView,
      productSnapshot: teaSnapshot,
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
    const command = buildDouyinEditV2Command(teaDraft);

    expect(command.payload.base.brand).toBe("山野调饮");
    expect(command.payload.media.main_images).toHaveLength(2);
    expect(command.payload.media.detail_images).toHaveLength(1);
    expect(command.payload.previousChannelState).toEqual(
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
    expect(command.payload.channelState).toEqual(
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
    expect(command.payload.ruleContext.blockers).toEqual(["品牌资质"]);
  });

  it("keeps incomplete delivery field values in the canonical delivery_fields payload", () => {
    const pendingDraft = buildDouyinPublishDraft({
      publishView,
      productSnapshot,
      douyinState: updateDouyinDynamicValue(createDouyinDynamicPanelState("coffee-drip"), "brandName", "栖山实验室"),
      channelState: {
        ...productSnapshot.channels.douyin,
        publicationStatus: "not_started",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
      },
    });

    pendingDraft.delivery.fields[0] = {
      ...pendingDraft.delivery.fields[0],
      value: "",
    };

    const command = buildDouyinAddV2Command(pendingDraft);

    expect(command.payload.delivery.status).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_key: "status",
          field_label: "主档状态",
          field_value: "ready",
          filled: true,
        }),
      ]),
    );
    expect(command.payload.delivery.shipping).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field_key: "shop", field_value: "" }),
        expect.objectContaining({ field_key: "deliverMethod", field_value: "express" }),
        expect.objectContaining({ field_key: "freightTemplate", field_value: "standard" }),
        expect.objectContaining({ field_key: "weight", field_value: "0.8" }),
      ]),
    );
    expect(command.payload.delivery).not.toHaveProperty("shop");
  });
});
