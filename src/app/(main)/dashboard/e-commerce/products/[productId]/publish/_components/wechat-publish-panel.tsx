"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublishView } from "../../../../_lib/publish/publish.types";
import { useProductCenterStore } from "../../../../_state/product-center-provider";
import { ChannelFieldEditor } from "../../_components/channel-field-editor";
import { WechatPublishStatusSummary } from "./wechat-publish-status-summary";

interface WechatPublishPanelProps {
  publishView: PublishView;
}

export function WechatPublishPanel({ publishView }: WechatPublishPanelProps) {
  const product = useProductCenterStore((state) => state.getProductById(publishView.productId));
  const saveDraft = useProductCenterStore((state) => state.saveDraft);

  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>视频号发布面板</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">未找到对应商品。</CardContent>
      </Card>
    );
  }

  const wechatChannel = product.channels.wechat;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>视频号发布面板</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <WechatPublishStatusSummary channel={wechatChannel} />
          <ChannelFieldEditor product={product} channel={wechatChannel} onSave={saveDraft} />
        </CardContent>
      </Card>
    </div>
  );
}
