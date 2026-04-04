# 抖店 / 视频号统一商品发布架构设计稿

- 日期：2026-04-04
- 主题：Douyin + WeChat Unified Publishing Architecture
- 项目：`next-shadcn-admin-dashboard`
- 目标：以抖店商品发布能力为锚点，重构当前“商品详情页内渠道发布 Tab”模式，形成一套可扩展的“通用商品发布页 + 平台个性化配置区”架构，先支持抖店与视频号，后续可扩到更多平台。

## 1. 背景

当前项目已经具备这些基础：

1. 商品中心首页、商品详情页、发布工作台
2. 详情页内 `抖音 / 视频号` 渠道 Tab
3. 视频号最小可发品结构，已对齐微信小店 `addProduct` 的核心字段心智
4. 共享的 mock/store、状态联动、字段保存、预览与工作台状态同步

但当前结构仍然有明显边界问题：

1. 页面核心仍然是“商品详情页 + 渠道补充字段 Tab”
2. 视频号已经开始走向“发品页”，抖音仍是轻量补充字段，平台深度不一致
3. 类目属性、规则约束、资质要求这类能力还没有独立分层
4. 现有模型更适合“单平台增强”，不适合扩成“统一商品发布架构”

这意味着：如果直接把抖店 `/product/addV2` 相关字段继续塞进当前详情页 Tab，页面和模型都会迅速失控。

## 2. 目标与范围

### 2.1 目标

本阶段目标不是直接接入抖店真实 API，而是先完成统一发布架构设计，明确：

1. 抖店商品发布能力的核心能力域
2. 通用商品模型与平台扩展模型的边界
3. 商品详情页与独立商品发布页的职责拆分
4. 抖店 / 视频号的字段映射与差异管理策略
5. 前端页面、schema、适配器、DTO 的推荐重构方向

### 2.2 范围

本设计覆盖：

1. 抖店接口能力拆解：
   - `/product/addV2`
   - `/product/editV2`
   - `/product/detail`
   - `/product/getCatePropertyV2`
   - `/product/getProductUpdateRule`
2. 视频号现有最小发品结构的整合抽象
3. 通用发布页的信息架构与工程落地建议

### 2.3 非目标

本阶段明确不做：

1. 抖店真实接口接入
2. 视频号真实接口改造
3. 完整后端实现稿
4. 批量发布与发布任务系统设计
5. 多平台权限系统设计

## 3. 设计结论

### 3.1 总体结论

当前页面未来要对齐抖店接口，关键不在“再补几个字段”，而在于先把三层能力拆开：

1. `商品主档能力`
   解决“商品本体是什么”
2. `类目驱动能力`
   解决“当前平台、当前类目下需要补哪些动态字段”
3. `规则驱动能力`
   解决“哪些字段虽然存在，但当前仍不满足平台发布限制”

因此，本阶段最推荐的重构方向是：

1. 保留商品详情页，只负责主档摘要、平台状态摘要、异常摘要和入口
2. 抽出独立商品发布页，作为真正的“发布编辑工作台”
3. 独立发布页采用 `通用商品区 + 平台配置区` 结构
4. 平台差异下沉到 `PlatformExtension + PlatformAdapter + DynamicSchemaBuilder`

### 3.2 架构结论

统一商品发布架构建议固定为：

- `通用层`
  - 商品主档
  - 通用素材
  - 通用 SKU
  - 默认价格 / 库存 / 履约
- `平台扩展层`
  - 平台类目
  - 平台动态属性
  - 平台资质
  - 平台规则
  - 平台专属媒体和发布控制

## 4. 抖店接口能力拆解

以下拆解以 `/product/addV2` 为发布锚点，并参考 `/editV2`、`/detail`、`/getCatePropertyV2`、`/getProductUpdateRule`。

### 4.1 能力域拆解

#### 4.1.1 基础信息

对应商品的静态发布基础层，通常包括：

- 商品标题
- 短标题或渠道标题层
- 商家商品编码 / 外部商品标识
- 商品类型 / 发布类型
- 主体品牌关联

这类字段大多属于“静态基础信息”，适合作为通用层或通用层 + 平台转换器的组合。

#### 4.1.2 类目与属性

这部分是抖店最核心的动态区：

