# Omni-Channel Product Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-phase omni-channel product center UI under the existing dashboard, centered on SPU master data with Douyin and WeChat Channels publication views backed by typed mock data.

**Architecture:** Add a new `dashboard/e-commerce` route group that follows the repo's colocation pattern. Keep domain types, mock data, and selectors inside a route-local `_lib`, then build three UI surfaces on top of that shared contract: product center landing page, SPU detail page, and publication workbench.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/ui, TanStack Table, Zod, Vitest

---

## Scope Check

This plan covers one implementation slice: the first-phase frontend product center. It does not include real platform API integration, auth changes, async task backends, or RBAC. Those should stay out of scope until this UI slice is working and reviewable.

## File Map

### Modify

- `package.json`
- `src/navigation/sidebar/sidebar-items.ts`

### Create

- `vitest.config.ts`
- `src/app/(main)/dashboard/e-commerce/page.tsx`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`
- `src/app/(main)/dashboard/e-commerce/_components/channel-status-badge.tsx`
- `src/app/(main)/dashboard/e-commerce/products/page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/overview-cards.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/product-table/schema.ts`
- `src/app/(main)/dashboard/e-commerce/products/_components/product-table/columns.tsx`
- `src/app/(main)/dashboard/e-commerce/products/_components/product-table/table.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/basic-info-card.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/sku-table.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/page.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/schema.ts`
- `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/columns.tsx`
- `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/table.tsx`

## Task 1: Establish typed mock domain and minimal test loop

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.ts`
- Test: `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`

- [ ] **Step 1: Install Vitest and add test scripts**

Run:

```bash
pnpm add -D vitest
```

Then update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint",
    "format": "biome format --write",
    "check": "biome check",
    "check:fix": "biome check --write",
    "prepare": "husky",
    "generate:presets": "ts-node -P tsconfig.scripts.json src/scripts/generate-theme-presets.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@biomejs/biome": "2.3.8",
    "@tailwindcss/postcss": "^4.2.2",
    "@types/node": "^22.19.15",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "babel-plugin-react-compiler": "^1.0.0",
    "globals": "^15.15.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.5.2",
    "postcss": "^8.5.8",
    "tailwindcss": "^4.1.5",
    "ts-node": "^10.9.2",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

Create `vitest.config.ts`:

```ts
import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Write the failing selector test**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { productCenterMock } from "./product-center.mock";
import {
  filterProductSummaries,
  getProductById,
  getProductCenterMetrics,
  getPublicationWorkbenchRows,
} from "./product-center.selectors";

describe("productCenter selectors", () => {
  it("computes homepage metrics from shared mock data", () => {
    expect(getProductCenterMetrics(productCenterMock)).toEqual({
      totalProducts: 3,
      missingContent: 2,
      readyToPublish: 1,
      inReview: 1,
      syncErrors: 1,
    });
  });

  it("filters products by search keyword and channel state", () => {
    expect(
      filterProductSummaries(productCenterMock, {
        search: "挂耳",
        productStatus: "all",
        channel: "all",
        channelState: "all",
      }).map((item) => item.id),
    ).toEqual(["spu-hanger-coffee"]);

    expect(
      filterProductSummaries(productCenterMock, {
        search: "",
        productStatus: "all",
        channel: "wechat",
        channelState: "sync_error",
      }).map((item) => item.id),
    ).toEqual(["spu-jasmine-tea"]);
  });

  it("finds a product detail by id", () => {
    expect(getProductById(productCenterMock, "spu-hanger-coffee")?.name).toBe("冷萃挂耳咖啡礼盒");
  });

  it("flattens actionable publication rows for the workbench", () => {
    expect(getPublicationWorkbenchRows(productCenterMock)).toHaveLength(4);
    expect(getPublicationWorkbenchRows(productCenterMock)[0].channel).toBe("douyin");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts'
```

Expected: FAIL with module-not-found errors for `product-center.mock` or `product-center.selectors`.

- [ ] **Step 4: Implement types, mock data, and selector helpers**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`:

```ts
export type ChannelId = "douyin" | "wechat";
export type ProductStatus = "draft" | "ready" | "archived";
export type PublicationStatus =
  | "not_started"
  | "missing_fields"
  | "ready_to_list"
  | "in_review"
  | "rejected"
  | "live"
  | "offline"
  | "sync_error";
export type AuditStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type ListingStatus = "not_listed" | "listed" | "delisted";

export interface ChannelFieldState {
  label: string;
  value: string;
  state: "ready" | "missing" | "warning";
}

export interface ChannelPublicationView {
  channel: ChannelId;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
  rejectionReason?: string;
  lastSyncAt: string;
  channelSpecificFields: ChannelFieldState[];
}

