# 视频号 addProduct 页面最小对齐设计稿

- 日期：2026-04-04
- 主题：WeChat Shop addProduct Page Alignment
- 项目：`next-shadcn-admin-dashboard`
- 目标：在保留现有商品中心详情页结构的前提下，把 `视频号` 渠道 Tab 从“补充字段编辑器”升级成“最小可发品表单”，对齐微信小店 `添加商品` 接口的核心发品字段与页面心智。

## 1. 背景

当前商品中心详情页已经具备这些基础能力：

1. 左侧主档信息 + 渠道发布 Tab
2. 右侧素材预览与素材状态
3. 渠道字段可编辑、可保存、可联动
4. 首页、详情页、工作台共享同一份前端 mock/store 状态

但当前 `视频号` Tab 里的字段仍然过于轻量，主要停留在：

- 商品轮播图
- 运费模板
- 卖点亮点
- 服务承诺

这套结构更像“渠道补充字段”，无法完整承载一次真实的微信小店 `addProduct` 发品心智。

根据官方文档 [添加商品](https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_addproduct.html)，视频号发品至少涉及以下核心层：

- 商品基础：`out_product_id`、标题、短标题
- 图文：`head_imgs`、`desc_info`
- 类目与品牌：`cats_v2`、`brand_id`
- 商品参数：`attrs`
- SKU：`skus`
- 履约：`deliver_method`、`express_info`
- 服务：`extra_service`
- 资质：`product_qua_infos`

因此，本阶段不再追求“视频号字段补充”，而是改为“视频号最小可发品页面对齐”。

## 2. 目标与范围

### 2.1 目标

在现有详情页的 `视频号` Tab 内，完成一套最小可发品页面结构，能够表达一次 `addProduct` 所需的最小关键字段集。

### 2.2 范围

本阶段只对齐 `视频号 / 微信小店 addProduct`，不同时升级抖音。

### 2.3 非目标

本阶段明确不做：

- 真实微信小店 API 接入
- 类目驱动的真实动态规则引擎
- 资质真实上传
- 全量接口镜像
- 独立发品页面或发品向导
- 抖音渠道同步升级为同等深度

## 3. 已确认决策

### 3.1 页面承载方式

- 继续复用当前商品详情页结构
- 继续放在现有 `视频号` Tab 内联编辑
- 不单独新建“视频号发品页”

### 3.2 目标层级

- 页面先对齐 `addProduct` 的最小可发品集
- 不追求第一阶段覆盖接口全部字段
- 保持商品中心中台视角，而不是照搬平台后台页面

### 3.3 设计原则

1. 页面结构对齐发品语义，而不是原样摊平接口字段名
2. 优先覆盖最容易决定“能不能发”的字段
3. 类目、履约、SKU、服务、资质的存在要在页面上被看见
4. 右侧素材预览必须和左侧图文区块产生明确语义对应

## 4. 最小可发品字段范围

本阶段先覆盖下面 6 组。

### 4.1 发品基础

对应官方：

- `out_product_id`
- `title`
- `short_title`

页面职责：

- 明确区分主档商品名与视频号发品标题
- 支撑“商家商品编码 + 标题层”输入

### 4.2 类目与品牌

对应官方：

- `cats_v2`
- `brand_id`

页面职责：

- 允许维护视频号类目路径
- 允许维护视频号品牌
- 给后续参数/资质规则留出挂载点

### 4.3 主图与详情

对应官方：

- `head_imgs`
- `desc_info.imgs`
- `desc_info.desc`

页面职责：

- 主图组选择
- 详情图组选择
- 可选详情文案

当前页面里的“商品轮播图”单字段不足以表达这层，需要拆开。

### 4.4 履约与发货

对应官方：

- `deliver_method`
- `express_info.template_id`
- `express_info.weight`

页面职责：

- 明确发货方式
- 维护运费模板
- 维护重量

### 4.5 SKU 发售信息

对应官方：

- `skus[].thumb_img`
- `skus[].sale_price`
- `skus[].stock_num`
- `skus[].sku_code`
- `skus[].sku_attrs`

页面职责：

- 在视频号 Tab 内完成发品态 SKU 编辑
- 不再只依赖全局只读 SKU 表

### 4.6 参数 / 资质 / 服务

对应官方：

- `attrs`
- `product_qua_infos`
- `extra_service.seven_day_return`
- `extra_service.freight_insurance`

页面职责：

- 提供类目参数区占位与缺失提醒
- 提供资质区占位与缺失提醒
- 明确七天无理由 / 运费险配置

