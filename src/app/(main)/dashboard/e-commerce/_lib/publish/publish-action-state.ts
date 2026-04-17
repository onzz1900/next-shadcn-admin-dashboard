import type { AuditStatus, ListingStatus, PublicationStatus } from "../../_lib/product-center.types";

export type PublishActionId = "focus_editor" | "submit_review" | "update_channel" | "retry_sync" | "list" | "delist";

export interface PublishActionStateInput {
  platformId: string;
  publicationStatus: PublicationStatus;
  auditStatus: AuditStatus;
  listingStatus: ListingStatus;
  missingFields: string[];
}

export interface PublishActionState {
  primary: PublishActionId;
  secondary: PublishActionId | null;
  hint: string;
}

export function getPublishActionState(input: PublishActionStateInput): PublishActionState {
  if (input.publicationStatus === "missing_fields" || input.missingFields.length > 0) {
    return {
      primary: "focus_editor",
      secondary: null,
      hint: "当前平台仍有待补字段，先回到表单补齐后再继续提交流程。",
    };
  }

  if (input.publicationStatus === "sync_error" || input.publicationStatus === "rejected") {
    return {
      primary: "retry_sync",
      secondary: null,
      hint: "当前渠道存在异常，优先重新同步后再继续后续动作。",
    };
  }

  if (input.auditStatus === "not_submitted" || input.auditStatus === "rejected") {
    return {
      primary: "submit_review",
      secondary: "update_channel",
      hint: "当前字段已齐备，但还未进入审核流程。",
    };
  }

  if (input.publicationStatus === "ready_to_list" && input.listingStatus !== "listed") {
    return {
      primary: "list",
      secondary: "update_channel",
      hint: "当前渠道已完成审核，可以直接上架或先刷新渠道信息。",
    };
  }

  if (input.publicationStatus === "live" || input.listingStatus === "listed") {
    return {
      primary: "delist",
      secondary: "update_channel",
      hint: "当前渠道已在售，可维护后继续同步或直接下架。",
    };
  }

  if (input.publicationStatus === "offline" || input.listingStatus === "delisted") {
    return {
      primary: "list",
      secondary: "update_channel",
      hint: "当前渠道已下架，可重新上架或先刷新渠道信息。",
    };
  }

  return {
    primary: "update_channel",
    secondary: null,
    hint: "当前平台可以继续刷新渠道配置。",
  };
}