export interface SKUItem {
  id: string;
  name: string;
  sellerSku: string;
  priceLabel: string;
  inventory: number;
}

export interface AssetItem {
  id: string;
  type: "cover" | "gallery" | "detail";
  label: string;
  status: "ready" | "missing";
}

export interface SPUSummary {
  id: string;
  spuCode: string;
  name: string;
  category: string;
  brand: string;
  shop: string;
  skuCount: number;
  completionPercent: number;
  productStatus: ProductStatus;
  updatedAt: string;
  channels: Record<ChannelId, ChannelPublicationView>;
}

export interface SPUDetail extends SPUSummary {
  description: string;
  tags: string[];
  skus: SKUItem[];
  assets: AssetItem[];
}

export interface ProductCenterFilters {
  search: string;
  productStatus: "all" | ProductStatus;
  channel: "all" | ChannelId;
  channelState: "all" | PublicationStatus;
}

export interface ProductCenterMetrics {
  totalProducts: number;
  missingContent: number;
  readyToPublish: number;
  inReview: number;
  syncErrors: number;
}

export interface PublicationWorkbenchRow {
  productId: string;
  productName: string;
  channel: ChannelId;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  blocker: string;
  updatedAt: string;
}
```

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`:

```ts
import type { SPUDetail } from "./product-center.types";

export const productCenterMock: SPUDetail[] = [
  {
    id: "spu-hanger-coffee",
    spuCode: "SPU-COFFEE-001",
    name: "冷萃挂耳咖啡礼盒",
    category: "咖啡冲饮",
    brand: "栖山实验室",
    shop: "抖音旗舰店",
    skuCount: 2,
    completionPercent: 100,
    productStatus: "ready",
    updatedAt: "2026-04-02 10:20",
    description: "适合短视频种草的冷萃挂耳组合装，包含两种风味规格。",
    tags: ["礼盒", "短视频主推", "新品"],
    skus: [
      { id: "sku-coffee-01", name: "经典拼配", sellerSku: "DRIP-CLASSIC", priceLabel: "¥59.00", inventory: 182 },
      { id: "sku-coffee-02", name: "花果拼配", sellerSku: "DRIP-FRUITY", priceLabel: "¥69.00", inventory: 96 },
    ],
    assets: [
      { id: "asset-coffee-cover", type: "cover", label: "封面图", status: "ready" },
      { id: "asset-coffee-gallery", type: "gallery", label: "卖点组图", status: "ready" },
      { id: "asset-coffee-detail", type: "detail", label: "详情长图", status: "ready" },
    ],
    channels: {
      douyin: {
        channel: "douyin",
        publicationStatus: "ready_to_list",
        auditStatus: "approved",
        listingStatus: "not_listed",
        missingFields: [],
        lastSyncAt: "2026-04-02 09:55",
        channelSpecificFields: [
          { label: "带货短标题", value: "春季上新冷萃挂耳礼盒", state: "ready" },
          { label: "卖点视频", value: "15 秒商品视频", state: "ready" },
        ],
      },
      wechat: {
        channel: "wechat",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: ["商品轮播图", "运费模板"],
        lastSyncAt: "2026-04-02 09:40",
        channelSpecificFields: [
          { label: "商品轮播图", value: "缺失", state: "missing" },
          { label: "运费模板", value: "未选择", state: "missing" },
        ],
      },
    },
  },
  {
    id: "spu-coffee-trial",
    spuCode: "SPU-COFFEE-002",
    name: "慢烘焙挂耳咖啡尝鲜装",
    category: "咖啡冲饮",
    brand: "栖山实验室",
    shop: "视频号小店",
    skuCount: 1,
    completionPercent: 68,
    productStatus: "draft",
    updatedAt: "2026-04-01 18:10",
    description: "主打低门槛试喝场景，目前素材仍在补齐。",
    tags: ["待补资料"],
    skus: [{ id: "sku-coffee-03", name: "尝鲜装", sellerSku: "DRIP-TRIAL", priceLabel: "¥29.90", inventory: 56 }],
    assets: [
      { id: "asset-trial-cover", type: "cover", label: "封面图", status: "ready" },
      { id: "asset-trial-gallery", type: "gallery", label: "卖点组图", status: "missing" },
      { id: "asset-trial-detail", type: "detail", label: "详情长图", status: "missing" },
    ],
    channels: {
      douyin: {
        channel: "douyin",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: ["商品卖点图", "详细参数"],
        lastSyncAt: "2026-04-01 18:00",
        channelSpecificFields: [
          { label: "商品卖点图", value: "缺失", state: "missing" },
          { label: "详细参数", value: "缺失", state: "missing" },
        ],
      },
      wechat: {
        channel: "wechat",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: ["主图视频"],
        lastSyncAt: "2026-04-01 17:58",
        channelSpecificFields: [{ label: "主图视频", value: "缺失", state: "missing" }],
      },
    },
  },
  {
    id: "spu-jasmine-tea",
    spuCode: "SPU-TEA-001",
    name: "茉莉轻乳茶浓缩液",
    category: "茶饮冲调",
    brand: "山野调饮",
    shop: "抖音旗舰店",
    skuCount: 3,
    completionPercent: 96,
    productStatus: "ready",
    updatedAt: "2026-04-02 08:45",
    description: "适合直播间组合售卖，主图与文案已完成，正在做渠道同步。",
    tags: ["直播间", "复购款"],
    skus: [
      { id: "sku-tea-01", name: "单瓶", sellerSku: "TEA-SINGLE", priceLabel: "¥39.00", inventory: 212 },
      { id: "sku-tea-02", name: "双瓶", sellerSku: "TEA-DOUBLE", priceLabel: "¥69.00", inventory: 148 },
      { id: "sku-tea-03", name: "四瓶礼盒", sellerSku: "TEA-GIFT", priceLabel: "¥129.00", inventory: 74 },
    ],
    assets: [
      { id: "asset-tea-cover", type: "cover", label: "封面图", status: "ready" },
      { id: "asset-tea-gallery", type: "gallery", label: "卖点组图", status: "ready" },
      { id: "asset-tea-detail", type: "detail", label: "详情长图", status: "ready" },
    ],
    channels: {
      douyin: {
        channel: "douyin",
        publicationStatus: "in_review",
        auditStatus: "pending",
        listingStatus: "not_listed",
        missingFields: [],
        lastSyncAt: "2026-04-02 08:10",
        channelSpecificFields: [
          { label: "带货短标题", value: "轻乳茶浓缩液一瓶做四杯", state: "ready" },
          { label: "卖点视频", value: "审核中", state: "warning" },
        ],
      },
      wechat: {
        channel: "wechat",
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: [],
        rejectionReason: "价格带同步失败，请重新提交渠道同步。",
        lastSyncAt: "2026-04-02 08:18",
        channelSpecificFields: [
          { label: "价格带", value: "同步失败", state: "warning" },
          { label: "运费模板", value: "常温模板", state: "ready" },
        ],
      },
    },
  },
];
```

