import type { AssetItem, ChannelPublicationView, SPUDetail } from "./product-center.types";
import {
  channelFieldEditingConfig,
  channelFieldGroupLabels,
  channelFieldGroupOrder,
} from "./product-center-editing.config";
import type {
  ChannelFieldDefinition,
  ChannelFieldDraft,
  ChannelFieldDraftRow,
  ChannelFieldDraftValue,
  ChannelFieldMutationOptions,
  ChannelFieldMutationResult,
  ChannelFieldValidationResult,
  EditableChannelId,
} from "./product-center-editing.types";

const ARRAY_DELIMITER = "\n";
const fieldDrivenPublicationStatuses = new Set<ChannelPublicationView["publicationStatus"]>([
  "not_started",
  "missing_fields",
  "ready_to_list",
]);

type ConfiguredFieldDefinition = ChannelFieldDefinition;
type ChannelFieldEntry = ChannelPublicationView["channelSpecificFields"][number];

const channelFieldDefinitionIndex = {
  douyin: buildChannelFieldDefinitionIndex("douyin"),
  wechat: buildChannelFieldDefinitionIndex("wechat"),
} as const;

function buildChannelFieldDefinitionIndex(channelId: EditableChannelId) {
  return channelFieldGroupOrder.reduce<Record<string, ConfiguredFieldDefinition>>((index, groupId) => {
    for (const field of channelFieldEditingConfig[channelId].groups[groupId]) {
      index[field.fieldId] = field;
    }

    return index;
  }, {});
}

function isStringArrayValue(value: ChannelFieldDraftValue): value is string[] {
  return Array.isArray(value);
}

function isArrayField(field: ConfiguredFieldDefinition): boolean {
  return field.type === "string-array" || field.type === "asset-array";
}

function normalizeString(value: string): string {
  return value.trim();
}

function normalizeScalarToString(value: Exclude<ChannelFieldDraftValue, string[]>): string {
  return String(value).trim();
}

