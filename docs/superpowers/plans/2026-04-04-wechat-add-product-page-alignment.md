# WeChat addProduct Page Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the `视频号` tab in the product detail page from a lightweight channel field editor into a minimal WeChat Shop `addProduct` publishing form that covers the smallest viable set of add-product fields without introducing real API integration.

**Architecture:** Keep the existing product-detail layout, shared product-center store, and save flow. Expand the shared channel editing model so `wechat` can express richer field groups, media arrays, boolean/number inputs, and WeChat-specific SKU publishing rows; then render those groups inside the existing `ChannelFieldEditor` with one explicit save action and existing cross-page state propagation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, React Hook Form, shadcn/ui, Vitest

---

## Scope Check

This is one coherent slice: align the `视频号` detail tab to the minimum WeChat Shop `addProduct` payload shape while preserving the current product-center UX. It does not include real WeChat APIs, dynamic category rules, qualification uploads, or a new standalone publishing page.

## File Map

### Modify

- `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts`

### Create

- `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/wechat-sku-publishing-section.tsx`

## Task 1: Expand the shared editing model to represent WeChat addProduct fields

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`

- [ ] **Step 1: Add a failing config-and-types test for the new WeChat sections**

Append to `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`:

```ts
it("defines six addProduct-oriented groups for wechat", () => {
  expect(channelFieldGroupOrder.wechat).toEqual([
    "basic",
    "category",
    "media",
    "fulfillment",
    "sku",
    "compliance",
  ]);

  expect(channelFieldEditingConfig.wechat.groups.basic.map((field) => field.fieldId)).toEqual([
    "outProductId",
    "title",
    "shortTitle",
  ]);
  expect(channelFieldEditingConfig.wechat.groups.category.map((field) => field.fieldId)).toEqual([
    "catsV2",
    "brandId",
    "categoryRuleSummary",
  ]);
  expect(channelFieldEditingConfig.wechat.groups.media.map((field) => field.fieldId)).toEqual([
    "headImages",
    "detailImages",
    "detailDescription",
  ]);
  expect(channelFieldEditingConfig.wechat.groups.fulfillment.map((field) => field.fieldId)).toEqual([
    "deliverMethod",
    "freightTemplate",
    "weight",
  ]);
  expect(channelFieldEditingConfig.wechat.groups.compliance.map((field) => field.fieldId)).toEqual([
    "attrsSummary",
    "qualificationSummary",
    "sevenDayReturn",
    "freightInsurance",
  ]);
});
```

- [ ] **Step 2: Run the editing test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: FAIL because `channelFieldGroupOrder` is still a single four-group array and the `wechat` config does not expose the new sections or field IDs.

- [ ] **Step 3: Extend shared editing types for richer WeChat fields**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts` so the editor can model the add-product minimum set:

```ts
export type ChannelFieldGroupId =
  | "basic"
  | "category"
  | "media"
  | "fulfillment"
  | "sku"
  | "compliance";

export type ChannelFieldType =
  | "text"
  | "textarea"
  | "select"
  | "asset"
  | "asset-array"
  | "string-array"
  | "number"
  | "boolean";

export type ChannelFieldDraftValue = string | string[] | number | boolean;

export interface WechatSkuPublishingDraftRow {
  skuId: string;
  skuCode: string;
  salePrice: string;
  stockNum: string;
  thumbImg: string;
  skuAttrs: string[];
}

export interface ChannelFieldDraft {
  basic: Record<string, ChannelFieldDraftValue>;
  category: Record<string, ChannelFieldDraftValue>;
  media: Record<string, ChannelFieldDraftValue>;
  fulfillment: Record<string, ChannelFieldDraftValue>;
  sku: {
    rows: WechatSkuPublishingDraftRow[];
  };
  compliance: Record<string, ChannelFieldDraftValue>;
}

export interface ChannelFieldGroupMeta {
  label: string;
  description: string;
}
```

- [ ] **Step 4: Replace the old four-group WeChat config with the six addProduct sections**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts`:

```ts
export const channelFieldGroupOrder: Record<EditableChannelId, ChannelFieldGroupId[]> = {
  douyin: ["basic", "fulfillment", "media", "compliance"],
  wechat: ["basic", "category", "media", "fulfillment", "sku", "compliance"],
};

