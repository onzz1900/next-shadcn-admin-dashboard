import { z } from "zod";

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

const auditStatusSchema = z.enum(["not_submitted", "pending", "approved", "rejected"]);
const listingStatusSchema = z.enum(["not_listed", "listed", "delisted"]);

const channelFieldStateSchema = z.object({
  label: z.string(),
  value: z.string(),
  state: z.enum(["ready", "missing", "warning"]),
});

const channelPublicationViewSchema = z.object({
  channel: z.enum(["douyin", "wechat"]),
  publicationStatus: publicationStatusSchema,
  auditStatus: auditStatusSchema,
  listingStatus: listingStatusSchema,
  missingFields: z.array(z.string()),
  rejectionReason: z.string().optional(),
  lastSyncAt: z.string(),
  channelSpecificFields: z.array(channelFieldStateSchema),
});

export const productCenterTableSchema = z.object({
  id: z.string(),
  spuCode: z.string(),
  name: z.string(),
  category: z.string(),
  brand: z.string(),
  shop: z.string(),
  skuCount: z.number(),
  completionPercent: z.number(),
  productStatus: z.enum(["draft", "ready", "archived"]),
  updatedAt: z.string(),
  channels: z.object({
    douyin: channelPublicationViewSchema,
    wechat: channelPublicationViewSchema,
  }),
});

export type ProductCenterTableRow = z.infer<typeof productCenterTableSchema>;
