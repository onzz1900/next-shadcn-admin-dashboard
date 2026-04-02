"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import { ChannelStatusBadge } from "../../../_components/channel-status-badge";
import type { PublicationWorkbenchTableRow } from "./schema";

const channelLabels: Record<PublicationWorkbenchTableRow["channel"], string> = {
  douyin: "抖音",
  wechat: "视频号",
};

export const publicationWorkbenchTableColumns: ColumnDef<PublicationWorkbenchTableRow>[] = [
  {
    accessorKey: "productName",
    header: "商品",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{row.original.productName}</div>
        <div className="text-muted-foreground text-xs tabular-nums">{row.original.productId}</div>
      </div>
    ),
  },
  {
    accessorKey: "channel",
    header: "渠道",
    cell: ({ row }) => <span className="text-foreground">{channelLabels[row.original.channel]}</span>,
  },
  {
    accessorKey: "publicationStatus",
    header: "状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.publicationStatus} />,
  },
  {
    accessorKey: "blocker",
    header: "阻塞项",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.blocker}</span>,
  },
  {
    accessorKey: "updatedAt",
    header: "更新时间",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.updatedAt}</span>,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">去处理</span>,
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
        <Link
          href={`/dashboard/e-commerce/products/${row.original.productId}?channel=${row.original.channel}`}
          aria-label={`去处理 ${row.original.productName}（${channelLabels[row.original.channel]}）`}
        >
          去处理
        </Link>
      </Button>
    ),
    enableHiding: false,
  },
];
