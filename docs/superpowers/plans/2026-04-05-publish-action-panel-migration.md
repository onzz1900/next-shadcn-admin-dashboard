# Publish Action Panel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the standalone publish page so the right rail becomes a real publish control area for the active platform, while the detail page is demoted to summary plus fallback quick actions.

**Architecture:** Reuse the existing `product-center` shared store and the already-landed `retry/list/delist/saveDraft` behavior, then add only the missing mock publish actions needed by the standalone publish page. Lift `activePlatform` state into the publish-page shell, derive a single primary/secondary action pair from current channel status, and render a focused `PublishActionPanel` inside the right-side validation card instead of inventing a second workflow or a second store.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, shadcn/ui, Vitest, existing `product-center` mock/store layer

---

## Scope Check

This plan covers one coherent migration slice:

1. Add the missing mock publish actions for the shared `product-center` store
2. Turn the publish-page right rail into a platform-aware action panel
3. Lower the visual/semantic weight of detail-page actions without deleting them

This plan does **not** include:

- Real platform API integration
- Douyin real publish/edit/detail adapters
- Batch actions
- A new publish-draft store
- Rebuilding the detail page around the publish page

## File Map

### Create

- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx`

### Modify

- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`

### Reuse Only

- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-status-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/publication-actions.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/channel-status.ts`

## Task 1: Add shared publish-action derivation and missing mock store actions

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`

- [ ] **Step 1: Write failing tests for action derivation and new store actions**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import { getPublishActionState } from "./publish-action-state";

describe("publish action state", () => {
  it("shows focus-editor only when fields are missing", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: ["主图", "发货方式"],
      }),
    ).toEqual({
      primaryAction: { id: "focus_editor", label: "继续补字段" },
      secondaryAction: null,
      hint: "当前平台仍有待补字段，先回到表单补齐后再继续提交流程。",
    });
  });

  it("prioritizes submit-review for channels that are complete but not yet submitted", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "ready_to_list",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primaryAction: { id: "submit_review", label: "提交审核" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前字段已齐备，但还未进入审核流程。",
    });
  });

  it("shows retry for sync errors", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "sync_error",
        auditStatus: "rejected",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primaryAction: { id: "retry_sync", label: "重新同步" },
      secondaryAction: null,
      hint: "当前渠道存在异常，优先重新同步后再继续后续动作。",
    });
  });

  it("shows list and update for ready-to-list channels that already passed review", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "ready_to_list",
        auditStatus: "approved",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primaryAction: { id: "list", label: "上架" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前渠道已完成审核，可以直接上架或先刷新渠道信息。",
    });
  });
});
```

Append to `src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts`:

```ts
  it("moves a channel into in-review when submitChannelForReview is called", () => {
    const store = createProductCenterStore([createWechatReadyProduct(), ...productCenterMock.slice(1)]);

    store.getState().submitChannelForReview("spu-hanger-coffee", "wechat", "2026-04-05 11:20");

    const updatedChannel = store.getState().getProductById("spu-hanger-coffee")?.channels.wechat;

    expect(updatedChannel?.publicationStatus).toBe("in_review");
    expect(updatedChannel?.auditStatus).toBe("pending");
    expect(updatedChannel?.listingStatus).toBe("not_listed");
    expect(updatedChannel?.rejectionReason).toBeUndefined();
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-05 11:20");
  });

  it("refreshes a non-error channel in place when updateChannel is called", () => {
    const store = createProductCenterStore([createWechatReadyProduct(), ...productCenterMock.slice(1)]);

    store.getState().listChannel("spu-hanger-coffee", "wechat", "2026-04-05 11:21");
    store.getState().updateChannel("spu-hanger-coffee", "wechat", "2026-04-05 11:25");

    const updatedChannel = store.getState().getProductById("spu-hanger-coffee")?.channels.wechat;

    expect(updatedChannel?.publicationStatus).toBe("live");
    expect(updatedChannel?.listingStatus).toBe("listed");
    expect(updatedChannel?.auditStatus).toBe("approved");
    expect(updatedChannel?.lastSyncAt).toBe("2026-04-05 11:25");
  });
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: FAIL because `getPublishActionState`, `submitChannelForReview`, and `updateChannel` do not exist yet.

- [ ] **Step 3: Add the shared publish-action derivation helper**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.ts`:

```ts
import type {
  AuditStatus,
  ChannelId,
  ListingStatus,
  PublicationStatus,
} from "../product-center.types";

