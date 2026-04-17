"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChannelId } from "../../../../_lib/product-center.types";
import { getDouyinActionState } from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import {
  getPublishActionState,
  type PublishActionId,
  type PublishActionState,
} from "../../../../_lib/publish/publish-action-state";
import { useProductCenterStore } from "../../../../_state/product-center-provider";

interface PublishActionPanelProps {
  productId: string;
  platformId: ChannelId;
  douyinState?: DouyinDynamicPanelState;
}

interface PendingAction {
  platformId: ChannelId;
  actionId: PublishActionId;
  actionState: PublishActionState;
}

const actionLabels: Record<PublishActionId, string> = {
  focus_editor: "继续补字段",
  submit_review: "提交审核",
  update_channel: "更新渠道",
  retry_sync: "重新同步",
  list: "上架",
  delist: "下架",
};

function getPlatformLabel(platformId: ChannelId) {
  return platformId === "douyin" ? "抖店" : "视频号";
}

function getActionButtonLabel(actionId: PublishActionId, pendingAction: PendingAction | null) {
  const label = actionLabels[actionId];
  if (pendingAction?.actionId !== actionId) {
    return label;
  }

  return `${label}中...`;
}

function isSamePublishActionState(left: PublishActionState, right: PublishActionState) {
  return left.primary === right.primary && left.secondary === right.secondary && left.hint === right.hint;
}

function isDouyinLocallyBlocked(douyinState: DouyinDynamicPanelState | undefined) {
  if (!douyinState) {
    return false;
  }

  return douyinState.missingFields.length > 0 || douyinState.rules.blockers.length > 0;
}

function getDouyinStatusBadgeLabel(
  platformId: ChannelId,
  douyinState: DouyinDynamicPanelState | undefined,
  channelMissingFields: string[],
) {
  if (platformId !== "douyin" || !douyinState) {
    return channelMissingFields.length === 0 ? "字段齐备" : "待补字段";
  }

  const localActionState = getDouyinActionState(douyinState);

  if (localActionState.primary === "focus_editor") {
    if (douyinState.missingFields.length > 0) {
      return "待补字段";
    }

    if (douyinState.rules.blockers.length > 0) {
      return "规则阻塞";
    }
  }

  return channelMissingFields.length === 0 ? "字段齐备" : "待补字段";
}

export function PublishActionPanel({ productId, platformId, douyinState }: PublishActionPanelProps) {
  const product = useProductCenterStore((state) => state.getProductById(productId));
  const submitChannelForReview = useProductCenterStore((state) => state.submitChannelForReview);
  const updateChannel = useProductCenterStore((state) => state.updateChannel);
  const retryChannelSync = useProductCenterStore((state) => state.retryChannelSync);
  const listChannel = useProductCenterStore((state) => state.listChannel);
  const delistChannel = useProductCenterStore((state) => state.delistChannel);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>发布控制</CardTitle>
          <CardDescription>当前平台：{getPlatformLabel(platformId)}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">未找到当前商品，无法展示发布动作。</CardContent>
      </Card>
    );
  }

  const channel = product.channels[platformId];
  if (!channel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>发布控制</CardTitle>
          <CardDescription>当前平台：{getPlatformLabel(platformId)}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">未找到当前平台的发布状态。</CardContent>
      </Card>
    );
  }

  const douyinLocalBlocked = platformId === "douyin" && isDouyinLocallyBlocked(douyinState);
  const douyinLocalActionState = platformId === "douyin" && douyinState ? getDouyinActionState(douyinState) : null;
  const liveActionState =
    platformId === "douyin" && douyinLocalBlocked && douyinLocalActionState
      ? douyinLocalActionState
      : getPublishActionState({
          platformId,
          publicationStatus: channel.publicationStatus,
          auditStatus: channel.auditStatus,
          listingStatus: channel.listingStatus,
          missingFields: channel.missingFields,
        });
  const actionState =
    pendingAction &&
    pendingAction.platformId === platformId &&
    isSamePublishActionState(pendingAction.actionState, liveActionState)
      ? pendingAction.actionState
      : liveActionState;

  const runAction = (actionId: PublishActionId) => {
    if (actionId === "focus_editor") {
      window.location.hash = `channel-${platformId}-editor`;
      return;
    }

    const snapshot: PendingAction = { actionId, platformId, actionState: liveActionState };
    setPendingAction(snapshot);

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
    }

    switch (actionId) {
      case "submit_review":
        submitChannelForReview(productId, platformId);
        break;
      case "update_channel":
        updateChannel(productId, platformId);
        break;
      case "retry_sync":
        retryChannelSync(productId, platformId);
        break;
      case "list":
        listChannel(productId, platformId);
        break;
      case "delist":
        delistChannel(productId, platformId);
        break;
      case "focus_editor":
        break;
      default:
        break;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      setPendingAction(null);
      frameRef.current = null;
    });
  };

  const isPending = pendingAction !== null;
  const statusBadgeLabel = getDouyinStatusBadgeLabel(platformId, douyinState, channel.missingFields);

  return (
    <Card>
      <CardHeader>
        <CardTitle>发布控制</CardTitle>
        <CardDescription>当前平台：{getPlatformLabel(platformId)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-medium text-sm">{getPlatformLabel(platformId)}</div>
            <div className="text-muted-foreground text-xs">{actionState.hint}</div>
          </div>
          <Badge variant={statusBadgeLabel === "字段齐备" ? "secondary" : "outline"}>{statusBadgeLabel}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => runAction(actionState.primary)} disabled={isPending}>
            {getActionButtonLabel(actionState.primary, pendingAction)}
          </Button>
          {actionState.secondary ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction(actionState.secondary)}
              disabled={isPending}
            >
              {getActionButtonLabel(actionState.secondary, pendingAction)}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
