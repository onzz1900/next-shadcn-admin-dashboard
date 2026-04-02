"use client";

import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";

import type { PublicationStatus } from "../_lib/product-center.types";

const publicationStatusConfig: Record<
  PublicationStatus,
  {
    label: string;
    variant: ComponentProps<typeof Badge>["variant"];
  }
> = {
  not_started: { label: "未开始", variant: "outline" },
  missing_fields: { label: "缺失内容", variant: "destructive" },
  ready_to_list: { label: "待上架", variant: "default" },
  in_review: { label: "审核中", variant: "secondary" },
  rejected: { label: "已拒绝", variant: "destructive" },
  live: { label: "已上架", variant: "default" },
  offline: { label: "已下架", variant: "outline" },
  sync_error: { label: "同步失败", variant: "destructive" },
};

interface ChannelStatusBadgeProps {
  status: PublicationStatus;
  className?: string;
}

export function ChannelStatusBadge({ status, className }: ChannelStatusBadgeProps) {
  const config = publicationStatusConfig[status];

  return (
    <Badge className={className} variant={config.variant}>
      {config.label}
    </Badge>
  );
}
