import { describe, expect, it } from "vitest";

import {
  createDouyinDynamicPanelState,
  getDouyinActionState,
  switchDouyinCategory,
  updateDouyinDynamicValue,
} from "./douyin-dynamic";

describe("douyin dynamic panel state", () => {
  it("builds the default coffee category with fields and blockers", () => {
    const state = createDouyinDynamicPanelState();

    expect(state.categoryId).toBe("coffee-drip");
    expect(state.category?.categoryPath).toBe("咖啡冲饮 > 挂耳咖啡");
    expect(state.fields.map((field) => field.label)).toEqual([
      "类目路径",
      "品牌名称",
      "品牌资质",
      "规格净含量",
      "类目规则摘要",
    ]);
    expect(state.missingFields).toEqual(["品牌名称", "规格净含量"]);
    expect(state.rules.blockers).toEqual(["品牌资质"]);
  });

  it("reduces missing fields after updating a value", () => {
    const initialState = createDouyinDynamicPanelState();
    const nextState = updateDouyinDynamicValue(initialState, "brandName", "蓝山咖啡");

    expect(initialState.missingFields).toEqual(["品牌名称", "规格净含量"]);
    expect(nextState.missingFields).toEqual(["规格净含量"]);
    expect(nextState.fields.find((field) => field.fieldId === "brandName")?.value).toBe("蓝山咖啡");
  });

  it("returns focus_editor when the panel is incomplete", () => {
    const state = createDouyinDynamicPanelState();

    expect(getDouyinActionState(state)).toEqual({
      primary: "focus_editor",
      secondary: null,
      hint: "当前抖店类目或属性仍未补齐，请先完成平台字段配置。",
    });
  });

  it("returns focus_editor when the panel is complete but a hard blocker remains", () => {
    let state = createDouyinDynamicPanelState();
    state = updateDouyinDynamicValue(state, "brandName", "蓝山咖啡");
    state = updateDouyinDynamicValue(state, "packSpec", "8g*10");

    expect(state.missingFields).toEqual([]);
    expect(state.rules.blockers).toEqual(["品牌资质"]);
    expect(getDouyinActionState(state)).toEqual({
      primary: "focus_editor",
      secondary: null,
      hint: "当前字段已齐备，但仍存在硬阻塞项，请先在编辑器中补齐后再继续。",
    });
  });

  it("returns submit_review after clearing the blocker field", () => {
    let state = createDouyinDynamicPanelState();
    state = updateDouyinDynamicValue(state, "brandName", "蓝山咖啡");
    state = updateDouyinDynamicValue(state, "packSpec", "8g*10");
    state = updateDouyinDynamicValue(state, "brandQualification", "资质已上传");

    expect(state.missingFields).toEqual([]);
    expect(state.rules.blockers).toEqual([]);
    expect(getDouyinActionState(state)).toEqual({
      primary: "submit_review",
      secondary: "update_channel",
      hint: "当前抖店字段已齐备，可继续提交审核或先刷新渠道配置。",
    });
  });

  it("keeps advisory-only categories on submit_review", () => {
    const state = createDouyinDynamicPanelState("gift-snack");

    expect(state.rules.blockers).toEqual([]);
    expect(state.rules.brandHint).toBe("礼盒品牌文案建议保持统一。");
    expect(getDouyinActionState(state)).toEqual({
      primary: "submit_review",
      secondary: "update_channel",
      hint: "当前抖店字段已齐备，可继续提交审核或先刷新渠道配置。",
    });
  });

  it("resets fields and blockers when switching to a new category", () => {
    let state = createDouyinDynamicPanelState();
    state = updateDouyinDynamicValue(state, "brandName", "蓝山咖啡");
    state = updateDouyinDynamicValue(state, "brandQualification", "资质已上传");

    const switched = switchDouyinCategory("tea-concentrate");

    expect(switched.categoryId).toBe("tea-concentrate");
    expect(switched.fields.map((field) => field.label)).toEqual(["类目路径", "品牌名称", "浓缩形态", "产地说明"]);
    expect(switched.fields.find((field) => field.fieldId === "brandName")?.value).toBe("山野茶研");
    expect(switched.fields.find((field) => field.fieldId === "concentrateType")?.value).toBe("tea-liquid");
    expect(switched.missingFields).toEqual([]);
    expect(switched.rules.blockers).toEqual([]);
    expect(switched.fields.some((field) => field.value === "蓝山咖啡")).toBe(false);
  });
});
