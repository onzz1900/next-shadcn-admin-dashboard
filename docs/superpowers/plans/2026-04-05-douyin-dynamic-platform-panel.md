# Douyin Dynamic Platform Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Douyin tab in the standalone publish page from static explanation cards into a category-driven dynamic platform panel whose field completeness and rule blockers also drive the right-side publish control area.

**Architecture:** Keep the unified publish-page shell intact and add a Douyin-only local panel state that is driven by a selected mock category. Model the Douyin category options, dynamic fields, rule summary, and derived missing-fields in a small publish-domain helper layer; then render a dedicated `DouyinPlatformPanel` and pass its derived state into the existing right-side validation/action area without polluting the global `product-center` store.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand store already used by the publish page, shadcn/ui, Vitest

---

## Scope Check

This plan covers one coherent slice:

1. Create local mock data and derivation logic for Douyin category-driven fields and rules
2. Replace the static Douyin platform cards with a real dynamic panel in the standalone publish page
3. Let the right-side validation/action area react to Douyin local panel state

This plan does **not** include:

- Real `/product/getCatePropertyV2`
- Real `/product/getProductUpdateRule`
- Real Douyin publish/edit/detail API calls
- Full SKU matrix generation
- Brand library / qualification upload
- Writing Douyin dynamic state into the shared `product-center` store

## File Map

### Create

- `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.types.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.mock.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-selector.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-dynamic-attribute-section.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx`

### Modify

- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`

### Reuse Only

- `src/app/(main)/dashboard/e-commerce/_lib/publish/platform-meta.ts`
- `src/app/(main)/dashboard/e-commerce/_lib/publish/publish.types.ts`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/common-publish-sections.tsx`
- `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-header.tsx`

## Task 1: Add Douyin dynamic mock data and derivation helpers

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.types.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.mock.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.ts`
- Create: `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts`

- [ ] **Step 1: Write the failing tests for category-driven Douyin state**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  createDouyinDynamicPanelState,
  getDouyinActionState,
  updateDouyinDynamicValue,
} from "./douyin-dynamic";

describe("douyin dynamic panel state", () => {
  it("builds missing fields and blockers for the default coffee category", () => {
    const state = createDouyinDynamicPanelState("coffee-drip");

    expect(state.selectedCategoryId).toBe("coffee-drip");
    expect(state.fields.map((field) => field.fieldId)).toEqual([
      "flavor",
      "packageSpec",
      "brandQualification",
      "mainImageRule",
    ]);
    expect(state.missingFields).toContain("风味");
    expect(state.rules.blockers).toContain("品牌资质待确认");
  });

  it("recomputes missing fields when required attributes are filled", () => {
    const initial = createDouyinDynamicPanelState("coffee-drip");
    const next = updateDouyinDynamicValue(initial, "flavor", "经典拼配");
    const ready = updateDouyinDynamicValue(next, "packageSpec", "10 袋 / 盒");

    expect(ready.values.flavor).toBe("经典拼配");
    expect(ready.values.packageSpec).toBe("10 袋 / 盒");
    expect(ready.missingFields).not.toContain("风味");
    expect(ready.missingFields).not.toContain("包装规格");
  });

  it("maps dynamic state to focus-editor when category or required attributes are incomplete", () => {
    const state = createDouyinDynamicPanelState("tea-concentrate");

    expect(getDouyinActionState(state)).toEqual({
      primary: "focus_editor",
      secondary: null,
      hint: "当前抖店类目或属性仍未补齐，请先完成平台字段配置。",
    });
  });

  it("maps dynamic state to update-channel when fields are complete but blockers remain", () => {
    const initial = createDouyinDynamicPanelState("tea-concentrate");
    const withScene = updateDouyinDynamicValue(initial, "drinkScene", "冷泡");
    const withShelfLife = updateDouyinDynamicValue(withScene, "shelfLife", "12 个月");
    const withOrigin = updateDouyinDynamicValue(withShelfLife, "origin", "福建");

    expect(getDouyinActionState(withOrigin)).toEqual({
      primary: "update_channel",
      secondary: null,
      hint: "当前字段已齐备，但规则区仍有阻塞项，建议先更新渠道配置。",
    });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts'
```

