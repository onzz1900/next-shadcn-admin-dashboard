import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ProductCenterStoreProvider } from "../../../_state/product-center-provider";
import { ProductDetailPage } from "./product-detail-page";

describe("ProductDetailPage", () => {
  it("renders the detail page fallback publication cues", () => {
    render(
      <TooltipProvider>
        <ProductCenterStoreProvider>
          <ProductDetailPage productId="spu-hanger-coffee" initialChannel="wechat" />
        </ProductCenterStoreProvider>
      </TooltipProvider>,
    );

    expect(screen.getByRole("link", { name: "进入发布页" }).getAttribute("href")).toBe(
      "/dashboard/e-commerce/products/spu-hanger-coffee/publish",
    );
    expect(screen.getByText(/主要发布动作请前往发布页/)).toBeTruthy();
    expect(screen.getByText(/深度发品编辑请前往发布页/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "提交审核" })).toBeNull();
    expect(screen.queryByRole("button", { name: "更新渠道" })).toBeNull();
    expect(screen.queryByRole("button", { name: "继续补字段" })).toBeNull();
    expect(
      screen
        .getAllByRole("link", { name: "前往发布页处理" })
        .some((link) => link.getAttribute("href") === "/dashboard/e-commerce/products/spu-hanger-coffee/publish"),
    ).toBe(true);
  });
});
