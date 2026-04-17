import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getChannelPrimaryStatusMeta } from "../../../_lib/channel-status";
import { getProductAssetPreview } from "../../../_lib/product-asset-preview";
import type {
  AssetItem,
  AuditStatus,
  ChannelId,
  ListingStatus,
  PublicationStatus,
} from "../../../_lib/product-center.types";
import { AssetPreviewCover } from "./asset-preview-cover";
import { AssetPreviewDetailStrip } from "./asset-preview-detail-strip";
import { AssetPreviewGallery } from "./asset-preview-gallery";
import { getChannelEditorSectionId, getChannelStatusSectionId } from "./channel-section-ids";

interface AssetsCardProps {
  productId: string;
  channelId: ChannelId;
  assets: AssetItem[];
  statusStrip: {
    publicationStatus: PublicationStatus;
    auditStatus: AuditStatus;
    listingStatus: ListingStatus;
    missingFields: string[];
    rejectionReason?: string;
    lastSavedAt: string;
  };
}

const channelLabel: Record<ChannelId, string> = {
  douyin: "抖音",
  wechat: "视频号",
};

const assetTypeLabel: Record<AssetItem["type"], string> = {
  cover: "封面",
  gallery: "组图",
  detail: "详情",
};

export function AssetsCard({ productId, channelId, assets, statusStrip }: AssetsCardProps) {
  const preview = getProductAssetPreview(productId, channelId);
  const readyCount = assets.filter((asset) => asset.status === "ready").length;
  const missingCount = assets.length - readyCount;
  const primaryStatus = getChannelPrimaryStatusMeta(statusStrip, {
    channelLabel: channelLabel[channelId],
  });
  const contextualHint = getContextualHint(statusStrip, channelId);
  const description = getPreviewDescription(channelId);
  const previewHint = getPreviewHint(channelId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>素材预览</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary">
            {preview ? `${channelLabel[channelId]}预览 Mock` : `暂无${channelLabel[channelId]} Mock`}
          </Badge>
          <Badge variant={primaryStatus.variant}>{primaryStatus.label}</Badge>
          <Badge variant="outline">{formatStatusStripTime(statusStrip.lastSavedAt)}</Badge>
        </div>
        <p className="text-muted-foreground text-xs">{previewHint}</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {contextualHint ? (
          <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span>{contextualHint.message}</span>
              {contextualHint.actionLabel && contextualHint.targetId ? (
                <Button asChild variant="link" size="xs" className="h-auto px-0">
                  <a href={`#${contextualHint.targetId}`}>{contextualHint.actionLabel}</a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        {preview ? (
          <>
            <AssetPreviewCover cover={preview.cover} />
            <AssetPreviewGallery gallery={preview.gallery} />
            <AssetPreviewDetailStrip detail={preview.detail} />
          </>
        ) : (
          <div className="rounded-xl border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-6 text-muted-foreground text-sm">
            {getEmptyPreviewMessage(channelId)}
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
            <span>素材真实状态</span>
            {assets.length > 0 ? (
              <Badge variant={missingCount > 0 ? "destructive" : "secondary"}>
                {missingCount > 0 ? `${missingCount} 项缺失` : `${readyCount}/${assets.length} 已就绪`}
              </Badge>
            ) : (
              <Badge variant="outline">未配置</Badge>
            )}
          </div>
          {assets.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs"
                >
                  <span>{assetTypeLabel[asset.type]}</span>
                  <span className="text-muted-foreground">{asset.label}</span>
                  <Badge variant={asset.status === "ready" ? "outline" : "destructive"}>
                    {asset.status === "ready" ? "已就绪" : "缺失"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-muted-foreground text-xs">当前商品还没有配置素材槽位。</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatusStripTime(value: string) {
  const time = value.split(" ")[1];
  return time ? `最近 ${time.slice(0, 5)}` : "暂无记录";
}

function getPreviewDescription(channelId: ChannelId) {
  if (channelId === "wechat") {
    return "先看视频号主图与详情图的右侧 mock 预览，再核对真实素材状态。";
  }

  return "先看封面主视觉，再看卖点组图和详情长图的右侧 mock 预览节奏。";
}

function getEmptyPreviewMessage(channelId: ChannelId) {
  if (channelId === "wechat") {
    return "当前商品暂无视频号 addProduct 的 head_imgs / desc_info.imgs 布局预览 mock，下面仅保留素材真实状态。";
  }

  return `当前商品暂无 ${channelLabel[channelId]} 布局预览 mock，下面仅保留素材真实状态。`;
}

function getPreviewHint(channelId: ChannelId) {
  if (channelId === "wechat") {
    return "当前预览对应视频号主图组与详情图组 mock，用于对照 head_imgs / desc_info.imgs。";
  }

  return "当前预览用于辅助判断渠道素材排布是否可用。";
}

function getContextualHint(statusStrip: AssetsCardProps["statusStrip"], channelId: ChannelId) {
  if (statusStrip.publicationStatus === "sync_error" || statusStrip.publicationStatus === "rejected") {
    return {
      message: statusStrip.rejectionReason ?? "当前渠道同步失败，请检查异常字段后重新提交。",
      actionLabel: "去处理异常",
      targetId: getChannelStatusSectionId(channelId),
    };
  }

  if (statusStrip.publicationStatus === "in_review" || statusStrip.auditStatus === "pending") {
    return {
      message: "当前渠道正在审核中，右侧预览仅用于确认素材排布与节奏。",
    };
  }

  const mediaMissingFields = statusStrip.missingFields.filter((field) =>
    ["图", "视频", "素材", "封面", "轮播"].some((keyword) => field.includes(keyword)),
  );

  if (mediaMissingFields.length > 0) {
    return {
      message: `当前仍缺 ${mediaMissingFields.join("、")}，右侧预览为 mock，不代表真实投放素材。`,
      actionLabel: "去补字段",
      targetId: getChannelEditorSectionId(channelId),
    };
  }

  return null;
}