Create `src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.ts`:

```ts
import type {
  ProductCenterFilters,
  ProductCenterMetrics,
  PublicationWorkbenchRow,
  SPUDetail,
  SPUSummary,
} from "./product-center.types";

export function getProductCenterMetrics(products: SPUDetail[]): ProductCenterMetrics {
  return {
    totalProducts: products.length,
    missingContent: products.filter((item) => item.completionPercent < 100).length,
    readyToPublish: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.publicationStatus === "ready_to_list"),
    ).length,
    inReview: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.auditStatus === "pending"),
    ).length,
    syncErrors: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.publicationStatus === "sync_error"),
    ).length,
  };
}

export function filterProductSummaries(products: SPUDetail[], filters: ProductCenterFilters): SPUSummary[] {
  const keyword = filters.search.trim().toLowerCase();

  return products.filter((item) => {
    const matchesKeyword =
      keyword.length === 0 ||
      item.name.toLowerCase().includes(keyword) ||
      item.spuCode.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword);

    const matchesProductStatus = filters.productStatus === "all" || item.productStatus === filters.productStatus;
    const channelViews = filters.channel === "all" ? Object.values(item.channels) : [item.channels[filters.channel]];
    const matchesChannel = filters.channel === "all" || channelViews[0].publicationStatus !== "not_started";
    const matchesChannelState =
      filters.channelState === "all" || channelViews.some((channel) => channel.publicationStatus === filters.channelState);

    return matchesKeyword && matchesProductStatus && matchesChannel && matchesChannelState;
  });
}

export function getProductById(products: SPUDetail[], id: string): SPUDetail | undefined {
  return products.find((item) => item.id === id);
}

export function getPublicationWorkbenchRows(products: SPUDetail[]): PublicationWorkbenchRow[] {
  return products.flatMap((product) =>
    Object.values(product.channels)
      .filter((channel) => channel.publicationStatus !== "ready_to_list" && channel.publicationStatus !== "live")
      .map((channel) => ({
        productId: product.id,
        productName: product.name,
        channel: channel.channel,
        publicationStatus: channel.publicationStatus,
        auditStatus: channel.auditStatus,
        blocker: channel.missingFields[0] ?? channel.rejectionReason ?? "等待渠道处理",
        updatedAt: channel.lastSyncAt,
      })),
  );
}
```

