import type {
  ChannelPublicationView,
  ProductCenterFilters,
  ProductCenterMetrics,
  PublicationWorkbenchRow,
  SPUDetail,
  SPUSummary,
} from "./product-center.types";

const PUBLICATION_PRIORITY: Record<"in_review" | "sync_error" | "missing_fields", number> = {
  in_review: 0,
  sync_error: 1,
  missing_fields: 2,
};

function summarizeProduct(product: SPUDetail): SPUSummary {
  return {
    id: product.id,
    spuCode: product.spuCode,
    name: product.name,
    category: product.category,
    brand: product.brand,
    shop: product.shop,
    skuCount: product.skuCount,
    completionPercent: product.completionPercent,
    productStatus: product.productStatus,
    updatedAt: product.updatedAt,
    channels: product.channels,
  };
}

function matchesPublicationState(status: string, filter: ProductCenterFilters["channelState"]): boolean {
  return filter === "all" || status === filter;
}

function getChannelViews(product: SPUDetail): Array<ChannelPublicationView> {
  return Object.values(product.channels);
}

function selectWorkbenchChannels(product: SPUDetail): Array<PublicationWorkbenchRow> {
  const rankedChannels = getChannelViews(product).filter((channel) =>
    ["in_review", "sync_error", "missing_fields"].includes(channel.publicationStatus),
  );

  const urgentChannels = rankedChannels.filter(
    (channel) => channel.publicationStatus === "in_review" || channel.publicationStatus === "sync_error",
  );

  if (urgentChannels.length > 0) {
    return urgentChannels.map((channel) => ({
      productId: product.id,
      productName: product.name,
      channel: channel.channel,
      publicationStatus: channel.publicationStatus,
      auditStatus: channel.auditStatus,
      blocker: channel.missingFields[0] ?? channel.rejectionReason ?? "等待渠道处理",
      updatedAt: channel.lastSyncAt,
    }));
  }

  const fallbackChannel = rankedChannels[0];

  if (!fallbackChannel) {
    return [];
  }

  return [
    {
      productId: product.id,
      productName: product.name,
      channel: fallbackChannel.channel,
      publicationStatus: fallbackChannel.publicationStatus,
      auditStatus: fallbackChannel.auditStatus,
      blocker: fallbackChannel.missingFields[0] ?? fallbackChannel.rejectionReason ?? "等待渠道处理",
      updatedAt: fallbackChannel.lastSyncAt,
    },
  ];
}

export function getProductCenterMetrics(products: SPUDetail[]): ProductCenterMetrics {
  return {
    totalProducts: products.length,
    missingContent: products.filter((item) => item.completionPercent < 100).length,
    readyToPublish: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.publicationStatus === "ready_to_list"),
    ).length,
    inReview: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.auditStatus === "pending"),
    ).length,
    syncErrors: products.filter((item) =>
      Object.values(item.channels).some((channel) => channel.publicationStatus === "sync_error"),
    ).length,
  };
}

export function filterProductSummaries(products: SPUDetail[], filters: ProductCenterFilters): SPUSummary[] {
  const keyword = filters.search.trim().toLowerCase();

  return products
    .filter((item) => {
      const matchesKeyword =
        keyword.length === 0 ||
        item.name.toLowerCase().includes(keyword) ||
        item.spuCode.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword);

      const matchesProductStatus = filters.productStatus === "all" || item.productStatus === filters.productStatus;
      const channelViews = filters.channel === "all" ? getChannelViews(item) : [item.channels[filters.channel]];
      const matchesChannel = filters.channel === "all" || channelViews[0].publicationStatus !== "not_started";
      const matchesChannelState =
        filters.channelState === "all" ||
        channelViews.some((channel) => matchesPublicationState(channel.publicationStatus, filters.channelState));

      return matchesKeyword && matchesProductStatus && matchesChannel && matchesChannelState;
    })
    .map(summarizeProduct);
}

export function getProductById(products: SPUDetail[], id: string): SPUDetail | undefined {
  return products.find((item) => item.id === id);
}

export function getPublicationWorkbenchRows(products: SPUDetail[]): PublicationWorkbenchRow[] {
  return products
    .flatMap((product) => selectWorkbenchChannels(product))
    .sort((left, right) => {
      const leftPriority = PUBLICATION_PRIORITY[left.publicationStatus as keyof typeof PUBLICATION_PRIORITY] ?? 3;
      const rightPriority = PUBLICATION_PRIORITY[right.publicationStatus as keyof typeof PUBLICATION_PRIORITY] ?? 3;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
}
