"use client";

import { startTransition, useState } from "react";

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
import type {
  ChannelFieldDraft,
  ChannelFieldMutationResult,
  EditableChannelId,
} from "../../../_lib/product-center-editing.types";
import { ChannelFieldEditor } from "./channel-field-editor";
import { getChannelActionSectionId, getChannelEditorSectionId, getChannelStatusSectionId } from "./channel-section-ids";
import { getChannelPrimaryAction } from "./publication-actions";

interface ChannelPublicationTabsProps {
  product: SPUDetail;
  activeChannel: ChannelId;
  onChannelChange: (channelId: ChannelId) => void;
  onSave: (channelId: EditableChannelId, draft: ChannelFieldDraft) => ChannelFieldMutationResult;
  onRetry: (channelId: ChannelId) => void;
  onList: (channelId: ChannelId) => void;
  onDelist: (channelId: ChannelId) => void;
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

function isEditableChannel(channel: ChannelPublicationView): channel is ChannelPublicationView<EditableChannelId> {
  return channel.channel === "douyin" || channel.channel === "wechat";
}

function getFieldBadgeVariant(state: ChannelFieldState["state"]) {
  if (state === "missing") {
    return "destructive";
  }

  if (state === "warning") {
    return "secondary";
  }

  return "outline";
}

function StatusGrid({ channel }: { channel: ChannelPublicationView }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border px-4 py-3">
        <div className="mb-2 text-muted-foreground text-xs">发布状态</div>
        <ChannelStatusBadge status={channel.publicationStatus} />
      </div>
      <div className="rounded-lg border px-4 py-3">
        <div className="mb-2 text-muted-foreground text-xs">审核状态</div>
        <div className="font-medium text-sm">{auditStatusLabel[channel.auditStatus]}</div>
      </div>
      <div className="rounded-lg border px-4 py-3">
        <div className="mb-2 text-muted-foreground text-xs">上下架状态</div>
        <div className="font-medium text-sm">{listingStatusLabel[channel.listingStatus]}</div>
      </div>
    </div>
  );
}

function getChannelFieldHint(channel: ChannelPublicationView) {
  if (channel.channel === "wechat") {
    return "请先补齐最小发品字段，再提交视频号发品/同步。";
  }

  return "优先补齐后再同步到渠道。";
}

function getChannelFieldsDescription(channel: ChannelPublicationView) {
  if (channel.channel === "wechat") {
    return "按视频号 addProduct 的最小发品要求检查字段，补齐后再提交视频号发品/同步。";
  }

  return "按渠道要求检查专属内容状态。";
}