- [ ] **Step 5: Run the selector test to verify it passes**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts'
```

Expected: PASS with `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts src/app/'(main)'/dashboard/e-commerce/_lib
git commit -m "feat: add product center mock domain"
```

## Task 2: Add dashboard navigation and route shells

**Files:**
- Modify: `src/navigation/sidebar/sidebar-items.ts`
- Create: `src/app/(main)/dashboard/e-commerce/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/publications/page.tsx`

- [ ] **Step 1: Replace the E-commerce "coming soon" item with real sub-navigation**

Update `src/navigation/sidebar/sidebar-items.ts`:

```ts
{
  title: "E-commerce",
  url: "/dashboard/e-commerce",
  icon: ShoppingBag,
  subItems: [
    {
      title: "Product Center",
      url: "/dashboard/e-commerce/products",
    },
    {
      title: "Publication Workbench",
      url: "/dashboard/e-commerce/publications",
    },
  ],
},
```

- [ ] **Step 2: Create route shell files so the sidebar targets resolve immediately**

Create `src/app/(main)/dashboard/e-commerce/page.tsx`:

```ts
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/e-commerce/products");
}
```

Create `src/app/(main)/dashboard/e-commerce/products/page.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Center</CardTitle>
          <CardDescription>SPU 主档、资料完整度与渠道发布状态会在后续任务中填充。</CardDescription>
        </CardHeader>
        <CardContent>Loading product center shell...</CardContent>
      </Card>
    </div>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/publications/page.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Publication Workbench</CardTitle>
          <CardDescription>待审核、同步失败和待补字段任务会在后续任务中填充。</CardDescription>
        </CardHeader>
        <CardContent>Loading publication workbench shell...</CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Run a build check to verify the new routes compile**

Run:

```bash
pnpm build
```

Expected: PASS and Next.js generates `/dashboard/e-commerce/products` and `/dashboard/e-commerce/publications`.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/sidebar/sidebar-items.ts src/app/'(main)'/dashboard/e-commerce
git commit -m "feat: add e-commerce dashboard routes"
```

## Task 3: Build the product center landing page shell

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/_components/channel-status-badge.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/overview-cards.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`

- [ ] **Step 1: Create a shared publication-status badge**

Create `src/app/(main)/dashboard/e-commerce/_components/channel-status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { PublicationStatus } from "../_lib/product-center.types";

const STATUS_LABELS: Record<PublicationStatus, string> = {
  not_started: "未开始",
  missing_fields: "待补字段",
  ready_to_list: "待上架",
  in_review: "审核中",
  rejected: "审核失败",
  live: "已上架",
  offline: "已下架",
  sync_error: "同步异常",
};

const STATUS_CLASSNAMES: Record<PublicationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  missing_fields: "bg-amber-500/10 text-amber-700",
  ready_to_list: "bg-sky-500/10 text-sky-700",
  in_review: "bg-blue-500/10 text-blue-700",
  rejected: "bg-destructive/10 text-destructive",
  live: "bg-green-500/10 text-green-700",
  offline: "bg-zinc-500/10 text-zinc-700",
  sync_error: "bg-destructive/10 text-destructive",
};

export function ChannelStatusBadge({ status }: { status: PublicationStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASSNAMES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
```

- [ ] **Step 2: Create the client shell that owns filter state and composes the landing page**

Create `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`:

```tsx
"use client";
"use no memo";

import * as React from "react";

import { filterProductSummaries, getProductCenterMetrics } from "../../_lib/product-center.selectors";
import type { ProductCenterFilters, SPUDetail } from "../../_lib/product-center.types";
import { ProductCenterFiltersBar } from "./filters";
import { ProductCenterOverviewCards } from "./overview-cards";

const INITIAL_FILTERS: ProductCenterFilters = {
  search: "",
  productStatus: "all",
  channel: "all",
  channelState: "all",
};

export function ProductCenterPage({ products }: { products: SPUDetail[] }) {
  const [filters, setFilters] = React.useState<ProductCenterFilters>(INITIAL_FILTERS);
  const deferredFilters = React.useDeferredValue(filters);

  const metrics = getProductCenterMetrics(products);
  const filteredProducts = filterProductSummaries(products, deferredFilters);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductCenterOverviewCards metrics={metrics} />
      <ProductCenterFiltersBar filters={filters} onFiltersChange={setFilters} />
      <div className="rounded-xl border border-dashed bg-card p-6 text-muted-foreground text-sm">
        当前筛选命中 {filteredProducts.length} 个商品。列表表格会在下一任务接入。
      </div>
    </div>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/_components/overview-cards.tsx`:

```tsx
import { AlertTriangle, CheckCircle2, FileWarning, Package2, RefreshCcw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ProductCenterMetrics } from "../../_lib/product-center.types";

const CARD_CONFIG = [
  { key: "totalProducts", label: "商品总数", description: "当前 SPU 主档规模", icon: Package2 },
  { key: "missingContent", label: "待补资料", description: "主档资料未完善", icon: FileWarning },
  { key: "readyToPublish", label: "可发布", description: "至少一个渠道可上架", icon: CheckCircle2 },
  { key: "inReview", label: "审核中", description: "渠道正在审核", icon: AlertTriangle },
  { key: "syncErrors", label: "发布异常", description: "渠道同步异常待处理", icon: RefreshCcw },
] as const;

export function ProductCenterOverviewCards({ metrics }: { metrics: ProductCenterMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      {CARD_CONFIG.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key}>
            <CardHeader>
              <CardDescription>{item.description}</CardDescription>
              <CardTitle className="flex items-center justify-between">
                <span>{item.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-semibold text-3xl tabular-nums">{metrics[item.key]}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/_components/filters.tsx`:

```tsx
"use client";

import type { Dispatch, SetStateAction } from "react";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ProductCenterFilters } from "../../_lib/product-center.types";

export function ProductCenterFiltersBar({
  filters,
  onFiltersChange,
}: {
  filters: ProductCenterFilters;
  onFiltersChange: Dispatch<SetStateAction<ProductCenterFilters>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, search: event.target.value }))}
          className="pl-9"
          placeholder="搜索商品名、SPU、类目"
        />
      </div>
      <Select
        value={filters.productStatus}
        onValueChange={(value) => onFiltersChange((prev) => ({ ...prev, productStatus: value as ProductCenterFilters["productStatus"] }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="商品状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部商品状态</SelectItem>
          <SelectItem value="draft">草稿</SelectItem>
          <SelectItem value="ready">已就绪</SelectItem>
          <SelectItem value="archived">已归档</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.channel}
        onValueChange={(value) => onFiltersChange((prev) => ({ ...prev, channel: value as ProductCenterFilters["channel"] }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="渠道" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部渠道</SelectItem>
          <SelectItem value="douyin">抖音</SelectItem>
          <SelectItem value="wechat">视频号</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.channelState}
        onValueChange={(value) => onFiltersChange((prev) => ({ ...prev, channelState: value as ProductCenterFilters["channelState"] }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="渠道状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部渠道状态</SelectItem>
          <SelectItem value="missing_fields">待补字段</SelectItem>
          <SelectItem value="ready_to_list">待上架</SelectItem>
          <SelectItem value="in_review">审核中</SelectItem>
          <SelectItem value="sync_error">同步异常</SelectItem>
          <SelectItem value="live">已上架</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 3: Wire the shell into the products route with shared mock data**

Update `src/app/(main)/dashboard/e-commerce/products/page.tsx`:

```tsx
import { productCenterMock } from "../_lib/product-center.mock";
import { ProductCenterPage } from "./_components/product-center-page";

export default function Page() {
  return <ProductCenterPage products={productCenterMock} />;
}
```

- [ ] **Step 4: Run a build check**

Run:

```bash
pnpm build
```

Expected: PASS and the Product Center route renders overview cards plus filters without table content yet.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce
git commit -m "feat: add product center landing shell"
```

## Task 4: Add the SPU table and homepage decision view

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/product-table/schema.ts`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/product-table/columns.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/_components/product-table/table.tsx`

- [ ] **Step 1: Create the product table row schema**

Create `src/app/(main)/dashboard/e-commerce/products/_components/product-table/schema.ts`:

```ts
import z from "zod";

export const productSummaryRowSchema = z.object({
  id: z.string(),
  spuCode: z.string(),
  name: z.string(),
  category: z.string(),
  skuCount: z.number(),
  completionPercent: z.number(),
  updatedAt: z.string(),
  channels: z.object({
    douyin: z.object({
      publicationStatus: z.string(),
      missingFields: z.array(z.string()),
    }),
    wechat: z.object({
      publicationStatus: z.string(),
      missingFields: z.array(z.string()),
    }),
  }),
});

export type ProductSummaryRow = z.infer<typeof productSummaryRowSchema>;
```

- [ ] **Step 2: Add table columns with completion and channel status visibility**

Create `src/app/(main)/dashboard/e-commerce/products/_components/product-table/columns.tsx`:

