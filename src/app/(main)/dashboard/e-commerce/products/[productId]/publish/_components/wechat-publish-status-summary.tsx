import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChannelPublicationView } from "../../../../_lib/product-center.types";

interface WechatPublishStatusSummaryProps {
  channel: ChannelPublicationView<"wechat">;
}

function formatStatusLabel(channel: ChannelPublicationView<"wechat">): string {
  if (channel.missingFields.length === 0) {
    return "齐备";
  }

  return "待补";
}

export function WechatPublishStatusSummary({ channel }: WechatPublishStatusSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>发布状态</CardTitle>
        <CardDescription>复用详情页同一份视频号状态，不另起状态源。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">视频号</div>
            <div className="text-muted-foreground text-xs">当前视频号发布状态摘要</div>
          </div>
          <Badge variant={channel.missingFields.length === 0 ? "secondary" : "outline"}>
            {formatStatusLabel(channel)}
          </Badge>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">发布状态</span>
            <span className="font-medium">{channel.publicationStatus}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">审核状态</span>
            <span className="font-medium">{channel.auditStatus}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">上架状态</span>
            <span className="font-medium">{channel.listingStatus}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">最后同步</span>
            <span className="font-medium">{channel.lastSyncAt}</span>
          </div>
        </div>
        {channel.missingFields.length > 0 ? (
          <div className="text-muted-foreground text-xs">待补字段：{channel.missingFields.join("、")}</div>
        ) : (
          <div className="text-muted-foreground text-xs">当前视频号字段齐备。</div>
        )}
      </CardContent>
    </Card>
  );
}
