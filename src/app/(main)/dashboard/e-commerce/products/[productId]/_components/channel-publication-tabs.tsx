"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ChannelStatusBadge } from "../../../_components/channel-status-badge";
import type {
  AuditStatus,
  ChannelFieldState,
  ChannelId,
  ChannelPublicationView,
  ListingStatus,
  SPUDetail,
} from "../../../_lib/product-center.types";

interface ChannelPublicationTabsProps {
  product: SPUDetail;
}

const channelLabel: Record<ChannelId, string> = {
  douyin: "抖音",
  wechat: "视频号",
};

const auditStatusLabel: Record<AuditStatus, string> = {
  not_submitted: "未提交",
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
};

const listingStatusLabel: Record<ListingStatus, string> = {
  not_listed: "未上架",
  listed: "已上架",
  delisted: "已下架",
};

function getFieldBadgeVariant(state: ChannelFieldState["state"]) {
  if (state === "missing") {
    return "destructive";
  }

  if (state === "warning") {
    return "secondary";
  }

  return "outline";
}

function getPrimaryAction(channel: ChannelPublicationView) {
  if (channel.publicationStatus === "missing_fields" || channel.publicationStatus === "sync_error") {
    return "更新渠道";
  }

  if (channel.auditStatus === "not_submitted" || channel.auditStatus === "rejected") {
    return "提交审核";
  }

  if (channel.auditStatus === "approved" && channel.listingStatus !== "listed") {
    return "上架";
  }

  if (channel.listingStatus === "listed") {
    return "下架";
  }

  return "更新渠道";
}

function StatusGrid({ channel }: { channel: ChannelPublicationView }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border px-4 py-3">
        <div className="text-muted-foreground mb-2 text-xs">发布状态</div>
        <ChannelStatusBadge status={channel.publicationStatus} />
      </div>
      <div className="rounded-lg border px-4 py-3">
        <div className="text-muted-foreground mb-2 text-xs">审核状态</div>
        <div className="font-medium text-sm">{auditStatusLabel[channel.auditStatus]}</div>
      </div>
      <div className="rounded-lg border px-4 py-3">
        <div className="text-muted-foreground mb-2 text-xs">上下架状态</div>
        <div className="font-medium text-sm">{listingStatusLabel[channel.listingStatus]}</div>
      </div>
    </div>
  );
}

function MissingFieldsSection({ channel }: { channel: ChannelPublicationView }) {
  return (
    <div className="space-y-3 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">缺失字段</div>
          <div className="text-muted-foreground text-xs">优先补齐后再同步到渠道。</div>
        </div>
        <Badge variant={channel.missingFields.length > 0 ? "destructive" : "outline"}>
          {channel.missingFields.length > 0 ? `${channel.missingFields.length} 项待补` : "已齐备"}
        </Badge>
      </div>
      {channel.missingFields.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {channel.missingFields.map((field) => (
            <Badge key={field} variant="destructive">
              {field}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">当前渠道要求字段均已配置。</p>
      )}
    </div>
  );
}

function ChannelFieldsSection({ channel }: { channel: ChannelPublicationView }) {
  return (
    <div className="space-y-3 rounded-lg border px-4 py-4">
      <div>
        <div className="font-medium text-sm">渠道专属字段</div>
        <div className="text-muted-foreground text-xs">按渠道要求检查专属内容状态。</div>
      </div>
      <div className="grid gap-3">
        {channel.channelSpecificFields.map((field) => (
          <div key={field.label} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-3">
            <div className="space-y-1">
              <div className="font-medium text-sm">{field.label}</div>
              <div className="text-muted-foreground text-xs">{field.value}</div>
            </div>
            <Badge variant={getFieldBadgeVariant(field.state)}>
              {field.state === "ready" ? "已配置" : field.state === "warning" ? "待确认" : "缺失"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelPublicationTabs({ product }: ChannelPublicationTabsProps) {
  const channels = Object.values(product.channels);

  return (
    <Card>
      <CardHeader>
        <CardTitle>渠道发布</CardTitle>
        <CardDescription>查看各渠道审核、上架与字段准备状态。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={channels[0]?.channel} className="gap-4">
          <TabsList variant="line">
            {channels.map((channel) => (
              <TabsTrigger key={channel.channel} value={channel.channel} className="gap-2">
                {channelLabel[channel.channel]}
                <ChannelStatusBadge status={channel.publicationStatus} className="ml-1" />
              </TabsTrigger>
            ))}
          </TabsList>
          {channels.map((channel) => (
            <TabsContent key={channel.channel} value={channel.channel} className="space-y-4">
              <StatusGrid channel={channel} />
              <MissingFieldsSection channel={channel} />
              <ChannelFieldsSection channel={channel} />
              {channel.rejectionReason ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4">
                  <div className="font-medium text-destructive text-sm">驳回 / 异常原因</div>
                  <p className="mt-2 text-sm">{channel.rejectionReason}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-4">
                <div className="space-y-1">
                  <div className="font-medium text-sm">{channelLabel[channel.channel]}操作</div>
                  <div className="text-muted-foreground text-xs">最近同步时间：{channel.lastSyncAt}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline">更新渠道</Button>
                  <Button>{getPrimaryAction(channel)}</Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
