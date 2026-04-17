# WeChat Publish Panel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the standalone publish page so the WeChat tab becomes a real editable publishing panel backed by the existing shared store and save flow, while the detail page is softened into a summary/transition surface.

**Architecture:** Reuse the existing `ChannelFieldEditor`, `WechatSkuPublishingSection`, and `saveDraft` path instead of creating a second publish-store or a second form engine. Add a publish-page-specific WeChat wrapper that composes a status summary, the existing editor, and missing-field guidance; then mount that wrapper into the new `PlatformPublishPanel`, leaving Douyin on its current mock-driven extension skeleton.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React Hook Form, Zustand, shadcn/ui, Vitest, existing `product-center` mock/store layer

---

## Scope Check

This is one coherent implementation slice:

1. Make the WeChat tab on the standalone publish page truly editable
2. Keep all writes flowing through the same `saveDraft` and store path as today
3. Lower the semantic weight of the detail page without deleting its fallback editor

It does not include Douyin real editing, real platform APIs, publish actions (`retry/list/delist`) migration, or a second draft store.

## File Map

### Create

- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-status-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx`

### Modify

- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx`

### Reuse Only

- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/wechat-sku-publishing-section.tsx`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-provider.tsx`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`

## Task 1: Add a publish-page-specific WeChat panel wrapper

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-status-summary.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx`

- [ ] **Step 1: Write the failing component test for the new WeChat publish panel**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { WechatPublishPanel } from "./wechat-publish-panel";

