export interface DouyinCategoryOption {
  categoryId: string;
  categoryName: string;
  categoryPath: string;
}

export interface DouyinDynamicFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type DouyinDynamicFieldType = "text" | "select";

export interface DouyinDynamicField {
  fieldId: string;
  label: string;
  type: DouyinDynamicFieldType;
  required: boolean;
  blocksWhenEmpty?: boolean;
  value: string;
  placeholder?: string;
  options?: DouyinDynamicFieldOption[];
}

export interface DouyinRuleSummary {
  title: string;
  summary: string;
  highlights: string[];
  blockers: string[];
  brandHint?: string;
  qualificationHint?: string;
  mediaHint?: string;
}

export interface DouyinDynamicPanelState {
  categoryId: string | null;
  category: DouyinCategoryOption | null;
  fields: DouyinDynamicField[];
  rules: DouyinRuleSummary;
  missingFields: string[];
}

export interface DouyinDerivedActionState {
  primary: "focus_editor" | "submit_review" | "update_channel";
  secondary: "update_channel" | null;
  hint: string;
}
