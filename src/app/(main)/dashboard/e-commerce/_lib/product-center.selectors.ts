import type {
  ChannelPublicationView,
  ProductCenterFilters,
  ProductCenterMetrics,
  PublicationStatus,
  PublicationWorkbenchRow,
  SPUDetail,
  SPUSummary,
} from "./product-center.types";

const ACTIONABLE_PUBLICATION_STATUSES = [
  "in_review",
  "sync_error",
  "ready_to_list",
  "missing_fields",
  "rejected",
] as const;
const ACTIONABLE_PUBLICATION_STATUS_SET = new Set<PublicationStatus>(ACTIONABLE_PUBLICATION_STATUSES);

type WorkbenchPublicationStatus = (typeof ACTIONABLE_PUBLICATION_STATUSES)[number];

const PUBLICATION_PRIORITY: Record<WorkbenchPublicationStatus, number> = {
  in_review: 0,
  sync_error: 1,
  ready_to_list: 2,
  missing_fields: 3,
  rejected: 4,
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
  return getChannelViews(product)
    .filter((channel) => ACTIONABLE_PUBLICATION_STATUS_SET.has(channel.publicationStatus))
    .map((channel) => ({
      productId: product.id,
      productName: product.name,
      channel: channel.channel,
      publicationStatus: channel.publicationStatus,
      auditStatus: channel.auditStatus,
      listingStatus: channel.listingStatus,
      missingFields: channel.missingFields,
      rejectionReason: channel.rejectionReason,
      blocker: channel.missingFields[0] ?? channel.rejectionReason ?? "等待渠道处理",
      updatedAt: channel.lastSyncAt,
    }));
}

function buildWorkBenchPriority(status: PublicationStatus): number {
  return PUBLICATION_PRIORITY[status as WorkbenchPublicationStatus] ?? 4;
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
      const matchesChannelState =
        filters.channelState === "all" ||
        channelViews.some((channel) => matchesPublicationState(channel.publicationStatus, filters.channelState));

      return matchesKeyword && matchesProductStatus && matchesChannelState;
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
      const leftPriority = buildWorkBenchPriority(left.publicationStatus);
      const rightPriority = buildWorkBenchPriority(right.publicationStatus);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
}