```tsx
"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightIcon } from "lucide-react";

import { ChannelStatusBadge } from "@/app/(main)/dashboard/e-commerce/_components/channel-status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { ProductSummaryRow } from "./schema";

export const productSummaryColumns: ColumnDef<ProductSummaryRow>[] = [
  {
    accessorKey: "name",
    header: "商品 / SPU",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.original.name}</div>
        <div className="text-muted-foreground text-xs">{row.original.spuCode}</div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: "类目",
  },
  {
    accessorKey: "skuCount",
    header: "SKU 数",
    cell: ({ row }) => <span className="tabular-nums">{row.original.skuCount}</span>,
  },
  {
    accessorKey: "completionPercent",
    header: "资料完整度",
    cell: ({ row }) => (
      <div className="min-w-32 space-y-2">
        <div className="text-sm tabular-nums">{row.original.completionPercent}%</div>
        <Progress value={row.original.completionPercent} />
      </div>
    ),
  },
  {
    id: "douyinStatus",
    header: "抖音状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.channels.douyin.publicationStatus as never} />,
  },
  {
    id: "wechatStatus",
    header: "视频号状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.channels.wechat.publicationStatus as never} />,
  },
  {
    accessorKey: "updatedAt",
    header: "最后更新",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.updatedAt}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/e-commerce/products/${row.original.id}`}>
          查看详情
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
    ),
    enableHiding: false,
  },
];
```

- [ ] **Step 3: Create the table wrapper and insert it into the landing page**

Create `src/app/(main)/dashboard/e-commerce/products/_components/product-table/table.tsx`:

```tsx
"use client";
"use no memo";

import * as React from "react";

import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { productSummaryColumns } from "./columns";
import type { ProductSummaryRow } from "./schema";