export const channelFieldGroupMeta: Record<EditableChannelId, Record<ChannelFieldGroupId, ChannelFieldGroupMeta>> = {
  douyin: {
    basic: { label: "基础信息", description: "维护抖音渠道核心展示字段。" },
    category: { label: "类目映射", description: "当前阶段抖音暂不开放该区块。" },
    media: { label: "内容表达", description: "维护视频和卖点表达。" },
    fulfillment: { label: "物流履约", description: "维护履约承诺与发货时效。" },
    sku: { label: "SKU 发售", description: "当前阶段抖音暂不开放该区块。" },
    compliance: { label: "亮点强化", description: "维护主推素材和辅助说明。" },
  },
  wechat: {
    basic: { label: "发品基础", description: "对齐 out_product_id、title、short_title。" },
    category: { label: "类目与品牌", description: "对齐 cats_v2、brand_id，并承接参数规则摘要。" },
    media: { label: "主图与详情", description: "对齐 head_imgs、desc_info.imgs、desc_info.desc。" },
    fulfillment: { label: "履约与发货", description: "对齐 deliver_method、运费模板和重量。" },
    sku: { label: "SKU 发售信息", description: "对齐 skus[].thumb_img、sale_price、stock_num、sku_code、sku_attrs。" },
    compliance: { label: "参数 / 资质 / 服务", description: "承接 attrs、product_qua_infos、seven_day_return、freight_insurance。" },
  },
};
```

Use these WeChat field definitions:

```ts
wechat: {
  groups: {
    basic: [
      { fieldId: "outProductId", key: "outProductId", label: "商家商品编码", required: true, group: "basic", type: "text" },
      { fieldId: "title", key: "title", label: "商品标题", required: true, group: "basic", type: "text" },
      { fieldId: "shortTitle", key: "shortTitle", label: "短标题", required: false, group: "basic", type: "text" },
    ],
    category: [
      { fieldId: "catsV2", key: "catsV2", label: "类目路径", required: true, group: "category", type: "select", options: [...] },
      { fieldId: "brandId", key: "brandId", label: "品牌", required: true, group: "category", type: "select", options: [...] },
      { fieldId: "categoryRuleSummary", key: "categoryRuleSummary", label: "类目参数要求", required: false, group: "category", type: "textarea" },
    ],
    media: [
      { fieldId: "headImages", key: "headImages", label: "主图组", required: true, group: "media", type: "asset-array", assetTypes: ["cover", "gallery"] },
      { fieldId: "detailImages", key: "detailImages", label: "详情图组", required: true, group: "media", type: "asset-array", assetTypes: ["detail", "gallery"] },
      { fieldId: "detailDescription", key: "detailDescription", label: "详情文案", required: false, group: "media", type: "textarea" },
    ],
    fulfillment: [
      { fieldId: "deliverMethod", key: "deliverMethod", label: "发货方式", required: true, group: "fulfillment", type: "select", options: [...] },
      { fieldId: "freightTemplate", key: "freightTemplate", label: "运费模板", required: true, group: "fulfillment", type: "select", options: [...] },
      { fieldId: "weight", key: "weight", label: "重量(kg)", required: true, group: "fulfillment", type: "number" },
    ],
    sku: [],
    compliance: [
      { fieldId: "attrsSummary", key: "attrsSummary", label: "类目参数摘要", required: false, group: "compliance", type: "string-array" },
      { fieldId: "qualificationSummary", key: "qualificationSummary", label: "商品资质", required: false, group: "compliance", type: "string-array" },
      { fieldId: "sevenDayReturn", key: "sevenDayReturn", label: "七天无理由", required: true, group: "compliance", type: "boolean" },
      { fieldId: "freightInsurance", key: "freightInsurance", label: "运费险", required: true, group: "compliance", type: "boolean" },
    ],
  },
}
```

- [ ] **Step 5: Re-run the editing test**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: PASS for the new config-group test, with older mutation tests still failing until the save/build logic is updated in Task 2.

- [ ] **Step 6: Commit the config-model slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
git commit -m "feat: define wechat add-product editing schema"
```