- 类目选择
- 销售属性
- 非销售属性
- 扩展属性
- 类目挂载的可选项与必填项

这部分明显依赖 `/product/getCatePropertyV2`，不适合静态写死在页面 schema 里。应视为“类目驱动动态区”。

#### 4.1.3 品牌与资质

包括：

- 品牌绑定
- 行业资质
- 类目资质
- 特殊经营类目资质

这部分通常不属于商品主档本体，属于平台发布要求，且常和类目联动，因此应归入平台扩展层。

#### 4.1.4 商品图文与媒体

包括：

- 主图
- 详情图
- 视频
- 白底图
- 平台图文限制

“素材资产池”适合留在通用层，但“素材在平台上的要求和映射”属于平台扩展层。

#### 4.1.5 SKU / 规格

包括：

- 规格项
- 规格值
- SKU 编码
- SKU 图片
- SKU 销售价
- SKU 库存

SKU 基础结构适合作为通用层；类目驱动的销售属性和平台 SKU 映射属于平台扩展层。

#### 4.1.6 价格与库存

包括：

- 销售价
- 划线价 / 原价
- 库存
- 库存校验约束

价格和库存的业务语义适合进通用层，但平台要求的格式、范围、最小值、整型约束应交给平台校验器和 transformer。

#### 4.1.7 发货与履约

包括：

- 发货方式
- 运费模板
- 重量 / 体积
- 时效承诺
- 仓配约束

默认履约基线适合通用层，抖店具体履约规则和平台模板映射属于平台扩展层。

#### 4.1.8 平台规则限制

包括：

- 图文数量/尺寸限制
- 属性必填规则
- 类目限制
- 编辑限制
- 发布限制

这部分明显依赖 `/product/getProductUpdateRule`，应作为单独的“规则驱动能力”存在。

#### 4.1.9 审核 / 发布相关控制

包括：

- 草稿保存
- 编辑回填
- 发布前校验
- 提交审核 / 发布
- 编辑时规则差异提示

这部分属于平台状态机与命令层，不属于通用主档字段。

### 4.2 字段分类结论

#### 静态基础信息

适合视为静态或半静态：

- 商品主标题
- 短标题
- 商家商品编码
- 商品简介
- 通用素材池
- 基础 SKU 结构
- 默认价格与库存
- 默认履约基线

#### 类目动态字段

明显依赖类目接口：

- 抖店类目属性
- 销售属性
- 非销售属性
- 类目相关资质要求
- 类目参数组

#### 规则动态字段

明显依赖规则接口：

- 图片数量/尺寸约束
- 字段必填/互斥关系
- 类目变更限制
- 编辑限制
- 发布限制

#### 抖店专属字段

应视为抖店平台扩展：

- 抖店类目 ID / 类目属性树
- 抖店发布规则结果
- 抖店品牌/资质映射
- 抖店平台状态机
- 抖店专属媒体要求

## 5. 通用商品模型设计

推荐领域模型拆为 8 块。

### 5.1 CommonProductBase

职责：描述商品本体。

建议字段：

- `productId`
- `spuCode`
- `name`
- `shortName`
- `description`
- `brandRef`
- `tags`
- `productType`

### 5.2 CommonProductMedia

职责：描述通用素材资产池与语义槽位，而不是平台字段名。

建议字段：

- `primaryImageAssets`
- `detailImageAssets`
- `videoAssets`
- `heroAssetRef`
- `skuAssetRefs`

### 5.3 CommonProductAttribute

职责：承接通用属性与平台类目映射前的属性容器。

建议字段：

- `specDimensions`
- `baseAttributes`
- `categoryAttributeDraft`
- `attributeSource`

### 5.4 CommonProductSku

职责：描述 SKU 本体。

建议字段：

- `skuId`
- `sellerSku`
- `name`
- `specCombination`
- `assetRef`
- `enabled`

### 5.5 CommonProductPricing

职责：描述通用价格语义。

建议字段：

- `salePrice`
- `marketPrice`
- `currency`
- `pricePolicy`

### 5.6 CommonProductInventory

职责：描述通用库存语义。

建议字段：

- `availableStock`
- `safetyStock`
- `inventoryMode`

### 5.7 CommonProductDelivery

职责：描述默认履约基线。

建议字段：