Expected: FAIL because the helper files do not exist yet.

- [ ] **Step 3: Add the Douyin dynamic types**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.types.ts`:

```ts
import type { PublishActionId } from "./publish-action-state";

export interface DouyinCategoryOption {
  id: string;
  label: string;
  path: string;
}

export interface DouyinDynamicFieldOption {
  label: string;
  value: string;
}

export type DouyinDynamicFieldType = "text" | "select";

export interface DouyinDynamicField {
  fieldId: string;
  label: string;
  type: DouyinDynamicFieldType;
  required: boolean;
  group: "sales" | "base";
  placeholder?: string;
  options?: DouyinDynamicFieldOption[];
}

export interface DouyinRuleSummary {
  requiredHighlights: string[];
  brandHint: string;
  qualificationHint: string;
  mediaHint: string;
  blockers: string[];
}

export interface DouyinDynamicPanelState {
  selectedCategoryId: string;
  categoryOptions: DouyinCategoryOption[];
  fields: DouyinDynamicField[];
  values: Record<string, string>;
  rules: DouyinRuleSummary;
  missingFields: string[];
}

export interface DouyinDerivedActionState {
  primary: PublishActionId;
  secondary: PublishActionId | null;
  hint: string;
}
```

- [ ] **Step 4: Add category fixtures and state derivation**

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.mock.ts`:

```ts
import type { DouyinCategoryOption, DouyinDynamicField, DouyinRuleSummary } from "./douyin-dynamic.types";

export const douyinCategoryOptions: DouyinCategoryOption[] = [
  { id: "coffee-drip", label: "挂耳咖啡", path: "咖啡冲饮 > 挂耳咖啡" },
  { id: "tea-concentrate", label: "浓缩茶饮", path: "茶饮冲调 > 浓缩茶饮" },
  { id: "gift-snack", label: "零食礼盒", path: "零食礼盒 > 伴手礼盒" },
];

export const douyinCategoryFields: Record<string, DouyinDynamicField[]> = {
  "coffee-drip": [
    {
      fieldId: "flavor",
      label: "风味",
      type: "select",
      required: true,
      group: "sales",
      options: [
        { label: "经典拼配", value: "经典拼配" },
        { label: "花果拼配", value: "花果拼配" },
      ],
    },
    {
      fieldId: "packageSpec",
      label: "包装规格",
      type: "text",
      required: true,
      group: "sales",
      placeholder: "例如 10 袋 / 盒",
    },
    {
      fieldId: "brandQualification",
      label: "品牌资质摘要",
      type: "text",
      required: false,
      group: "base",
      placeholder: "例如 商标授权已确认",
    },
    {
      fieldId: "mainImageRule",
      label: "主图要求摘要",
      type: "text",
      required: false,
      group: "base",
      placeholder: "例如 主图需 1:1 白底",
    },
  ],
  "tea-concentrate": [
    {
      fieldId: "drinkScene",
      label: "饮用场景",
      type: "select",
      required: true,
      group: "sales",
      options: [
        { label: "冷泡", value: "冷泡" },
        { label: "热饮", value: "热饮" },
      ],
    },
    {
      fieldId: "shelfLife",
      label: "保质期",
      type: "text",
      required: true,
      group: "base",
      placeholder: "例如 12 个月",
    },
    {
      fieldId: "origin",
      label: "产地",
      type: "text",
      required: true,
      group: "base",
      placeholder: "例如 福建",
    },
  ],
  "gift-snack": [
    {
      fieldId: "giftTheme",
      label: "礼盒主题",
      type: "text",
      required: true,
      group: "sales",
      placeholder: "例如 节日伴手礼",
    },
    {
      fieldId: "grossWeight",
      label: "毛重",
      type: "text",
      required: true,
      group: "base",
      placeholder: "例如 1.2kg",
    },
  ],
};

export const douyinCategoryRules: Record<string, Omit<DouyinRuleSummary, "blockers">> = {
  "coffee-drip": {
    requiredHighlights: ["风味", "包装规格"],
    brandHint: "品牌资质待确认",
    qualificationHint: "食品经营资质需补齐",
    mediaHint: "主图需 1:1，详情图不少于 3 张",
  },
  "tea-concentrate": {
    requiredHighlights: ["饮用场景", "保质期", "产地"],
    brandHint: "品牌映射可选，但建议补齐",
    qualificationHint: "饮品类目需补充生产资质摘要",
    mediaHint: "详情图需包含冲泡说明",
  },
  "gift-snack": {
    requiredHighlights: ["礼盒主题", "毛重"],
    brandHint: "礼盒品牌可选",
    qualificationHint: "礼盒组合商品需确认配料摘要",
    mediaHint: "主图需清晰展示礼盒正面",
  },
};
```

