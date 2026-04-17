# Douyin WeChat Unified Publishing Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract a standalone product publishing page that separates common product publishing data from platform-specific extensions, keeps the current WeChat minimum-publishing flow working, and adds the first Douyin publishing extension structure with category/rule-driven mock sections.

**Architecture:** Keep the existing product-center store and detail page, but move real publishing editing into a dedicated `/publish` route under the product detail hierarchy. Introduce a small publish domain with `common draft + platform draft + platform adapter metadata`, render one shared publishing shell, and let WeChat and Douyin mount extension sections into that shell. Treat Douyin category properties and update rules as dynamic mock-driven extension blocks instead of flattening them into the common schema.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React Hook Form, shadcn/ui, Vitest, existing product-center mock/store layer

---

## Scope Check

This is one coherent implementation slice:

1. Extract a standalone publish page and move publishing editing there
2. Define common-vs-platform publish boundaries in the frontend domain
3. Preserve the existing WeChat minimum-publishing flow through the new architecture
4. Add the first Douyin platform extension structure with mock category-property and rule sections

It does not include real Douyin APIs, real WeChat APIs, batch publishing, or a task center redesign.

## File Map

### Create

- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-meta.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/wechat-publish.adapter.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/douyin-publish.adapter.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-section.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-section.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`

### Modify

- `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`

## Task 1: Introduce the standalone publish route and page shell

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

- [ ] **Step 1: Write the failing route-level test for the new publish page shell**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { PublishPage } from "./publish-page";

describe("publish page", () => {
  it("renders common sections and the platform panel", () => {
    render(<PublishPage publishView={createPublishView("spu-hanger-coffee")} />);

    expect(screen.getByText("通用商品发布")).toBeInTheDocument();
    expect(screen.getByText("平台配置")).toBeInTheDocument();
    expect(screen.getByText("发布校验")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: FAIL because `PublishPage` and `createPublishView` do not exist yet.

- [ ] **Step 3: Add a minimal standalone publish route and shell**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`:

```ts
export interface PublishView {
  productId: string;
  productName: string;
  spuCode: string;
  common: {
    sections: Array<{ id: string; title: string; description: string }>;
  };
  platforms: Array<{ platformId: "douyin" | "wechat"; title: string }>;
}
```

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts`:

```ts
import type { PublishView } from "./publish.types";

export function createPublishView(productId: string): PublishView {
  return {
    productId,
    productName: "冷萃挂耳咖啡礼盒",
    spuCode: "SPU-COFFEE-001",
    common: {
      sections: [{ id: "base", title: "基础信息", description: "通用商品发布占位区。" }],
    },
    platforms: [
      { platformId: "douyin", title: "抖店配置" },
      { platformId: "wechat", title: "视频号配置" },
    ],
  };
}
```

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts`:

```ts
import { createPublishView } from "./publish.mock";
import type { PublishView } from "./publish.types";

export function getPublishView(productId: string): PublishView | undefined {
  return createPublishView(productId);
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { getPublishView } from "../../../../_lib/publish/publish.selectors";
import { PublishPage } from "./_components/publish-page";

export default async function ProductPublishRoute({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const publishView = getPublishView(productId);

  if (!publishView) {
    notFound();
  }

  return <PublishPage publishView={publishView} />;
}
```

Create `publish-page.tsx`:

```tsx
"use client";

import { PublishHeader } from "./publish-header";
import { CommonPublishSections } from "./common-publish-sections";
import { PlatformPublishPanel } from "./platform-publish-panel";
import { PublishValidationSummary } from "./publish-validation-summary";
import type { PublishView } from "../../../../_lib/publish/publish.types";

export function PublishPage({ publishView }: { publishView: PublishView }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PublishHeader publishView={publishView} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <CommonPublishSections publishView={publishView} />
          <PlatformPublishPanel publishView={publishView} />
        </div>
        <PublishValidationSummary publishView={publishView} />
      </div>
    </div>
  );
}
```

Create `common-publish-sections.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublishView } from "../../../../_lib/publish/publish.types";

export function CommonPublishSections({ publishView }: { publishView: PublishView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>通用商品发布</CardTitle>
      </CardHeader>
      <CardContent>{publishView.common.sections[0]?.title}</CardContent>
    </Card>
  );
}
```

Create `publish-header.tsx` and `publish-validation-summary.tsx` with one `Card` each that render the labels from the test, and create `platform-publish-panel.tsx` with a `CardTitle` of `平台配置`.

- [ ] **Step 4: Add a detail-page entry into the new route**

Update `detail-header.tsx` to add a link button:

```tsx
<Button asChild variant="outline">
  <Link href={`/dashboard/e-commerce/products/${product.id}/publish`}>进入发布页</Link>
</Button>
```

