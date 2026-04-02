import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ProductCenterMetrics } from "../../_lib/product-center.types";

interface ProductCenterOverviewCardsProps {
  metrics: ProductCenterMetrics;
}

const metricCards = [
  {
    key: "totalProducts",
    title: "商品总数",
    description: "当前中心内的 SPU 数量",
  },
  {
    key: "missingContent",
    title: "待补内容",
    description: "内容完成度未达 100%",
  },
  {
    key: "readyToPublish",
    title: "可发布",
    description: "至少一个渠道可直接上架",
  },
  {
    key: "inReview",
    title: "审核中",
    description: "有渠道处于待审核状态",
  },
  {
    key: "syncErrors",
    title: "同步异常",
    description: "有渠道发生同步失败",
  },
] as const;

export function ProductCenterOverviewCards({ metrics }: ProductCenterOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      {metricCards.map((metric) => (
        <Card key={metric.key}>
          <CardHeader className="space-y-1">
            <CardDescription>{metric.title}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{metrics[metric.key as keyof ProductCenterMetrics]}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-muted-foreground text-sm">{metric.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