Create `src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.ts`:

```ts
import { type PublishActionId } from "./publish-action-state";
import {
  douyinCategoryFields,
  douyinCategoryOptions,
  douyinCategoryRules,
} from "./douyin-dynamic.mock";
import type { DouyinDerivedActionState, DouyinDynamicPanelState } from "./douyin-dynamic.types";

function buildMissingFields(categoryId: string, values: Record<string, string>) {
  const fields = douyinCategoryFields[categoryId] ?? [];

  return fields.filter((field) => field.required && !values[field.fieldId]?.trim()).map((field) => field.label);
}

function buildRuleBlockers(categoryId: string, values: Record<string, string>, missingFields: string[]) {
  const baseRules = douyinCategoryRules[categoryId];
  if (!baseRules) {
    return [];
  }

  const blockers: string[] = [];

  if (missingFields.length > 0) {
    blockers.push(`必填属性未完成：${missingFields.join("、")}`);
  }

  if (categoryId === "coffee-drip" && !values.brandQualification?.trim()) {
    blockers.push("品牌资质待确认");
  }

  if (categoryId === "tea-concentrate" && !values.origin?.trim()) {
    blockers.push("产地信息需明确");
  }

  return blockers;
}

function buildRules(categoryId: string, values: Record<string, string>, missingFields: string[]) {
  const baseRules = douyinCategoryRules[categoryId];
  if (!baseRules) {
    return {
      requiredHighlights: [],
      brandHint: "当前类目暂无额外品牌提醒",
      qualificationHint: "当前类目暂无额外资质提醒",
      mediaHint: "当前类目暂无额外图文提醒",
      blockers: [],
    };
  }

  return {
    ...baseRules,
    blockers: buildRuleBlockers(categoryId, values, missingFields),
  };
}

export function createDouyinDynamicPanelState(categoryId = douyinCategoryOptions[0]!.id): DouyinDynamicPanelState {
  const values: Record<string, string> = {};
  const missingFields = buildMissingFields(categoryId, values);

  return {
    selectedCategoryId: categoryId,
    categoryOptions: douyinCategoryOptions,
    fields: douyinCategoryFields[categoryId] ?? [],
    values,
    rules: buildRules(categoryId, values, missingFields),
    missingFields,
  };
}

export function updateDouyinDynamicValue(
  state: DouyinDynamicPanelState,
  fieldId: string,
  value: string,
): DouyinDynamicPanelState {
  const values = {
    ...state.values,
    [fieldId]: value,
  };
  const missingFields = buildMissingFields(state.selectedCategoryId, values);

  return {
    ...state,
    values,
    rules: buildRules(state.selectedCategoryId, values, missingFields),
    missingFields,
  };
}

export function switchDouyinCategory(categoryId: string): DouyinDynamicPanelState {
  return createDouyinDynamicPanelState(categoryId);
}

export function getDouyinActionState(state: DouyinDynamicPanelState): DouyinDerivedActionState {
  if (!state.selectedCategoryId || state.missingFields.length > 0) {
    return {
      primary: "focus_editor",
      secondary: null,
      hint: "当前抖店类目或属性仍未补齐，请先完成平台字段配置。",
    };
  }

  if (state.rules.blockers.length > 0) {
    return {
      primary: "update_channel",
      secondary: null,
      hint: "当前字段已齐备，但规则区仍有阻塞项，建议先更新渠道配置。",
    };
  }

  return {
    primary: "submit_review",
    secondary: "update_channel",
    hint: "当前抖店字段已齐备，可继续提交审核或先刷新渠道配置。",
  };
}
```

