import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AssetItem } from "../../../_lib/product-center.types";

interface AssetsCardProps {
  assets: AssetItem[];
}

const assetTypeLabel: Record<AssetItem["type"], string> = {
  cover: "封面",
  gallery: "组图",
  detail: "详情",
};

export function AssetsCard({ assets }: AssetsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>素材状态</CardTitle>
        <CardDescription>检查封面、组图与详情素材是否齐备。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {assets.map((asset) => (
          <div key={asset.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="space-y-1">
              <div className="font-medium text-sm">{asset.label}</div>
              <div className="text-muted-foreground text-xs">{assetTypeLabel[asset.type]}素材</div>
            </div>
            <Badge variant={asset.status === "ready" ? "default" : "destructive"}>
              {asset.status === "ready" ? "已就绪" : "缺失"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
