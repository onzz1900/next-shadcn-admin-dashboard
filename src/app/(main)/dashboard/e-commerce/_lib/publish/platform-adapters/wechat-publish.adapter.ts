export interface PublishExtensionSection {
  id: string;
  title: string;
  description: string;
}

export const wechatExtensionSections: PublishExtensionSection[] = [
  { id: "basic", title: "发品基础", description: "对齐 title、short_title、外部商品编码。" },
  { id: "category", title: "类目与品牌", description: "对齐 cats_v2、brand_id 与参数摘要。" },
  { id: "media", title: "主图与详情", description: "对齐 head_imgs、desc_info.imgs、desc_info.desc。" },
  { id: "fulfillment", title: "履约与发货", description: "维护发货方式、运费模板、重量。" },
  { id: "sku", title: "SKU 发售信息", description: "维护 SKU 价格、库存、缩略图与销售属性。" },
  { id: "compliance", title: "参数 / 资质 / 服务", description: "维护参数摘要、资质摘要与服务承诺。" },
];
