"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type FieldErrors, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";

import type { ChannelPublicationView, SPUDetail } from "../../../_lib/product-center.types";
import { buildChannelFieldDraft, getChannelFieldDefinitions } from "../../../_lib/product-center-editing";
import { channelFieldGroupOrder } from "../../../_lib/product-center-editing.config";
import type {
  ChannelFieldDraft,
  ChannelFieldMutationResult,
  EditableChannelId,
} from "../../../_lib/product-center-editing.types";
import { ChannelFieldGroup } from "./channel-field-group";
import { ChannelSaveFeedback } from "./channel-save-feedback";
import { WechatSkuPublishingSection } from "./wechat-sku-publishing-section";

interface ChannelFieldEditorProps {
  product: SPUDetail;
  channel: ChannelPublicationView<EditableChannelId>;
  onSave: (channelId: EditableChannelId, draft: ChannelFieldDraft) => ChannelFieldMutationResult;
}

export function countChannelFieldErrors(value: FieldErrors<ChannelFieldDraft> | unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countChannelFieldErrors(item), 0);
  }

  const entries = Object.entries(value);
  const nestedErrorCount = entries.reduce((total, [key, item]) => {
    if (key === "message" || key === "type" || key === "ref") {
      return total;
    }

    return total + countChannelFieldErrors(item);
  }, 0);

  if (nestedErrorCount > 0) {
    return nestedErrorCount;
  }

  return "message" in value || "type" in value ? 1 : 0;
}

export function ChannelFieldEditor({ product, channel, onSave }: ChannelFieldEditorProps) {
  const [didSave, setDidSave] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(channel.lastSyncAt);
  const lastFormScopeRef = useRef(`${product.id}:${channel.channel}`);
  const defaultValues = useMemo(() => buildChannelFieldDraft(product, channel.channel), [channel.channel, product]);
  const form = useForm<ChannelFieldDraft>({
    defaultValues,
    mode: "onSubmit",
  });
  const fieldGroups = useMemo(() => getChannelFieldDefinitions(channel.channel), [channel.channel]);

  useEffect(() => {
    const currentScope = `${product.id}:${channel.channel}`;
    const scopeChanged = lastFormScopeRef.current !== currentScope;

    if (scopeChanged || !form.formState.isDirty) {
      form.reset(defaultValues);
      lastFormScopeRef.current = currentScope;
    }
  }, [channel.channel, defaultValues, form, form.formState.isDirty, product.id]);

  useEffect(() => {
    setLastSavedAt(channel.lastSyncAt);
  }, [channel.lastSyncAt]);

  const onSubmit = form.handleSubmit((values) => {
    const result = onSave(channel.channel, values);
    setDidSave(true);
    setLastSavedAt(result.lastSyncAt);
    form.reset(buildChannelFieldDraft(result.product, channel.channel));
  });

  const validationErrorCount = countChannelFieldErrors(form.formState.errors);
  const hasValidationErrors = form.formState.submitCount > 0 && validationErrorCount > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="font-medium text-sm">字段编辑器</div>
          <div className="text-muted-foreground text-xs">编辑后需显式保存，详情页状态会基于共享 store 立即刷新。</div>
        </div>
        <Button type="submit">保存字段</Button>
      </div>
      <ChannelSaveFeedback
        hasUnsavedChanges={form.formState.isDirty}
        hasValidationErrors={hasValidationErrors}
        validationErrorCount={validationErrorCount}
        didSave={didSave}
        lastSavedAt={lastSavedAt}
      />
      {channelFieldGroupOrder.map((groupId) =>
        groupId === "sku" && channel.channel === "wechat" ? (
          <WechatSkuPublishingSection key={`${channel.channel}-sku`} control={form.control} product={product} />
        ) : (
          <ChannelFieldGroup
            key={groupId}
            groupId={groupId}
            fields={fieldGroups[groupId]}
            control={form.control}
            product={product}
          />
        ),
      )}
    </form>
  );
}
