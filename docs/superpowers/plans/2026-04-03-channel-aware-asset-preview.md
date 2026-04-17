# Channel-Aware Asset Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the product detail asset preview follow the active channel tab so one product can show distinct `douyin` and `wechat` mock preview styles in the existing right-side detail card.

**Architecture:** Keep the current preview feature as a read-only mock layer, but change its lookup from `productId` to `productId + channelId`. Lift the active channel state from `ChannelPublicationTabs` into `ProductDetailPage`, pass it down to `AssetsCard`, and reuse the existing preview components so the only new behavior is channel-aware data switching.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, shadcn/ui

---

## Scope Check

This plan covers one focused slice:

1. Channel-aware preview mock data
2. Detail-page channel state lifting
3. Right-column preview switching

It does not include real platform media APIs, editing actions, or any new page.

## File Map

### Modify

- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

### Reuse Without Change

- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-cover.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-gallery.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-detail-strip.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/asset-preview-media-surface.tsx`

## Task 1: Upgrade preview mock to `productId + channelId`

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`

- [ ] **Step 1: Write the failing test for channel-aware lookup**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { getProductAssetPreview } from "./product-asset-preview";
import type { AssetPreviewImage } from "./product-asset-preview.types";

const missingAssetPreviewImage: AssetPreviewImage = {
  id: "asset-missing-demo",
  label: "缺失素材示例",
  status: "missing",
};

