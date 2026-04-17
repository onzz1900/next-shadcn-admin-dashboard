"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ChannelPublicationView, SPUDetail } from "../../../../_lib/product-center.types";
import { buildDouyinAddV2Command, buildDouyinEditV2Command } from "../../../../_lib/publish/douyin-command-builder";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import { buildDouyinPublishDraft } from "../../../../_lib/publish/douyin-publish-draft";
import type { PublishView } from "../../../../_lib/publish/publish.types";

interface DouyinCommandPreviewProps {
  publishView: PublishView;
  productSnapshot: SPUDetail;
  douyinState: DouyinDynamicPanelState;
  channelState: ChannelPublicationView<"douyin">;
}

function buildPreview(
  publishView: PublishView,
  productSnapshot: SPUDetail,
  douyinState: DouyinDynamicPanelState,
  channelState: ChannelPublicationView<"douyin">,
) {
  const draft = buildDouyinPublishDraft({
    publishView,
    productSnapshot,
    douyinState,
    channelState,
  });

  const command =
    draft.channelState.commandMode === "add" ? buildDouyinAddV2Command(draft) : buildDouyinEditV2Command(draft);

  return { command };
}

export function DouyinCommandPreview({
  publishView,
  productSnapshot,
  douyinState,
  channelState,
}: DouyinCommandPreviewProps) {
  try {
    const { command } = buildPreview(publishView, productSnapshot, douyinState, channelState);
    const { payload } = command;
    const shippingReadyCount = payload.delivery.shipping.filter((field) => field.filled).length;
    const commitmentReadyCount = payload.delivery.commitment.filter((field) => field.filled).length;
    const statusReadyCount = payload.delivery.status.filter((field) => field.filled).length;
    const totalMediaCount =
      payload.media.main_images.length + payload.media.detail_images.length + payload.media.gallery_images.length;

    return (
      <Card>
        <CardHeader>
          <CardTitle>抖店命令预览</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{command.apiPath}</Badge>
            <Badge variant="secondary">mode: {command.mode}</Badge>
            <Badge variant="outline">category: {payload.category.category_id}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs">SKU 数量</div>
              <div className="font-medium text-sm">{payload.sku.sku_list.length}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs">资源数量</div>
              <div className="font-medium text-sm">
                主图 {payload.media.main_images.length} / 详情 {payload.media.detail_images.length} / 总计{" "}
                {totalMediaCount}
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium">履约摘要</div>
            <div className="mt-1 grid gap-1 text-muted-foreground text-xs">
              <div>
                发货 {shippingReadyCount}/{payload.delivery.shipping.length}
              </div>
              <div>
                承诺 {commitmentReadyCount}/{payload.delivery.commitment.length}
              </div>
              <div>
                状态 {statusReadyCount}/{payload.delivery.status.length}
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="font-medium">校验摘要</div>
            <div className="mt-1 text-muted-foreground text-xs">
              阻塞 {payload.ruleContext.blockers.length} 项，缺失 {payload.ruleContext.missingFields.length} 项
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "命令预览构建失败";

    return (
      <Card>
        <CardHeader>
          <CardTitle>抖店命令预览</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{message}</CardContent>
      </Card>
    );
  }
}