- [ ] **Step 5: Run the tests again**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts'
```

Expected: PASS

- [ ] **Step 6: Commit the helper layer**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.types.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.mock.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.ts' \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts'
git commit -m "feat: add douyin dynamic publish helpers"
```

## Task 2: Build the dynamic Douyin platform panel

**Files:**
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-selector.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-dynamic-attribute-section.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-summary.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.tsx`
- Create: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`

- [ ] **Step 1: Write the failing component test for the Douyin panel**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import { DouyinPlatformPanel } from "./douyin-platform-panel";

describe("DouyinPlatformPanel", () => {
  it("switches category and refreshes fields and rule summary together", () => {
    render(
      <DouyinPlatformPanel
        state={createDouyinDynamicPanelState("coffee-drip")}
        onStateChange={() => undefined}
      />,
    );

    expect(screen.getByText("抖店类目选择")).toBeInTheDocument();
    expect(screen.getByText("风味")).toBeInTheDocument();
    expect(screen.getByText("品牌资质待确认")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "浓缩茶饮" }));

    expect(screen.getByText("饮用场景")).toBeInTheDocument();
    expect(screen.getByText("保质期")).toBeInTheDocument();
    expect(screen.getByText("饮品类目需补充生产资质摘要")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx'
```

Expected: FAIL because the panel and child components do not exist yet.

- [ ] **Step 3: Add the category selector, attribute section, and rule summary components**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-selector.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DouyinCategoryOption } from "../../../../_lib/publish/douyin-dynamic.types";

interface DouyinCategorySelectorProps {
  options: DouyinCategoryOption[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
}

export function DouyinCategorySelector({
  options,
  selectedCategoryId,
  onSelect,
}: DouyinCategorySelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目选择</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={option.id === selectedCategoryId ? "default" : "outline"}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-dynamic-attribute-section.tsx`:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DouyinDynamicField } from "../../../../_lib/publish/douyin-dynamic.types";

interface DouyinDynamicAttributeSectionProps {
  fields: DouyinDynamicField[];
  values: Record<string, string>;
  onValueChange: (fieldId: string, value: string) => void;
}

export function DouyinDynamicAttributeSection({
  fields,
  values,
  onValueChange,
}: DouyinDynamicAttributeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目属性</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {fields.map((field) => (
          <div key={field.fieldId} className="grid gap-2">
            <Label htmlFor={field.fieldId}>
              {field.label}
              {field.required ? <span className="ml-1 text-destructive">*</span> : null}
            </Label>
            {field.type === "select" ? (
              <Select value={values[field.fieldId] ?? ""} onValueChange={(value) => onValueChange(field.fieldId, value)}>
                <SelectTrigger id={field.fieldId}>
                  <SelectValue placeholder={field.placeholder ?? `请选择${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.fieldId}
                value={values[field.fieldId] ?? ""}
                placeholder={field.placeholder}
                onChange={(event) => onValueChange(field.fieldId, event.target.value)}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-summary.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DouyinRuleSummary as DouyinRuleSummaryModel } from "../../../../_lib/publish/douyin-dynamic.types";

export function DouyinRuleSummary({ rules }: { rules: DouyinRuleSummaryModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店规则摘要</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="space-y-1">
          <div className="font-medium text-sm">必填属性</div>
          <div className="flex flex-wrap gap-2">
            {rules.requiredHighlights.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-muted-foreground text-sm">{rules.brandHint}</div>
        <div className="text-muted-foreground text-sm">{rules.qualificationHint}</div>
        <div className="text-muted-foreground text-sm">{rules.mediaHint}</div>
        {rules.blockers.length > 0 ? (
          <div className="space-y-1">
            <div className="font-medium text-sm">当前阻塞项</div>
            <div className="flex flex-wrap gap-2">
              {rules.blockers.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Compose the Douyin platform panel and lift its state into PublishPage**

Create `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  switchDouyinCategory,
  updateDouyinDynamicValue,
} from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import { DouyinCategorySelector } from "./douyin-category-selector";
import { DouyinDynamicAttributeSection } from "./douyin-dynamic-attribute-section";
import { DouyinRuleSummary } from "./douyin-rule-summary";

interface DouyinPlatformPanelProps {
  state: DouyinDynamicPanelState;
  onStateChange: (nextState: DouyinDynamicPanelState) => void;
}

export function DouyinPlatformPanel({ state, onStateChange }: DouyinPlatformPanelProps) {
  return (
    <div className="grid gap-3">
      <DouyinCategorySelector
        options={state.categoryOptions}
        selectedCategoryId={state.selectedCategoryId}
        onSelect={(categoryId) => onStateChange(switchDouyinCategory(categoryId))}
      />
      <DouyinDynamicAttributeSection
        fields={state.fields}
        values={state.values}
        onValueChange={(fieldId, value) => onStateChange(updateDouyinDynamicValue(state, fieldId, value))}
      />
      <DouyinRuleSummary rules={state.rules} />
      <Card>
        <CardHeader>
          <CardTitle>抖店平台状态</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-muted-foreground text-sm">
            当前类目：{state.categoryOptions.find((item) => item.id === state.selectedCategoryId)?.path}
          </div>
          <Badge variant={state.missingFields.length === 0 ? "secondary" : "outline"}>
            {state.missingFields.length === 0 ? "字段齐备" : `${state.missingFields.length} 项待补`}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx`:

```tsx
import { useState } from "react";

import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
```

Then add state:

```tsx
  const [douyinState, setDouyinState] = useState<DouyinDynamicPanelState>(() => createDouyinDynamicPanelState());
```

and pass it into both children:

```tsx
          <PlatformPublishPanel
            publishView={publishView}
            activePlatform={activePlatform}
            onActivePlatformChange={setActivePlatform}
            douyinState={douyinState}
            onDouyinStateChange={setDouyinState}
          />
...
        <PublishValidationSummary
          publishView={publishView}
          activePlatform={activePlatform}
          douyinState={douyinState}
        />
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx`:

```tsx
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import { DouyinPlatformPanel } from "./douyin-platform-panel";
```

and extend props:

```tsx
interface PlatformPublishPanelProps {
  publishView: PublishView;
  activePlatform: ChannelId;
  onActivePlatformChange: (platformId: ChannelId) => void;
  douyinState: DouyinDynamicPanelState;
  onDouyinStateChange: (nextState: DouyinDynamicPanelState) => void;
}
```

Replace the static Douyin block with:

```tsx
                  {platform.platformId === "wechat" ? (
                    <WechatPublishPanel publishView={publishView} />
                  ) : (
                    <DouyinPlatformPanel state={douyinState} onStateChange={onDouyinStateChange} />
                  )}
```

- [ ] **Step 5: Run the Douyin panel test**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx'
```

Expected: PASS

- [ ] **Step 6: Commit the Douyin platform panel**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-category-selector.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-dynamic-attribute-section.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-rule-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/platform-publish-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.tsx'
git commit -m "feat: add douyin dynamic platform panel"
```

## Task 3: Wire Douyin dynamic state into the right-side validation and action area

**Files:**
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`
- Modify: `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx`

- [ ] **Step 1: Write failing tests for Douyin right-rail linkage**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import { ProductCenterStoreProvider } from "../../../../_state/product-center-provider";
import { PublishActionPanel } from "./publish-action-panel";

describe("PublishActionPanel", () => {
  it("uses Douyin local state to show focus-editor when category attributes are still incomplete", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishActionPanel
          productId="spu-hanger-coffee"
          platformId="douyin"
          douyinState={createDouyinDynamicPanelState("coffee-drip")}
        />
      </ProductCenterStoreProvider>,
    );

    expect(screen.getByText("当前抖店类目或属性仍未补齐，请先完成平台字段配置。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续补字段" })).toBeInTheDocument();
  });
});
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx` with a Douyin integration test:

```tsx
  it("recomputes the right rail when Douyin category fields become complete", () => {
    render(
      <ProductCenterStoreProvider>
        <PublishPage publishView={publishView} />
      </ProductCenterStoreProvider>,
    );

    const douyinTab = screen.getByRole("tab", { name: "抖店配置" });
    fireEvent.click(douyinTab);

    expect(screen.getByRole("button", { name: "继续补字段" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "挂耳咖啡" }));
    fireEvent.click(screen.getByRole("combobox", { name: "风味" }));
    fireEvent.click(screen.getByText("经典拼配"));
    fireEvent.change(screen.getByLabelText("包装规格"), { target: { value: "10 袋 / 盒" } });

    expect(screen.getByText("品牌资质待确认")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新渠道" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: FAIL because the right rail does not yet understand Douyin local state.

- [ ] **Step 3: Pass Douyin local state into the right rail and action panel**

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx`:

```tsx
import { getDouyinActionState } from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
```

Extend props:

```tsx
interface PublishValidationSummaryProps {
  publishView: PublishView;
  activePlatform: ChannelId;
  douyinState: DouyinDynamicPanelState;
}
```

Then inside the component, add dynamic missing-fields for Douyin:

```tsx
            const liveMissingFields =
              platform.platformId === "douyin"
                ? douyinState.missingFields
                : currentProduct?.channels[platform.platformId]?.missingFields ?? platform.missingFields;
```

And when rendering `PublishActionPanel`:

```tsx
            <PublishActionPanel
              key={activePlatform}
              productId={publishView.productId}
              platformId={activePlatform}
              douyinState={activePlatform === "douyin" ? douyinState : undefined}
            />
```

Update `src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx`:

```tsx
import { getDouyinActionState } from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
```

Extend props:

```tsx
interface PublishActionPanelProps {
  productId: string;
  platformId: ChannelId;
  douyinState?: DouyinDynamicPanelState;
}
```

Then override Douyin action state:

```tsx
  const liveActionState =
    platformId === "douyin" && douyinState
      ? getDouyinActionState(douyinState)
      : getPublishActionState({
          platformId,
          publicationStatus: channel.publicationStatus,
          auditStatus: channel.auditStatus,
          listingStatus: channel.listingStatus,
          missingFields: channel.missingFields,
        });
```

Also override the badge text for Douyin:

```tsx
  const missingFields = platformId === "douyin" && douyinState ? douyinState.missingFields : channel.missingFields;
```

and use `missingFields.length` everywhere the current badge reads from `channel.missingFields`.

- [ ] **Step 4: Run the right-rail tests again**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
```

Expected: PASS

- [ ] **Step 5: Commit the Douyin right-rail linkage**

```bash
git add \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-validation-summary.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx'
git commit -m "feat: connect douyin dynamic state to publish controls"
```

## Final Verification

- [ ] **Step 1: Run the focused regression suite**

Run:

```bash
node node_modules/vitest/vitest.mjs run \
  'src/app/(main)/dashboard/e-commerce/_lib/publish/douyin-dynamic.test.ts' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/douyin-platform-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-action-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/publish-page.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/_components/wechat-publish-panel.test.tsx' \
  'src/app/(main)/dashboard/e-commerce/products/[productId]/publish/page.test.tsx'
```

Expected: PASS

- [ ] **Step 2: Run the repository check**

Run:

```bash
pnpm check
```

Expected: PASS with only the known `src/lib/cookie.client.ts` warnings.

- [ ] **Step 3: Browser smoke**

Run:

```bash
pnpm dev --port 3001
```

Then verify:

1. `http://localhost:3001/dashboard/e-commerce/products/spu-hanger-coffee/publish`
2. Switch to `抖店配置`
3. Change category from `挂耳咖啡` to `浓缩茶饮`
4. Confirm:
   - Douyin field set changes
   - Douyin rule summary changes
   - right-side `发布控制` changes from `继续补字段` to `更新渠道` after required fields are filled

Expected: no runtime errors; Douyin panel is no longer static; right rail reacts to Douyin local state.

## Self-Review

- Spec coverage: the plan covers mock data, category-driven UI, and right-rail linkage without introducing real Douyin APIs
- Placeholder scan: no TODO/TBD or “similar to above” shortcuts remain
- Type consistency: `DouyinDynamicPanelState` is defined in Task 1 before any Task 2/3 component consumes it; `douyinState` is lifted into `PublishPage` before right-rail consumers depend on it