export function ProductCenterTable({ data }: { data: ProductSummaryRow[] }) {
  const table = useReactTable({
    data,
    columns: productSummaryColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品主档列表</CardTitle>
        <CardDescription>优先展示能否发布、卡在哪个渠道、是否需要补资料。</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden rounded-xl border px-0">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

Update `src/app/(main)/dashboard/e-commerce/products/_components/product-center-page.tsx`:

```tsx
"use client";
"use no memo";

import * as React from "react";

import { ProductCenterTable } from "./product-table/table";
import { filterProductSummaries, getProductCenterMetrics } from "../../_lib/product-center.selectors";
import type { ProductCenterFilters, SPUDetail } from "../../_lib/product-center.types";
import { ProductCenterFiltersBar } from "./filters";
import { ProductCenterOverviewCards } from "./overview-cards";

const INITIAL_FILTERS: ProductCenterFilters = {
  search: "",
  productStatus: "all",
  channel: "all",
  channelState: "all",
};

export function ProductCenterPage({ products }: { products: SPUDetail[] }) {
  const [filters, setFilters] = React.useState<ProductCenterFilters>(INITIAL_FILTERS);
  const deferredFilters = React.useDeferredValue(filters);

  const metrics = getProductCenterMetrics(products);
  const filteredProducts = filterProductSummaries(products, deferredFilters);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductCenterOverviewCards metrics={metrics} />
      <ProductCenterFiltersBar filters={filters} onFiltersChange={setFilters} />
      <ProductCenterTable data={filteredProducts} />
    </div>
  );
}
```

- [ ] **Step 4: Verify the table route**

Run:

```bash
pnpm build
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts'
```

Expected:

- `pnpm build` PASS
- selector test still PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products
git commit -m "feat: add product center table view"
```

## Task 5: Build the SPU detail page and channel publication tabs

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/basic-info-card.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/sku-table.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`

- [ ] **Step 1: Create the detail page route and not-found guard**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { getProductById } from "../../_lib/product-center.selectors";
import { productCenterMock } from "../../_lib/product-center.mock";
import { AssetsCard } from "./_components/assets-card";
import { BasicInfoCard } from "./_components/basic-info-card";
import { ChannelPublicationTabs } from "./_components/channel-publication-tabs";
import { DetailHeader } from "./_components/detail-header";
import { SkuTable } from "./_components/sku-table";

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = getProductById(productCenterMock, productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="flex flex-col gap-4">
          <BasicInfoCard product={product} />
          <SkuTable skus={product.skus} />
        </div>
        <div className="flex flex-col gap-4">
          <AssetsCard assets={product.assets} />
          <ChannelPublicationTabs channels={product.channels} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the header and master-data cards**

Create `detail-header.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { SPUDetail } from "../../../_lib/product-center.types";

export function DetailHeader({ product }: { product: SPUDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{product.spuCode}</CardDescription>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{product.name}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline">更新渠道</Button>
            <Button>提交审核</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">资料完整度</span>
            <span className="tabular-nums">{product.completionPercent}%</span>
          </div>
          <Progress value={product.completionPercent} />
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `basic-info-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { SPUDetail } from "../../../_lib/product-center.types";

export function BasicInfoCard({ product }: { product: SPUDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基础信息</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-xs">类目</div>
          <div className="font-medium">{product.category}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">品牌</div>
          <div className="font-medium">{product.brand}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">所属店铺</div>
          <div className="font-medium">{product.shop}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">最后更新</div>
          <div className="font-medium">{product.updatedAt}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-muted-foreground text-xs">商品描述</div>
          <div className="font-medium leading-6">{product.description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `sku-table.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { SKUItem } from "../../../_lib/product-center.types";

export function SkuTable({ skus }: { skus: SKUItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SKU 规格</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>规格名</TableHead>
              <TableHead>商家 SKU</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>库存</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.map((sku) => (
              <TableRow key={sku.id}>
                <TableCell>{sku.name}</TableCell>
                <TableCell>{sku.sellerSku}</TableCell>
                <TableCell>{sku.priceLabel}</TableCell>
                <TableCell className="tabular-nums">{sku.inventory}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

Create `assets-card.tsx`:

```tsx
import { CheckCircle2, ImageOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AssetItem } from "../../../_lib/product-center.types";

export function AssetsCard({ assets }: { assets: AssetItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>内容素材</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium">{asset.label}</div>
              <div className="text-muted-foreground text-xs">{asset.type}</div>
            </div>
            {asset.status === "ready" ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <ImageOff className="size-4 text-amber-600" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create the channel tabs with missing fields, status, and actions**

Create `channel-publication-tabs.tsx`:

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelStatusBadge } from "@/app/(main)/dashboard/e-commerce/_components/channel-status-badge";

import type { ChannelId, ChannelPublicationView } from "../../../_lib/product-center.types";

const CHANNEL_LABELS: Record<ChannelId, string> = {
  douyin: "抖音",
  wechat: "视频号",
};

export function ChannelPublicationTabs({
  channels,
}: {
  channels: Record<ChannelId, ChannelPublicationView>;
}) {
  return (
    <Tabs defaultValue="douyin">
      <TabsList>
        <TabsTrigger value="douyin">抖音</TabsTrigger>
        <TabsTrigger value="wechat">视频号</TabsTrigger>
      </TabsList>
      {Object.entries(channels).map(([channelId, channel]) => (
        <TabsContent key={channelId} value={channelId}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{CHANNEL_LABELS[channel.channel]}发布视图</span>
                <ChannelStatusBadge status={channel.publicationStatus} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">审核状态</div>
                  <div className="font-medium">{channel.auditStatus}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">上下架状态</div>
                  <div className="font-medium">{channel.listingStatus}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-sm">待补字段</div>
                {channel.missingFields.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">当前没有待补字段</div>
                ) : (
                  channel.missingFields.map((field) => (
                    <div key={field} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                      {field}
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <div className="font-medium text-sm">渠道特有字段</div>
                {channel.channelSpecificFields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-muted-foreground text-sm">{field.label}</span>
                    <span className="font-medium text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
              {channel.rejectionReason ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {channel.rejectionReason}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button>提交审核</Button>
                <Button variant="outline">更新渠道</Button>
                <Button variant="outline">上架</Button>
                <Button variant="outline">下架</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 4: Verify the detail page compiles and opens from the table**

Run:

```bash
pnpm build
```

Expected: PASS and product table links resolve to `/dashboard/e-commerce/products/[productId]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'
git commit -m "feat: add product detail publication view"
```

## Task 6: Build the publication workbench page

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/publications/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-overview-cards.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/schema.ts`
- Create: `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/columns.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/publications/_components/workbench-table/table.tsx`

- [ ] **Step 1: Replace the shell with publication workbench cards**

Create `workbench-overview-cards.tsx`:

```tsx
import { AlertTriangle, CheckCircle2, RefreshCcw, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublicationWorkbenchRow } from "../../_lib/product-center.types";

export function WorkbenchOverviewCards({ rows }: { rows: PublicationWorkbenchRow[] }) {
  const awaitingReview = rows.filter((row) => row.auditStatus === "pending").length;
  const missingFields = rows.filter((row) => row.publicationStatus === "missing_fields").length;
  const syncErrors = rows.filter((row) => row.publicationStatus === "sync_error").length;
  const readyActions = rows.filter((row) => row.publicationStatus === "ready_to_list").length;

  const cards = [
    { label: "审核中", value: awaitingReview, description: "渠道审核未返回", icon: ShieldAlert },
    { label: "待补字段", value: missingFields, description: "资料不完整", icon: AlertTriangle },
    { label: "同步异常", value: syncErrors, description: "需要重新同步", icon: RefreshCcw },
    { label: "待上架", value: readyActions, description: "可立即执行发布", icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.description}</CardDescription>
              <CardTitle className="flex items-center justify-between">
                <span>{card.label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-3xl tabular-nums">{card.value}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add the workbench table**

Create `workbench-table/schema.ts`:

```ts
import z from "zod";

export const publicationWorkbenchRowSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  channel: z.enum(["douyin", "wechat"]),
  publicationStatus: z.string(),
  auditStatus: z.string(),
  blocker: z.string(),
  updatedAt: z.string(),
});

export type PublicationWorkbenchTableRow = z.infer<typeof publicationWorkbenchRowSchema>;
```

Create `workbench-table/columns.tsx`:

```tsx
"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { ChannelStatusBadge } from "@/app/(main)/dashboard/e-commerce/_components/channel-status-badge";
import { Button } from "@/components/ui/button";

import type { PublicationWorkbenchTableRow } from "./schema";

export const publicationWorkbenchColumns: ColumnDef<PublicationWorkbenchTableRow>[] = [
  {
    accessorKey: "productName",
    header: "商品",
  },
  {
    accessorKey: "channel",
    header: "渠道",
    cell: ({ row }) => (row.original.channel === "douyin" ? "抖音" : "视频号"),
  },
  {
    accessorKey: "publicationStatus",
    header: "状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.publicationStatus as never} />,
  },
  {
    accessorKey: "blocker",
    header: "阻塞项",
  },
  {
    accessorKey: "updatedAt",
    header: "更新时间",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/e-commerce/products/${row.original.productId}`}>去处理</Link>
      </Button>
    ),
  },
];
```

Create `workbench-table/table.tsx`:

```tsx
"use client";
"use no memo";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { publicationWorkbenchColumns } from "./columns";
import type { PublicationWorkbenchTableRow } from "./schema";

export function PublicationWorkbenchTable({ data }: { data: PublicationWorkbenchTableRow[] }) {
  const table = useReactTable({
    data,
    columns: publicationWorkbenchColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>渠道待处理任务</CardTitle>
        <CardDescription>集中查看待补字段、审核中与同步异常任务。</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden rounded-xl border px-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

Update `src/app/(main)/dashboard/e-commerce/publications/page.tsx`:

```tsx
import { getPublicationWorkbenchRows } from "../_lib/product-center.selectors";
import { productCenterMock } from "../_lib/product-center.mock";
import { WorkbenchOverviewCards } from "./_components/workbench-overview-cards";
import { PublicationWorkbenchTable } from "./_components/workbench-table/table";

export default function Page() {
  const rows = getPublicationWorkbenchRows(productCenterMock);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <WorkbenchOverviewCards rows={rows} />
      <PublicationWorkbenchTable data={rows} />
    </div>
  );
}
```

- [ ] **Step 3: Verify the workbench page**

Run:

```bash
pnpm build
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center.selectors.test.ts'
```

Expected:

- build PASS
- selector test PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/publications
git commit -m "feat: add publication workbench page"
```

## Task 7: Final verification and polish pass

**Files:**
- Modify: any files touched in Tasks 1-6 only if verification exposes real issues

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

Expected:

- `pnpm test` PASS
- `pnpm check` PASS with Biome clean
- `pnpm build` PASS

- [ ] **Step 2: Smoke-test the key paths locally**

Run:

```bash
pnpm dev
```

Then manually verify:

1. `/dashboard/e-commerce/products`
2. `/dashboard/e-commerce/products/spu-hanger-coffee`
3. `/dashboard/e-commerce/publications`

Expected:

- 首页可见摘要卡、筛选区、商品主档表格
- 详情页可见基础信息、SKU、素材、渠道发布 Tab
- 工作台页可见待处理任务汇总和表格

- [ ] **Step 3: Fix any verification issues inline**

If Biome flags import ordering, normalize imports like this:

```ts
import { productCenterMock } from "../_lib/product-center.mock";
import { getPublicationWorkbenchRows } from "../_lib/product-center.selectors";
```

If a route component needs the shared page container class, normalize to:

```tsx
<div className="@container/main flex flex-col gap-4 md:gap-6">
  {/* page content */}
</div>
```

- [ ] **Step 4: Commit the verified feature**

```bash
git add package.json vitest.config.ts src/navigation/sidebar/sidebar-items.ts src/app/'(main)'/dashboard/e-commerce
git commit -m "feat: add omni-channel product center ui"
```

## Self-Review Checklist

- Spec coverage:
  - 商品主档首页: Task 3 + Task 4
  - 商品详情页: Task 5
  - 渠道发布子视图: Task 5
  - 发布工作台: Task 6
  - 主档/渠道/任务三层数据边界: Task 1
- Placeholder scan:
  - No `TODO` / `TBD`
  - No “类似 Task N” 之类引用
- Type consistency:
  - Shared types only live in `product-center.types.ts`
  - Landing page, detail page, and workbench all consume the same domain contract
