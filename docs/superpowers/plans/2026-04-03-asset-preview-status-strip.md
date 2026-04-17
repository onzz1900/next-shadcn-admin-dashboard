# Asset Preview Status Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight status badge strip to the asset preview card header so saving channel fields immediately reflects "saved", "missing count", and "recent saved time" without changing preview image content.

**Architecture:** Keep all new behavior local to the detail page. `ProductDetailPage` tracks a tiny piece of transient UI state for the most recently saved channel, derives a `statusStrip` object from the current channel plus existing store-backed product data, and passes that object into `AssetsCard`, which renders a compact badge strip in the header.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, shadcn/ui

---

## Scope Check

This plan covers one focused slice:

1. Local save-feedback state in the detail page
2. Asset preview header badge strip
3. Minimal verification of channel switching and save feedback

It does not include preview image mutation, store contract changes, or global notification work.

## File Map

### Modify

- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

### Optional Test Touch

- `src/app/(main)/dashboard/e-commerce/_lib/product-asset-preview.test.ts`

## Task 1: Add local save-feedback state in the detail page

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`

- [ ] **Step 1: Add a failing build expectation for the new `statusStrip` prop**

Temporarily update the `AssetsCard` call inside `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx` to this target shape:

```tsx
<AssetsCard
  productId={product.id}
  channelId={currentChannel}
  assets={product.assets}
  statusStrip={{
    didSave: lastSavedChannelId === currentChannel,
    missingCount: product.channels[currentChannel].missingFields.length,
    lastSavedAt: product.channels[currentChannel].lastSyncAt,
  }}
/>
```

Then run:

```bash
pnpm build
```

Expected: FAIL because `lastSavedChannelId` does not exist yet and `AssetsCard` does not yet accept `statusStrip`.

Revert only this temporary failing call-site edit before continuing to Step 2.

- [ ] **Step 2: Add local `lastSavedChannelId` state**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

// keep existing imports

export function ProductDetailPage({ productId, initialChannel }: ProductDetailPageProps) {
  const product = useProductCenterStore((store) => store.getProductById(productId));
  const saveDraft = useProductCenterStore((store) => store.saveDraft);
  const [activeChannel, setActiveChannel] = useState<ChannelId>(initialChannel ?? "douyin");
  const [lastSavedChannelId, setLastSavedChannelId] = useState<ChannelId | null>(null);

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

  const handleSave = (channelId: EditableChannelId, draft: ChannelFieldDraft): ChannelFieldMutationResult => {
    const result = saveDraft(productId, channelId, draft, { syncAt: formatSyncAt(new Date()) });
    setLastSavedChannelId(channelId);

    return result;
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <BasicInfoCard product={product} />
          <ChannelPublicationTabs
            product={product}
            activeChannel={currentChannel}
            onChannelChange={setActiveChannel}
            onSave={handleSave}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <SkuTable skus={product.skus} />
          <AssetsCard
            productId={product.id}
            channelId={currentChannel}
            assets={product.assets}
            statusStrip={{
              didSave: lastSavedChannelId === currentChannel,
              missingCount: product.channels[currentChannel].missingFields.length,
              lastSavedAt: product.channels[currentChannel].lastSyncAt,
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run the build to verify the detail page compiles once `AssetsCard` is updated**

Run:

```bash
pnpm build
```

Expected: FAIL for now because `AssetsCard` still lacks the new prop type.

## Task 2: Render the compact status strip in `AssetsCard`

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

- [ ] **Step 1: Add the `statusStrip` prop type and short-time formatter**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProductAssetPreview } from "../../../_lib/product-asset-preview";
import type { AssetItem, ChannelId } from "../../../_lib/product-center.types";
import { AssetPreviewCover } from "./asset-preview-cover";
import { AssetPreviewDetailStrip } from "./asset-preview-detail-strip";
import { AssetPreviewGallery } from "./asset-preview-gallery";

interface AssetsCardStatusStrip {
  didSave: boolean;
  missingCount: number;
  lastSavedAt: string;
}

interface AssetsCardProps {
  productId: string;
  channelId: ChannelId;
  assets: AssetItem[];
  statusStrip: AssetsCardStatusStrip;
}

const channelLabel: Record<ChannelId, string> = {
  douyin: "抖音",
  wechat: "视频号",
};

const assetTypeLabel: Record<AssetItem["type"], string> = {
  cover: "封面",
  gallery: "组图",
  detail: "详情",
};

function formatStatusStripTime(value: string) {
  const time = value.split(" ")[1];
  return time ? `最近 ${time.slice(0, 5)}` : "暂无记录";
}
```

- [ ] **Step 2: Render the badge strip under the card description**

Continue updating `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`:

```tsx
export function AssetsCard({ productId, channelId, assets, statusStrip }: AssetsCardProps) {
  const preview = getProductAssetPreview(productId, channelId);
  const readyCount = assets.filter((asset) => asset.status === "ready").length;
  const missingCount = assets.length - readyCount;
  const missingStatusLabel =
    statusStrip.missingCount > 0
      ? `${channelLabel[channelId]}缺 ${statusStrip.missingCount} 项`
      : `${channelLabel[channelId]}已齐备`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>素材预览</CardTitle>
        <CardDescription>先看封面主视觉，再看卖点组图和详情长图的右侧 mock 预览节奏。</CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">
            {preview ? `${channelLabel[channelId]}预览 Mock` : `暂无${channelLabel[channelId]} Mock`}
          </Badge>
          <Badge variant={statusStrip.didSave ? "default" : "outline"}>
            {statusStrip.didSave ? "已保存" : "最近保存记录"}
          </Badge>
          <Badge variant={statusStrip.missingCount > 0 ? "destructive" : "secondary"}>{missingStatusLabel}</Badge>
          <Badge variant="outline">{formatStatusStripTime(statusStrip.lastSavedAt)}</Badge>
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

- [ ] **Step 3: Run the build to verify the badge strip compiles**

Run:

```bash
pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx
git commit -m "feat: add asset preview status strip"
```

## Task 3: Final verification and smoke pass

**Files:**
- Modify only if verification reveals a real issue

- [ ] **Step 1: Run automated checks**

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

- [ ] **Step 2: Smoke-test the detail page**

Run:

```bash
pnpm dev
```

Then verify:

1. 打开 `/dashboard/e-commerce/products/spu-hanger-coffee?channel=douyin`
2. 确认右侧素材卡头部有 4 个轻量 badge：
   - `抖音预览 Mock`
   - `最近保存记录` 或 `已保存`
   - `抖音已齐备`
   - `最近 HH:MM`
3. 在当前渠道保存一次字段
4. 确认素材卡头部第二个 badge 切成 `已保存`
5. 切到 `视频号`
6. 确认头部第三个 badge 切成 `视频号缺 2 项`，时间和保存反馈同步切到当前渠道

Expected:

- 状态带会随保存动作立刻变化
- 切换渠道后状态带也同步切换
- 头部状态带仍然轻量，不压过封面图和组图

- [ ] **Step 3: Final commit**

```bash
git add src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/product-detail-page.tsx src/app/'(main)'/dashboard/e-commerce/products/'[productId]'/_components/assets-card.tsx
git commit -m "feat: add asset preview status strip"
```
