import type { AuditStatus, ListingStatus, PublicationStatus } from "./product-center.types";

export interface ChannelPrimaryStatusInput {
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
  rejectionReason?: string;
}

export interface ChannelPrimaryStatusOptions {
  channelLabel?: string;
}

export interface ChannelPrimaryStatusMeta {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

export interface ChannelStatusDetailMeta {
  tooltip?: string;
  inlineNote?: string;
}

export function getChannelPrimaryStatusMeta(
  input: ChannelPrimaryStatusInput,
  options?: ChannelPrimaryStatusOptions,
): ChannelPrimaryStatusMeta {
  const prefix = options?.channelLabel ?? "";

  if (input.publicationStatus === "sync_error" || input.publicationStatus === "rejected") {
    return {
      label: `${prefix}${input.publicationStatus === "sync_error" ? "同步失败" : "已驳回"}`,
      variant: "destructive",
    };
  }

  if (input.publicationStatus === "in_review" || input.auditStatus === "pending") {
    return {
      label: `${prefix}审核中`,
      variant: "outline",
    };
  }

  if (input.missingFields.length > 0) {
    return {
      label: `${prefix}缺 ${input.missingFields.length} 项`,
      variant: "destructive",
    };
  }

  if (input.publicationStatus === "ready_to_list" && input.listingStatus === "not_listed") {
    return {
      label: `${prefix}待上架`,
      variant: "secondary",
    };
  }

  if (input.publicationStatus === "live" || input.listingStatus === "listed") {
    return {
      label: `${prefix}已上架`,
      variant: "secondary",
    };
  }

  if (input.publicationStatus === "offline" || input.listingStatus === "delisted") {
    return {
      label: `${prefix}已下架`,
      variant: "outline",
    };
  }

  return {
    label: `${prefix}已齐备`,
    variant: "secondary",
  };
}

export function getChannelStatusDetailMeta(input: ChannelPrimaryStatusInput): ChannelStatusDetailMeta {
  if (input.publicationStatus === "sync_error" || input.publicationStatus === "rejected") {
    const reason =
      input.rejectionReason ??
      (input.publicationStatus === "sync_error" ? "渠道同步失败，请重新提交处理。" : "渠道已驳回，请检查后重新提交。");

    return {
      tooltip: reason,
      inlineNote: shortenStatusReason(reason),
    };
  }

  if (input.publicationStatus === "in_review" || input.auditStatus === "pending") {
    return {
      tooltip: "等待渠道审核",
    };
  }

  if (input.missingFields.length > 0) {
    return {
      tooltip: `缺：${input.missingFields.join("、")}`,
    };
  }

  if (input.publicationStatus === "ready_to_list" && input.listingStatus === "not_listed") {
    return {
      tooltip: "字段已齐备，等待上架",
    };
  }

  if (input.publicationStatus === "live" || input.listingStatus === "listed") {
    return {
      tooltip: "渠道已上架",
    };
  }

  if (input.publicationStatus === "offline" || input.listingStatus === "delisted") {
    return {
      tooltip: "渠道已下架",
    };
  }

  return {};
}

function shortenStatusReason(value: string) {
  return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}