describe("product asset preview", () => {
  it("allows missing images without forcing preview fields", () => {
    expect(missingAssetPreviewImage.status).toBe("missing");
  });

  it("returns douyin preview for the coffee gift box", () => {
    const preview = getProductAssetPreview("spu-hanger-coffee", "douyin");

    expect(preview?.cover.title).toBe("抖音封面主视觉");
    expect(preview?.gallery.items).toHaveLength(3);
    expect(preview?.detail.sections).toHaveLength(3);
  });

  it("returns wechat preview for the coffee gift box", () => {
    const preview = getProductAssetPreview("spu-hanger-coffee", "wechat");

    expect(preview?.cover.title).toBe("视频号场景封面");
    expect(preview?.gallery.items).toHaveLength(3);
    expect(preview?.detail.sections).toHaveLength(3);
  });

  it("keeps ready image metadata on both channels", () => {
    const douyinCover = getProductAssetPreview("spu-hanger-coffee", "douyin")?.cover.image;
    const wechatCover = getProductAssetPreview("spu-hanger-coffee", "wechat")?.cover.image;

    expect(douyinCover?.status).toBe("ready");
    expect(wechatCover?.status).toBe("ready");

    if (douyinCover?.status !== "ready" || wechatCover?.status !== "ready") {
      throw new Error("Expected both channel covers to be ready");
    }

    expect(douyinCover.previewUrl).toContain("data:image/svg+xml");
    expect(wechatCover.previewUrl).toContain("data:image/svg+xml");
  });

  it("returns undefined for products or channels without preview mocks", () => {
    expect(getProductAssetPreview("spu-jasmine-tea", "douyin")).toBeUndefined();
    expect(getProductAssetPreview("spu-hanger-coffee", "unknown" as never)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
```

Expected: FAIL because `getProductAssetPreview` still only accepts `productId` and current mock shape is not channel-aware.

- [ ] **Step 3: Add channel-aware preview map types**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.types.ts`:

```ts
import type { ChannelId } from "./product-center.types";

type AssetPreviewImageBase = {
  id: string;
  label: string;
};

export type AssetPreviewImage =
  | (AssetPreviewImageBase & {
      status: "ready";
      previewUrl: string;
      width: number;
      height: number;
    })
  | (AssetPreviewImageBase & {
      status: "missing";
    });

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

export type ChannelAssetPreviewMap = Partial<Record<ChannelId, ProductAssetPreview>>;
export type ProductAssetPreviewMap = Partial<Record<string, ChannelAssetPreviewMap>>;
```

- [ ] **Step 4: Replace the single preview mock with dual-channel mock data**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.mock.ts` so `spu-hanger-coffee` has separate `douyin` and `wechat` entries:

```ts
import type { ProductAssetPreviewMap } from "./product-asset-preview.types";

// keep createPreviewSvg unchanged

export const productAssetPreviewMock: ProductAssetPreviewMap = {
  "spu-hanger-coffee": {
    douyin: {
      cover: {
        title: "抖音封面主视觉",
        caption: "更强对比和更快节奏，强调礼盒与送礼转化感。",
        image: {
          id: "douyin-cover-hero",
          label: "抖音礼盒主视觉",
          previewUrl: createPreviewSvg({
            title: "Gift Box Drop",
            subtitle: "爆款礼盒 · 春季限定",
            palette: {
              background: "#f2d8c2",
              accent: "#a34f2a",
              text: "#3f1d12",
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
        title: "抖音卖点组图",
        caption: "强调礼盒结构、风味亮点和场景利益点。",
        items: [
          {
            id: "douyin-gallery-1",
            label: "礼盒冲击图",
            previewUrl: createPreviewSvg({
              title: "礼盒开场",
              subtitle: "首屏抓眼 + 节日送礼",
              palette: {
                background: "#f7e2d1",
                accent: "#b85d35",
                text: "#442314",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "douyin-gallery-2",
            label: "风味卖点卡",
            previewUrl: createPreviewSvg({
              title: "花果坚果",
              subtitle: "双风味直接表达",
              palette: {
                background: "#f4ded0",
                accent: "#8f4d30",
                text: "#3b2115",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "douyin-gallery-3",
            label: "场景利益点",
            previewUrl: createPreviewSvg({
              title: "办公室送礼",
              subtitle: "节奏快、利益点明确",
              palette: {
                background: "#f6e4d8",
                accent: "#aa6a46",
                text: "#46281b",
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
        title: "抖音详情长图",
        caption: "短段落、高信息密度，偏快速成交。",
        sections: [
          {
            id: "douyin-detail-1",
            label: "爆款卖点段",
            previewUrl: createPreviewSvg({
              title: "核心卖点",
              subtitle: "冷萃、礼盒、即送即饮",
              palette: {
                background: "#f5e1d1",
                accent: "#a35c37",
                text: "#432419",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "douyin-detail-2",
            label: "冲泡效率段",
            previewUrl: createPreviewSvg({
              title: "冲泡步骤",
              subtitle: "更直接的步骤表达",
              palette: {
                background: "#f0ddd0",
                accent: "#8b5333",
                text: "#3f2419",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "douyin-detail-3",
            label: "转化收尾段",
            previewUrl: createPreviewSvg({
              title: "礼盒细节",
              subtitle: "包装与收纳的快速收尾",
              palette: {
                background: "#f7e8dc",
                accent: "#b07148",
                text: "#45291b",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
    wechat: {
      cover: {
        title: "视频号场景封面",
        caption: "更克制的内容场景感，降低强促销表达。",
        image: {
          id: "wechat-cover-hero",
          label: "视频号咖啡场景封面",
          previewUrl: createPreviewSvg({
            title: "Morning Brew Story",
            subtitle: "桌面场景 · 轻内容化表达",
            palette: {
              background: "#efe6db",
              accent: "#8b6a52",
              text: "#3f3024",
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
        title: "视频号场景组图",
        caption: "更强调生活方式和饮用氛围。",
        items: [
          {
            id: "wechat-gallery-1",
            label: "晨间桌面图",
            previewUrl: createPreviewSvg({
              title: "晨间桌面",
              subtitle: "咖啡与礼盒的安静开场",
              palette: {
                background: "#f2ebe2",
                accent: "#9a7a62",
                text: "#403126",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "wechat-gallery-2",
            label: "饮用场景图",
            previewUrl: createPreviewSvg({
              title: "生活方式",
              subtitle: "办公室与居家场景",
              palette: {
                background: "#ede3d8",
                accent: "#86644b",
                text: "#3d2f26",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "wechat-gallery-3",
            label: "礼盒细节图",
            previewUrl: createPreviewSvg({
              title: "细节近景",
              subtitle: "更慢的内容节奏",
              palette: {
                background: "#f3e9df",
                accent: "#a07c63",
                text: "#433328",
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
        title: "视频号详情长图",
        caption: "更连续的阅读节奏，偏内容化呈现。",
        sections: [
          {
            id: "wechat-detail-1",
            label: "故事开场段",
            previewUrl: createPreviewSvg({
              title: "晨间风味",
              subtitle: "从咖啡体验讲起",
              palette: {
                background: "#f0e7de",
                accent: "#8c6a55",
                text: "#413126",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "wechat-detail-2",
            label: "饮用说明段",
            previewUrl: createPreviewSvg({
              title: "冲泡与饮用",
              subtitle: "更平缓的说明节奏",
              palette: {
                background: "#eee4da",
                accent: "#7f604c",
                text: "#3f3025",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "wechat-detail-3",
            label: "礼盒收束段",
            previewUrl: createPreviewSvg({
              title: "礼盒与收纳",
              subtitle: "内容感更完整的收尾",
              palette: {
                background: "#f4ece4",
                accent: "#9a775d",
                text: "#433328",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
  },
};
```

- [ ] **Step 5: Update the helper to read by `productId + channelId`**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.ts`:

```ts
import type { ChannelId } from "./product-center.types";
import { productAssetPreviewMock } from "./product-asset-preview.mock";
import type { ProductAssetPreview } from "./product-asset-preview.types";

export function getProductAssetPreview(productId: string, channelId: ChannelId): ProductAssetPreview | undefined {
  return productAssetPreviewMock[productId]?.[channelId];
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
```

Expected: PASS with `5 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.types.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.mock.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.test.ts
git commit -m "feat: add channel aware asset preview mock"
```

## Task 2: Lift active channel state into the detail page

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

- [ ] **Step 1: Add a failing integration expectation in the detail page flow**

Before implementing the controlled channel flow, temporarily update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx` to this target API:

```tsx
<ChannelPublicationTabs
  product={product}
  initialChannel={initialChannel}
  activeChannel={activeChannel}
  onChannelChange={setActiveChannel}
  onSave={handleSave}
/>
<AssetsCard productId={product.id} channelId={activeChannel} assets={product.assets} />
```

Then run:

```bash
pnpm build
```

Expected: FAIL because `ChannelPublicationTabs` and `AssetsCard` do not yet accept the new props. Revert only this temporary failing call-site edit before continuing to Step 2.

- [ ] **Step 2: Make `ChannelPublicationTabs` controlled for active channel**

Update the `ChannelPublicationTabsProps` interface and tab usage in `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`:

```tsx
interface ChannelPublicationTabsProps {
  product: SPUDetail;
  initialChannel?: ChannelId;
  activeChannel: ChannelId;
  onChannelChange: (channelId: ChannelId) => void;
  onSave: (channelId: EditableChannelId, draft: ChannelFieldDraft) => ChannelFieldMutationResult;
}
```

Replace the local state block:

```tsx
  const channels = Object.values(product.channels);
  const defaultChannel =
    initialChannel && channels.some((channel) => channel.channel === initialChannel)
      ? initialChannel
      : channels[0]?.channel;

  useEffect(() => {
    if (defaultChannel && activeChannel !== defaultChannel) {
      onChannelChange(defaultChannel);
    }
  }, [activeChannel, defaultChannel, onChannelChange]);
```

Replace the tabs binding:

```tsx
        <Tabs value={activeChannel} onValueChange={(value) => onChannelChange(value as ChannelId)} className="gap-4">
```

- [ ] **Step 3: Hold `activeChannel` in `ProductDetailPage`**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

// keep existing imports

export function ProductDetailPage({ productId, initialChannel }: ProductDetailPageProps) {
  const product = useProductCenterStore((store) => store.getProductById(productId));
  const saveDraft = useProductCenterStore((store) => store.saveDraft);
  const [activeChannel, setActiveChannel] = useState<ChannelId>(initialChannel ?? "douyin");

  useEffect(() => {
    if (initialChannel) {
      setActiveChannel(initialChannel);
    }
  }, [initialChannel]);

  if (!product) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="rounded-xl border border-muted-foreground/30 border-dashed bg-muted/20 px-6 py-10 text-center">
          <div className="font-medium text-sm">未找到商品</div>
          <div className="mt-2 text-muted-foreground text-sm">这个商品可能已被移除，或当前链接对应的主档不存在。</div>
        </div>
      </div>
    );
  }

  const fallbackChannel = Object.values(product.channels)[0]?.channel ?? "douyin";
  const currentChannel = Object.values(product.channels).some((channel) => channel.channel === activeChannel)
    ? activeChannel
    : fallbackChannel;

  const handleSave = (channelId: EditableChannelId, draft: ChannelFieldDraft): ChannelFieldMutationResult =>
    saveDraft(productId, channelId, draft, { syncAt: formatSyncAt(new Date()) });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <BasicInfoCard product={product} />
          <ChannelPublicationTabs
            product={product}
            initialChannel={initialChannel}
            activeChannel={currentChannel}
            onChannelChange={setActiveChannel}
            onSave={handleSave}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <SkuTable skus={product.skus} />
          <AssetsCard productId={product.id} channelId={currentChannel} assets={product.assets} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the build to verify controlled channel flow compiles**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-publication-tabs.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx
git commit -m "feat: lift detail channel state"
```

## Task 3: Make `AssetsCard` switch preview by channel

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

- [ ] **Step 1: Update the card API to accept `channelId`**

Change the props in `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`:

```tsx
import type { AssetItem, ChannelId } from "../../../_lib/product-center.types";

interface AssetsCardProps {
  productId: string;
  channelId: ChannelId;
  assets: AssetItem[];
}
```

- [ ] **Step 2: Use channel-aware preview lookup and surface the active channel label**

Update the card body:

```tsx
const channelLabel: Record<ChannelId, string> = {
  douyin: "抖音",
  wechat: "视频号",
};

export function AssetsCard({ productId, channelId, assets }: AssetsCardProps) {
  const preview = getProductAssetPreview(productId, channelId);
  const readyCount = assets.filter((asset) => asset.status === "ready").length;
  const missingCount = assets.length - readyCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>素材预览</CardTitle>
        <CardDescription>先看封面主视觉，再看卖点组图和详情长图的右侧 mock 预览节奏。</CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">{channelLabel[channelId]}预览 Mock</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {preview ? (
          <>
            <AssetPreviewCover cover={preview.cover} />
            <AssetPreviewGallery gallery={preview.gallery} />
            <AssetPreviewDetailStrip detail={preview.detail} />
          </>
        ) : (
          <div className="rounded-xl border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-6 text-muted-foreground text-sm">
            当前商品暂无 {channelLabel[channelId]} 布局预览 mock，下面仅保留素材真实状态。
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
            <span>素材真实状态</span>
            {assets.length > 0 ? (
              <Badge variant={missingCount > 0 ? "destructive" : "secondary"}>
                {missingCount > 0 ? `${missingCount} 项缺失` : `${readyCount}/${assets.length} 已就绪`}
              </Badge>
            ) : (
              <Badge variant="outline">未配置</Badge>
            )}
          </div>
          {assets.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs"
                >
                  <span>{assetTypeLabel[asset.type]}</span>
                  <span className="text-muted-foreground">{asset.label}</span>
                  <Badge variant={asset.status === "ready" ? "outline" : "destructive"}>
                    {asset.status === "ready" ? "已就绪" : "缺失"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-muted-foreground text-xs">当前商品还没有配置素材槽位。</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Run the build to verify the card compiles with the new prop**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx
git commit -m "feat: switch asset preview by channel"
```

## Task 4: Final verification and smoke pass

**Files:**
- Modify only if verification reveals a real issue

- [ ] **Step 1: Run the focused automated checks**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts'
pnpm check
pnpm build
```

Expected:

- preview test PASS
- `pnpm check` PASS, with only pre-existing warnings outside this feature if any
- `pnpm build` PASS

- [ ] **Step 2: Run the detail-page smoke check**

Run:

```bash
pnpm dev
```

Then verify manually:

1. 打开 `/dashboard/e-commerce/products/spu-hanger-coffee?channel=douyin`
2. 确认右侧看到“抖音预览 Mock”，封面和组图风格更强、更快节奏
3. 切换到 `视频号` Tab
4. 确认右侧同步变成“视频号预览 Mock”，封面更克制、详情更连续

Expected:

- 左侧切 Tab 时右侧同步切换
- 两套 preview 风格差异明显
- 页面结构没有新增第二个渠道控制器

- [ ] **Step 3: Final commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.types.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.mock.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.ts src/app/'(main)'/dashboard/e-commerce/_lib/product-asset-preview.test.ts src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/channel-publication-tabs.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx
git commit -m "feat: add channel aware asset preview"
```
