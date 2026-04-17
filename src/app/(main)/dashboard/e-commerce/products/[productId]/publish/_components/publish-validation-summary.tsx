"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChannelId, ChannelPublicationView } from "../../../../_lib/product-center.types";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import type { PublishView } from "../../../../_lib/publish/publish.types";
import { useProductCenterStore } from "../../../../_state/product-center-provider";
import { DouyinCommandPreview } from "./douyin-command-preview";
import { PublishActionPanel } from "./publish-action-panel";

interface PublishValidationSummaryProps {
  publishView: PublishView;
  activePlatform: ChannelId;
  douyinState: DouyinDynamicPanelState;
}

function getDouyinValidationSnapshot(douyinState: DouyinDynamicPanelState) {
  const missingFields = douyinState.missingFields;
  const blocker = douyinState.rules.blockers[0] ?? missingFields[0] ?? "当前没有显式阻塞项。";
  const label = missingFields.length > 0 ? "待补" : douyinState.rules.blockers.length > 0 ? "阻塞" : "齐备";

  return {
    missingFields,
    blocker,
    label,
  };
}

function isDouyinLocallyBlocked(douyinState: DouyinDynamicPanelState) {
  return douyinState.missingFields.length > 0 || douyinState.rules.blockers.length > 0;
}

export function PublishValidationSummary({ publishView, activePlatform, douyinState }: PublishValidationSummaryProps) {
  const currentProduct = useProductCenterStore((state) => state.getProductById(publishView.productId));

  const platformStatusLabel = (platformId: PublishView["platforms"][number]["platformId"]): string => {
    return platformId === "douyin" ? "抖店" : "视频号";
  };

  const platformHealthLabel = (
    channel: ChannelPublicationView | undefined,
    missingFields: string[],
    douyinLabel?: string,
  ): string => {
    if (douyinLabel) {
      return douyinLabel;
    }

    if (missingFields.length > 0) {
      return "待补";
    }

    if (!channel) {
      return "齐备";
    }

    if (channel.publicationStatus === "sync_error" || channel.publicationStatus === "rejected") {
      return "异常";
    }

    if (channel.publicationStatus === "in_review") {
      return "审核中";
    }

    if (channel.publicationStatus === "ready_to_list") {
      return "待上架";
    }

    if (channel.publicationStatus === "live") {
      return "在售";
    }

    if (channel.publicationStatus === "offline") {
      return "已下架";
    }

    return "齐备";
  };

  const getFirstBlockingItem = (
    channel: ChannelPublicationView | undefined,
    missingFields: string[],
    douyinBlocker?: string,
  ): string => {
    if (douyinBlocker) {
      return douyinBlocker;
    }

    if (missingFields.length > 0) {
      return missingFields[0];
    }

    if (!channel) {
      return publishView.validation.items[0]?.value ?? "当前没有显式阻塞项。";
    }

    if (channel.publicationStatus === "sync_error" || channel.publicationStatus === "rejected") {
      return channel.rejectionReason ?? "当前渠道存在同步异常，请重新同步。";
    }

    if (channel.auditStatus === "not_submitted") {
      return "待提交审核";
    }

    if (channel.auditStatus === "pending") {
      return "审核中";
    }

    if (channel.auditStatus === "approved" && channel.listingStatus !== "listed") {
      return "待上架";
    }

    if (channel.listingStatus === "listed" || channel.publicationStatus === "live") {
      return "已上架";
    }

    if (channel.listingStatus === "delisted" || channel.publicationStatus === "offline") {
      return "待重新上架";
    }

    return "当前平台没有显式阻塞项。";
  };

  const currentPlatform = currentProduct?.channels[activePlatform];
  const douyinSnapshot = activePlatform === "douyin" ? getDouyinValidationSnapshot(douyinState) : undefined;
  const douyinUseLocalState = activePlatform === "douyin" && isDouyinLocallyBlocked(douyinState);
  const currentPlatformMissingFields = douyinUseLocalState
    ? (douyinSnapshot?.missingFields ?? [])
    : (currentPlatform?.missingFields ?? []);
  const currentPlatformHealthLabel = platformHealthLabel(
    currentPlatform,
    currentPlatformMissingFields,
    douyinUseLocalState ? douyinSnapshot?.label : undefined,
  );
  const currentBlockingItem = getFirstBlockingItem(
    currentPlatform,
    currentPlatformMissingFields,
    douyinUseLocalState ? douyinSnapshot?.blocker : undefined,
  );
  const activePlatformView = publishView.platforms.find((platform) => platform.platformId === activePlatform);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{publishView.validation.title}</CardTitle>
        <CardDescription>用于快速查看平台状态摘要与当前发布页壳层中已知的阻塞项。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-3">
          {publishView.platforms.map((platform) => {
            const liveChannel = currentProduct?.channels[platform.platformId];
            const liveDouyinSnapshot =
              platform.platformId === "douyin" ? getDouyinValidationSnapshot(douyinState) : undefined;
            const liveDouyinUseLocalState = platform.platformId === "douyin" && isDouyinLocallyBlocked(douyinState);
            const liveMissingFields = liveDouyinUseLocalState
              ? (liveDouyinSnapshot?.missingFields ?? [])
              : (liveChannel?.missingFields ?? platform.missingFields);
            const liveHealthLabel = platformHealthLabel(
              liveChannel,
              liveMissingFields,
              liveDouyinUseLocalState ? liveDouyinSnapshot?.label : undefined,
            );

            return (
              <div key={platform.platformId} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{platformStatusLabel(platform.platformId)}</div>
                    <div className="text-muted-foreground text-xs">{platform.summary}</div>
                  </div>
                  <Badge variant={liveMissingFields.length > 0 ? "outline" : "secondary"}>{liveHealthLabel}</Badge>
                </div>
                <div className="mt-2 text-muted-foreground text-xs">
                  {liveDouyinUseLocalState && liveDouyinSnapshot?.blocker
                    ? `规则阻塞：${liveDouyinSnapshot.blocker}`
                    : liveMissingFields.length === 0
                      ? "当前平台没有待补字段。"
                      : `待补字段：${liveMissingFields.join("、")}`}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">缺失字段</div>
            <div className="text-muted-foreground text-xs">{`${currentPlatformMissingFields.length} 项`}</div>
          </div>
          <Badge variant="outline">校验</Badge>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">首个阻塞项</div>
            <div className="text-muted-foreground text-xs">{currentBlockingItem}</div>
          </div>
          <Badge
            variant={
              currentPlatformHealthLabel === "齐备" ||
              currentPlatformHealthLabel === "在售" ||
              currentPlatformHealthLabel === "待上架"
                ? "secondary"
                : "outline"
            }
          >
            校验
          </Badge>
        </div>
        {activePlatformView ? (
          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">当前平台：{platformStatusLabel(activePlatform)}</div>
                <div className="text-muted-foreground text-xs">{activePlatformView.summary}</div>
              </div>
              <Badge variant="outline">当前平台</Badge>
            </div>
            {activePlatform === "douyin" && currentProduct ? (
              <DouyinCommandPreview
                publishView={publishView}
                productSnapshot={currentProduct}
                douyinState={douyinState}
                channelState={currentProduct.channels.douyin}
              />
            ) : null}
            <PublishActionPanel
              key={activePlatform}
              productId={publishView.productId}
              platformId={activePlatform}
              douyinState={activePlatform === "douyin" ? douyinState : undefined}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
