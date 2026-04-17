# Channel Field Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full simulated channel field editing inside the product detail channel tabs, with explicit save and synchronized updates across detail, product list, and publication workbench.

**Architecture:** Introduce a small shared client-side product-center data layer under `e-commerce` so list/detail/workbench stop reading the static mock directly. Put channel field definitions, validation, and state recomputation in shared pure helpers; then build a grouped field editor on top of those helpers inside the existing channel tabs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React Hook Form, Zod, shadcn/ui, Vitest

---

## Scope Check

This plan is one coherent slice: editable channel fields with simulated persistence and cross-page state propagation. It does not include real uploads, real platform APIs, or real publish/audit actions. Those should remain a separate plan after this editing flow is stable.

## File Map

### Modify

- `src/app/(main)/dashboard/e-commerce/products/page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/page.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`

### Create

- `src/app/(main)/dashboard/e-commerce/layout.tsx`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-provider.tsx`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`
- `src/app/(main)/dashboard/e-commerce/publications/_components/publication-workbench-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-save-feedback.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

## Task 1: Define editable field configs and mutation engine

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- Test: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`

- [ ] **Step 1: Write the failing editing-state test**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { productCenterMock } from "./product-center.mock";
import {
  buildChannelDraftValues,
  saveChannelDraft,
  validateChannelDraft,
} from "./product-center-editing";

