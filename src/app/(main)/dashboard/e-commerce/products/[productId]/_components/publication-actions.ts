import type { ChannelPublicationView, SPUDetail } from "../../../_lib/product-center.types";

export type PublicationAction = "更新渠道" | "提交审核" | "上架" | "下架";

const actionPriority: Record<PublicationAction, number> = {
  更新渠道: 0,
  提交审核: 1,
  上架: 2,
  下架: 3,
};

export function getChannelPrimaryAction(channel: ChannelPublicationView): PublicationAction {
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

export function getHeaderActions(product: Pick<SPUDetail, "channels">): PublicationAction[] {
  return [...new Set(Object.values(product.channels).map(getChannelPrimaryAction))]
    .sort((left, right) => actionPriority[left] - actionPriority[right])
    .slice(0, 2);
}
