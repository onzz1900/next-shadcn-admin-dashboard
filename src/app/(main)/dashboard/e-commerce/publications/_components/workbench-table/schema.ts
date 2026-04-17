import { z } from "zod";

import type { PublicationWorkbenchRow } from "../../../_lib/product-center.types";

const publicationStatusSchema = z.enum([
  "not_started",
  "missing_fields",
  "ready_to_list",
  "in_review",
  "rejected",
  "live",
  "offline",
  "sync_error",
]);

const channelIdSchema = z.enum(["douyin", "wechat"]);
const auditStatusSchema = z.enum(["not_submitted", "pending", "approved", "rejected"]);
const listingStatusSchema = z.enum(["not_listed", "listed", "delisted"]);

export const publicationWorkbenchRowSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  channel: channelIdSchema,
  publicationStatus: publicationStatusSchema,
  auditStatus: auditStatusSchema,
  listingStatus: listingStatusSchema,
  missingFields: z.array(z.string()),
  rejectionReason: z.string().optional(),
  blocker: z.string(),
  updatedAt: z.string(),
});

export type PublicationWorkbenchTableRow = Pick<
  PublicationWorkbenchRow,
  | "productId"
  | "productName"
  | "channel"
  | "publicationStatus"
  | "auditStatus"
  | "listingStatus"
  | "missingFields"
  | "rejectionReason"
  | "blocker"
  | "updatedAt"
>;