- `deliveryMethod`
- `freightTemplateRef`
- `weight`
- `volume`
- `deliveryCommitment`

### 5.8 PlatformExtension

职责：承载所有平台专属字段。

建议结构：

- `platformExtensions.douyin`
- `platformExtensions.wechat`

其中：

- `douyin` 承载类目、类目属性、规则结果、品牌资质、平台专属媒体和发布控制
- `wechat` 承载 `cats_v2`、品牌、参数摘要、资质摘要、服务承诺、平台映射结果

### 5.9 通用层 / 平台层边界

#### 应进入通用模型的

- 商品本体
- 通用素材池
- SKU 本体
- 默认价格库存
- 默认履约基线

#### 必须放在平台扩展模型的

- 平台类目 ID
- 平台类目属性值
- 平台品牌 / 资质映射
- 平台规则结果
- 平台审核/发布状态
- 平台专属图文要求

#### 避免通用模型污染的原则

1. 不直接用平台接口字段名命名通用字段
2. 类目动态字段不直接写入通用 schema
3. 同名异义字段统一走“通用语义名 + 平台转换器”

## 6. 页面信息架构设计

### 6.1 页面职责拆分

#### 商品详情页

保留：

- 商品主档摘要
- 各平台发布状态摘要
- 异常与缺失摘要
- “进入发布页”入口

不再承担完整发布编辑职责。

#### 独立商品发布页

承担：

- 通用商品编辑
- 平台配置
- 动态属性与规则校验
- 保存草稿 / 校验 / 发布动作

### 6.2 独立发布页信息架构

推荐结构：

#### A. 顶部发布摘要条

包含：

- 商品名称 / SPU 编码
- 当前平台切换器
- 通用层完成度
- 平台状态摘要
- 最近保存时间
- 主动作：保存草稿、校验、发布

#### B. 通用商品区

直接展示：

- 基础信息
- 通用素材
- 通用属性 / 规格
- SKU 基础
- 默认价格库存
- 默认履约

#### C. 平台配置区

按平台切换展示：

- 抖店配置
- 视频号配置

该区只承载平台扩展能力：

- 类目与属性
- 资质与品牌
- 平台图文要求
- 平台规则结果
- 平台专属字段

#### D. 校验与发布区

统一展示：

- 通用校验结果
- 平台校验结果
- 规则限制
- 发布前摘要

### 6.3 模块归属结论

#### 主页面直接展示

- 基础信息
- 通用素材
- SKU 基础
- 默认价格库存履约

#### 按平台切换显示

- 平台类目映射
- 平台动态属性
- 平台资质
- 平台规则约束
- 平台专属媒体要求

#### 按类目动态渲染

- 抖店类目属性区
- 抖店类目资质要求
- 视频号类目参数区
- 视频号资质要求

#### 适合通用表单组件

- 文本
- 数字
- 布尔
- 下拉
- 素材选择
- 数组
- 通用 SKU 行编辑

#### 适合平台插件式渲染

- 类目属性区
- 规则限制区
- 平台资质区
- 平台专属预览区

### 6.4 页面线框建议

推荐线框为：

1. 顶部固定摘要条
2. 左主区：
   - 通用商品区
   - 平台配置区
3. 右侧固定摘要栏：
   - 平台状态
   - 规则命中
   - 缺失字段
   - 发布动作

这套结构比当前“详情页内平台 Tab”更适合承接抖店复杂度。

## 7. 字段映射与差异管理

### 7.1 映射原则

统一走三段式：

`通用字段 -> 平台发布视图模型 -> 平台接口 DTO`

不要让页面直接绑定平台接口字段。

### 7.2 映射分类

#### 直接共用型

语义接近，可统一业务命名：

- 商品标题
- 短标题
- SKU 编码
- 销售价
- 库存
- 主图基础语义
- 详情图基础语义
- 发货方式
- 运费模板
- 重量

#### 统一名称、不同转换型

可统一业务命名，但必须平台转换：

- 主图
- 详情图
- 品牌
- 服务承诺
- 类目参数
- 平台标题层

#### 强制平台专属型

必须只放平台扩展层：

- 抖店类目属性树
- 抖店发布规则结果
- 抖店资质结果
- 视频号 `cats_v2`
- 视频号 `product_qua_infos`
- 视频号 `extra_service`
- 平台审核状态
- 平台发布命令

