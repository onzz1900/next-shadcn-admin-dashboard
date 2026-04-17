"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { type Control, Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { SPUDetail } from "../../../_lib/product-center.types";
import { channelFieldGroupLabels } from "../../../_lib/product-center-editing.config";
import type {
  ChannelFieldDefinition,
  ChannelFieldDraft,
  ChannelFieldDraftValue,
  ChannelFieldGroupId,
} from "../../../_lib/product-center-editing.types";
import { ChannelAssetPickerDialog } from "./channel-asset-picker-dialog";

interface ChannelFieldGroupProps {
  groupId: ChannelFieldGroupId;
  fields: readonly ChannelFieldDefinition[];
  control: Control<ChannelFieldDraft>;
  product: SPUDetail;
}

function isEmptyValue(value: ChannelFieldDraftValue) {
  if (Array.isArray(value)) {
    return value.filter((item) => String(item).trim()).length === 0;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (typeof value === "number") {
    return !Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return false;
  }

  return true;
}

function getArrayValue(value: ChannelFieldDraftValue): string[] {
  return Array.isArray(value) ? value : [];
}

function getStringValue(value: ChannelFieldDraftValue): string {
  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "";
}

function getNumberValue(value: ChannelFieldDraftValue): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function getBooleanValue(value: ChannelFieldDraftValue): "true" | "false" | "" {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === "true" || value === "false") {
    return value;
  }

  return "";
}

export function ChannelFieldGroup({ groupId, fields, control, product }: ChannelFieldGroupProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-lg border px-4 py-4">
      <div>
        <div className="font-medium text-sm">{channelFieldGroupLabels[groupId]}</div>
        <div className="text-muted-foreground text-xs">按当前渠道要求维护这组字段。</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((fieldDefinition) => (
          <Controller
            key={fieldDefinition.fieldId}
            control={control}
            name={`${fieldDefinition.group}.${fieldDefinition.key}` as never}
            rules={{
              validate: (value) =>
                fieldDefinition.required && isEmptyValue((value as ChannelFieldDraftValue) ?? "")
                  ? `${fieldDefinition.label}不能为空`
                  : true,
            }}
            render={({ field, fieldState }) => {
              const invalid = fieldState.invalid;

              return (
                <Field
                  className={
                    fieldDefinition.type === "textarea" || fieldDefinition.type === "string-array"
                      ? "md:col-span-2"
                      : ""
                  }
                  data-invalid={invalid}
                >
                  <FieldLabel>{fieldDefinition.label}</FieldLabel>
                  {fieldDefinition.description ? (
                    <FieldDescription>{fieldDefinition.description}</FieldDescription>
                  ) : null}
                  {fieldDefinition.type === "text" ? (
                    <Input
                      value={getStringValue((field.value as ChannelFieldDraftValue) ?? "")}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder={fieldDefinition.placeholder}
                      aria-invalid={invalid}
                    />
                  ) : null}
                  {fieldDefinition.type === "textarea" ? (
                    <Textarea
                      rows={4}
                      value={getStringValue((field.value as ChannelFieldDraftValue) ?? "")}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder={fieldDefinition.placeholder}
                      aria-invalid={invalid}
                    />
                  ) : null}
                  {fieldDefinition.type === "select" ? (
                    <div className="space-y-2">
                      <Select
                        value={getStringValue((field.value as ChannelFieldDraftValue) ?? "")}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full" aria-invalid={invalid}>
                          <SelectValue placeholder={fieldDefinition.placeholder ?? "请选择"} />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldDefinition.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!fieldDefinition.required ? (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange("")}
                            disabled={getStringValue((field.value as ChannelFieldDraftValue) ?? "") === ""}
                          >
                            清空选择
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {fieldDefinition.type === "asset" ? (
                    <ChannelAssetPickerDialog
                      assets={product.assets}
                      assetTypes={fieldDefinition.assetTypes}
                      value={getStringValue((field.value as ChannelFieldDraftValue) ?? "")}
                      placeholder={fieldDefinition.placeholder ?? "选择当前商品素材"}
                      onSelect={field.onChange}
                    />
                  ) : null}
                  {fieldDefinition.type === "asset-array" ? (
                    <ChannelAssetPickerDialog
                      assets={product.assets}
                      assetTypes={fieldDefinition.assetTypes}
                      selectionMode="multiple"
                      value={getArrayValue((field.value as ChannelFieldDraftValue) ?? [])}
                      placeholder={fieldDefinition.placeholder ?? "选择当前商品素材"}
                      onSelect={field.onChange}
                    />
                  ) : null}
                  {fieldDefinition.type === "number" ? (
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={getNumberValue((field.value as ChannelFieldDraftValue) ?? "")}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.onChange(nextValue === "" ? "" : Number(nextValue));
                      }}
                      placeholder={fieldDefinition.placeholder}
                      aria-invalid={invalid}
                    />
                  ) : null}
                  {fieldDefinition.type === "boolean" ? (
                    <div className="space-y-2">
                      <Select
                        value={getBooleanValue((field.value as ChannelFieldDraftValue) ?? "")}
                        onValueChange={(nextValue) => field.onChange(nextValue === "true")}
                      >
                        <SelectTrigger className="w-full" aria-invalid={invalid}>
                          <SelectValue placeholder="请选择是否开启" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">开启</SelectItem>
                          <SelectItem value="false">关闭</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange("")}
                          disabled={getBooleanValue((field.value as ChannelFieldDraftValue) ?? "") === ""}
                        >
                          清空选择
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {fieldDefinition.type === "string-array" ? (
                    <div className="space-y-3">
                      {getArrayValue((field.value as ChannelFieldDraftValue) ?? []).length > 0 ? (
                        getArrayValue((field.value as ChannelFieldDraftValue) ?? []).map((item, index) => (
                          <div key={`${fieldDefinition.fieldId}-${index}`} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(event) => {
                                const nextValue = [...getArrayValue((field.value as ChannelFieldDraftValue) ?? [])];
                                nextValue[index] = event.target.value;
                                field.onChange(nextValue);
                              }}
                              placeholder={fieldDefinition.placeholder}
                              aria-invalid={invalid}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => {
                                const nextValue = getArrayValue((field.value as ChannelFieldDraftValue) ?? []).filter(
                                  (_, currentIndex) => currentIndex !== index,
                                );
                                field.onChange(nextValue);
                              }}
                            >
                              <Trash2Icon />
                              <span className="sr-only">删除</span>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-dashed px-3 py-4 text-muted-foreground text-sm">
                          还没有添加条目。
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          field.onChange([...getArrayValue((field.value as ChannelFieldDraftValue) ?? []), ""])
                        }
                      >
                        <PlusIcon />
                        添加条目
                      </Button>
                    </div>
                  ) : null}
                  {invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              );
            }}
          />
        ))}
      </div>
    </section>
  );
}
