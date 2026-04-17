# Product Detail Asset Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the product detail asset card into a visual preview surface for the coffee gift box so the team can judge cover, gallery, and long-detail image layout directly in the existing admin detail page.

**Architecture:** Keep the current `assets` model untouched for the channel-editing flow and add a separate preview-mock layer keyed by `productId`. Use a small pure helper to resolve preview sections for the detail page, then render those sections inside an upgraded `AssetsCard` with three focused visual blocks: cover hero, gallery grid, and detail-strip preview.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, shadcn/ui

---

## Scope Check

This plan is one focused slice: visual asset preview mock on the detail page. It does not introduce uploads, asset management workflows, or backend contracts.

## File Map

### Modify

- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

### Create

- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-cover.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-gallery.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-detail-strip.tsx`

## Task 1: Define asset preview mock domain

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`
- Test: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getProductAssetPreview } from "./product-asset-preview";

describe("product asset preview", () => {
  it("returns structured preview sections for the coffee gift box", () => {
    const preview = getProductAssetPreview("spu-hanger-coffee");

    expect(preview?.cover.title).toBe("封面主视觉");
    expect(preview?.gallery.items).toHaveLength(3);
    expect(preview?.detail.sections).toHaveLength(3);
  });

  it("returns undefined for products without preview mocks", () => {
    expect(getProductAssetPreview("spu-jasmine-tea")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
```

Expected: FAIL with module-not-found for `product-asset-preview`.

- [ ] **Step 3: Add preview types**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`:

```ts
export interface AssetPreviewImage {
  id: string;
  label: string;
  previewUrl: string;
  width: number;
  height: number;
  status: "ready" | "missing";
}

export interface ProductAssetPreviewCover {
  title: string;
  caption: string;
  image: AssetPreviewImage;
}

export interface ProductAssetPreviewGallery {
  title: string;
  caption: string;
  items: AssetPreviewImage[];
}

export interface ProductAssetPreviewDetail {
  title: string;
  caption: string;
  sections: AssetPreviewImage[];
}

export interface ProductAssetPreview {
  cover: ProductAssetPreviewCover;
  gallery: ProductAssetPreviewGallery;
  detail: ProductAssetPreviewDetail;
}
```

- [ ] **Step 4: Add the coffee preview mock with inline SVG data URIs**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts`:

```ts
import type { ProductAssetPreview } from "./product-asset-preview.types";

function createPreviewSvg({
  title,
  subtitle,
  palette,
  width,
  height,
}: {
  title: string;
  subtitle: string;
  palette: { background: string; accent: string; text: string };
  width: number;
  height: number;
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.background}" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="28" fill="url(#g)" />
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="24" fill="rgba(255,255,255,0.72)" />
      <circle cx="${width * 0.72}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.16}" fill="rgba(255,255,255,0.32)" />
      <text x="56" y="${height * 0.34}" fill="${palette.text}" font-size="${Math.max(20, width * 0.06)}" font-family="Georgia, serif" font-weight="700">${title}</text>
      <text x="56" y="${height * 0.46}" fill="${palette.text}" font-size="${Math.max(12, width * 0.03)}" font-family="Arial, sans-serif">${subtitle}</text>
      <rect x="56" y="${height * 0.58}" width="${width * 0.42}" height="${height * 0.16}" rx="18" fill="rgba(255,255,255,0.85)" />
      <rect x="${width * 0.56}" y="${height * 0.54}" width="${width * 0.22}" height="${height * 0.2}" rx="22" fill="rgba(87,52,34,0.22)" />
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const productAssetPreviewMock: Record<string, ProductAssetPreview> = {
  "spu-hanger-coffee": {
    cover: {
      title: "封面主视觉",
      caption: "用于验证首图在右侧窄栏里的视觉重心。",
      image: {
        id: "cover-hero",
        label: "冷萃挂耳礼盒主图",
        previewUrl: createPreviewSvg({
          title: "Cold Brew Gift Box",
          subtitle: "冷萃挂耳礼盒 · 春季主推",
          palette: {
            background: "#f3e3d0",
            accent: "#a76b45",
            text: "#4b2c1d",
          },
          width: 1200,
          height: 900,
        }),
        width: 1200,
        height: 900,
        status: "ready",
      },
    },
    gallery: {
      title: "卖点组图",
      caption: "模拟礼盒、风味和送礼场景三张组图。",
      items: [
        {
          id: "gallery-1",
          label: "礼盒开箱图",
          previewUrl: createPreviewSvg({
            title: "礼盒结构",
            subtitle: "双风味挂耳组合",
            palette: {
              background: "#f7ecdf",
              accent: "#b37a4d",
              text: "#4a2f20",
            },
            width: 900,
            height: 900,
          }),
          width: 900,
          height: 900,
          status: "ready",
        },
        {
          id: "gallery-2",
          label: "风味卖点图",
          previewUrl: createPreviewSvg({
            title: "花果与坚果",
            subtitle: "两种风味切换展示",
            palette: {
              background: "#efe2d5",
              accent: "#8e5a35",
              text: "#412618",
            },
            width: 900,
            height: 900,
          }),
          width: 900,
          height: 900,
          status: "ready",
        },
        {
          id: "gallery-3",
          label: "送礼场景图",
          previewUrl: createPreviewSvg({
            title: "节日送礼",
            subtitle: "桌面场景与杯具陈列",
            palette: {
              background: "#f5e8de",
              accent: "#c38f68",
              text: "#4f3120",
            },
            width: 900,
            height: 900,
          }),
          width: 900,
          height: 900,
          status: "ready",
        },
      ],
    },
    detail: {
      title: "详情长图",
      caption: "分段模拟详情页纵向阅读节奏。",
      sections: [
        {
          id: "detail-1",
          label: "核心卖点段",
          previewUrl: createPreviewSvg({
            title: "Cold Brew Notes",
            subtitle: "冷萃风味、酸甜层次、礼盒定位",
            palette: {
              background: "#f7efe6",
              accent: "#b9825c",
              text: "#47291a",
            },
            width: 900,
            height: 1400,
          }),
          width: 900,
          height: 1400,
          status: "ready",
        },
        {
          id: "detail-2",
          label: "冲泡说明段",
          previewUrl: createPreviewSvg({
            title: "Brew Guide",
            subtitle: "温度、时间、杯量说明",
            palette: {
              background: "#f2e5d8",
              accent: "#9d6742",
              text: "#432719",
            },
            width: 900,
            height: 1400,
          }),
          width: 900,
          height: 1400,
          status: "ready",
        },
        {
          id: "detail-3",
          label: "礼盒细节段",
          previewUrl: createPreviewSvg({
            title: "Gift Details",
            subtitle: "包装细节、场景氛围、送礼说明",
            palette: {
              background: "#f8ede3",
              accent: "#c68d63",
              text: "#4d2f1f",
            },
            width: 900,
            height: 1400,
          }),
          width: 900,
          height: 1400,
          status: "ready",
        },
      ],
    },
  },
};
```

- [ ] **Step 5: Add the preview lookup helper**

Create `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`:

```ts
import { productAssetPreviewMock } from "./product-asset-preview.mock";

export function getProductAssetPreview(productId: string) {
  return productAssetPreviewMock[productId];
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
```

Expected: PASS with `2 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.types.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.mock.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.test.ts
git commit -m "feat: add product asset preview mock"
```

## Task 2: Build the visual preview card UI

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-cover.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-gallery.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-detail-strip.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

- [ ] **Step 1: Replace the static asset-status list with sectioned preview components**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-cover.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

import type { ProductAssetPreviewCover } from "../../../_lib/product-asset-preview.types";

export function AssetPreviewCover({ cover }: { cover: ProductAssetPreviewCover }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{cover.title}</div>
          <div className="text-muted-foreground text-xs">{cover.caption}</div>
        </div>
        <Badge variant={cover.image.status === "ready" ? "outline" : "destructive"}>
          {cover.image.status === "ready" ? "已就绪" : "缺失"}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-xl border bg-muted/20">
        <img
          src={cover.image.previewUrl}
          alt={cover.image.label}
          className="block aspect-[4/3] h-auto w-full object-cover"
        />
      </div>
    </section>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-gallery.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

import type { ProductAssetPreviewGallery } from "../../../_lib/product-asset-preview.types";

export function AssetPreviewGallery({ gallery }: { gallery: ProductAssetPreviewGallery }) {
  return (
    <section className="space-y-3">
      <div>
        <div className="font-medium text-sm">{gallery.title}</div>
        <div className="text-muted-foreground text-xs">{gallery.caption}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {gallery.items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border bg-muted/20">
            <img src={item.previewUrl} alt={item.label} className="block aspect-square h-auto w-full object-cover" />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <div className="font-medium text-xs">{item.label}</div>
              <Badge variant={item.status === "ready" ? "outline" : "destructive"}>
                {item.status === "ready" ? "可预览" : "缺失"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-detail-strip.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

import type { ProductAssetPreviewDetail } from "../../../_lib/product-asset-preview.types";

export function AssetPreviewDetailStrip({ detail }: { detail: ProductAssetPreviewDetail }) {
  return (
    <section className="space-y-3">
      <div>
        <div className="font-medium text-sm">{detail.title}</div>
        <div className="text-muted-foreground text-xs">{detail.caption}</div>
      </div>
      <div className="space-y-3">
        {detail.sections.map((section) => (
          <div key={section.id} className="overflow-hidden rounded-xl border bg-muted/20">
            <img src={section.previewUrl} alt={section.label} className="block h-auto w-full object-cover" />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <div className="font-medium text-xs">{section.label}</div>
              <Badge variant={section.status === "ready" ? "outline" : "destructive"}>
                {section.status === "ready" ? "可预览" : "缺失"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Upgrade `AssetsCard` to consume preview data**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProductAssetPreview } from "../../../_lib/product-asset-preview";
import type { AssetItem } from "../../../_lib/product-center.types";
import { AssetPreviewCover } from "./asset-preview-cover";
import { AssetPreviewDetailStrip } from "./asset-preview-detail-strip";
import { AssetPreviewGallery } from "./asset-preview-gallery";

interface AssetsCardProps {
  productId: string;
  assets: AssetItem[];
}

const assetTypeLabel: Record<AssetItem["type"], string> = {
  cover: "封面",
  gallery: "组图",
  detail: "详情",
};

export function AssetsCard({ productId, assets }: AssetsCardProps) {
  const preview = getProductAssetPreview(productId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>详情素材预览</CardTitle>
        <CardDescription>用 mock 素材验证封面图、组图和详情长图在详情页中的布局节奏。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {preview ? (
          <>
            <AssetPreviewCover cover={preview.cover} />
            <AssetPreviewGallery gallery={preview.gallery} />
            <AssetPreviewDetailStrip detail={preview.detail} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
            当前商品还没有配置详情素材预览 mock。
          </div>
        )}
        <div className="grid gap-2 rounded-xl border bg-muted/10 px-4 py-4">
          <div className="font-medium text-sm">素材状态摘要</div>
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between text-sm">
              <span>{asset.label}</span>
              <Badge variant={asset.status === "ready" ? "outline" : "destructive"}>
                {assetTypeLabel[asset.type]} · {asset.status === "ready" ? "已就绪" : "缺失"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Run the build to verify the card compiles**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-cover.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-gallery.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-detail-strip.tsx
git commit -m "feat: add detail asset preview card"
```

## Task 3: Wire the detail page to the new preview contract

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

- [ ] **Step 1: Pass `productId` into the assets card**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`:

```tsx
<div className="flex min-w-0 flex-col gap-4 md:gap-6">
  <SkuTable skus={product.skus} />
  <AssetsCard productId={product.id} assets={product.assets} />
</div>
```

- [ ] **Step 2: Run a focused build check**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx
git commit -m "feat: wire detail asset preview data"
```

## Task 4: Final verification and smoke pass

**Files:**
- Modify only if verification reveals a real issue

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
pnpm build
pnpm check
```

Expected:

- preview test PASS
- `pnpm build` PASS
- `pnpm check` PASS, with only pre-existing warnings outside this feature if any

- [ ] **Step 2: Smoke-test the target page**

Run:

```bash
pnpm dev
```

Then verify:

1. 打开 `/dashboard/e-commerce/products/spu-hanger-coffee`
2. 查看右侧素材区

Expected:

- 顶部出现一张封面大图
- 中部出现 3 张卖点组图网格
- 底部出现 3 段详情长图预览
- 页面整体仍然是后台详情页气质，不像完整 C 端商品详情页

- [ ] **Step 3: Final commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.types.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.mock.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.test.ts src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-cover.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-gallery.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/asset-preview-detail-strip.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx
git commit -m "feat: add product detail asset preview mock"
```
