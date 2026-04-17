import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { productCenterMock } from "../../../../_lib/product-center.mock";
import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { DouyinCommandPreview } from "./douyin-command-preview";
import { PublishPage } from "./publish-page";

describe("PublishPage", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  afterEach(() => {
    cleanup();
  });

  const publishView = createPublishView("spu-hanger-coffee");
  if (!publishView) {
    throw new Error("Expected publish view fixture");
  }
  const syncPublishView = createPublishView("spu-jasmine-tea");
  if (!syncPublishView) {
    throw new Error("Expected sync publish view fixture");
  }

  it("renders the publish summary and current platform control state", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("发布校验")).toBeTruthy();
    expect(screen.getByText("发布控制")).toBeTruthy();
  });

  it("writes the focus_editor hash against a real platform anchor", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    const videoTab = screen.getByRole("tab", { name: "视频号配置" });
    fireEvent.mouseDown(videoTab);
    fireEvent.click(videoTab);

    expect(document.getElementById("channel-wechat-editor")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "继续补字段" }));

    expect(window.location.hash).toBe("#channel-wechat-editor");
  });

  it("switches platform without carrying over stale pending state from the previous platform", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "抖店配置" }));
    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));
    expect(screen.getByRole("button", { name: "上架" })).toBeTruthy();

    const videoTab = screen.getByRole("tab", { name: "视频号配置" });
    fireEvent.mouseDown(videoTab);
    fireEvent.click(videoTab);

    expect(screen.getByRole("button", { name: "继续补字段" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "上架中..." })).toBeNull();
  });

  it("recomputes the validation summary from store state after retrying a sync error", async () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={syncPublishView} />
      </ProductCenterStoreProvider>,
    );

    const wechatTab = screen.getByRole("tab", { name: "视频号配置" });
    fireEvent.mouseDown(wechatTab);
    fireEvent.click(wechatTab);

    expect(screen.getByText("价格带同步失败，请重新提交渠道同步。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "重新同步" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "上架" })).toBeTruthy();
    });

    const blockerContainer = screen.getByText("首个阻塞项").closest(".space-y-1");
    expect(blockerContainer).toBeTruthy();
    expect(within(blockerContainer as HTMLElement).getByText("待上架")).toBeTruthy();
  });

  it("recomputes the right rail from Douyin local state when category fields change", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "抖店配置" }));

    expect(screen.getByRole("button", { name: "继续补字段" })).toBeTruthy();
    const blockerContainer = screen.getByText("首个阻塞项").closest(".space-y-1");
    expect(blockerContainer).toBeTruthy();
    expect(within(blockerContainer as HTMLElement).getByText("品牌资质")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));

    expect(screen.getByRole("button", { name: "上架" })).toBeTruthy();
    const nextBlockerContainer = screen.getByText("首个阻塞项").closest(".space-y-1");
    expect(nextBlockerContainer).toBeTruthy();
    expect(within(nextBlockerContainer as HTMLElement).getByText("待上架")).toBeTruthy();
    expect(screen.queryByText("当前没有显式阻塞项。")).toBeNull();
  });

  it("shows the Douyin command preview summary and refreshes it when the category changes", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "抖店配置" }));

    const previewCard = screen.getByText("抖店命令预览").closest('[data-slot="card"]');
    expect(previewCard).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("/product/editV2")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("category: coffee-drip")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("SKU 数量")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("发货 4/4")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("承诺 1/1")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("状态 1/1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));

    expect(within(previewCard as HTMLElement).getByText("category: tea-concentrate")).toBeTruthy();
    expect(within(previewCard as HTMLElement).getByText("mode: edit")).toBeTruthy();
  });

  it("can render an add-mode Douyin command preview with a synthetic not-started channel state", () => {
    const productSnapshot = productCenterMock.find((item) => item.id === "spu-hanger-coffee");
    const coffeePublishView = createPublishView("spu-hanger-coffee");

    if (!productSnapshot || !coffeePublishView) {
      throw new Error("Expected coffee fixtures");
    }

    render(
      <DouyinCommandPreview
        publishView={coffeePublishView}
        productSnapshot={productSnapshot}
        douyinState={createDouyinDynamicPanelState("coffee-drip")}
        channelState={{
          ...productSnapshot.channels.douyin,
          publicationStatus: "not_started",
          auditStatus: "not_submitted",
          listingStatus: "not_listed",
          missingFields: [],
        }}
      />,
    );

    expect(screen.getByText("抖店命令预览")).toBeTruthy();
    expect(screen.getByText("/product/addV2")).toBeTruthy();
    expect(screen.getByText("mode: add")).toBeTruthy();
    expect(screen.getByText("category: coffee-drip")).toBeTruthy();
  });
});