## Task 2: Persist richer WeChat draft values in mocks and mutation helpers

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`
- Modify: `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`

- [ ] **Step 1: Add failing mutation tests for WeChat media arrays and SKU rows**

Append to `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts`:

```ts
it("builds a wechat addProduct draft from persisted channel values and sku publishing rows", () => {
  const draft = buildChannelFieldDraft(productCenterMock[0], "wechat");

  expect(draft.basic.outProductId).toBe("wx-spu-hanger-coffee");
  expect(draft.media.headImages).toEqual(["asset-coffee-cover", "asset-coffee-gallery"]);
  expect(draft.media.detailImages).toEqual(["asset-coffee-detail"]);
  expect(draft.sku.rows[0]).toEqual({
    skuId: "sku-coffee-01",
    skuCode: "DRIP-CLASSIC",
    salePrice: "5900",
    stockNum: "182",
    thumbImg: "asset-coffee-cover",
    skuAttrs: ["口味:经典拼配"],
  });
});

it("saves a wechat addProduct draft and recomputes readiness", () => {
  const result = saveChannelFieldDraft(
    productCenterMock[0],
    "wechat",
    {
      basic: { outProductId: "wx-spu-hanger-coffee", title: "冷萃挂耳咖啡礼盒", shortTitle: "挂耳礼盒" },
      category: { catsV2: "coffee-gift", brandId: "qishan-lab", categoryRuleSummary: "口味、规格必填" },
      media: {
        headImages: ["asset-coffee-cover", "asset-coffee-gallery"],
        detailImages: ["asset-coffee-detail"],
        detailDescription: "礼盒详情页文案",
      },
      fulfillment: { deliverMethod: "express", freightTemplate: "standard", weight: 0.8 },
      sku: {
        rows: [
          {
            skuId: "sku-coffee-01",
            skuCode: "DRIP-CLASSIC",
            salePrice: "5900",
            stockNum: "182",
            thumbImg: "asset-coffee-cover",
            skuAttrs: ["口味:经典拼配"],
          },
        ],
      },
      compliance: {
        attrsSummary: ["口味:经典拼配", "规格:10袋/盒"],
        qualificationSummary: ["食品经营许可已备案"],
        sevenDayReturn: true,
        freightInsurance: true,
      },
    },
    { syncAt: "2026-04-04 11:20" },
  );

  expect(result.publicationStatus).toBe("ready_to_list");
  expect(result.missingFields).toEqual([]);
  expect(result.product.channels.wechat.channelSpecificFields.find((field) => field.fieldId === "headImages")?.value).toBe(
    "封面图\n卖点组图",
  );
  expect(result.product.skus[0].channelPublishing?.wechat?.salePrice).toBe("5900");
});
```

- [ ] **Step 2: Run the editing test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: FAIL because the mock data does not have persisted WeChat add-product values and the mutation helper cannot yet parse or save `asset-array`, `boolean`, `number`, or SKU publishing rows.

- [ ] **Step 3: Extend `SKUItem` and WeChat mock data**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts`:

```ts
export interface SKUPublishingState {
  salePrice: string;
  stockNum: string;
  skuCode: string;
  thumbImg: string;
  skuAttrs: string[];
}

export interface SKUItem {
  id: string;
  name: string;
  sellerSku: string;
  priceLabel: string;
  inventory: number;
  channelPublishing?: Partial<Record<Extract<ChannelId, "wechat">, SKUPublishingState>>;
}
```

Seed `src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts` so each product has meaningful WeChat baseline data:

```ts
wechat: {
  channel: "wechat",
  publicationStatus: "missing_fields",
  auditStatus: "not_submitted",
  listingStatus: "not_listed",
  missingFields: ["主图组", "运费模板", "SKU 图片"],
  lastSyncAt: "2026-04-02 09:40",
  channelSpecificFields: [
    { fieldId: "outProductId", label: "商家商品编码", value: "wx-spu-hanger-coffee", state: "ready" },
    { fieldId: "title", label: "商品标题", value: "冷萃挂耳咖啡礼盒", state: "ready" },
    { fieldId: "headImages", label: "主图组", value: "", state: "missing" },
    { fieldId: "detailImages", label: "详情图组", value: "详情长图", state: "ready" },
    { fieldId: "freightTemplate", label: "运费模板", value: "", state: "missing" },
    { fieldId: "sevenDayReturn", label: "七天无理由", value: "开启", state: "ready" },
  ],
},
skus: [
  {
    id: "sku-coffee-01",
    name: "经典拼配",
    sellerSku: "DRIP-CLASSIC",
    priceLabel: "¥59.00",
    inventory: 182,
    channelPublishing: {
      wechat: {
        salePrice: "5900",
        stockNum: "182",
        skuCode: "DRIP-CLASSIC",
        thumbImg: "",
        skuAttrs: ["口味:经典拼配"],
      },
    },
  },
]
```

- [ ] **Step 4: Teach the shared editing helper to parse and save richer field types**

Update `src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts`:

```ts
function createEmptyChannelFieldDraft(): ChannelFieldDraft {
  return {
    basic: {},
    category: {},
    media: {},
    fulfillment: {},
    sku: { rows: [] },
    compliance: {},
  };
}

function parseStoredValue(product: SPUDetail, field: ConfiguredFieldDefinition, value: string): ChannelFieldDraftValue {
  if (field.type === "asset-array") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .map((label) => getAssetByReference(product.assets, label)?.id ?? "")
      .filter(Boolean);
  }

  if (field.type === "boolean") {
    return value === "开启" || value === "true";
  }

  if (field.type === "number") {
    return Number(value) || 0;
  }

  return previousParseStoredValue(product, field, value);
}

function buildWechatSkuDraftRows(product: SPUDetail): WechatSkuPublishingDraftRow[] {
  return product.skus.map((sku) => ({
    skuId: sku.id,
    skuCode: sku.channelPublishing?.wechat?.skuCode ?? sku.sellerSku,
    salePrice: sku.channelPublishing?.wechat?.salePrice ?? "",
    stockNum: sku.channelPublishing?.wechat?.stockNum ?? `${sku.inventory}`,
    thumbImg: sku.channelPublishing?.wechat?.thumbImg ?? "",
    skuAttrs: sku.channelPublishing?.wechat?.skuAttrs ?? [`规格:${sku.name}`],
  }));
}

function saveWechatSkuRows(product: SPUDetail, rows: WechatSkuPublishingDraftRow[]) {
  return product.skus.map((sku) => {
    const row = rows.find((item) => item.skuId === sku.id);
    if (!row) return sku;

    return {
      ...sku,
      channelPublishing: {
        ...sku.channelPublishing,
        wechat: {
          skuCode: row.skuCode,
          salePrice: row.salePrice,
          stockNum: row.stockNum,
          thumbImg: row.thumbImg,
          skuAttrs: row.skuAttrs,
        },
      },
    };
  });
}
```

When recomputing missing fields, include:

```ts
if ((draft.media.headImages as string[]).length === 0) missingFields.push("主图组");
if ((draft.media.detailImages as string[]).length === 0) missingFields.push("详情图组");
if (!String(draft.fulfillment.weight ?? "").trim()) missingFields.push("重量");
if (!draft.compliance.sevenDayReturn) missingFields.push("七天无理由");
if (!draft.compliance.freightInsurance) missingFields.push("运费险");

for (const row of draft.sku.rows) {
  if (!row.thumbImg.trim()) missingFields.push("SKU 图片");
  if (!row.salePrice.trim()) missingFields.push("SKU 售价");
  if (!row.stockNum.trim()) missingFields.push("SKU 库存");
}
```

- [ ] **Step 5: Re-run the editing helper test**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
```

Expected: PASS, including the new WeChat draft build/save coverage.

- [ ] **Step 6: Commit the data-model slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center.mock.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts'
git commit -m "feat: persist wechat add-product draft data"
```