Update `product-detail-page.tsx` so any old “完整发布编辑” responsibility remains in place for now, but the new route becomes the recommended entry point from the header.

- [ ] **Step 5: Run the route-shell test again**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 6: Commit the route-shell slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx'
git commit -m "feat: add standalone product publish page shell"
```

## Task 2: Add the shared publish domain and common publish sections

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`

- [ ] **Step 1: Write a failing selector test for `PublishView`**

Create `publish.selectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getPublishView } from "./publish.selectors";

describe("publish selectors", () => {
  it("builds a publish view with common and platform sections", () => {
    const view = getPublishView("spu-hanger-coffee");

    expect(view?.productId).toBe("spu-hanger-coffee");
    expect(view?.common.sections.map((section) => section.id)).toEqual([
      "base",
      "media",
      "attributes",
      "sku",
      "pricing",
      "delivery",
    ]);
    expect(view?.platforms.map((platform) => platform.platformId)).toEqual(["douyin", "wechat"]);
  });
});
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts'
```

Expected: FAIL because the publish domain files do not exist.

- [ ] **Step 3: Define a focused publish-domain type model**

Create `publish.types.ts`:

```ts
import type { ChannelId } from "../product-center.types";

export interface PublishFieldValue {
  key: string;
  label: string;
  value: string;
}

export interface PublishSectionView {
  id: "base" | "media" | "attributes" | "sku" | "pricing" | "delivery";
  title: string;
  description: string;
  fields: PublishFieldValue[];
}

export interface PlatformPublishView {
  platformId: ChannelId;
  title: string;
  summary: string;
  status: string;
  missingFields: string[];
  extensionSections: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export interface PublishView {
  productId: string;
  productName: string;
  spuCode: string;
  common: {
    sections: PublishSectionView[];
  };
  platforms: PlatformPublishView[];
}
```

- [ ] **Step 4: Build a simple selector from existing product-center mocks**

Create `publish.selectors.ts`:

```ts
import { productCenterMock } from "../product-center.mock";
import type { PublishView } from "./publish.types";

export function getPublishView(productId: string): PublishView | undefined {
  const product = productCenterMock.find((item) => item.id === productId);
  if (!product) return undefined;

  return {
    productId: product.id,
    productName: product.name,
    spuCode: product.spuCode,
    common: {
      sections: [
        { id: "base", title: "基础信息", description: "统一维护商品本体名称、简介和标签。", fields: [
          { key: "name", label: "商品名称", value: product.name },
          { key: "brand", label: "品牌", value: product.brand },
        ] },
        { id: "media", title: "通用素材", description: "统一维护跨平台可复用素材池。", fields: [
          { key: "assets", label: "素材槽位", value: `${product.assets.length} 项` },
        ] },
        { id: "attributes", title: "通用属性", description: "统一维护规格与基础属性容器。", fields: [
          { key: "category", label: "类目", value: product.category },
        ] },
        { id: "sku", title: "SKU 基础", description: "统一维护 SKU 本体与商家编码。", fields: [
          { key: "skuCount", label: "SKU 数量", value: String(product.skus.length) },
        ] },
        { id: "pricing", title: "默认价格库存", description: "统一维护默认价格与库存基线。", fields: [
          { key: "priceBand", label: "价格带", value: product.skus.map((sku) => sku.priceLabel).join(" / ") },
        ] },
        { id: "delivery", title: "默认履约", description: "统一维护默认发货与模板基线。", fields: [
          { key: "shop", label: "店铺", value: product.shop },
        ] },
      ],
    },
    platforms: Object.values(product.channels).map((channel) => ({
      platformId: channel.channel,
      title: channel.channel === "douyin" ? "抖店配置" : "视频号配置",
      summary: channel.channel === "douyin" ? "维护抖店类目、属性、规则与专属媒体要求。" : "维护视频号发品字段、服务与资质。",
      status: channel.publicationStatus,
      missingFields: channel.missingFields,
      extensionSections: [],
    })),
  };
}
```

- [ ] **Step 5: Render the common publish sections on the page**

Create `common-publish-sections.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublishView } from "../../../../_lib/publish/publish.types";

export function CommonPublishSections({ publishView }: { publishView: PublishView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>通用商品发布</CardTitle>
        <CardDescription>先维护跨平台复用的商品本体，再进入平台扩展配置。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {publishView.common.sections.map((section) => (
          <div key={section.id} className="rounded-lg border px-4 py-4">
            <div className="font-medium text-sm">{section.title}</div>
            <div className="text-muted-foreground text-xs">{section.description}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

Then wire it into `publish-page.tsx`.

- [ ] **Step 6: Run the selector and page tests**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 7: Commit the shared publish-domain slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts'
git commit -m "feat: add shared publish domain model"
```

