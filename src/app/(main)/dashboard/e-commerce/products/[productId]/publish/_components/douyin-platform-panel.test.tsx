import { useState } from "react";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { DouyinPlatformPanel } from "./douyin-platform-panel";
import { PlatformPublishPanel } from "./platform-publish-panel";
import { PublishPage } from "./publish-page";

function DouyinPanelHarness() {
  const [state, setState] = useState(() => createDouyinDynamicPanelState("coffee-drip"));

  return <DouyinPlatformPanel state={state} onStateChange={setState} />;
}

afterEach(() => {
  cleanup();
});

describe("DouyinPlatformPanel", () => {
  it("renders the initial category, fields, and rule summary", () => {
    render(<DouyinPanelHarness />);

    expect(screen.getByText("抖店类目选择")).toBeTruthy();
    expect(screen.getByRole("button", { name: "挂耳咖啡" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "品牌资质" })).toBeTruthy();
    expect(screen.getByText("品牌资质为空时会阻断提交。")).toBeTruthy();
    expect(screen.getAllByText("2 项待补").length).toBeGreaterThan(0);
  });

  it("switches category and refreshes fields and rules together", () => {
    render(<DouyinPanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));

    expect(screen.getByText("浓缩形态")).toBeTruthy();
    expect(screen.getByText("产地说明")).toBeTruthy();
    expect(screen.getByText("浓缩茶饮类目字段齐备后可直接进入审核，不额外预置阻塞项。")).toBeTruthy();
    expect(screen.getByText("当前没有硬阻塞项。")).toBeTruthy();
    expect(screen.queryByLabelText("品牌资质")).toBeNull();
    expect(screen.getAllByText("字段齐备").length).toBeGreaterThan(0);
  });

  it("keeps dynamic field edits inside the current category state", () => {
    render(<DouyinPanelHarness />);

    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));
    fireEvent.change(screen.getByRole("textbox", { name: "产地说明" }), { target: { value: "产地：云南" } });

    expect(screen.getAllByText("字段齐备").length).toBeGreaterThan(0);
    expect(screen.getByText("当前没有硬阻塞项。")).toBeTruthy();
    expect(screen.getByDisplayValue("产地：云南")).toBeTruthy();
  });
});

describe("PlatformPublishPanel", () => {
  const publishView = createPublishView("spu-hanger-coffee");
  if (!publishView) {
    throw new Error("Expected publish view fixture");
  }

  it("renders the Douyin dynamic panel when the active platform is douyin", () => {
    render(
      <PlatformPublishPanel
        publishView={publishView}
        activePlatform="douyin"
        onActivePlatformChange={() => undefined}
        douyinState={createDouyinDynamicPanelState("coffee-drip")}
        onDouyinStateChange={() => undefined}
      />,
    );

    expect(screen.getByText("抖店类目选择")).toBeTruthy();
    expect(screen.getByText("抖店平台状态")).toBeTruthy();
  });
});

describe("PublishPage", () => {
  const publishView = createPublishView("spu-hanger-coffee");
  if (!publishView) {
    throw new Error("Expected publish view fixture");
  }

  it("keeps the Douyin platform state lifted at the publish page level", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "抖店配置" }));
    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));

    expect(screen.getByText("浓缩形态")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "视频号配置" }));
    fireEvent.click(screen.getByRole("tab", { name: "抖店配置" }));

    expect(screen.getByText("浓缩形态")).toBeTruthy();
    expect(screen.getAllByText("茶饮冲调 > 浓缩茶饮").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("品牌资质")).toBeNull();
  });
});
