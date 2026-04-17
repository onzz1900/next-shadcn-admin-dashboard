"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getDouyinActionState,
  switchDouyinCategory,
  updateDouyinDynamicValue,
} from "../../../../_lib/publish/douyin-dynamic";
import { douyinDynamicCategoryMocks, getDouyinDynamicCategoryMock } from "../../../../_lib/publish/douyin-dynamic.mock";
import type {
  DouyinDynamicField,
  DouyinDynamicPanelState,
  DouyinRuleSummary,
} from "../../../../_lib/publish/douyin-dynamic.types";

interface DouyinPlatformPanelProps {
  state: DouyinDynamicPanelState;
  onStateChange: (nextState: DouyinDynamicPanelState) => void;
}

function renderFieldInput(field: DouyinDynamicField, onChange: (value: string) => void) {
  if (field.type === "select") {
    return (
      <select
        id={field.fieldId}
        className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
        value={field.value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{field.placeholder ?? `请选择${field.label}`}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      id={field.fieldId}
      value={field.value}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function DouyinCategorySection({
  state,
  onStateChange,
}: {
  state: DouyinDynamicPanelState;
  onStateChange: (nextState: DouyinDynamicPanelState) => void;
}) {
  const currentCategory = state.category ?? getDouyinDynamicCategoryMock(state.categoryId ?? undefined).category;

  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目选择</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {douyinDynamicCategoryMocks.map((item) => {
            const selected = item.category.categoryId === state.categoryId;

            return (
              <Button
                key={item.category.categoryId}
                type="button"
                variant={selected ? "default" : "outline"}
                onClick={() => onStateChange(switchDouyinCategory(item.category.categoryId))}
              >
                {item.category.categoryName}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2">
          <div className="space-y-1">
            <div className="font-medium text-sm">{currentCategory.categoryName}</div>
            <div className="text-muted-foreground text-xs">{currentCategory.categoryPath}</div>
          </div>
          <Badge variant={state.missingFields.length === 0 ? "secondary" : "outline"}>
            {state.missingFields.length === 0 ? "字段齐备" : `${state.missingFields.length} 项待补`}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DouyinAttributeSection({
  state,
  onStateChange,
}: {
  state: DouyinDynamicPanelState;
  onStateChange: (nextState: DouyinDynamicPanelState) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目属性</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {state.fields.map((field) => (
          <div key={field.fieldId} className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={field.fieldId}>
                {field.label}
                {field.required ? <span className="ml-1 text-destructive">*</span> : null}
              </Label>
              {field.blocksWhenEmpty ? <Badge variant="outline">硬阻塞</Badge> : null}
            </div>
            {renderFieldInput(field, (value) => onStateChange(updateDouyinDynamicValue(state, field.fieldId, value)))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DouyinRuleSection({ rules }: { rules: DouyinRuleSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{rules.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="text-muted-foreground text-sm">{rules.summary}</div>
        <div className="flex flex-wrap gap-2">
          {rules.highlights.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
        <div className="grid gap-2 text-sm">
          <div className="text-muted-foreground">{rules.brandHint}</div>
          <div className="text-muted-foreground">{rules.qualificationHint}</div>
          <div className="text-muted-foreground">{rules.mediaHint}</div>
        </div>
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
          <div className="font-medium text-sm">当前阻塞项</div>
          {rules.blockers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {rules.blockers.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">当前没有硬阻塞项。</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DouyinStatusSection({ state }: { state: DouyinDynamicPanelState }) {
  const actionState = getDouyinActionState(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店平台状态</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">当前类目</div>
            <div className="text-muted-foreground text-xs">{state.category?.categoryPath ?? "未选择类目"}</div>
          </div>
          <Badge variant={state.missingFields.length === 0 ? "secondary" : "outline"}>
            {state.missingFields.length === 0 ? "字段齐备" : `${state.missingFields.length} 项待补`}
          </Badge>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="font-medium text-sm">动作提示</div>
          <div className="mt-1 text-muted-foreground text-sm">{actionState.hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DouyinPlatformPanel({ state, onStateChange }: DouyinPlatformPanelProps) {
  return (
    <div className="grid gap-3">
      <DouyinCategorySection state={state} onStateChange={onStateChange} />
      <DouyinAttributeSection state={state} onStateChange={onStateChange} />
      <DouyinRuleSection rules={state.rules} />
      <DouyinStatusSection state={state} />
    </div>
  );
}