## Task 3: Migrate the existing WeChat publishing flow into the platform extension panel

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-meta.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/wechat-publish.adapter.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`

- [ ] **Step 1: Write a failing adapter test for WeChat platform metadata**

Append to `publish.selectors.test.ts`:

```ts
it("exposes six wechat extension sections inside the platform panel", () => {
  const view = getPublishView("spu-hanger-coffee");
  const wechat = view?.platforms.find((platform) => platform.platformId === "wechat");

  expect(wechat?.extensionSections.map((section) => section.id)).toEqual([
    "basic",
    "category",
    "media",
    "fulfillment",
    "sku",
    "compliance",
  ]);
});
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts'
```

Expected: FAIL because `wechat.extensionSections` is still empty.

- [ ] **Step 3: Add a platform metadata layer for extension sections**

Create `platform-meta.ts`:

```ts
import type { ChannelId } from "../product-center.types";

export const platformMeta: Record<ChannelId, { title: string; summary: string }> = {
  douyin: {
    title: "抖店配置",
    summary: "维护抖店类目、动态属性、规则与资质要求。",
  },
  wechat: {
    title: "视频号配置",
    summary: "维护视频号最小可发品字段、服务与资质要求。",
  },
};
```

Create `wechat-publish.adapter.ts`:

```ts
export const wechatExtensionSections = [
  { id: "basic", title: "发品基础", description: "对齐 title、short_title、外部商品编码。" },
  { id: "category", title: "类目与品牌", description: "对齐 cats_v2、brand_id 与参数摘要。" },
  { id: "media", title: "主图与详情", description: "对齐 head_imgs、desc_info.imgs、desc_info.desc。" },
  { id: "fulfillment", title: "履约与发货", description: "维护发货方式、运费模板、重量。" },
  { id: "sku", title: "SKU 发售信息", description: "维护 SKU 价格、库存、缩略图与销售属性。" },
  { id: "compliance", title: "参数 / 资质 / 服务", description: "维护参数摘要、资质摘要与服务承诺。" },
];
```

- [ ] **Step 4: Feed WeChat extension sections into the publish selector**

Update `publish.selectors.ts` so the `wechat` platform includes the six extension sections from the adapter, while `douyin` still returns placeholder sections for now:

```ts
extensionSections:
  channel.channel === "wechat"
    ? wechatExtensionSections
    : [{ id: "category", title: "类目与属性", description: "等待抖店扩展区接入。" }],
```

- [ ] **Step 5: Render WeChat extensions as the first real platform block**

Update `platform-publish-panel.tsx`:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PlatformPublishPanel({ publishView }: { publishView: PublishView }) {
  const defaultPlatform = publishView.platforms[0]?.platformId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>平台配置</CardTitle>
        <CardDescription>通用层以下沉平台差异，平台区只维护类目、规则、资质与专属字段。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultPlatform}>
          <TabsList>
            {publishView.platforms.map((platform) => (
              <TabsTrigger key={platform.platformId} value={platform.platformId}>
                {platform.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {publishView.platforms.map((platform) => (
            <TabsContent key={platform.platformId} value={platform.platformId} className="space-y-4">
              {platform.extensionSections.map((section) => (
                <div key={section.id} className="rounded-lg border px-4 py-4">
                  <div className="font-medium text-sm">{section.title}</div>
                  <div className="text-muted-foreground text-xs">{section.description}</div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Run the selector and page tests again**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 7: Commit the WeChat migration slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/platform-meta.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/wechat-publish.adapter.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
git commit -m "feat: move wechat publishing into platform panel"
```

## Task 4: Add the first Douyin extension with mock category properties and update rules

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/douyin-publish.adapter.ts`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-section.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-section.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`

- [ ] **Step 1: Write a failing test for Douyin dynamic sections**

Append to `publish.selectors.test.ts`:

```ts
it("exposes category-property and rule-driven blocks for douyin", () => {
  const view = getPublishView("spu-hanger-coffee");
  const douyin = view?.platforms.find((platform) => platform.platformId === "douyin");

  expect(douyin?.extensionSections.map((section) => section.id)).toEqual([
    "category-properties",
    "brand-qualification",
    "media-requirements",
    "rule-constraints",
  ]);
});
```