#### 不建议抽象型

- 特定平台营销字段
- 特定行业资质
- 平台专属媒体限制
- 平台特殊发布控制字段

### 7.3 映射示意

#### 通用 -> 抖店

- `CommonProductBase.name` -> 抖店标题字段
- `CommonProductMedia.primaryImageAssets` -> 抖店主图列表
- `CommonProductSku[*].sellerSku` -> 抖店 SKU 编码
- `CommonProductPricing.salePrice` -> 抖店售价
- `CommonProductInventory.availableStock` -> 抖店库存
- `CommonProductDelivery.freightTemplateRef` -> 抖店运费模板
- `PlatformExtension.douyin.categoryProps` -> 类目属性 DTO
- `PlatformExtension.douyin.ruleResult` -> 规则约束与发布校验

#### 通用 -> 视频号

- `CommonProductBase.name` -> `title`
- `CommonProductBase.shortName` -> `short_title`
- `CommonProductMedia.primaryImageAssets` -> `head_imgs`
- `CommonProductMedia.detailImageAssets` -> `desc_info.imgs`
- `CommonProductSku[*]` -> `skus`
- `CommonProductDelivery` -> `deliver_method / express_info`
- `PlatformExtension.wechat` -> `cats_v2 / brand_id / attrs / product_qua_infos / extra_service`

### 7.4 动态依赖结论

#### 依赖平台类目属性接口动态加载

- 抖店类目属性
- 抖店资质要求
- 视频号类目参数
- 视频号资质要求

#### 依赖平台规则接口动态校验

- 抖店图片数量/尺寸规则
- 抖店属性必填规则
- 抖店编辑限制
- 抖店发布限制
- 视频号规则摘要与可发性校验

## 8. 前后端实现建议

### 8.1 前端 schema 设计

建议采用两层 schema：

- `CommonPublishSchema`
- `PlatformPublishSchema`
  - `DouyinPublishSchema`
  - `WechatPublishSchema`

不要做一个超大 schema 混合所有平台字段。

### 8.2 是否适合 schema-driven form

适合，但应分层：

- 通用字段区：`schema-driven`
- 平台类目属性区：`schema-driven + platform builder`
- 平台复杂区块：`component-driven`

不建议把整页都做成纯 JSON renderer。

### 8.3 组件拆分建议

#### 通用组件

- `TextField`
- `SelectField`
- `NumberField`
- `BooleanField`
- `AssetPickerField`
- `ArrayField`
- `SkuTableEditor`
- `ValidationSummary`

#### 页面级组件

- `PublishPageShell`
- `PublishHeader`
- `CommonBaseSection`
- `CommonMediaSection`
- `CommonSkuSection`
- `CommonDeliverySection`
- `PlatformSwitcher`
- `PublishSideSummary`

#### 平台组件

- `DouyinCategorySection`
- `DouyinRuleSection`
- `DouyinQualificationSection`
- `WechatCategorySection`
- `WechatServiceSection`
- `WechatQualificationSection`

### 8.4 DTO / VO / Command 建议

建议至少拆 4 类：

#### CommonProductDraftDTO

保存通用草稿。

#### PlatformDraftDTO

保存平台扩展草稿：

- `DouyinDraftDTO`
- `WechatDraftDTO`

#### PublishViewVO

页面回显对象。前端应优先消费它，而不是直接消费平台接口 detail。

#### PublishCommand

真正提交发布的命令对象：

- `PublishToDouyinCommand`
- `PublishToWechatCommand`

### 8.5 提交发布时的转换链路

建议固定为：

`页面草稿 -> 领域草稿模型 -> 平台 adapter -> 平台 command DTO`

例如：

- `buildCommonDraft(formState)`
- `buildDouyinExtension(formState)`
- `mapToDouyinAddProductCommand(commonDraft, douyinExtension, categoryContext, ruleContext)`

### 8.6 草稿保存 / 编辑回填 / 详情回显

#### 保存草稿

保存：

- `CommonDraft`
- `PlatformDraft`

仅做基础结构校验。

#### 编辑回填

优先回填自有 `PublishViewVO`，不要直接用平台 detail 做页面状态。

#### 详情回显

统一由 `PublishViewVO` 驱动，平台 detail 通过 adapter 转换。

