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

export const publicationWorkbenchRowSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  channel: channelIdSchema,
  publicationStatus: publicationStatusSchema,
  blocker: z.string(),
  updatedAt: z.string(),
});

export type PublicationWorkbenchTableRow = Pick<
  PublicationWorkbenchRow,
  "productId" | "productName" | "channel" | "publicationStatus" | "blocker" | "updatedAt"
>;