## 5. 视频号 Tab 新信息架构

当前通用分组命名：

- 基础信息
- 物流履约
- 内容表达
- 亮点强化

对视频号 `addProduct` 已经不够。视频号 Tab 应重组为下面 6 段。

### 5.1 发品基础

放：

- 商家商品编码
- 商品标题
- 短标题

### 5.2 类目与品牌

放：

- 类目路径
- 品牌
- 类目参数要求摘要

### 5.3 主图与详情

放：

- 主图组
- 详情图组
- 详情文案

### 5.4 履约与发货

放：

- 发货方式
- 运费模板
- 重量

### 5.5 SKU 发售信息

放：

- SKU 编码
- SKU 售价
- SKU 库存
- SKU 图片
- SKU 销售属性摘要

### 5.6 参数 / 资质 / 服务

放：

- 类目参数
- 商品资质
- 七天无理由
- 运费险

## 6. 与当前代码结构的对齐策略

### 6.1 保留的部分

可以继续保留：

1. 商品详情页整体布局
2. 共享 store / 保存联动机制
3. 现有字段编辑器机制
4. 右侧素材预览区域

### 6.2 必须升级的部分

#### A. `wechat` schema

当前文件：

- [/Users/taojialiang/Desktop/projects/pim/next-shadcn-admin-dashboard/src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts](/Users/taojialiang/Desktop/projects/pim/next-shadcn-admin-dashboard/src/app/(main)/dashboard/e-commerce/_lib/product-center-editing.config.ts)

需要把 `wechat` 从轻量字段扩成最小可发品字段集。

#### B. 字段分组标题与说明

当前文件：

- [/Users/taojialiang/Desktop/projects/pim/next-shadcn-admin-dashboard/src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx](/Users/taojialiang/Desktop/projects/pim/next-shadcn-admin-dashboard/src/app/(main)/dashboard/e-commerce/products/[productId]/_components/channel-field-group.tsx)

需要支持视频号更贴近发品语义的分组标题和描述，而不再只是通用命名。

#### C. SKU 发品编辑区

当前缺口最大。

建议新增独立的 `视频号 SKU 发品编辑区` 组件，承载：

- `sku_code`
- `sale_price`
- `stock_num`
- `thumb_img`
- `sku_attrs`

#### D. 图文区与右侧素材预览

左侧必须把：

- `head_imgs`
- `desc_info.imgs`

明确拆开，否则右侧 preview 只能继续停留在“素材区”，无法真正服务发品页面。

#### E. 参数 / 资质区

第一阶段只做：

- 结构占位
- 缺失状态
- 必填提醒

不做真实类目规则拉取和真实资质上传。

## 7. 页面表现原则

### 7.1 不照搬接口名字

页面上不应该直接把接口字段名原样平铺成开发者视图。

用户看到的应该是：

- 发品基础
- 类目与品牌
- 主图与详情
- 履约与发货
- SKU 发售信息
- 参数 / 资质 / 服务

### 7.2 保留中台视角

虽然字段来源是 `addProduct`，但页面仍然属于商品中心。

所以：

- 主档仍然是入口
- 视频号 Tab 是渠道发品层
- 右侧素材预览继续是辅助决策区

### 7.3 最小可发品优先

先解决：

- 页面能不能完整表达一次新增商品
- 用户能不能看清缺什么
- mock/store 能不能承载这些字段

而不是第一版就追求真实接口 100% 覆盖。

## 8. 第一阶段完成标准

完成后应满足：

1. 视频号 Tab 的字段结构已经能映射到 `addProduct` 的最小发品结构
2. 页面上能完整表达一次微信小店新增商品最少需要填什么
3. 当前 mock/store 已经足以承载这些字段
4. 左侧图文区和右侧素材预览的语义已经打通
5. 后续可自然拆成：
   - 商品基础 payload
   - 类目 / 品牌 / 参数 payload
   - 图文 payload
   - 履约 payload
   - SKU payload
   - 服务 / 资质 payload

## 9. 结论

视频号 `addProduct` 的页面对齐，不应该理解成“把 API 字段原样堆到表单上”。

正确做法是：

- 保留当前商品中心详情页结构
- 把视频号 Tab 升级成一个最小可发品表单
- 先对齐发品语义，再对齐真实接口 payload

第一刀应该落在：

1. `wechat` 字段 schema
2. 视频号 Tab 分组重构
3. SKU 发品编辑区
4. 主图 / 详情图区拆分

而不是优先去接真实 API。
