"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { filterProductSummaries, getProductCenterMetrics } from "../../_lib/product-center.selectors";
import type { ProductCenterFilters, SPUDetail } from "../../_lib/product-center.types";
import { ProductCenterFiltersBar } from "./filters";
import { ProductCenterOverviewCards } from "./overview-cards";

interface ProductCenterPageProps {
  products: SPUDetail[];
}

const initialFilters: ProductCenterFilters = {
  search: "",
  productStatus: "all",
  channel: "all",
  channelState: "all",
};

export function ProductCenterPage({ products }: ProductCenterPageProps) {
  const [filters, setFilters] = React.useState<ProductCenterFilters>(initialFilters);
  const deferredFilters = React.useDeferredValue(filters);

  const metrics = React.useMemo(() => getProductCenterMetrics(products), [products]);
  const filteredProducts = React.useMemo(
    () => filterProductSummaries(products, deferredFilters),
    [products, deferredFilters],
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductCenterOverviewCards metrics={metrics} />
      <ProductCenterFiltersBar filters={filters} onFiltersChange={setFilters} />
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>Task 4 将在这里接入列表表格。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          当前筛选结果共 <span className="font-medium text-foreground">{filteredProducts.length}</span> 个商品。
        </CardContent>
      </Card>
    </div>
  );
}