export type PublishActionId = "focus_editor" | "submit_review" | "update_channel" | "retry_sync" | "list" | "delist";

export interface PublishActionDefinition {
  id: PublishActionId;
  label: string;
}

export interface PublishActionStateInput {
  platformId: ChannelId;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
}

export interface PublishActionState {
  primaryAction: PublishActionDefinition | null;
  secondaryAction: PublishActionDefinition | null;
  hint: string;
}

export function getPublishActionState(input: PublishActionStateInput): PublishActionState {
  if (input.missingFields.length > 0 || input.publicationStatus === "missing_fields") {
    return {
      primaryAction: { id: "focus_editor", label: "继续补字段" },
      secondaryAction: null,
      hint: "当前平台仍有待补字段，先回到表单补齐后再继续提交流程。",
    };
  }

  if (input.publicationStatus === "sync_error" || input.publicationStatus === "rejected") {
    return {
      primaryAction: { id: "retry_sync", label: "重新同步" },
      secondaryAction: null,
      hint: "当前渠道存在异常，优先重新同步后再继续后续动作。",
    };
  }

  if (input.auditStatus === "not_submitted" || input.auditStatus === "rejected") {
    return {
      primaryAction: { id: "submit_review", label: "提交审核" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前字段已齐备，但还未进入审核流程。",
    };
  }

  if (input.publicationStatus === "ready_to_list" && input.listingStatus !== "listed") {
    return {
      primaryAction: { id: "list", label: "上架" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前渠道已完成审核，可以直接上架或先刷新渠道信息。",
    };
  }

  if (input.publicationStatus === "live" || input.listingStatus === "listed") {
    return {
      primaryAction: { id: "delist", label: "下架" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前渠道已在售，可维护后继续同步或直接下架。",
    };
  }

  if (input.publicationStatus === "offline" || input.listingStatus === "delisted") {
    return {
      primaryAction: { id: "list", label: "重新上架" },
      secondaryAction: { id: "update_channel", label: "更新渠道" },
      hint: "当前渠道已下架，可重新上架或先刷新渠道信息。",
    };
  }

  return {
    primaryAction: { id: "update_channel", label: "更新渠道" },
    secondaryAction: null,
    hint: "当前平台可以继续刷新渠道配置。",
  };
}
```

- [ ] **Step 4: Add the missing mock store actions**

Update `src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts`:

```ts
export interface ProductCenterStoreState {
  products: SPUDetail[];
  saveDraft: (
    productId: string,
    channelId: EditableChannelId,
    draft: ChannelFieldDraft,
    options?: ChannelFieldMutationOptions,
  ) => ChannelFieldMutationResult;
  submitChannelForReview: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  updateChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  retryChannelSync: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  listChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  delistChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  getProductById: (id: string) => SPUDetail | undefined;
  getMetrics: () => ProductCenterMetrics;
  getFilteredProducts: (filters: ProductCenterFilters) => ReturnType<typeof filterProductSummaries>;
  getWorkbenchRows: () => PublicationWorkbenchRow[];
}
```

Add these implementations inside `createProductCenterStore`:

```ts
    submitChannelForReview: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                publicationStatus: "in_review",
                auditStatus: "pending",
                listingStatus: "not_listed",
                rejectionReason: undefined,
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
    updateChannel: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
```

- [ ] **Step 5: Run the tests again**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: PASS

- [ ] **Step 6: Commit the state/action foundation**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
git commit -m "feat: add publish action state and store actions"
```

## Task 2: Upgrade the publish-page right rail into a real action panel

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`

- [ ] **Step 1: Write failing tests for the right-side action panel**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { PublishActionPanel } from "./publish-action-panel";

describe("publish action panel", () => {
  it("shows submit-review as the primary action for a complete but not-submitted WeChat channel", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel productId="spu-hanger-coffee" platformId="wechat" />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("发布控制")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交审核" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新渠道" })).toBeInTheDocument();
  });

  it("moves the active channel into review when the primary action is clicked", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel productId="spu-hanger-coffee" platformId="wechat" />
      </ProductCenterStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "提交审核" }));

    expect(screen.getByText("提交中...")).toBeInTheDocument();
  });
});
```

Replace the current contents of `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx` with a publish-page-focused test:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { createPublishView } from "../../../../_lib/publish/publish.mock";
import { PublishPage } from "./publish-page";

describe("publish page", () => {
  it("keeps the active platform in sync between the center panel and the right rail", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={createPublishView("spu-hanger-coffee")!} />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("发布校验")).toBeInTheDocument();
    expect(screen.getByText("发布控制")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "视频号配置" }));

    expect(screen.getByText("当前平台：视频号")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交审核" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: FAIL because `PublishActionPanel` does not exist and the right rail is not yet platform-aware.

- [ ] **Step 3: Create the active-platform action panel**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`:

```tsx
"use client";

import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getPublishActionState } from "../../../../_lib/publish/publish-action-state";
import type { ChannelId } from "../../../../_lib/product-center.types";
import { useProductCenterStore } from "../../../../_state/product-center-provider";

interface PublishActionPanelProps {
  productId: string;
  platformId: ChannelId;
}

export function PublishActionPanel({ productId, platformId }: PublishActionPanelProps) {
  const product = useProductCenterStore((store) => store.getProductById(productId));
  const submitChannelForReview = useProductCenterStore((store) => store.submitChannelForReview);
  const updateChannel = useProductCenterStore((store) => store.updateChannel);
  const retryChannelSync = useProductCenterStore((store) => store.retryChannelSync);
  const listChannel = useProductCenterStore((store) => store.listChannel);
  const delistChannel = useProductCenterStore((store) => store.delistChannel);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  if (!product) {
    return null;
  }

  const channel = product.channels[platformId];
  const actionState = getPublishActionState({
    platformId,
    publicationStatus: channel.publicationStatus,
    auditStatus: channel.auditStatus,
    listingStatus: channel.listingStatus,
    missingFields: channel.missingFields,
  });

  const runAction = (actionId: string) => {
    setPendingActionId(actionId);

    startTransition(() => {
      if (actionId === "submit_review") {
        submitChannelForReview(productId, platformId);
      } else if (actionId === "update_channel") {
        updateChannel(productId, platformId);
      } else if (actionId === "retry_sync") {
        retryChannelSync(productId, platformId);
      } else if (actionId === "list") {
        listChannel(productId, platformId);
      } else if (actionId === "delist") {
        delistChannel(productId, platformId);
      } else if (actionId === "focus_editor") {
        window.location.hash = `channel-${platformId}-editor`;
      }

      setPendingActionId(null);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>发布控制</CardTitle>
        <CardDescription>当前平台：{platformId === "douyin" ? "抖店" : "视频号"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{actionState.hint}</p>
        <div className="flex flex-wrap gap-2">
          {actionState.primaryAction ? (
            <Button onClick={() => runAction(actionState.primaryAction!.id)} disabled={pendingActionId !== null}>
              {pendingActionId === actionState.primaryAction.id
                ? `${actionState.primaryAction.label.slice(0, -2)}中...`
                : actionState.primaryAction.label}
            </Button>
          ) : null}
          {actionState.secondaryAction ? (
            <Button
              variant="outline"
              onClick={() => runAction(actionState.secondaryAction!.id)}
              disabled={pendingActionId !== null}
            >
              {actionState.secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Lift active-platform state into the publish-page shell and wire the right rail**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`:

```tsx
"use client";

import { useState } from "react";

import type { ChannelId } from "../../../../_lib/product-center.types";
import type { PublishView } from "../../../../_lib/publish/publish.types";
import { CommonPublishSections } from "./common-publish-sections";
import { PlatformPublishPanel } from "./platform-publish-panel";
import { PublishHeader } from "./publish-header";
import { PublishValidationSummary } from "./publish-validation-summary";

interface PublishPageProps {
  publishView: PublishView;
}

export function PublishPage({ publishView }: PublishPageProps) {
  const [activePlatform, setActivePlatform] = useState<ChannelId>(publishView.platforms[0]?.platformId ?? "wechat");

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PublishHeader publishView={publishView} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CommonPublishSections publishView={publishView} />
          <PlatformPublishPanel
            publishView={publishView}
            activePlatform={activePlatform}
            onPlatformChange={setActivePlatform}
          />
        </div>
        <PublishValidationSummary publishView={publishView} activePlatform={activePlatform} />
      </div>
    </div>
  );
}
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`:

```tsx
interface PlatformPublishPanelProps {
  publishView: PublishView;
  activePlatform: ChannelId;
  onPlatformChange: (platformId: ChannelId) => void;
}
```

and replace `Tabs` with:

```tsx
        <Tabs value={activePlatform} onValueChange={(value) => onPlatformChange(value as ChannelId)} className="w-full">
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`:

```tsx
import { useProductCenterStore } from "../../../../_state/product-center-provider";
import type { ChannelId } from "../../../../_lib/product-center.types";
import { PublishActionPanel } from "./publish-action-panel";

interface PublishValidationSummaryProps {
  publishView: PublishView;
  activePlatform: ChannelId;
}

export function PublishValidationSummary({ publishView, activePlatform }: PublishValidationSummaryProps) {
  const product = useProductCenterStore((store) => store.getProductById(publishView.productId));
  const activeChannel = product?.channels[activePlatform];
```

Then keep the existing validation items and append this block at the bottom of `CardContent`:

```tsx
        {activeChannel ? (
          <div className="rounded-lg border border-dashed p-3">
            <div className="mb-3 text-muted-foreground text-xs">
              当前平台：{activePlatform === "douyin" ? "抖店" : "视频号"}
            </div>
            <PublishActionPanel productId={publishView.productId} platformId={activePlatform} />
          </div>
        ) : null}
```

- [ ] **Step 5: Run the right-rail tests again**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 6: Commit the publish-page action panel slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
git commit -m "feat: add publish action panel to publish page"
```

## Task 3: Demote detail-page actions to fallback status and verify shared-store behavior

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`

- [ ] **Step 1: Write the failing detail-page transition test**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";

import { ProductCenterStoreProvider } from "../../../_state/product-center-provider";
import { ProductDetailPage } from "./product-detail-page";

describe("product detail page", () => {
  it("keeps fallback quick actions but redirects the primary workflow to the publish page", () => {
    render(
      <ProductCenterStoreProvider>
        <TooltipProvider>
          <ProductDetailPage productId="spu-hanger-coffee" initialChannel="wechat" />
        </TooltipProvider>
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByRole("link", { name: "进入发布页" })).toBeInTheDocument();
    expect(screen.getByText("主要发布动作请前往发布页，当前页保留过渡期快捷操作。")).toBeInTheDocument();
    expect(screen.getByText(/深度发品编辑请前往发布页/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the new detail-page test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx'
```

Expected: FAIL because the fallback-action note does not exist yet.

- [ ] **Step 3: Lower the detail-page action emphasis without deleting shortcuts**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx` so the action area becomes:

```tsx
        <div className="flex flex-col items-start gap-2 xl:items-end">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button asChild variant="default">
              <Link href={`/dashboard/e-commerce/products/${product.id}/publish`}>进入发布页</Link>
            </Button>
            {actions.map((action) => (
              <Button key={action} variant="outline">
                {action}
              </Button>
            ))}
          </div>
          <div className="text-muted-foreground text-xs">
            主要发布动作请前往发布页，当前页保留过渡期快捷操作。
          </div>
        </div>
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx` so the card description becomes:

```tsx
        <CardDescription>
          查看各渠道审核、上架与字段准备状态，深度发品编辑请前往发布页；当前页仅保留过渡期快捷操作。
        </CardDescription>
```

- [ ] **Step 4: Run the detail-page test and a focused static check**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx'

pnpm check
```

Expected:

- Vitest: PASS
- `pnpm check`: PASS with only the existing `src/lib/cookie.client.ts` warnings

- [ ] **Step 5: Commit the detail-page downgrade**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/detail-header.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx'
git commit -m "refactor: downgrade detail page publish actions"
```

## Final Verification

- [ ] **Step 1: Run the full focused regression suite**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/publish-action-state.test.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx'
```

Expected: PASS

- [ ] **Step 2: Run the repository check**

Run:

```bash
pnpm check
```

Expected: PASS with only the known `src/lib/cookie.client.ts` warnings.

- [ ] **Step 3: Browser smoke for the two primary flows**

Run:

```bash
pnpm dev --port 3001
```

Then verify in the browser:

1. `http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee/publish`
   - 右侧显示 `发布控制`
   - 视频号 Tab 下能看到 `提交审核 / 更新渠道`
   - 点击主动作后右侧状态摘要和按钮文案发生变化
2. `http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee?channel=wechat`
   - 详情页仍有 `进入发布页`
   - 详情页文案明确说明主动作前往发布页

Expected: both flows render without runtime errors; publish page is the primary action surface; detail page is visibly downgraded to fallback status.

## Self-Review

- Spec coverage: covered right-rail action migration, missing mock actions, detail-page downgrade, and verification paths
- Placeholder scan: no TBD/TODO or “similar to” shortcuts remain
- Type consistency: `submitChannelForReview` and `updateChannel` are defined in Task 1 before any later task references them; `activePlatform` is introduced in `PublishPage` before `PublishValidationSummary`/`PlatformPublishPanel` consume it