function normalizeStringArray(value: ChannelFieldDraftValue): string[] {
  if (isStringArrayValue(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(ARRAY_DELIMITER)
    .map((item) => item.trim())
    .filter(Boolean);
}

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

type WechatSkuPublishing = NonNullable<NonNullable<SPUDetail["skus"][number]["channelPublishing"]>["wechat"]>;

function normalizeSalePrice(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeWechatSkuPublishing(sku: SPUDetail["skus"][number]): WechatSkuPublishing {
  const publishing = sku.channelPublishing?.wechat;

  return {
    skuId: publishing?.skuId ?? sku.id,
    skuCode: publishing?.skuCode ?? sku.sellerSku,
    salePrice: normalizeSalePrice(publishing?.salePrice ?? sku.priceLabel),
    stockNum: publishing?.stockNum ?? sku.inventory,
    thumbImg: publishing?.thumbImg ?? "",
    skuAttrs: publishing?.skuAttrs ?? [],
  };
}

function buildWechatSkuRows(product: SPUDetail) {
  return product.skus.map((sku): ChannelFieldDraftRow => {
    const wechat = normalizeWechatSkuPublishing(sku);

    return {
      rowId: sku.id,
      skuId: sku.id,
      sellerSku: sku.sellerSku,
      name: sku.name,
      fields: {
        skuId: wechat.skuId,
        skuCode: wechat.skuCode,
        salePrice: wechat.salePrice,
        stockNum: wechat.stockNum,
        thumbImg: wechat.thumbImg,
        skuAttrs: wechat.skuAttrs,
      },
    };
  });
}

function getConfiguredFields(channelId: EditableChannelId): ConfiguredFieldDefinition[] {
  return channelFieldGroupOrder.flatMap((groupId) => channelFieldEditingConfig[channelId].groups[groupId]);
}

export function getChannelFieldDefinitions(channelId: EditableChannelId) {
  return channelFieldEditingConfig[channelId].groups;
}

function getConfiguredFieldByEntry(
  channelId: EditableChannelId,
  entry: ChannelFieldEntry,
): ConfiguredFieldDefinition | undefined {
  if (entry.fieldId) {
    const fieldDefinition = channelFieldDefinitionIndex[channelId][entry.fieldId];
    if (fieldDefinition) {
      return fieldDefinition;
    }
  }

  return getConfiguredFields(channelId).find((field) => field.label === entry.label);
}

function getChannelFieldValue(
  channel: ChannelPublicationView,
  _channelId: EditableChannelId,
  field: ConfiguredFieldDefinition,
): string {
  const byFieldId = channel.channelSpecificFields.find((item) => item.fieldId === field.fieldId);
  if (byFieldId) {
    return byFieldId.value;
  }

  return channel.channelSpecificFields.find((item) => item.label === field.label)?.value ?? "";
}

function getAssetByReference(assets: AssetItem[], value: string) {
  return assets.find((asset) => asset.id === value || asset.label === value);
}

function getReadyAssetByReference(product: SPUDetail, field: ConfiguredFieldDefinition, value: string) {
  const asset = getAssetByReference(product.assets, value);
  if (!asset || asset.status !== "ready") {
    return undefined;
  }

  if (field.assetTypes?.length && !field.assetTypes.includes(asset.type)) {
    return undefined;
  }

  return asset;
}

function getOptionByReference(field: ConfiguredFieldDefinition, value: string) {
  return field.options?.find((option) => option.value === value || option.label === value);
}

function createEmptyDraftValue(field: ConfiguredFieldDefinition): ChannelFieldDraftValue {
  return isArrayField(field) ? [] : "";
}

function parseBooleanValue(value: string): boolean | string {
  const normalizedValue = value.toLowerCase();
  if (["true", "1", "yes", "y", "on", "是"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "n", "off", "否"].includes(normalizedValue)) {
    return false;
  }

  return value;
}

function parseNumberValue(value: string): number | string {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : value;
}

function parseStoredValue(product: SPUDetail, field: ConfiguredFieldDefinition, value: string): ChannelFieldDraftValue {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return createEmptyDraftValue(field);
  }

  if (field.type === "string-array") {
    return normalizeStringArray(normalizedValue);
  }

  if (field.type === "asset-array") {
    return normalizeStringArray(normalizedValue)
      .map((item) => getReadyAssetByReference(product, field, item)?.id ?? "")
      .filter(Boolean);
  }

  if (field.type === "select") {
    return getOptionByReference(field, normalizedValue)?.value ?? normalizedValue;
  }

  if (field.type === "asset") {
    return getReadyAssetByReference(product, field, normalizedValue)?.id ?? "";
  }

  if (field.type === "number") {
    return parseNumberValue(normalizedValue);
  }

  if (field.type === "boolean") {
    return parseBooleanValue(normalizedValue);
  }

  return normalizedValue;
}

function isDraftValueEmpty(value: ChannelFieldDraftValue): boolean {
  if (isStringArrayValue(value)) {
    return normalizeStringArray(value).length === 0;
  }

  return typeof value === "string" ? normalizeString(value).length === 0 : false;
}

function isDraftValueMissingOrInvalid(
  product: SPUDetail,
  field: ConfiguredFieldDefinition,
  value: ChannelFieldDraftValue,
): boolean {
  if (isDraftValueEmpty(value)) {
    return true;
  }

  const normalizedValue = normalizeScalarToString(value as Exclude<ChannelFieldDraftValue, string[]>);

  if (field.type === "number") {
    return !Number.isFinite(typeof value === "number" ? value : Number(normalizedValue));
  }

  if (field.type === "select") {
    return !getOptionByReference(field, normalizedValue);
  }

  if (field.type === "asset") {
    return !getReadyAssetByReference(product, field, normalizedValue);
  }

  if (field.type === "asset-array") {
    const normalizedValues = normalizeStringArray(value);
    return (
      normalizedValues.length === 0 || normalizedValues.some((item) => !getReadyAssetByReference(product, field, item))
    );
  }

  if (field.type === "boolean") {
    if (typeof value === "boolean") {
      return false;
    }

    if (typeof value !== "string") {
      return true;
    }

    return typeof parseBooleanValue(normalizedValue) !== "boolean";
  }

  return false;
}

function normalizeDraftValue(
  product: SPUDetail,
  field: ConfiguredFieldDefinition,
  value: ChannelFieldDraftValue,
): ChannelFieldDraftValue {
  if (field.type === "asset" && !isStringArrayValue(value)) {
    return getReadyAssetByReference(product, field, normalizeScalarToString(value))?.id ?? "";
  }

  if (field.type === "asset-array") {
    const values = isStringArrayValue(value) ? value : normalizeStringArray(value);
    return values
      .map((item) => getReadyAssetByReference(product, field, String(item).trim())?.id ?? "")
      .filter(Boolean);
  }

  if (field.type === "string-array" || isStringArrayValue(value)) {
    return value;
  }

  return value;
}

function formatStoredValue(
  product: SPUDetail,
  field: ConfiguredFieldDefinition,
  value: ChannelFieldDraftValue,
): string {
  if (field.type === "string-array") {
    return normalizeStringArray(value).join(ARRAY_DELIMITER);
  }

  if (field.type === "asset-array") {
    return normalizeStringArray(value)
      .map((item) => getReadyAssetByReference(product, field, item)?.label ?? item)
      .filter(Boolean)
      .join(ARRAY_DELIMITER);
  }

  if (isStringArrayValue(value)) {
    return normalizeStringArray(value).join(ARRAY_DELIMITER);
  }

  const normalizedValue = normalizeScalarToString(value);
  if (!normalizedValue) {
    return "";
  }

  if (field.type === "select") {
    return getOptionByReference(field, normalizedValue)?.label ?? normalizedValue;
  }

  if (field.type === "asset") {
    return getReadyAssetByReference(product, field, normalizedValue)?.label ?? "";
  }

  if (field.type === "number" || field.type === "boolean") {
    return normalizedValue;
  }

  return normalizedValue;
}

export function buildChannelFieldDraft(product: SPUDetail, channelId: EditableChannelId): ChannelFieldDraft {
  const channel = product.channels[channelId];
  const draft = createEmptyChannelFieldDraft();

  for (const field of getConfiguredFields(channelId)) {
    const groupDraft = draft[field.group] ?? {};
    groupDraft[field.key] = parseStoredValue(product, field, getChannelFieldValue(channel, channelId, field));
    draft[field.group] = groupDraft;
  }

  if (channelId === "wechat") {
    draft.sku.rows = buildWechatSkuRows(product);
  }

  return draft;
}

export function validateChannelFieldDraft(
  product: SPUDetail,
  channelId: EditableChannelId,
  draft: ChannelFieldDraft,
): ChannelFieldValidationResult {
  const missingFields: string[] = [];

  for (const field of getConfiguredFields(channelId)) {
    const value = (draft[field.group]?.[field.key] ?? createEmptyDraftValue(field)) as ChannelFieldDraftValue;
    if (field.required && isDraftValueMissingOrInvalid(product, field, value)) {
      missingFields.push(field.label);
    }
  }

  if (channelId === "wechat") {
    const rows = draft.sku?.rows ?? [];
    const hasValidRows = rows.length === product.skus.length && rows.every((row) => !isWechatSkuRowMissing(row));

    if (!hasValidRows) {
      missingFields.push(channelFieldGroupLabels.sku);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

function resolveChannelFieldState(
  existingField: ChannelFieldEntry | undefined,
  displayValue: string,
  preserveWarningState: boolean,
  isMissing: boolean,
): ChannelFieldEntry["state"] {
  if (isMissing || !normalizeString(displayValue)) {
    return "missing";
  }

  if (preserveWarningState && existingField?.state === "warning") {
    return "warning";
  }

  return "ready";
}

function collectMissingFieldLabels(fields: ChannelPublicationView["channelSpecificFields"]): string[] {
  return fields.filter((field) => field.state === "missing").map((field) => field.label);
}

function normalizeDraftRowFieldString(value: ChannelFieldDraftValue | undefined): string {
  if (value === undefined) {
    return "";
  }

  return normalizeScalarToString(value as Exclude<ChannelFieldDraftValue, string[]>);
}

function normalizeDraftRowFieldArray(value: ChannelFieldDraftValue | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return normalizeStringArray(value);
}

function normalizeDraftRowStockNum(value: ChannelFieldDraftValue | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(normalizeString(value));
    if (Number.isFinite(parsedValue) && Number.isInteger(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
  }

  return undefined;
}

function isWechatSkuRowMissing(row: ChannelFieldDraftRow): boolean {
  const fields = row.fields ?? {};
  const skuId = normalizeDraftRowFieldString(row.skuId ?? fields.skuId);
  const skuCode = normalizeDraftRowFieldString(fields.skuCode ?? row.sellerSku);
  const salePrice = normalizeDraftRowFieldString(fields.salePrice);
  const stockNum = normalizeDraftRowStockNum(fields.stockNum);
  const thumbImg = normalizeDraftRowFieldString(fields.thumbImg);
  const skuAttrs = normalizeDraftRowFieldArray(fields.skuAttrs);

  return !skuId || !skuCode || !/^\d+$/.test(salePrice) || stockNum === undefined || !thumbImg || skuAttrs.length === 0;
}

function getWechatSkuPublishingFromDraftRow(
  draft: ChannelFieldDraft,
  sku: SPUDetail["skus"][number],
  rowIndex: number,
): WechatSkuPublishing {
  const row =
    draft.sku?.rows?.find((item) => item.skuId === sku.id || item.rowId === sku.id) ?? draft.sku?.rows?.[rowIndex];
  const fields = row?.fields ?? {};
  const existing = sku.channelPublishing?.wechat;

  return {
    skuId: normalizeDraftRowFieldString(row?.skuId ?? fields.skuId) || sku.id,
    skuCode: normalizeDraftRowFieldString(fields.skuCode ?? row?.sellerSku ?? existing?.skuCode) || sku.sellerSku,
    salePrice:
      normalizeSalePrice(normalizeDraftRowFieldString(fields.salePrice ?? existing?.salePrice)) ||
      normalizeSalePrice(sku.priceLabel),
    stockNum: normalizeDraftRowStockNum(fields.stockNum) ?? existing?.stockNum ?? sku.inventory,
    thumbImg: normalizeDraftRowFieldString(fields.thumbImg ?? existing?.thumbImg),
    skuAttrs: normalizeDraftRowFieldArray(fields.skuAttrs ?? existing?.skuAttrs ?? []),
  };
}

function getValidWechatSkuPublishingFromDraftRow(
  draft: ChannelFieldDraft,
  sku: SPUDetail["skus"][number],
  rowIndex: number,
): WechatSkuPublishing | undefined {
  const row = draft.sku.rows.find((item) => item.skuId === sku.id || item.rowId === sku.id) ?? draft.sku.rows[rowIndex];

  if (!row || isWechatSkuRowMissing(row)) {
    return undefined;
  }

  return getWechatSkuPublishingFromDraftRow(draft, sku, rowIndex);
}

function buildChannelSpecificFields(
  product: SPUDetail,
  channelId: EditableChannelId,
  channel: ChannelPublicationView,
  draft: ChannelFieldDraft,
): ChannelPublicationView["channelSpecificFields"] {
  const preserveWarningState = !fieldDrivenPublicationStatuses.has(channel.publicationStatus);
  const matchedFieldIds = new Set<string>();
  const configuredFields = getConfiguredFields(channelId);
  const updatedChannelSpecificFields = channel.channelSpecificFields
    .map((item) => {
      const fieldDefinition = getConfiguredFieldByEntry(channelId, item);
      if (!fieldDefinition) {
        return item;
      }

      matchedFieldIds.add(fieldDefinition.fieldId);

      const rawValue = normalizeDraftValue(
        product,
        fieldDefinition,
        (draft[fieldDefinition.group]?.[fieldDefinition.key] ??
          createEmptyDraftValue(fieldDefinition)) as ChannelFieldDraftValue,
      );
      if (!fieldDefinition.required && isDraftValueEmpty(rawValue)) {
        return null;
      }

      const displayValue = formatStoredValue(product, fieldDefinition, rawValue);
      const isMissing = fieldDefinition.required && isDraftValueMissingOrInvalid(product, fieldDefinition, rawValue);

      return {
        ...item,
        fieldId: fieldDefinition.fieldId,
        label: fieldDefinition.label,
        value: displayValue,
        state: resolveChannelFieldState(item, displayValue, preserveWarningState, isMissing),
      };
    })
    .filter((item): item is ChannelFieldEntry => item !== null);

  const appendedFields = configuredFields
    .filter((field) => !matchedFieldIds.has(field.fieldId))
    .flatMap((field) => {
      const rawValue = normalizeDraftValue(
        product,
        field,
        (draft[field.group]?.[field.key] ?? createEmptyDraftValue(field)) as ChannelFieldDraftValue,
      );
      if (!field.required && isDraftValueEmpty(rawValue)) {
        return [];
      }

      const displayValue = formatStoredValue(product, field, rawValue);
      const isMissing = field.required && isDraftValueMissingOrInvalid(product, field, rawValue);

      return [
        {
          fieldId: field.fieldId,
          label: field.label,
          value: displayValue,
          state: resolveChannelFieldState(undefined, displayValue, preserveWarningState, isMissing),
        },
      ];
    });

  return [...updatedChannelSpecificFields, ...appendedFields];
}

function getNextPublicationStatus(channel: ChannelPublicationView, missingFields: string[]) {
  if (!fieldDrivenPublicationStatuses.has(channel.publicationStatus)) {
    return channel.publicationStatus;
  }

  return missingFields.length === 0 ? "ready_to_list" : "missing_fields";
}

export function saveChannelFieldDraft(
  product: SPUDetail,
  channelId: EditableChannelId,
  draft: ChannelFieldDraft,
  options: ChannelFieldMutationOptions = {},
): ChannelFieldMutationResult {
  const lastSyncAt = options.syncAt ?? product.channels[channelId].lastSyncAt;
  const channel = product.channels[channelId];
  const updatedChannelSpecificFields = buildChannelSpecificFields(product, channelId, channel, draft);
  const validation = validateChannelFieldDraft(product, channelId, draft);
  const missingFields = [
    ...new Set([...collectMissingFieldLabels(updatedChannelSpecificFields), ...validation.missingFields]),
  ];
  const publicationStatus = getNextPublicationStatus(channel, missingFields);
  const updatedSkus =
    channelId === "wechat"
      ? product.skus.map((sku, index) => ({
          ...sku,
          channelPublishing: {
            ...sku.channelPublishing,
            wechat: getValidWechatSkuPublishingFromDraftRow(draft, sku, index) ?? sku.channelPublishing?.wechat,
          },
        }))
      : product.skus;
  const updatedChannel: ChannelPublicationView = {
    ...channel,
    publicationStatus,
    missingFields,
    lastSyncAt,
    channelSpecificFields: updatedChannelSpecificFields,
  };

  return {
    product: {
      ...product,
      skus: updatedSkus,
      channels: {
        ...product.channels,
        [channelId]: updatedChannel,
      },
    },
    publicationStatus,
    missingFields,
    lastSyncAt,
  };
}

export const applyChannelFieldDraftMutation = saveChannelFieldDraft;
