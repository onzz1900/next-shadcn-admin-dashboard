import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { SPUDetail } from "../../../_lib/product-center.types";
import { getHeaderActions } from "./publication-actions";

interface DetailHeaderProps {
  product: SPUDetail;
}

export function DetailHeader({ product }: DetailHeaderProps) {
  const actions = getHeaderActions(product);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{product.spuCode}</div>
            <div className="space-y-2">
              <h1 className="font-semibold text-2xl tracking-tight">{product.name}</h1>
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
          {actions.map((action, index) => (
            <Button key={action} variant={index === 0 && actions.length > 1 ? "outline" : "default"}>
              {action}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
