import { douyinDefaultCategoryId, getDouyinDynamicCategoryMock } from "./douyin-dynamic.mock";
import type { DouyinDerivedActionState, DouyinDynamicField, DouyinDynamicPanelState } from "./douyin-dynamic.types";

function cloneFields(fields: DouyinDynamicField[]) {
  return fields.map((field) => ({ ...field, options: field.options?.map((option) => ({ ...option })) }));
}

function buildMissingFields(fields: DouyinDynamicField[]) {
  return fields.filter((field) => field.required && field.value.trim().length === 0).map((field) => field.label);
}

function buildRuleBlockers(fields: DouyinDynamicField[], baseBlockers: string[] = []) {
  const fieldBlockers = fields
    .filter((field) => field.blocksWhenEmpty && field.value.trim().length === 0)
    .map((field) => field.label);

  return Array.from(new Set([...baseBlockers, ...fieldBlockers]));
}

export function createDouyinDynamicPanelState(categoryId?: string): DouyinDynamicPanelState {
  const categoryMock = getDouyinDynamicCategoryMock(categoryId ?? douyinDefaultCategoryId);
  const fields = cloneFields(categoryMock.fields);
  const missingFields = buildMissingFields(fields);

  return {
    categoryId: categoryMock.category.categoryId,
    category: categoryMock.category,
    fields,
    rules: {
      title: categoryMock.rules.title,
      summary: categoryMock.rules.summary,
      highlights: [...categoryMock.rules.highlights],
      blockers: buildRuleBlockers(fields, categoryMock.rules.blockers),
      brandHint: categoryMock.rules.brandHint,
      qualificationHint: categoryMock.rules.qualificationHint,
      mediaHint: categoryMock.rules.mediaHint,
    },
    missingFields,
  };
}

export function updateDouyinDynamicValue(
  state: DouyinDynamicPanelState,
  fieldId: string,
  value: string,
): DouyinDynamicPanelState {
  const fields = state.fields.map((field) =>
    field.fieldId === fieldId
      ? {
          ...field,
          value,
        }
      : { ...field, options: field.options?.map((option) => ({ ...option })) },
  );
  const missingFields = buildMissingFields(fields);
  const ruleMock = getDouyinDynamicCategoryMock(state.categoryId ?? undefined);

  return {
    ...state,
    fields,
    missingFields,
    rules: {
      title: ruleMock.rules.title,
      summary: ruleMock.rules.summary,
      highlights: [...ruleMock.rules.highlights],
      blockers: buildRuleBlockers(fields, ruleMock.rules.blockers),
      brandHint: ruleMock.rules.brandHint,
      qualificationHint: ruleMock.rules.qualificationHint,
      mediaHint: ruleMock.rules.mediaHint,
    },
  };
}

export function switchDouyinCategory(categoryId: string): DouyinDynamicPanelState {
  return createDouyinDynamicPanelState(categoryId);
}

export function getDouyinActionState(state: DouyinDynamicPanelState): DouyinDerivedActionState {
  if (!state.categoryId || state.missingFields.length > 0) {
    return {
      primary: "focus_editor",
      secondary: null,
      hint: "当前抖店类目或属性仍未补齐，请先完成平台字段配置。",
    };
  }

  if (state.rules.blockers.length > 0) {
    return {
      primary: "focus_editor",
      secondary: null,
      hint: "当前字段已齐备，但仍存在硬阻塞项，请先在编辑器中补齐后再继续。",
    };
  }

  return {
    primary: "submit_review",
    secondary: "update_channel",
    hint: "当前抖店字段已齐备，可继续提交审核或先刷新渠道配置。",
  };
}