describe("wechat publish panel", () => {
  it("renders status summary and the real field editor", () => {
    render(
      <ProductCenterStoreProvider>
        <WechatPublishPanel productId="spu-hanger-coffee" />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("视频号发布状态")).toBeInTheDocument();
    expect(screen.getByText("字段编辑器")).toBeInTheDocument();
    expect(screen.getByText("保存字段")).toBeInTheDocument();
    expect(screen.getByText("发品基础")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx'
```

Expected: FAIL because `WechatPublishPanel` and `WechatPublishStatusSummary` do not exist yet.

- [ ] **Step 3: Create the WeChat publish status summary**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-status-summary.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ChannelStatusBadge } from "../../../../_components/channel-status-badge";
import type { ChannelPublicationView } from "../../../../_lib/product-center.types";

const auditStatusLabel = {
  not_submitted: "未提交",
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
} as const;

const listingStatusLabel = {
  not_listed: "未上架",
  listed: "已上架",
  delisted: "已下架",
} as const;

export function WechatPublishStatusSummary({
  channel,
}: {
  channel: ChannelPublicationView<"wechat">;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>视频号发布状态</CardTitle>
        <CardDescription>先确认当前发品卡点，再继续补字段和保存。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border px-4 py-3">
          <div className="mb-2 text-muted-foreground text-xs">发布状态</div>
          <ChannelStatusBadge status={channel.publicationStatus} />
        </div>
        <div className="rounded-lg border px-4 py-3">
          <div className="mb-2 text-muted-foreground text-xs">审核状态</div>
          <div className="font-medium text-sm">{auditStatusLabel[channel.auditStatus]}</div>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <div className="mb-2 text-muted-foreground text-xs">上下架状态</div>
          <div className="font-medium text-sm">{listingStatusLabel[channel.listingStatus]}</div>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <div className="mb-2 text-muted-foreground text-xs">缺失字段</div>
          <Badge variant={channel.missingFields.length > 0 ? "destructive" : "outline"}>
            {channel.missingFields.length > 0 ? `${channel.missingFields.length} 项待补` : "已齐备"}
          </Badge>
        </div>
        <div className="rounded-lg border px-4 py-3">
          <div className="mb-2 text-muted-foreground text-xs">最近同步</div>
          <div className="font-medium text-sm">{channel.lastSyncAt}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create the WeChat publish panel wrapper**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx`:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

import type {
  ChannelFieldDraft,
  ChannelFieldMutationResult,
} from "../../../../_lib/product-center-editing.types";
import { useProductCenterStore } from "../../../../_state/product-center-provider";
import { ChannelFieldEditor } from "../../_components/channel-field-editor";
import { WechatPublishStatusSummary } from "./wechat-publish-status-summary";

function formatSyncAt(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function WechatPublishPanel({ productId }: { productId: string }) {
  const product = useProductCenterStore((store) => store.getProductById(productId));
  const saveDraft = useProductCenterStore((store) => store.saveDraft);

  if (!product) {
    return null;
  }

  const handleSave = (_channelId: "wechat", draft: ChannelFieldDraft): ChannelFieldMutationResult => {
    return saveDraft(productId, "wechat", draft, { syncAt: formatSyncAt(new Date()) });
  };

  return (
    <div className="space-y-4">
      <WechatPublishStatusSummary channel={product.channels.wechat} />
      <ChannelFieldEditor product={product} channel={product.channels.wechat} onSave={handleSave} />
      <Card>
        <CardContent className="px-4 py-4 text-muted-foreground text-sm">
          当前发布页承载真实视频号发品编辑；详情页仅保留摘要和过渡入口。
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Run the component test again**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx'
```

Expected: PASS

- [ ] **Step 6: Commit the panel wrapper slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-status-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx'
git commit -m "feat: add wechat publish panel wrapper"
```

## Task 2: Mount the real WeChat panel into the publish page

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`

- [ ] **Step 1: Extend the publish-page test so it proves the WeChat tab is real**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx` to:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { PublishPage } from "./publish-page";

describe("publish page", () => {
  it("renders common sections, the platform panel, and the right-side status summary", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={createPublishView("spu-hanger-coffee")} />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("通用商品发布")).toBeInTheDocument();
    expect(screen.getByText("平台配置")).toBeInTheDocument();
    expect(screen.getByText("发布校验")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "视频号配置" }));

    expect(screen.getByText("视频号发布状态")).toBeInTheDocument();
    expect(screen.getByText("字段编辑器")).toBeInTheDocument();
    expect(screen.getByText("保存字段")).toBeInTheDocument();

    const validationCard = screen.getByText("发布校验").closest('[data-slot="card"]');
    expect(within(validationCard as HTMLElement).getByText("视频号")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the page test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: FAIL because the WeChat tab still only renders static section metadata.

- [ ] **Step 3: Mount `WechatPublishPanel` into `PlatformPublishPanel`**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { PublishView } from "../../../../_lib/publish/publish.types";
import { DouyinCategorySection } from "./douyin-category-section";
import { DouyinRuleSection } from "./douyin-rule-section";
import { WechatPublishPanel } from "./wechat-publish-panel";

export function PlatformPublishPanel({ publishView }: { publishView: PublishView }) {
  const defaultPlatform = publishView.platforms[0]?.platformId ?? "wechat";

  return (
    <Card>
      <CardHeader>
        <CardTitle>平台配置</CardTitle>
        <CardDescription>在这里切换平台扩展区，视频号先承载真实编辑，抖店继续保留规则骨架。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultPlatform} className="w-full">
          <TabsList className="mb-4 w-full">
            {publishView.platforms.map((platform) => (
              <TabsTrigger key={platform.platformId} value={platform.platformId}>
                {platform.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {publishView.platforms.map((platform) => (
            <TabsContent key={platform.platformId} value={platform.platformId}>
              {platform.platformId === "wechat" ? (
                <WechatPublishPanel productId={publishView.productId} />
              ) : (
                <div className="grid gap-3">
                  <DouyinCategorySection />
                  <DouyinRuleSection />
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm">{platform.title}</div>
                        <div className="text-muted-foreground text-xs">{platform.summary}</div>
                      </div>
                      <Badge variant="outline">
                        {platform.missingFields.length === 0 ? "已就绪" : "待补字段"}
                      </Badge>
                    </div>
                    {platform.missingFields.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {platform.missingFields.map((field) => (
                          <Badge key={field} variant="secondary">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    {platform.extensionSections.map((section) => (
                      <div key={section.id} className="rounded-lg border bg-muted/20 p-4">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="mt-1 text-muted-foreground text-xs">{section.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Re-run the page and panel tests**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 5: Commit the publish-page integration slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
git commit -m "feat: mount wechat editing into publish page"
```

## Task 3: Soften detail-page semantics and verify shared-store behavior

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`

- [ ] **Step 1: Add a failing assertion for detail-page transition wording**

Append to `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { ProductDetailPage } from "../_components/product-detail-page";

it("keeps detail page as a summary surface and points deep editing to the publish page", () => {
  render(
    <ProductCenterStoreProvider>
      <ProductDetailPage productId="spu-hanger-coffee" initialChannel="wechat" />
    </ProductCenterStoreProvider>,
  );

  expect(screen.getByText("进入发布页")).toBeInTheDocument();
  expect(screen.getByText("深度发品编辑请前往发布页")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the detail-page test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx'
```

Expected: FAIL because the detail page still describes the channel tab as the direct editing surface.

- [ ] **Step 3: Update detail-page wording for the transition state**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`:

```tsx
<CardDescription>
  查看各渠道审核、上架与字段准备状态。深度发品编辑请前往发布页，当前页保留摘要和过渡期快捷编辑能力。
</CardDescription>
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`:

```tsx
<Button asChild variant="outline">
  <Link href={`/dashboard/e-commerce/products/${product.id}/publish`}>
    进入发布页
  </Link>
</Button>
```

If `detail-header.tsx` already contains this button, do not change the button itself; only keep it as part of the test evidence and make the wording change in `channel-publication-tabs.tsx`.

- [ ] **Step 4: Run focused tests and the repo check**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
pnpm check
```

Expected:
- Vitest: PASS
- `pnpm check`: PASS with only the existing warnings in `src/lib/cookie.client.ts`

- [ ] **Step 5: Run browser smoke on the publish route**

Run a local smoke against:

```bash
pnpm dev --port 3001
```

Then verify:

1. `http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee/publish`
   - shows `通用商品发布`
   - shows `平台配置`
   - in `视频号配置` tab shows `视频号发布状态` and `字段编辑器`
2. `http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee`
   - still shows `进入发布页`
   - still shows `渠道发布`
   - copy now points deep editing to the publish page

- [ ] **Step 6: Commit the migration completion slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx'
git commit -m "feat: migrate wechat editing into publish page"
```

## Self-Review

### Spec coverage

This plan covers each requirement from the migration spec:

1. 发布页里的视频号区改成三段结构：
   - Task 1
   - Task 2
2. 复用现有 `ChannelFieldEditor / WechatSkuPublishingSection / saveDraft`：
   - Task 1
3. 新发布页里的视频号区成为真实编辑面：
   - Task 1
   - Task 2
4. 详情页软降级为摘要 + 过渡入口：
   - Task 3
5. 不引入第二套草稿状态源：
   - Architecture + Task 1 implementation path

### Placeholder scan

This plan does not contain `TODO` / `TBD` / “similar to previous task” placeholders. Every task has explicit files, code snippets, commands, and expected outputs.

### Type consistency

The plan consistently reuses:

- `ProductCenterStoreProvider`
- `useProductCenterStore`
- `ChannelFieldEditor`
- `ChannelFieldDraft`
- `ChannelFieldMutationResult`

No new parallel publish-draft model is introduced.
