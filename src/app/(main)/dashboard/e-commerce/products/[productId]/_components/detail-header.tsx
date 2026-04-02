import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { SPUDetail } from "../../../_lib/product-center.types";

interface DetailHeaderProps {
  product: SPUDetail;
}

export function DetailHeader({ product }: DetailHeaderProps) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{product.spuCode}</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-sm">资料完整度</span>
              <span className="font-medium text-sm tabular-nums">{product.completionPercent}%</span>
            </div>
            <Progress value={product.completionPercent} className="h-2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button variant="outline">更新渠道</Button>
          <Button>提交审核</Button>
        </div>
      </div>
    </section>
  );
}