- [ ] **Step 2: Run the selector test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts'
```

Expected: FAIL because Douyin still only exposes a placeholder section.

- [ ] **Step 3: Define Douyin extension metadata around category properties and rules**

Create `douyin-publish.adapter.ts`:

```ts
export const douyinExtensionSections = [
  {
    id: "category-properties",
    title: "类目与属性",
    description: "对接 getCatePropertyV2 的类目属性、销售属性和必填项。",
  },
  {
    id: "brand-qualification",
    title: "品牌与资质",
    description: "承接品牌映射、行业资质和类目资质要求。",
  },
  {
    id: "media-requirements",
    title: "图文与媒体要求",
    description: "承接主图、详情图、视频、白底图等平台要求。",
  },
  {
    id: "rule-constraints",
    title: "发布规则",
    description: "承接 getProductUpdateRule 的字段限制、图文规则和发布限制。",
  },
];
```

- [ ] **Step 4: Render Douyin’s first dedicated blocks inside the platform panel**

Create `douyin-category-section.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DouyinCategorySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目与属性</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        这里承接 getCatePropertyV2 返回的类目属性、销售属性和动态必填项。
      </CardContent>
    </Card>
  );
}
```

Create `douyin-rule-section.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DouyinRuleSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店发布规则</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        这里承接 getProductUpdateRule 返回的限制，用于展示动态校验和发布前提醒。
      </CardContent>
    </Card>
  );
}
```

Update `platform-publish-panel.tsx` so the Douyin tab renders these two components above the generic section cards.

- [ ] **Step 5: Update the publish selector with Douyin extension sections**

Update `publish.selectors.ts` so Douyin reads `douyinExtensionSections`, and enrich `publish.mock.ts` with a small hard-coded mock context:

```ts
export const publishMock = {
  douyin: {
    categoryName: "咖啡冲饮 > 挂耳咖啡",
    ruleHighlights: ["主图需 1:1", "品牌资质必填", "销售属性需完整"],
  },
};
```

- [ ] **Step 6: Re-run the publish tests**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 7: Commit the Douyin extension slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/platform-adapters/douyin-publish.adapter.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.mock.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-section.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-section.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx'
git commit -m "feat: add douyin publishing extension blocks"
```

## Task 5: Wire validation summary, polish page semantics, and verify end-to-end flow

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`

- [ ] **Step 1: Add a failing test for summary counts and platform status text**

Append to `publish-page.test.tsx`:

```tsx
it("shows platform status and missing-field summaries in the right rail", () => {
  render(<PublishPage publishView={createPublishView("spu-hanger-coffee")} />);

  expect(screen.getByText("发布校验")).toBeInTheDocument();
  expect(screen.getByText("抖店")).toBeInTheDocument();
  expect(screen.getByText("视频号")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: FAIL because the validation summary is still only a label shell.

- [ ] **Step 3: Render publish summary and page semantics**

Update `publish-header.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function PublishHeader({ publishView }: { publishView: PublishView }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <div className="text-muted-foreground text-xs">统一商品发布页</div>
          <div className="font-semibold text-lg">{publishView.productName}</div>
          <div className="text-muted-foreground text-sm">{publishView.spuCode}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

Update `publish-validation-summary.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PublishValidationSummary({ publishView }: { publishView: PublishView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>发布校验</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {publishView.platforms.map((platform) => (
          <div key={platform.platformId} className="rounded-lg border px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-sm">{platform.platformId === "douyin" ? "抖店" : "视频号"}</span>
              <Badge variant={platform.missingFields.length > 0 ? "destructive" : "outline"}>
                {platform.missingFields.length > 0 ? `${platform.missingFields.length} 项待补` : "已齐备"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run targeted tests and full project check**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish.selectors.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
pnpm check
```

Expected:
- Vitest: PASS
- `pnpm check`: PASS, with only the existing warning in `src/lib/cookie.client.ts`

- [ ] **Step 5: Run a browser smoke for the new publish page**

Run the local browser flow and verify:

```bash
open 'http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee/publish'
```

Manual expectations:

1. The page shows `通用商品发布`, `平台配置`, and `发布校验`
2. The WeChat tab shows the six-section extension structure
3. The Douyin tab shows category-property and rule-driven sections instead of a flat field pile
4. The detail page header exposes the `进入发布页` entry

- [ ] **Step 6: Commit the integration slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx'
git commit -m "feat: complete unified publishing page mvp"
```

## Self-Review

### Spec coverage

This plan covers every spec section:

1. `商品详情页摘要 + 独立发布页`：
   - Task 1
2. `通用商品区 + 平台配置区`：
   - Task 1, Task 2, Task 5
3. `通用模型与平台扩展边界`：
   - Task 2, Task 3, Task 4
4. `视频号作为第一个完整平台扩展示例`：
   - Task 3
5. `抖店类目属性 / 规则驱动区块`：
   - Task 4
6. `前端页面重构优先，不接真实 API`：
   - Scope and all task boundaries

### Placeholder scan

No `TODO`, `TBD`, or “similar to previous task” placeholders remain. Every task includes file paths, commands, expected outputs, and concrete code snippets.

### Type consistency

The plan uses one consistent view model family:

- `PublishView`
- `PublishSectionView`
- `PlatformPublishView`

It also consistently keeps:

- WeChat as the first real extension
- Douyin as the first category/rule-driven extension
- `common sections` separate from `platform extension sections`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-05-douyin-wechat-unified-publishing-architecture.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
