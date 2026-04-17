import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ProductCenterMetrics } from "../../_lib/product-center.types";

interface ProductCenterOverviewCardsProps {
  metrics: ProductCenterMetrics;
}

const metricCards = [
  {
    key: "totalProducts",
    title: "商品总数",
    description: "当前商品中心内的 SPU 商品数",
  },
  {
    key: "missingContent",
    title: "主档待补",
    description: "主档内容完成度未达 100% 的商品",
  },
  {
    key: "readyToPublish",
    title: "待上架商品",
    description: "至少一个渠道已齐备并可直接上架的商品",
  },
  {
    key: "inReview",
    description: "至少一个渠道处于待审核状态的商品",
  },
  {
    key: "syncErrors",
    title: "异常商品",
    description: "至少一个渠道发生同步失败的商品",
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