describe("product center editing", () => {
  it("builds editable draft values from a channel view", () => {
    const product = productCenterMock[0];
    const draft = buildChannelDraftValues(product, "douyin");

    expect(draft.basic.shortTitle).toBe("春季上新冷萃挂耳礼盒");
    expect(draft.logistics.freightTemplate).toBe("");
    expect(draft.content.coverAssetId).toBe("asset-coffee-cover");
    expect(draft.highlights).toEqual(["礼盒", "短视频主推"]);
  });

  it("reports required field validation errors", () => {
    const product = productCenterMock[0];
    const draft = buildChannelDraftValues(product, "wechat");

    draft.content.carouselAssetId = "";
    draft.logistics.freightTemplate = "";

    expect(validateChannelDraft(draft)).toEqual({
      content: { carouselAssetId: "请选择轮播图" },
      logistics: { freightTemplate: "请选择运费模板" },
    });
  });

  it("saves draft values and recomputes the channel status", () => {
    const product = productCenterMock[0];
    const draft = buildChannelDraftValues(product, "wechat");

    draft.content.carouselAssetId = "asset-coffee-gallery";
    draft.logistics.freightTemplate = "wechat-standard";
    draft.content.heroVideoAssetId = "asset-coffee-detail";
    draft.basic.channelCategory = "coffee-gift";

    const next = saveChannelDraft(productCenterMock, {
      productId: product.id,
      channel: "wechat",
      draft,
      savedAt: "2026-04-02 19:20",
    });

    const updated = next.find((item) => item.id === product.id);

    expect(updated?.channels.wechat.publicationStatus).toBe("ready_to_list");
    expect(updated?.channels.wechat.missingFields).toEqual([]);
    expect(updated?.channels.wechat.lastSyncAt).toBe("2026-04-02 19:20");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: FAIL with module-not-found errors for `product-center-editing`.

- [ ] **Step 3: Add shared editing types and field config**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts`:

```ts
import type { ChannelId } from "./product-center.types";

export type ChannelFieldType = "text" | "textarea" | "select" | "asset" | "string-array";
export type ChannelFieldGroupKey = "basic" | "logistics" | "content" | "highlights";

export interface ChannelFieldOption {
  label: string;
  value: string;
}

export interface ChannelFieldConfig {
  id: string;
  group: ChannelFieldGroupKey;
  type: ChannelFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: ChannelFieldOption[];
}

export interface ChannelDraftValues {
  basic: {
    shortTitle: string;
    channelCategory: string;
    sellingPoint: string;
  };
  logistics: {
    freightTemplate: string;
    deliveryEta: string;
    servicePromise: string;
  };
  content: {
    coverAssetId: string;
    carouselAssetId: string;
    heroVideoAssetId: string;
  };
  highlights: string[];
}

export interface SaveChannelDraftInput {
  productId: string;
  channel: ChannelId;
  draft: ChannelDraftValues;
  savedAt: string;
}
```

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`:

```ts
import type { ChannelFieldConfig } from "./product-center-editing.types";

export const channelFieldConfig: Record<"douyin" | "wechat", ChannelFieldConfig[]> = {
  douyin: [
    { id: "shortTitle", group: "basic", type: "text", label: "渠道短标题", required: true, placeholder: "请输入带货短标题" },
    { id: "channelCategory", group: "basic", type: "select", label: "渠道类目", required: true, options: [
      { label: "咖啡礼盒", value: "coffee-gift" },
      { label: "即饮茶饮", value: "tea-ready" },
    ] },
    { id: "sellingPoint", group: "basic", type: "textarea", label: "卖点摘要", required: true, placeholder: "用一句话概括卖点" },
    { id: "freightTemplate", group: "logistics", type: "select", label: "运费模板", required: true, options: [
      { label: "抖音常温模板", value: "douyin-standard" },
      { label: "抖音次日达模板", value: "douyin-fast" },
    ] },
    { id: "deliveryEta", group: "logistics", type: "select", label: "发货时效", required: true, options: [
      { label: "24 小时内", value: "24h" },
      { label: "48 小时内", value: "48h" },
    ] },
    { id: "servicePromise", group: "logistics", type: "select", label: "服务承诺", required: true, options: [
      { label: "七天无理由", value: "refund-7d" },
      { label: "破损包赔", value: "damage-cover" },
    ] },
    { id: "coverAssetId", group: "content", type: "asset", label: "封面图", required: true },
    { id: "carouselAssetId", group: "content", type: "asset", label: "轮播图", required: true },
    { id: "heroVideoAssetId", group: "content", type: "asset", label: "主图视频", required: true },
    { id: "highlights", group: "highlights", type: "string-array", label: "渠道亮点", required: true },
  ],
  wechat: [
    { id: "shortTitle", group: "basic", type: "text", label: "渠道短标题", required: true, placeholder: "请输入视频号商品标题" },
    { id: "channelCategory", group: "basic", type: "select", label: "渠道类目", required: true, options: [
      { label: "精品咖啡", value: "coffee-gift" },
      { label: "轻乳茶", value: "tea-ready" },
    ] },
    { id: "sellingPoint", group: "basic", type: "textarea", label: "卖点摘要", required: true, placeholder: "请输入视频号卖点说明" },
    { id: "freightTemplate", group: "logistics", type: "select", label: "运费模板", required: true, options: [
      { label: "视频号常温模板", value: "wechat-standard" },
      { label: "视频号全国包邮", value: "wechat-free" },
    ] },
    { id: "deliveryEta", group: "logistics", type: "select", label: "发货时效", required: true, options: [
      { label: "48 小时内", value: "48h" },
      { label: "72 小时内", value: "72h" },
    ] },
    { id: "servicePromise", group: "logistics", type: "select", label: "服务承诺", required: true, options: [
      { label: "售后客服在线", value: "service-online" },
      { label: "过敏包退", value: "refund-sensitive" },
    ] },
    { id: "coverAssetId", group: "content", type: "asset", label: "封面图", required: true },
    { id: "carouselAssetId", group: "content", type: "asset", label: "轮播图", required: true },
    { id: "heroVideoAssetId", group: "content", type: "asset", label: "主图视频", required: true },
    { id: "highlights", group: "highlights", type: "string-array", label: "渠道亮点", required: true },
  ],
};
```

- [ ] **Step 4: Implement draft building, validation, and save mutation**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`:

```ts
import type { SPUDetail } from "./product-center.types";
import type { ChannelDraftValues, SaveChannelDraftInput } from "./product-center-editing.types";

function recomputeMissingFields(draft: ChannelDraftValues) {
  const missing: string[] = [];

  if (!draft.basic.shortTitle.trim()) missing.push("渠道短标题");
  if (!draft.basic.channelCategory.trim()) missing.push("渠道类目");
  if (!draft.basic.sellingPoint.trim()) missing.push("卖点摘要");
  if (!draft.logistics.freightTemplate.trim()) missing.push("运费模板");
  if (!draft.logistics.deliveryEta.trim()) missing.push("发货时效");
  if (!draft.logistics.servicePromise.trim()) missing.push("服务承诺");
  if (!draft.content.coverAssetId.trim()) missing.push("封面图");
  if (!draft.content.carouselAssetId.trim()) missing.push("轮播图");
  if (!draft.content.heroVideoAssetId.trim()) missing.push("主图视频");
  if (draft.highlights.length === 0 || draft.highlights.some((item) => !item.trim())) missing.push("渠道亮点");

  return missing;
}

export function buildChannelDraftValues(product: SPUDetail, channel: "douyin" | "wechat"): ChannelDraftValues {
  const view = product.channels[channel];
  const lookup = Object.fromEntries(view.channelSpecificFields.map((field) => [field.label, field.value]));

  return {
    basic: {
      shortTitle: lookup["带货短标题"] ?? lookup["渠道短标题"] ?? "",
      channelCategory: lookup["渠道类目"] ?? "",
      sellingPoint: lookup["卖点摘要"] ?? "",
    },
    logistics: {
      freightTemplate: lookup["运费模板"] ?? "",
      deliveryEta: lookup["发货时效"] ?? "",
      servicePromise: lookup["服务承诺"] ?? "",
    },
    content: {
      coverAssetId: product.assets.find((item) => item.type === "cover")?.id ?? "",
      carouselAssetId: view.missingFields.includes("商品轮播图") ? "" : product.assets.find((item) => item.type === "gallery")?.id ?? "",
      heroVideoAssetId: view.missingFields.includes("主图视频") ? "" : product.assets.find((item) => item.type === "detail")?.id ?? "",
    },
    highlights: product.tags.slice(0, 2),
  };
}

export function validateChannelDraft(draft: ChannelDraftValues) {
  return {
    basic: {
      ...(draft.basic.shortTitle.trim() ? {} : { shortTitle: "请输入渠道短标题" }),
      ...(draft.basic.channelCategory.trim() ? {} : { channelCategory: "请选择渠道类目" }),
      ...(draft.basic.sellingPoint.trim() ? {} : { sellingPoint: "请输入卖点摘要" }),
    },
    logistics: {
      ...(draft.logistics.freightTemplate.trim() ? {} : { freightTemplate: "请选择运费模板" }),
      ...(draft.logistics.deliveryEta.trim() ? {} : { deliveryEta: "请选择发货时效" }),
      ...(draft.logistics.servicePromise.trim() ? {} : { servicePromise: "请选择服务承诺" }),
    },
    content: {
      ...(draft.content.coverAssetId.trim() ? {} : { coverAssetId: "请选择封面图" }),
      ...(draft.content.carouselAssetId.trim() ? {} : { carouselAssetId: "请选择轮播图" }),
      ...(draft.content.heroVideoAssetId.trim() ? {} : { heroVideoAssetId: "请选择主图视频" }),
    },
  };
}

export function saveChannelDraft(products: SPUDetail[], input: SaveChannelDraftInput): SPUDetail[] {
  return products.map((product) => {
    if (product.id !== input.productId) {
      return product;
    }

    const missingFields = recomputeMissingFields(input.draft);
    const publicationStatus = missingFields.length === 0 ? "ready_to_list" : "missing_fields";

    return {
      ...product,
      channels: {
        ...product.channels,
        [input.channel]: {
          ...product.channels[input.channel],
          publicationStatus,
          missingFields,
          rejectionReason: publicationStatus === "ready_to_list" ? undefined : product.channels[input.channel].rejectionReason,
          lastSyncAt: input.savedAt,
          channelSpecificFields: [
            { label: "渠道短标题", value: input.draft.basic.shortTitle, state: "ready" },
            { label: "渠道类目", value: input.draft.basic.channelCategory, state: "ready" },
            { label: "卖点摘要", value: input.draft.basic.sellingPoint, state: "ready" },
            { label: "运费模板", value: input.draft.logistics.freightTemplate, state: "ready" },
            { label: "发货时效", value: input.draft.logistics.deliveryEta, state: "ready" },
            { label: "服务承诺", value: input.draft.logistics.servicePromise, state: "ready" },
          ],
        },
      },
    };
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: PASS with `3 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-center-editing.types.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-center-editing.config.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-center-editing.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-center-editing.test.ts
git commit -m "feat: add channel field editing config"
```

## Task 2: Add a shared client-side product-center data layer

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/layout.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_state/product-center-provider.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/publications/_components/publication-workbench-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/publications/page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`

- [ ] **Step 1: Write the failing store test**

Create `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { productCenterMock } from "../_lib/product-center.mock";
import { buildChannelDraftValues } from "../_lib/product-center-editing";
import { createProductCenterStore } from "./product-center-store";

describe("product center store", () => {
  it("updates list/detail/workbench data from one save action", () => {
    const store = createProductCenterStore(productCenterMock);
    const draft = buildChannelDraftValues(productCenterMock[0], "wechat");

    draft.basic.channelCategory = "coffee-gift";
    draft.logistics.freightTemplate = "wechat-standard";
    draft.logistics.deliveryEta = "48h";
    draft.logistics.servicePromise = "service-online";
    draft.content.coverAssetId = "asset-coffee-cover";
    draft.content.carouselAssetId = "asset-coffee-gallery";
    draft.content.heroVideoAssetId = "asset-coffee-detail";
    draft.highlights = ["礼盒", "可送礼"];

    store.getState().saveDraft({
      productId: "spu-hanger-coffee",
      channel: "wechat",
      draft,
      savedAt: "2026-04-02 20:10",
    });

    const state = store.getState();

    expect(state.getProductById("spu-hanger-coffee")?.channels.wechat.publicationStatus).toBe("ready_to_list");
    expect(state.getFilteredProducts({ search: "", productStatus: "all", channel: "all", channelState: "ready_to_list" })).toHaveLength(2);
    expect(state.getWorkbenchRows().some((row) => row.channel === "wechat" && row.publicationStatus === "ready_to_list")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: FAIL with module-not-found for `product-center-store`.

- [ ] **Step 3: Implement the store and provider**

Create `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`:

```ts
import { createStore } from "zustand/vanilla";

import { saveChannelDraft } from "../_lib/product-center-editing";
import { filterProductSummaries, getProductById, getProductCenterMetrics, getPublicationWorkbenchRows } from "../_lib/product-center.selectors";
import type { SaveChannelDraftInput } from "../_lib/product-center-editing.types";
import type { ProductCenterFilters, SPUDetail } from "../_lib/product-center.types";

export interface ProductCenterStoreState {
  products: SPUDetail[];
  saveDraft: (input: SaveChannelDraftInput) => void;
  getProductById: (id: string) => SPUDetail | undefined;
  getMetrics: () => ReturnType<typeof getProductCenterMetrics>;
  getFilteredProducts: (filters: ProductCenterFilters) => ReturnType<typeof filterProductSummaries>;
  getWorkbenchRows: () => ReturnType<typeof getPublicationWorkbenchRows>;
}

export function createProductCenterStore(initialProducts: SPUDetail[]) {
  return createStore<ProductCenterStoreState>((set, get) => ({
    products: initialProducts,
    saveDraft: (input) => set((state) => ({ products: saveChannelDraft(state.products, input) })),
    getProductById: (id) => getProductById(get().products, id),
    getMetrics: () => getProductCenterMetrics(get().products),
    getFilteredProducts: (filters) => filterProductSummaries(get().products, filters),
    getWorkbenchRows: () => getPublicationWorkbenchRows(get().products),
  }));
}
```

Create `src/app/(main)/dashboard/e-commerce/_state/product-center-provider.tsx`:

```tsx
"use client";

import * as React from "react";
import { useStore } from "zustand";

import { productCenterMock } from "../_lib/product-center.mock";
import { createProductCenterStore } from "./product-center-store";

const ProductCenterStoreContext = React.createContext<ReturnType<typeof createProductCenterStore> | null>(null);

export function ProductCenterProvider({ children }: React.PropsWithChildren) {
  const storeRef = React.useRef<ReturnType<typeof createProductCenterStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProductCenterStore(productCenterMock);
  }

  return <ProductCenterStoreContext.Provider value={storeRef.current}>{children}</ProductCenterStoreContext.Provider>;
}

export function useProductCenterStore<T>(selector: (state: ReturnType<typeof createProductCenterStore> extends infer S ? S extends { getState: () => infer U } ? U : never : never) => T) {
  const store = React.useContext(ProductCenterStoreContext);

  if (!store) {
    throw new Error("useProductCenterStore must be used within ProductCenterProvider");
  }

  return useStore(store, selector);
}
```

Create `src/app/(main)/dashboard/e-commerce/layout.tsx`:

```tsx
import type { ReactNode } from "react";

import { ProductCenterProvider } from "./_state/product-center-provider";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProductCenterProvider>{children}</ProductCenterProvider>;
}
```

- [ ] **Step 4: Rewire pages to the provider-backed data source**

Update `src/app/(main)/dashboard/e-commerce/products/page.tsx`:

```tsx
import { ProductCenterPage } from "./_components/product-center-page";

export default function Page() {
  return <ProductCenterPage />;
}
```

Update `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`:

```tsx
"use client";

import * as React from "react";

import { useProductCenterStore } from "../../_state/product-center-provider";
import type { ProductCenterFilters } from "../../_lib/product-center.types";
import { ProductCenterFiltersBar } from "./filters";
import { ProductCenterOverviewCards } from "./overview-cards";
import { ProductCenterTable } from "./product-table/table";

const initialFilters: ProductCenterFilters = {
  search: "",
  productStatus: "all",
  channel: "all",
  channelState: "all",
};

export function ProductCenterPage() {
  const [filters, setFilters] = React.useState(initialFilters);
  const deferredFilters = React.useDeferredValue(filters);
  const metrics = useProductCenterStore((state) => state.getMetrics());
  const filteredProducts = useProductCenterStore((state) => state.getFilteredProducts(deferredFilters));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductCenterOverviewCards metrics={metrics} />
      <ProductCenterFiltersBar filters={filters} onFiltersChange={setFilters} />
      <ProductCenterTable data={filteredProducts} />
    </div>
  );
}
```

Update `src/app/(main)/dashboard/e-commerce/publications/page.tsx`:

```tsx
import { PublicationWorkbenchPage } from "./_components/publication-workbench-page";

export default function Page() {
  return <PublicationWorkbenchPage />;
}
```

Create `src/app/(main)/dashboard/e-commerce/publications/_components/publication-workbench-page.tsx`:

```tsx
"use client";

import { useProductCenterStore } from "../../_state/product-center-provider";
import { WorkbenchOverviewCards } from "./workbench-overview-cards";
import { PublicationWorkbenchTable } from "./workbench-table/table";

export function PublicationWorkbenchPage() {
  const rows = useProductCenterStore((state) => state.getWorkbenchRows());

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <WorkbenchOverviewCards rows={rows} />
      <PublicationWorkbenchTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 5: Run the store test to verify it passes**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/layout.tsx src/app/'(main)'/dashboard/e-commerce/_state src/app/'(main)'/dashboard/e-commerce/products/page.tsx src/app/'(main)'/dashboard/e-commerce/products/_components/product-center-page.tsx src/app/'(main)'/dashboard/e-commerce/publications/page.tsx src/app/'(main)'/dashboard/e-commerce/publications/_components/publication-workbench-page.tsx
git commit -m "feat: add shared product center editing store"
```

## Task 3: Build grouped channel field editor UI

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-save-feedback.tsx`

- [ ] **Step 1: Add grouped field editor skeleton**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChannelFieldGroup({
  title,
  description,
  children,
}: React.PropsWithChildren<{ title: string; description: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { AssetItem } from "../../../_lib/product-center.types";

export function ChannelAssetPickerDialog({
  assets,
  onSelect,
  triggerLabel,
}: {
  assets: AssetItem[];
  onSelect: (assetId: string) => void;
  triggerLabel: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>从已有素材中选择</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {assets.map((asset) => (
            <Button key={asset.id} variant="ghost" className="justify-start" onClick={() => onSelect(asset.id)}>
              {asset.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Build the channel field editor component**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`:

```tsx
"use client";

import * as React from "react";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { channelFieldConfig } from "../../../_lib/product-center-editing.config";
import { buildChannelDraftValues, validateChannelDraft } from "../../../_lib/product-center-editing";
import type { ChannelDraftValues } from "../../../_lib/product-center-editing.types";
import type { AssetItem, ChannelId, SPUDetail } from "../../../_lib/product-center.types";
import { ChannelAssetPickerDialog } from "./channel-asset-picker-dialog";
import { ChannelFieldGroup } from "./channel-field-group";
import { ChannelSaveFeedback } from "./channel-save-feedback";

export function ChannelFieldEditor({
  channel,
  product,
  onSave,
}: {
  channel: ChannelId;
  product: SPUDetail;
  onSave: (draft: ChannelDraftValues) => Promise<void>;
}) {
  const draft = React.useMemo(() => buildChannelDraftValues(product, channel), [product, channel]);
  const form = useForm<ChannelDraftValues>({ values: draft });
  const [errors, setErrors] = React.useState<Record<string, Record<string, string>>>({});
  const [lastSavedAt, setLastSavedAt] = React.useState<string>("");

  async function handleSave(values: ChannelDraftValues) {
    const nextErrors = validateChannelDraft(values);
    const hasErrors = Object.values(nextErrors).some((group) => Object.keys(group).length > 0);

    setErrors(nextErrors);
    if (hasErrors) return;

    await onSave(values);
    setLastSavedAt(new Date().toLocaleString("zh-CN", { hour12: false }));
    form.reset(values);
  }

  const assets = product.assets;
  const fields = channelFieldConfig[channel];

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)}>
      <ChannelFieldGroup title="基础发布信息" description="标题、类目和卖点摘要。">
        <Input {...form.register("basic.shortTitle")} placeholder="请输入渠道短标题" />
        <Select value={form.watch("basic.channelCategory")} onValueChange={(value) => form.setValue("basic.channelCategory", value)}>
          <SelectTrigger><SelectValue placeholder="请选择渠道类目" /></SelectTrigger>
          <SelectContent>
            {fields.filter((item) => item.id === "channelCategory")[0]?.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea {...form.register("basic.sellingPoint")} placeholder="请输入卖点摘要" />
      </ChannelFieldGroup>

      <ChannelFieldGroup title="履约与配送" description="运费模板、发货时效、服务承诺。">
        <Input {...form.register("logistics.freightTemplate")} />
        <Input {...form.register("logistics.deliveryEta")} />
        <Input {...form.register("logistics.servicePromise")} />
      </ChannelFieldGroup>

      <ChannelFieldGroup title="内容素材" description="只允许从当前商品已有素材中选择。">
        <ChannelAssetPickerDialog assets={assets} triggerLabel="选择封面图" onSelect={(id) => form.setValue("content.coverAssetId", id)} />
        <ChannelAssetPickerDialog assets={assets} triggerLabel="选择轮播图" onSelect={(id) => form.setValue("content.carouselAssetId", id)} />
        <ChannelAssetPickerDialog assets={assets} triggerLabel="选择主图视频" onSelect={(id) => form.setValue("content.heroVideoAssetId", id)} />
      </ChannelFieldGroup>

      <ChannelFieldGroup title="扩展数组字段" description="可增删的渠道亮点。">
        {form.watch("highlights").map((_, index) => (
          <div key={index} className="flex gap-2">
            <Input {...form.register(`highlights.${index}`)} />
            <Button type="button" variant="outline" onClick={() => form.setValue("highlights", form.getValues("highlights").filter((__, itemIndex) => itemIndex !== index))}>
              删除
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => form.setValue("highlights", [...form.getValues("highlights"), ""])}>
          新增一项
        </Button>
      </ChannelFieldGroup>

      <ChannelSaveFeedback dirty={form.formState.isDirty} lastSavedAt={lastSavedAt} errors={errors} />
      <div className="flex justify-end">
        <Button type="submit">保存字段</Button>
      </div>
    </form>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-save-feedback.tsx`:

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ChannelSaveFeedback({
  dirty,
  lastSavedAt,
  errors,
}: {
  dirty: boolean;
  lastSavedAt: string;
  errors: Record<string, Record<string, string>>;
}) {
  const errorCount = Object.values(errors).reduce((count, group) => count + Object.keys(group).length, 0);

  if (errorCount > 0) {
    return (
      <Alert variant="destructive">
        <AlertTitle>保存前请先修正字段</AlertTitle>
        <AlertDescription>当前还有 {errorCount} 个字段未通过校验。</AlertDescription>
      </Alert>
    );
  }

  if (dirty) {
    return (
      <Alert>
        <AlertTitle>存在未保存修改</AlertTitle>
        <AlertDescription>点击“保存字段”后才会同步更新首页和发布工作台。</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertTitle>字段已保存</AlertTitle>
      <AlertDescription>{lastSavedAt ? `最近一次保存时间：${lastSavedAt}` : "当前没有未保存变更。"}</AlertDescription>
    </Alert>
  );
}
```

- [ ] **Step 3: Verify the editor components compile**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-field-editor.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-field-group.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-asset-picker-dialog.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-save-feedback.tsx
git commit -m "feat: add grouped channel field editor"
```

## Task 4: Integrate editable channel tabs into the detail page

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`

- [ ] **Step 1: Convert the detail page to a provider-backed client shell**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`:

```tsx
"use client";

import { notFound, useSearchParams } from "next/navigation";

import { useProductCenterStore } from "../../../_state/product-center-provider";
import type { ChannelDraftValues } from "../../../_lib/product-center-editing.types";
import type { ChannelId } from "../../../_lib/product-center.types";
import { AssetsCard } from "./assets-card";
import { BasicInfoCard } from "./basic-info-card";
import { ChannelPublicationTabs } from "./channel-publication-tabs";
import { DetailHeader } from "./detail-header";
import { SkuTable } from "./sku-table";

export function ProductDetailPage({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const requestedChannel = searchParams.get("channel");
  const initialChannel = requestedChannel === "douyin" || requestedChannel === "wechat" ? (requestedChannel as ChannelId) : undefined;
  const product = useProductCenterStore((state) => state.getProductById(productId));
  const saveDraft = useProductCenterStore((state) => state.saveDraft);

  if (!product) {
    notFound();
  }

  async function handleSave(channel: ChannelId, draft: ChannelDraftValues) {
    saveDraft({
      productId: product.id,
      channel,
      draft,
      savedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    });
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] md:gap-6">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <BasicInfoCard product={product} />
          <ChannelPublicationTabs product={product} initialChannel={initialChannel} onSave={handleSave} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <SkuTable skus={product.skus} />
          <AssetsCard assets={product.assets} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the route and tabs to the new editor**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`:

```tsx
import { ProductDetailPage } from "./_components/product-detail-page";

interface ProductDetailPageRouteProps {
  params: Promise<{ productId: string }>;
}

export default async function Page({ params }: ProductDetailPageRouteProps) {
  const { productId } = await params;
  return <ProductDetailPage productId={productId} />;
}
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`:

```tsx
"use client";

import { ChannelFieldEditor } from "./channel-field-editor";
import type { ChannelDraftValues } from "../../../_lib/product-center-editing.types";

export function ChannelPublicationTabs({
  product,
  initialChannel,
  onSave,
}: {
  product: SPUDetail;
  initialChannel?: ChannelId;
  onSave: (channel: ChannelId, draft: ChannelDraftValues) => Promise<void>;
}) {
  const channels = Object.values(product.channels);
  const defaultChannel =
    initialChannel && channels.some((channel) => channel.channel === initialChannel)
      ? initialChannel
      : channels[0]?.channel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>渠道发布</CardTitle>
        <CardDescription>查看状态并直接编辑渠道字段。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs key={defaultChannel} defaultValue={defaultChannel} className="gap-4">
          <TabsList variant="line">
            {channels.map((channel) => (
              <TabsTrigger key={channel.channel} value={channel.channel} className="gap-2">
                {channelLabel[channel.channel]}
                <ChannelStatusBadge status={channel.publicationStatus} className="ml-1" />
              </TabsTrigger>
            ))}
          </TabsList>
          {channels.map((channel) => (
            <TabsContent key={channel.channel} value={channel.channel} className="space-y-4">
              <StatusGrid channel={channel} />
              <MissingFieldsSection channel={channel} />
              <ChannelFieldEditor channel={channel.channel} product={product} onSave={(draft) => onSave(channel.channel, draft)} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify save wiring and build**

Run:

```bash
pnpm build
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/page.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-publication-tabs.tsx
git commit -m "feat: wire editable channel tabs"
```

## Task 5: Verify cross-page synchronization and refine workbench/list behavior

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx`

- [ ] **Step 1: Add a selector regression test for post-save cross-page state**

Append to `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`:

```ts
import { buildChannelDraftValues, saveChannelDraft } from "./product-center-editing";

it("reflects saved channel state in list and workbench selectors", () => {
  const draft = buildChannelDraftValues(productCenterMock[0], "wechat");

  draft.basic.channelCategory = "coffee-gift";
  draft.logistics.freightTemplate = "wechat-standard";
  draft.logistics.deliveryEta = "48h";
  draft.logistics.servicePromise = "service-online";
  draft.content.coverAssetId = "asset-coffee-cover";
  draft.content.carouselAssetId = "asset-coffee-gallery";
  draft.content.heroVideoAssetId = "asset-coffee-detail";
  draft.highlights = ["礼盒", "节日送礼"];

  const next = saveChannelDraft(productCenterMock, {
    productId: "spu-hanger-coffee",
    channel: "wechat",
    draft,
    savedAt: "2026-04-02 20:10",
  });

  expect(
    filterProductSummaries(next, {
      search: "",
      productStatus: "all",
      channel: "wechat",
      channelState: "ready_to_list",
    }).some((item) => item.id === "spu-hanger-coffee"),
  ).toBe(true);

  expect(
    getPublicationWorkbenchRows(next).some(
      (row) => row.productId === "spu-hanger-coffee" && row.channel === "wechat" && row.publicationStatus === "ready_to_list",
    ),
  ).toBe(true);
});
```

- [ ] **Step 2: Normalize visible labels and feedback copy**

Update `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`:

```tsx
const channelOptions: Array<{ value: ProductCenterFilters["channel"]; label: string }> = [
  { value: "all", label: "全部渠道" },
  { value: "douyin", label: "抖音" },
  { value: "wechat", label: "视频号" },
];
```

Update `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx` so card descriptions stay aligned with post-save transitions:

```tsx
const overviewCards = [
  { key: "in_review", title: "审核中", description: "等待渠道审核的任务" },
  { key: "missing_fields", title: "待补字段", description: "保存字段后仍未补齐的任务" },
  { key: "sync_error", title: "同步异常", description: "需要重新同步的渠道任务" },
  { key: "ready_to_list", title: "待上架", description: "字段已齐备，等待进一步动作" },
  { key: "rejected", title: "已驳回", description: "被渠道驳回后等待修正的任务" },
] as const;
```

- [ ] **Step 3: Run the full focused checks**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts'
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
pnpm check
pnpm build
```

Expected: all PASS; `pnpm check` may still show the pre-existing cookie warning, but the new feature files should be clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-center.selectors.test.ts src/app/'(main)'/dashboard/e-commerce/products/_components/filters.tsx src/app/'(main)'/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx
git commit -m "feat: sync channel field saves across views"
```

## Task 6: Final verification and manual smoke pass

**Files:**
- Modify: only if verification reveals a real issue

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

Expected:

- `pnpm test` PASS
- `pnpm check` PASS with only known non-blocking warnings outside this feature
- `pnpm build` PASS

- [ ] **Step 2: Smoke-test the key flows**

Run:

```bash
pnpm dev
```

Then verify:

1. 打开 `/dashboard/e-commerce/products/spu-hanger-coffee`
2. 切到 `视频号` Tab
3. 补齐缺失字段并点击 `保存字段`
4. 返回 `/dashboard/e-commerce/products`
5. 打开 `/dashboard/e-commerce/publications`

Expected:

- 详情页的 `视频号` 状态从 `待补字段` 变成 `待上架`
- 首页该商品的 `视频号状态` 更新
- 工作台任务列表和概览卡同步变化

- [ ] **Step 3: Fix any real verification issues**

If the selected channel is lost after navigation, keep the detail shell reading `?channel=` via:

```tsx
const requestedChannel = searchParams.get("channel");
const initialChannel = requestedChannel === "douyin" || requestedChannel === "wechat" ? requestedChannel : undefined;
```

If form dirty state is not cleared after save, normalize save handling to:

```tsx
await onSave(values);
form.reset(values);
```

- [ ] **Step 4: Commit the verified feature**

```bash
git add src/app/'(main)'/dashboard/e-commerce
git commit -m "feat: add simulated channel field editing flow"
```

## Self-Review Checklist

- Spec coverage:
  - 详情页 Tab 内联编辑: Task 3 + Task 4
  - 四类字段: Task 1 config + Task 3 renderer
  - 显式保存: Task 4
  - 详情页 / 首页 / 工作台联动: Task 2 + Task 5
  - 未来真实接口边界的前端对应：Task 1 mutation engine + Task 2 store
- Placeholder scan:
  - No `TODO` / `TBD`
  - No “类似 Task N”
  - Every command is explicit
- Type consistency:
  - `ChannelDraftValues`, `SaveChannelDraftInput`, and provider store methods are defined once and reused
  - Pages no longer read static mock data directly once the provider is introduced
