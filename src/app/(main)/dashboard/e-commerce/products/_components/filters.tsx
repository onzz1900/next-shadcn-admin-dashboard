"use client";

import { Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ProductCenterFilters, ProductStatus, PublicationStatus } from "../../_lib/product-center.types";

interface ProductCenterFiltersBarProps {
  filters: ProductCenterFilters;
  onFiltersChange: (nextFilters: ProductCenterFilters) => void;
}

const productStatusOptions: Array<{ value: ProductCenterFilters["productStatus"]; label: string }> = [
  { value: "all", label: "全部商品状态" },
  { value: "draft", label: "草稿" },
  { value: "ready", label: "可发布" },
  { value: "archived", label: "已归档" },
];

const channelOptions: Array<{ value: ProductCenterFilters["channel"]; label: string }> = [
  { value: "all", label: "全部渠道" },
  { value: "douyin", label: "抖音" },
  { value: "wechat", label: "微信" },
];

const channelStateOptions: Array<{ value: ProductCenterFilters["channelState"]; label: string }> = [
  { value: "all", label: "全部渠道状态" },
  { value: "not_started", label: "未开始" },
  { value: "missing_fields", label: "缺失内容" },
  { value: "ready_to_list", label: "待上架" },
  { value: "in_review", label: "审核中" },
  { value: "rejected", label: "已拒绝" },
  { value: "live", label: "已上架" },
  { value: "offline", label: "已下架" },
  { value: "sync_error", label: "同步失败" },
];

export function ProductCenterFiltersBar({ filters, onFiltersChange }: ProductCenterFiltersBarProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>筛选商品</CardTitle>
        <CardDescription>按商品状态、渠道和渠道发布状态快速缩小范围。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索商品名、SPU 编码或类目"
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                search: event.target.value,
              })
            }
          />
        </div>

        <Select
          value={filters.productStatus}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              productStatus: value as ProductStatus,
            })
          }
        >
          <SelectTrigger className="w-full md:col-span-1">
            <SelectValue placeholder="商品状态" />
          </SelectTrigger>
          <SelectContent>
            {productStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.channel}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              channel: value as ProductCenterFilters["channel"],
            })
          }
        >
          <SelectTrigger className="w-full md:col-span-1">
            <SelectValue placeholder="渠道" />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.channelState}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              channelState: value as PublicationStatus | "all",
            })
          }
        >
          <SelectTrigger className="w-full md:col-span-1">
            <SelectValue placeholder="渠道状态" />
          </SelectTrigger>
          <SelectContent>
            {channelStateOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
