import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { WechatPublishPanel } from "./wechat-publish-panel";

describe("WechatPublishPanel", () => {
  it("wraps the existing channel field editor with publish page status summary", () => {
    render(
      <ProductCenterStoreProvider>
        <WechatPublishPanel publishView={createPublishView("spu-hanger-coffee")} />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("视频号发布面板")).toBeTruthy();
    expect(screen.getByText("当前视频号发布状态摘要")).toBeTruthy();
    expect(screen.getAllByText("发布状态")).toHaveLength(2);
    expect(screen.getByText("待补")).toBeTruthy();
    expect(screen.getByText("字段编辑器")).toBeTruthy();
    expect(screen.getByText("保存字段")).toBeTruthy();
  });
});