function MissingFieldsSection({ channel }: { channel: ChannelPublicationView }) {
  return (
    <div className="space-y-3 rounded-lg border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">缺失字段</div>
          <div className="text-muted-foreground text-xs">{getChannelFieldHint(channel)}</div>
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
        <div className="text-muted-foreground text-xs">{getChannelFieldsDescription(channel)}</div>
      </div>
      <div className="grid gap-3">
        {channel.channelSpecificFields.map((field) => (
          <div
            key={field.fieldId ?? field.label}
            className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-3"
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">{field.label}</div>
              <div className="whitespace-pre-line text-muted-foreground text-xs">{field.value}</div>
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

function ChannelHandlingBanner({
  channel,
  publishPageHref,
}: {
  channel: ChannelPublicationView;
  publishPageHref: string;
}) {
  if (channel.publicationStatus === "sync_error" || channel.publicationStatus === "rejected") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4">
        <div className="space-y-1">
          <div className="font-medium text-destructive text-sm">当前渠道存在异常，需要重新处理</div>
          <div className="text-sm">{channel.rejectionReason ?? "渠道同步失败，请回到操作区重新提交同步。"}</div>
        </div>
        <Button asChild>
          <a href={`#${getChannelActionSectionId(channel.channel)}`}>重新同步</a>
        </Button>
      </div>
    );
  }

  if (channel.missingFields.length > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-4">
        <div className="space-y-1">
          <div className="font-medium text-sm">当前渠道仍有待补字段</div>
          <div className="text-muted-foreground text-sm">先补齐字段，再继续后续同步或提交流程。</div>
        </div>
        <Button asChild>
          <a href={publishPageHref}>前往发布页处理</a>
        </Button>
      </div>
    );
  }

  return null;
}

export function ChannelPublicationTabs({
  product,
  activeChannel,
  onChannelChange,
  onSave,
  onRetry,
  onList,
  onDelist,
}: ChannelPublicationTabsProps) {
  const channels = Object.values(product.channels);
  const publishPageHref = `/dashboard/e-commerce/products/${product.id}/publish`;
  const [retryingChannelId, setRetryingChannelId] = useState<ChannelId | null>(null);
  const [listingChannelId, setListingChannelId] = useState<ChannelId | null>(null);
  const [delistingChannelId, setDelistingChannelId] = useState<ChannelId | null>(null);

  const handleRetry = (channelId: ChannelId) => {
    setRetryingChannelId(channelId);
    startTransition(() => {
      onRetry(channelId);
      setRetryingChannelId(null);
    });
  };

  const handleList = (channelId: ChannelId) => {
    setListingChannelId(channelId);
    startTransition(() => {
      onList(channelId);
      setListingChannelId(null);
    });
  };

  const handleDelist = (channelId: ChannelId) => {
    setDelistingChannelId(channelId);
    startTransition(() => {
      onDelist(channelId);
      setDelistingChannelId(null);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>渠道发布</CardTitle>
        <CardDescription>
          查看各渠道审核、上架与字段准备状态，深度发品编辑请前往发布页；当前页仅保留过渡期快捷操作。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChannel} onValueChange={(value) => onChannelChange(value as ChannelId)} className="gap-4">
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
              {(() => {
                const primaryAction = getChannelPrimaryAction(channel);
                const isRetryAction =
                  channel.publicationStatus === "sync_error" || channel.publicationStatus === "rejected";
                const isListAction = primaryAction === "上架";
                const isDelistAction = primaryAction === "下架";
                const actionLabel = isRetryAction ? "重新同步" : primaryAction;
                const canHandleCurrentPageAction = isRetryAction || isListAction || isDelistAction;
                const isActionLoading =
                  retryingChannelId === channel.channel ||
                  listingChannelId === channel.channel ||
                  delistingChannelId === channel.channel;

                return (
                  <>
                    <div id={getChannelStatusSectionId(channel.channel)} className="scroll-mt-24 space-y-4">
                      <StatusGrid channel={channel} />
                      <ChannelHandlingBanner channel={channel} publishPageHref={publishPageHref} />
                    </div>
                    <MissingFieldsSection channel={channel} />
                    <ChannelFieldsSection channel={channel} />
                    {isEditableChannel(channel) ? (
                      <div id={getChannelEditorSectionId(channel.channel)} className="scroll-mt-24">
                        <ChannelFieldEditor product={product} channel={channel} onSave={onSave} />
                      </div>
                    ) : null}
                    {channel.rejectionReason ? (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4">
                        <div className="font-medium text-destructive text-sm">驳回 / 异常原因</div>
                        <p className="mt-2 text-sm">{channel.rejectionReason}</p>
                      </div>
                    ) : null}
                    <div
                      id={getChannelActionSectionId(channel.channel)}
                      className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-4"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{channelLabel[channel.channel]}操作</div>
                        <div className="text-muted-foreground text-xs">最近同步时间：{channel.lastSyncAt}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canHandleCurrentPageAction ? (
                          <Button
                            disabled={isActionLoading}
                            onClick={
                              isRetryAction
                                ? () => handleRetry(channel.channel)
                                : isListAction
                                  ? () => handleList(channel.channel)
                                  : isDelistAction
                                    ? () => handleDelist(channel.channel)
                                    : undefined
                            }
                          >
                            {retryingChannelId === channel.channel
                              ? "同步中..."
                              : listingChannelId === channel.channel
                                ? "上架中..."
                                : delistingChannelId === channel.channel
                                  ? "下架中..."
                                  : actionLabel}
                          </Button>
                        ) : null}
                        <Button asChild variant={canHandleCurrentPageAction ? "outline" : "default"}>
                          <a href={publishPageHref}>前往发布页处理</a>
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
