import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { PublishActionPanel } from "./publish-action-panel";

describe("PublishActionPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the correct primary and secondary actions for the ready-to-list channel", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel productId="spu-hanger-coffee" platformId="douyin" />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("发布控制")).toBeTruthy();
    expect(screen.getByText("当前平台：抖店")).toBeTruthy();
    expect(screen.getByRole("button", { name: "上架" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "更新渠道" })).toBeTruthy();
  });

  it("updates the visible primary action after the store synchronously changes", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel productId="spu-hanger-coffee" platformId="douyin" />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "上架" }));

    expect(screen.getByRole("button", { name: "下架" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "上架中..." })).toBeNull();
  });

  it("uses Douyin local state to show focus-editor for incomplete category fields", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel
          productId="spu-hanger-coffee"
          platformId="douyin"
          douyinState={createDouyinDynamicPanelState("coffee-drip")}
        />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("当前抖店类目或属性仍未补齐，请先完成平台字段配置。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "继续补字段" })).toBeTruthy();
  });

  it("falls back to the store action state once Douyin local state is complete", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel
          productId="spu-hanger-coffee"
          platformId="douyin"
          douyinState={createDouyinDynamicPanelState("tea-concentrate")}
        />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByRole("button", { name: "上架" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "更新渠道" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "提交审核" })).toBeNull();
  });

  it("shows a rule-blocked badge instead of field-ready when Douyin has hard blockers only", () => {
    const blockerState = createDouyinDynamicPanelState("coffee-drip");
    blockerState.missingFields = [];
    blockerState.rules.blockers = ["品牌资质"];

    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel productId="spu-hanger-coffee" platformId="douyin" douyinState={blockerState} />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByRole("button", { name: "继续补字段" })).toBeTruthy();
    expect(screen.getByText("规则阻塞")).toBeTruthy();
    expect(screen.queryByText("字段齐备")).toBeNull();
  });
});
