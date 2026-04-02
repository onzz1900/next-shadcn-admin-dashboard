import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { SPUDetail } from "../../../_lib/product-center.types";

interface BasicInfoCardProps {
  product: SPUDetail;
}

const basicInfoItems: Array<{
  key: keyof Pick<SPUDetail, "category" | "brand" | "shop" | "updatedAt">;
  label: string;
}> = [
  { key: "category", label: "类目" },
  { key: "brand", label: "品牌" },
  { key: "shop", label: "店铺" },
  { key: "updatedAt", label: "最后更新" },
];

export function BasicInfoCard({ product }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基础信息</CardTitle>
        <CardDescription>商品主数据与当前主站信息。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {basicInfoItems.map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="text-muted-foreground text-xs">{item.label}</div>
              <div className="font-medium text-sm">{product[item.key]}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs">商品描述</div>
          <p className="leading-6 text-sm">{product.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