### 8.7 校验机制建议

建议拆成三层：

1. 基础校验
2. 类目驱动校验
3. 规则驱动校验

不要把校验逻辑分散在字段组件里。

## 9. 代码改造建议

### 9.1 目录结构

建议按“发布域”拆分：

```text
src/app/(main)/dashboard/e-commerce/publish/
  common/
    model/
    schema/
    validators/
    transformers/
    components/
  platforms/
    douyin/
      schema/
      adapters/
      validators/
      components/
      rules/
    wechat/
      schema/
      adapters/
      validators/
      components/
  application/
    save-draft/
    validate/
    publish/
    mapping/
  pages/
    publish-page/
```

### 9.2 组件层

建议固定成四层：

1. `page shell`
2. `common sections`
3. `platform sections`
4. `field renderers`

### 9.3 平台适配器

每个平台至少拆 3 类：

- `detail adapter`
- `draft adapter`
- `publish adapter`

对抖店建议预留：

- `mapDouyinDetailToPublishVO`
- `mapPublishDraftToDouyinAddV2`
- `mapPublishDraftToDouyinEditV2`
- `buildDouyinCategorySchema`
- `buildDouyinRuleConstraints`

### 9.4 schema / validator / transformer

建议严格拆开：

- `schema`
  - 决定页面长什么样
- `validator`
  - 决定哪些不合法
- `transformer`
  - 决定如何变成平台 DTO

不要把三者混在一个 `config.ts` 文件里。

### 9.5 平台扩展原则

建议定义统一平台插件契约：

- `getPlatformMeta()`
- `buildPlatformSchema(context)`
- `validatePlatformDraft(draft, context)`
- `mapToPublishCommand(draft, context)`
- `mapFromPlatformDetail(detail)`

后续加快手、小红书等平台时，以“加平台插件”替代“改主页面”。

## 10. 重构优先级

### 10.1 MVP 版

目标：先把架构拉正。

做什么：

1. 从详情页抽出独立发布页
2. 建立 `通用商品区 + 平台配置区`
3. 保留视频号当前最小可发品能力
4. 为抖店建立字段域与 mock schema 占位
5. 初步建立 `CommonDraft + PlatformDraft`

### 10.2 推荐版

目标：形成统一发布架构。

做什么：

1. 接入抖店类目属性动态区
2. 接入抖店规则校验区
3. 建立：
   - schema builder
   - validator
   - transformer
   - platform adapter
4. 打通保存草稿、回填、发布前校验

### 10.3 理想版

目标：变成可扩展的多平台发布平台。

做什么：

1. 平台插件化
2. 类目驱动 schema 工厂
3. 规则驱动校验引擎
4. 统一发布任务中心
5. 支持更多平台接入

## 11. 风险与坑

### 11.1 抽象过度

为了“通用”把所有平台字段塞进一个大模型，会导致语义虚化和页面不可用。

### 11.2 通用模型污染

如果把 `head_imgs`、`cats_v2`、抖店类目属性等直接拉进通用层，后续每接一个平台都会继续污染。

### 11.3 平台差异硬塞进通用层

类目、资质、规则、发布状态机这类能力应优先判定为平台层。

### 11.4 类目动态属性处理不当

如果将类目属性写死在 schema 中，接真实抖店类目接口时会整体推翻。

### 11.5 校验逻辑分散

若基础校验、类目校验、规则校验散落在字段组件、页面和 adapter 中，后续无法解释“为什么不能发”。

### 11.6 页面复杂度失控

如果把通用层、平台层、规则层、资质层平铺在当前详情页内，页面会很快失控。

## 12. 最终建议

这次最推荐的方向，不是“把抖店字段继续接进当前详情页 Tab”，而是：

1. 保留详情页做商品主档与发布摘要
2. 抽出独立发布页
3. 页面主结构固定为：
   - `通用商品区`
   - `平台配置区`
4. 平台差异通过：
   - `PlatformExtension`
   - `PlatformAdapter`
   - `DynamicSchemaBuilder`
   下沉
5. 抖店以后以“类目属性接口 + 规则接口”驱动扩展区
6. 视频号继续作为第一个完整平台扩展示例

这样既能承接抖店复杂度，也不会让通用商品发布模型被单个平台反向主导。