## Task 3: Rebuild the editor UI around addProduct sections and a WeChat SKU publishing block

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/wechat-sku-publishing-section.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts`

- [ ] **Step 1: Add a failing UI test for nested WeChat field errors**

Append to `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts`:

```ts
it("counts nested wechat sku row errors as leaf errors", () => {
  const errors = {
    basic: {
      outProductId: { type: "required", message: "商家商品编码不能为空" },
    },
    sku: {
      rows: [
        {
          salePrice: { type: "required", message: "SKU 售价不能为空" },
          thumbImg: { type: "required", message: "SKU 图片不能为空" },
        },
      ],
    },
  } satisfies Partial<Record<keyof ChannelFieldDraft, unknown>>;

  expect(countChannelFieldErrors(errors as never)).toBe(3);
});
```

- [ ] **Step 2: Run the editor test to verify it fails**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts'
```

Expected: FAIL if `countChannelFieldErrors` does not recurse through the new `sku.rows` structure.

- [ ] **Step 3: Teach the generic field group to render asset arrays, numbers, and booleans**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx`:

```tsx
{fieldDefinition.type === "asset-array" ? (
  <ChannelAssetPickerDialog
    mode="multiple"
    assets={product.assets}
    assetTypes={fieldDefinition.assetTypes}
    selectedAssetIds={getStringArrayValue(field.value)}
    onSelectMany={field.onChange}
    placeholder="选择一组素材"
  />
) : null}

{fieldDefinition.type === "number" ? (
  <Input
    type="number"
    value={String(field.value ?? "")}
    onChange={(event) => field.onChange(Number(event.target.value))}
    placeholder={fieldDefinition.placeholder}
  />
) : null}

{fieldDefinition.type === "boolean" ? (
  <Select value={(field.value ? "true" : "false") as string} onValueChange={(value) => field.onChange(value === "true")}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="true">开启</SelectItem>
      <SelectItem value="false">关闭</SelectItem>
    </SelectContent>
  </Select>
) : null}
```

Also replace hard-coded group title text with per-channel metadata:

```tsx
const meta = channelFieldGroupMeta[channelId][groupId];
<div className="font-medium text-sm">{meta.label}</div>
<div className="text-muted-foreground text-xs">{meta.description}</div>
```

- [ ] **Step 4: Add the dedicated WeChat SKU publishing section**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/wechat-sku-publishing-section.tsx`:

```tsx
"use client";

import { Controller, type Control } from "react-hook-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { SPUDetail } from "../../../_lib/product-center.types";
import type { ChannelFieldDraft } from "../../../_lib/product-center-editing.types";
import { ChannelAssetPickerDialog } from "./channel-asset-picker-dialog";

interface WechatSkuPublishingSectionProps {
  control: Control<ChannelFieldDraft>;
  product: SPUDetail;
}

export function WechatSkuPublishingSection({ control, product }: WechatSkuPublishingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SKU 发售信息</CardTitle>
        <CardDescription>对齐视频号 addProduct 的 SKU 图片、售价、库存、编码和销售属性。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Controller
          control={control}
          name={"sku.rows"}
          render={({ field }) => (
            <div className="space-y-4">
              {field.value.map((row, index) => (
                <div key={row.skuId} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
                  <Input value={row.skuCode} onChange={(event) => updateRow(index, "skuCode", event.target.value)} />
                  <Input value={row.salePrice} onChange={(event) => updateRow(index, "salePrice", event.target.value)} />
                  <Input value={row.stockNum} onChange={(event) => updateRow(index, "stockNum", event.target.value)} />
                  <ChannelAssetPickerDialog
                    assets={product.assets}
                    assetTypes={["cover", "gallery"]}
                    selectedAssetId={row.thumbImg}
                    onSelect={(assetId) => updateRow(index, "thumbImg", assetId)}
                  />
                </div>
              ))}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Render the WeChat SKU block from the shared editor**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx`:

```tsx
const groupOrder = channelFieldGroupOrder[channel.channel];
const groupMeta = channelFieldGroupMeta[channel.channel];

{groupOrder
  .filter((groupId) => groupId !== "sku")
  .map((groupId) => (
    <ChannelFieldGroup
      key={groupId}
      channelId={channel.channel}
      groupId={groupId}
      groupMeta={groupMeta[groupId]}
      fields={fieldGroups[groupId]}
      control={form.control}
      product={product}
    />
  ))}

{channel.channel === "wechat" ? (
  <WechatSkuPublishingSection control={form.control} product={product} />
) : null}
```

