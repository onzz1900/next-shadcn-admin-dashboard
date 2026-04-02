"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { ChannelStatusBadge } from "../../../_components/channel-status-badge";
import type { ProductCenterTableRow } from "./schema";

export const productCenterTableColumns: ColumnDef<ProductCenterTableRow>[] = [
  {
    accessorKey: "name",
    header: "商品 / SPU",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium text-foreground">{row.original.name}</div>
        <div className="text-muted-foreground text-xs tabular-nums">{row.original.spuCode}</div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "类目",
    cell: ({ row }) => <span className="text-foreground">{row.original.category}</span>,
  },
  {
    accessorKey: "skuCount",
    header: "SKU 数",
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.skuCount}</span>,
  },
  {
    accessorKey: "completionPercent",
    header: "资料完整度",
    cell: ({ row }) => (
      <div className="flex min-w-36 items-center gap-3">
        <Progress value={row.original.completionPercent} className="h-2 flex-1" />
        <span className="w-10 text-right font-medium text-muted-foreground text-xs tabular-nums">
          {row.original.completionPercent}%
        </span>
      </div>
    ),
  },
  {
    id: "douyinStatus",
    header: "抖音状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.channels.douyin.publicationStatus} />,
  },
  {
    id: "wechatStatus",
    header: "视频号状态",
    cell: ({ row }) => <ChannelStatusBadge status={row.original.channels.wechat.publicationStatus} />,
  },
  {
    accessorKey: "updatedAt",
    header: "最后更新",
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.updatedAt}</span>,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">查看详情</span>,
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
        <Link href={`/dashboard/e-commerce/products/${row.original.id}`}>查看详情</Link>
      </Button>
    ),
    enableHiding: false,
  },
];
