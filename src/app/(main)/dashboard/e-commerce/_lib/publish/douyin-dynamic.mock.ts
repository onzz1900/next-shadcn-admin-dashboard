import type { DouyinCategoryOption, DouyinDynamicField, DouyinRuleSummary } from "./douyin-dynamic.types";

export interface DouyinDynamicCategoryMock {
  category: DouyinCategoryOption;
  fields: DouyinDynamicField[];
  rules: Omit<DouyinRuleSummary, "blockers"> & {
    blockers: string[];
  };
}

export const douyinDynamicCategoryMocks: DouyinDynamicCategoryMock[] = [
  {
    category: {
      categoryId: "coffee-drip",
      categoryName: "挂耳咖啡",
      categoryPath: "咖啡冲饮 > 挂耳咖啡",
    },
    fields: [
      {
        fieldId: "categoryPath",
        label: "类目路径",
        type: "text",
        required: true,
        value: "咖啡冲饮 > 挂耳咖啡",
      },
      {
        fieldId: "brandName",
        label: "品牌名称",
        type: "text",
        required: true,
        value: "",
        placeholder: "填写抖店品牌名称",
      },
      {
        fieldId: "brandQualification",
        label: "品牌资质",
        type: "text",
        required: false,
        blocksWhenEmpty: true,
        value: "",
        placeholder: "填写或上传品牌资质说明",
      },
      {
        fieldId: "packSpec",
        label: "规格净含量",
        type: "select",
        required: true,
        value: "",
        options: [
          { label: "6g x 10包", value: "6g*10" },
          { label: "8g x 10包", value: "8g*10" },
          { label: "10g x 10包", value: "10g*10" },
        ],
      },
      {
        fieldId: "catNote",
        label: "类目规则摘要",
        type: "text",
        required: false,
        value: "挂耳咖啡需同步品牌资质与净含量。",
      },
    ],
    rules: {
      title: "挂耳咖啡规则",
      summary: "挂耳咖啡类目需要先补齐品牌和规格，再继续抖店发布流程。",
      highlights: ["主图建议保持 1:1", "品牌资质需可追溯", "规格净含量必须明确"],
      blockers: [],
      brandHint: "建议补充品牌信息以便后续审核。",
      qualificationHint: "品牌资质为空时会阻断提交。",
      mediaHint: "主图建议保持 1:1 规范。",
    },
  },
  {
    category: {
      categoryId: "tea-concentrate",
      categoryName: "浓缩茶饮",
      categoryPath: "茶饮冲调 > 浓缩茶饮",
    },
    fields: [
      {
        fieldId: "categoryPath",
        label: "类目路径",
        type: "text",
        required: true,
        value: "茶饮冲调 > 浓缩茶饮",
      },
      {
        fieldId: "brandName",
        label: "品牌名称",
        type: "text",
        required: true,
        value: "山野茶研",
      },
      {
        fieldId: "concentrateType",
        label: "浓缩形态",
        type: "select",
        required: true,
        value: "tea-liquid",
        options: [
          { label: "液体浓缩", value: "tea-liquid" },
          { label: "粉末浓缩", value: "tea-powder" },
        ],
      },
      {
        fieldId: "originNote",
        label: "产地说明",
        type: "text",
        required: false,
        value: "产地与批次信息已同步。",
      },
    ],
    rules: {
      title: "浓缩茶饮规则",
      summary: "浓缩茶饮类目字段齐备后可直接进入审核，不额外预置阻塞项。",
      highlights: ["类目属性已齐备", "支持直接提交流程", "规则区保持最小阻塞"],
      blockers: [],
      brandHint: "品牌字段已满足基础要求。",
      qualificationHint: "当前类目不要求额外品牌资质。",
      mediaHint: "素材要求可沿用通用模板。",
    },
  },
  {
    category: {
      categoryId: "gift-snack",
      categoryName: "零食礼盒",
      categoryPath: "零食礼盒 > 伴手礼盒",
    },
    fields: [
      {
        fieldId: "categoryPath",
        label: "类目路径",
        type: "text",
        required: true,
        value: "零食礼盒 > 伴手礼盒",
      },
      {
        fieldId: "brandName",
        label: "品牌名称",
        type: "text",
        required: true,
        value: "礼遇工坊",
      },
      {
        fieldId: "giftTheme",
        label: "礼盒主题",
        type: "select",
        required: true,
        value: "holiday",
        options: [
          { label: "节日送礼", value: "holiday" },
          { label: "商务伴手礼", value: "business" },
          { label: "组合礼盒", value: "combo" },
        ],
      },
      {
        fieldId: "audienceNote",
        label: "适用场景",
        type: "text",
        required: false,
        value: "适合节日赠礼和企业伴手礼。",
      },
    ],
    rules: {
      title: "零食礼盒规则",
      summary: "零食礼盒类目虽然字段齐备，但仍保留渠道维护建议项。",
      highlights: ["礼盒文案需统一", "图文风格要匹配送礼场景", "建议同步渠道配置"],
      blockers: [],
      brandHint: "礼盒品牌文案建议保持统一。",
      qualificationHint: "建议复核送礼场景下的资质表达。",
      mediaHint: "礼盒主图与场景图可作为建议优化项。",
    },
  },
] as const;

export const douyinDynamicCategoryMap = Object.fromEntries(
  douyinDynamicCategoryMocks.map((item) => [item.category.categoryId, item]),
) as Record<string, DouyinDynamicCategoryMock>;

export const douyinDefaultCategoryId = "coffee-drip";

export function getDouyinDynamicCategoryMock(categoryId?: string) {
  if (!categoryId) {
    return douyinDynamicCategoryMap[douyinDefaultCategoryId];
  }

  return douyinDynamicCategoryMap[categoryId] ?? douyinDynamicCategoryMap[douyinDefaultCategoryId];
}
