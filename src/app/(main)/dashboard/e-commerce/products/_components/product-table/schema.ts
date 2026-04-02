import { z } from "zod";

import type { ChannelPublicationView, SPUSummary } from "../../../_lib/product-center.types";

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

const productCenterTableChannelSchema = z.object({
  publicationStatus: publicationStatusSchema,
});

export const productCenterTableSchema = z.object({
  id: z.string(),
  spuCode: z.string(),
  name: z.string(),
  category: z.string(),
  skuCount: z.number(),
  completionPercent: z.number(),
  updatedAt: z.string(),
  channels: z.object({
    douyin: productCenterTableChannelSchema,
    wechat: productCenterTableChannelSchema,
  }),
});

export type ProductCenterTableRow = Pick<
  SPUSummary,
  "id" | "spuCode" | "name" | "category" | "skuCount" | "completionPercent" | "updatedAt"
> & {
  channels: {
    douyin: Pick<ChannelPublicationView, "publicationStatus">;
    wechat: Pick<ChannelPublicationView, "publicationStatus">;
  };
};
