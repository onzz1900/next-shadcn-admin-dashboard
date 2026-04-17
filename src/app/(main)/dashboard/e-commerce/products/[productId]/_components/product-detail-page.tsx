"use client";

import { useEffect, useState } from "react";

import type { ChannelId } from "../../../_lib/product-center.types";
import type {
  ChannelFieldDraft,
  ChannelFieldMutationResult,
  EditableChannelId,
} from "../../../_lib/product-center-editing.types";
import { useProductCenterStore } from "../../../_state/product-center-provider";
import { AssetsCard } from "./assets-card";
import { BasicInfoCard } from "./basic-info-card";
import { ChannelPublicationTabs } from "./channel-publication-tabs";
import { DetailHeader } from "./detail-header";
import { SkuTable } from "./sku-table";

interface ProductDetailPageProps {
  productId: string;
  initialChannel?: ChannelId;
}

function formatSyncAt(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function ProductDetailPage({ productId, initialChannel }: ProductDetailPageProps) {
  const product = useProductCenterStore((store) => store.getProductById(productId));
  const saveDraft = useProductCenterStore((store) => store.saveDraft);
  const retryChannelSync = useProductCenterStore((store) => store.retryChannelSync);
  const listChannel = useProductCenterStore((store) => store.listChannel);
  const delistChannel = useProductCenterStore((store) => store.delistChannel);
  const [activeChannel, setActiveChannel] = useState<ChannelId>(initialChannel ?? "douyin");

  useEffect(() => {
    if (initialChannel) {
      setActiveChannel(initialChannel);
    }
  }, [initialChannel]);

  if (!product) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="rounded-xl border border-muted-foreground/30 border-dashed bg-muted/20 px-6 py-10 text-center">
          <div className="font-medium text-sm">未找到商品</div>
          <div className="mt-2 text-muted-foreground text-sm">这个商品可能已被移除，或当前链接对应的主档不存在。</div>
        </div>
      </div>
    );
  }

  const fallbackChannel = Object.values(product.channels)[0]?.channel ?? "douyin";
  const currentChannel = Object.values(product.channels).some((channel) => channel.channel === activeChannel)
    ? activeChannel
    : fallbackChannel;
  const currentChannelView = product.channels[currentChannel];

  const handleSave = (channelId: EditableChannelId, draft: ChannelFieldDraft): ChannelFieldMutationResult => {
    return saveDraft(productId, channelId, draft, { syncAt: formatSyncAt(new Date()) });
  };

  const handleRetry = (channelId: ChannelId) => {
    retryChannelSync(productId, channelId);
  };

  const handleList = (channelId: ChannelId) => {
    listChannel(productId, channelId);
  };

  const handleDelist = (channelId: ChannelId) => {
    delistChannel(productId, channelId);
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <BasicInfoCard product={product} />
          <ChannelPublicationTabs
            product={product}
            activeChannel={currentChannel}
            onChannelChange={setActiveChannel}
            onSave={handleSave}
            onRetry={handleRetry}
            onList={handleList}
            onDelist={handleDelist}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <SkuTable skus={product.skus} />
          <AssetsCard
            productId={product.id}
            channelId={currentChannel}
            assets={product.assets}
            statusStrip={{
              publicationStatus: currentChannelView.publicationStatus,
              auditStatus: currentChannelView.auditStatus,
              listingStatus: currentChannelView.listingStatus,
              missingFields: currentChannelView.missingFields,
              rejectionReason: currentChannelView.rejectionReason,
              lastSavedAt: currentChannelView.lastSyncAt,
            }}
          />
        </div>
      </div>
    </div>
  );
}