- [ ] **Step 6: Re-run the editor test**

Run:

```bash
pnpm exec vitest run 'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts'
```

Expected: PASS for nested error counting and no type regressions in the editor components.

- [ ] **Step 7: Commit the UI-editor slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-asset-picker-dialog.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/wechat-sku-publishing-section.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts'
git commit -m "feat: rebuild wechat tab as add-product form"
```

## Task 4: Wire the detail page semantics and verify the end-to-end mock flow

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`

- [ ] **Step 1: Align the tab copy and section ordering with addProduct semantics**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx`:

```tsx
<CardDescription>
  查看各渠道审核、上架与字段准备状态，并在视频号渠道中直接维护最小可发品字段。
</CardDescription>
```

Update the missing-fields helper copy so WeChat users see add-product language:

```tsx
<div className="text-muted-foreground text-xs">
  {channel.channel === "wechat" ? "优先补齐最小发品字段后，再继续同步或提交流程。" : "优先补齐后再同步到渠道。"}
</div>
```

- [ ] **Step 2: Make the right-side asset card explicitly reference WeChat media semantics**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx`:

```tsx
const previewHint =
  channelId === "wechat"
    ? "当前预览对应视频号主图组与详情图组 mock，用于对照 head_imgs / desc_info.imgs。"
    : "当前预览用于辅助判断渠道素材排布是否可用。";
```

Render it under the status strip:

```tsx
<p className="text-muted-foreground text-xs">{previewHint}</p>
```

- [ ] **Step 3: Run fast unit and type checks**

Run:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts'
pnpm check
```

Expected:
- Vitest: PASS
- `pnpm check`: PASS, with only the existing warning in `src/lib/cookie.client.ts`

- [ ] **Step 4: Run a local browser smoke for the WeChat detail tab**

Use the existing dev server and verify:

```bash
open 'http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee?channel=wechat'
```

Manual expectations:
- The `视频号` tab shows six sections in this order: `发品基础` → `类目与品牌` → `主图与详情` → `履约与发货` → `SKU 发售信息` → `参数 / 资质 / 服务`
- The right asset card explains it is previewing `head_imgs / desc_info.imgs`
- Editing required WeChat fields and clicking `保存字段` updates the current tab state without breaking the shared store flow

- [ ] **Step 5: Commit the integration slice**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-publication-tabs.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/product-detail-page.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/assets-card.tsx'
git commit -m "feat: align wechat detail tab to add-product semantics"
```

## Final Verification

- [ ] Run the focused test suite:

```bash
pnpm exec vitest run \
  'src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-editor.test.ts' \
  'src/app/(main)/dashboard/e-commerce/_state/product-center-store.test.ts'
```

Expected: PASS.

- [ ] Run repository checks:

```bash
pnpm check
pnpm build
```

Expected:
- `pnpm check`: PASS with only the pre-existing warning in `src/lib/cookie.client.ts`
- `pnpm build`: PASS

- [ ] Capture final acceptance evidence:

Verify these routes:

```text
/dashboard/e-commerce/products/spu-hanger-coffee?channel=wechat
/dashboard/e-commerce/products/spu-jasmine-tea?channel=wechat
```

Acceptance notes to record:
- 视频号 Tab 已从“补充字段编辑器”升级为“最小可发品表单”
- 左侧字段分区与 `addProduct` 的最小 payload 结构一致
- 右侧素材预览和 `head_imgs / desc_info.imgs` 语义打通
- 保存字段后详情页状态仍然沿用共享 store 联动

## Self-Review

- Spec coverage:
  - 最小字段集：Task 1、Task 2
  - 六段信息架构：Task 1、Task 3、Task 4
  - SKU 发品编辑区：Task 2、Task 3
  - 图文区与右侧 preview 语义打通：Task 4
  - 非目标未越界：计划中未引入真实 API、动态规则或资质上传
- Placeholder scan:
  - No `TODO` / `TBD`
  - All tasks include exact files, commands, and concrete code shape
- Type consistency:
  - Group IDs consistently use `basic/category/media/fulfillment/sku/compliance`
  - SKU publishing row shape is reused consistently between types, helper, and UI section
