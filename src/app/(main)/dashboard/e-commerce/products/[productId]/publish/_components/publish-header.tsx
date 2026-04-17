import { Badge } from "@/components/ui/badge";

import type { PublishView } from "../../../../_lib/publish/publish.types";

interface PublishHeaderProps {
  publishView: PublishView;
}

export function PublishHeader({ publishView }: PublishHeaderProps) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="text-muted-foreground text-xs uppercase tracking-[0.18em]">商品发布</div>
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">{publishView.productName}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{publishView.spuCode}</Badge>
              <Badge variant="secondary">发布入口</Badge>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground text-sm">先查看平台状态摘要，再进入平台发布配置。</div>
      </div>
    </section>
  );
}
