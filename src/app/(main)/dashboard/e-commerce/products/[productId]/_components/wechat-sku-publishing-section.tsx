"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { type Control, Controller, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { SPUDetail } from "../../../_lib/product-center.types";
import type { ChannelFieldDraft, ChannelFieldDraftValue } from "../../../_lib/product-center-editing.types";
import { ChannelAssetPickerDialog } from "./channel-asset-picker-dialog";

interface WechatSkuPublishingSectionProps {
  control: Control<ChannelFieldDraft>;
  product: SPUDetail;
}

function getStringValue(value: ChannelFieldDraftValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  return "";
}

function getArrayValue(value: ChannelFieldDraftValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function getNumberValue(value: ChannelFieldDraftValue | undefined): string {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export function WechatSkuPublishingSection({ control, product }: WechatSkuPublishingSectionProps) {
  const rows = useWatch({
    control,
    name: "sku.rows",
  });

  if (!rows?.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-lg border px-4 py-4">
      <div>
        <div className="font-medium text-sm">SKU 发售信息</div>
        <div className="text-muted-foreground text-xs">
          按视频号发品要求维护每个 SKU 的价格、库存、缩略图与销售属性。
        </div>
      </div>
      <div className="space-y-4">
        {rows.map((row, index) => {
          const sourceSku = product.skus[index];

          return (
            <div
              key={row.rowId ?? row.skuId ?? sourceSku?.id ?? index}
              className="space-y-4 rounded-lg border bg-muted/20 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{row.name ?? sourceSku?.name ?? `SKU ${index + 1}`}</div>
                  <div className="text-muted-foreground text-xs">
                    商家编码：{row.sellerSku ?? sourceSku?.sellerSku ?? "-"} · 当前售价：{sourceSku?.priceLabel ?? "-"}{" "}
                    · 当前库存：
                    {sourceSku?.inventory ?? "-"}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name={`sku.rows.${index}.fields.skuCode`}
                  rules={{
                    validate: (value) => (String(value ?? "").trim() ? true : "SKU 编码不能为空"),
                  }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>SKU 编码</FieldLabel>
                      <Input
                        value={getStringValue(field.value as ChannelFieldDraftValue)}
                        onChange={(event) => field.onChange(event.target.value)}
                        placeholder="输入渠道 SKU 编码"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`sku.rows.${index}.fields.salePrice`}
                  rules={{
                    validate: (value) =>
                      /^\d+$/.test(String(value ?? "").trim()) ? true : "销售价需填写为纯数字字符串",
                  }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>销售价</FieldLabel>
                      <Input
                        value={getStringValue(field.value as ChannelFieldDraftValue)}
                        onChange={(event) => field.onChange(event.target.value)}
                        placeholder="例如 5900"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`sku.rows.${index}.fields.stockNum`}
                  rules={{
                    validate: (value) => {
                      const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
                      return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 0
                        ? true
                        : "库存需填写为非负整数";
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>库存</FieldLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={getNumberValue(field.value as ChannelFieldDraftValue)}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? "" : Number(event.target.value))
                        }
                        placeholder="输入可售库存"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`sku.rows.${index}.fields.thumbImg`}
                  rules={{
                    validate: (value) => (String(value ?? "").trim() ? true : "缩略图不能为空"),
                  }}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>缩略图</FieldLabel>
                      <FieldDescription>只允许从当前商品素材中选取一个可用素材。</FieldDescription>
                      <ChannelAssetPickerDialog
                        assets={product.assets}
                        assetTypes={["cover", "gallery", "detail"]}
                        value={getStringValue(field.value as ChannelFieldDraftValue)}
                        placeholder="选择 SKU 缩略图"
                        onSelect={field.onChange}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name={`sku.rows.${index}.fields.skuAttrs`}
                  rules={{
                    validate: (value) =>
                      getArrayValue(value as ChannelFieldDraftValue).filter((item) => item.trim()).length > 0
                        ? true
                        : "销售属性不能为空",
                  }}
                  render={({ field, fieldState }) => (
                    <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
                      <FieldLabel>销售属性</FieldLabel>
                      <FieldDescription>逐条维护视频号侧的 SKU 属性文案。</FieldDescription>
                      <div className="space-y-3">
                        {getArrayValue(field.value as ChannelFieldDraftValue).length > 0 ? (
                          getArrayValue(field.value as ChannelFieldDraftValue).map((item, attrIndex) => (
                            <div
                              key={`${row.rowId ?? row.skuId ?? index}-${attrIndex}`}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={item}
                                onChange={(event) => {
                                  const nextValue = [...getArrayValue(field.value as ChannelFieldDraftValue)];
                                  nextValue[attrIndex] = event.target.value;
                                  field.onChange(nextValue);
                                }}
                                placeholder="例如 经典拼配 / 500g"
                                aria-invalid={fieldState.invalid}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={() => {
                                  field.onChange(
                                    getArrayValue(field.value as ChannelFieldDraftValue).filter(
                                      (_, currentIndex) => currentIndex !== attrIndex,
                                    ),
                                  );
                                }}
                              >
                                <Trash2Icon />
                                <span className="sr-only">删除</span>
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-md border border-dashed px-3 py-4 text-muted-foreground text-sm">
                            还没有添加销售属性。
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange([...getArrayValue(field.value as ChannelFieldDraftValue), ""])}
                        >
                          <PlusIcon />
                          添加属性
                        </Button>
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </div>
                    </Field>
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
