"use client";

import * as React from "react";

import { filterProductSummaries, getProductCenterMetrics } from "../../_lib/product-center.selectors";
import type { ProductCenterFilters } from "../../_lib/product-center.types";
import { useProductCenterStore } from "../../_state/product-center-provider";
import { ProductCenterFiltersBar } from "./filters";
import { ProductCenterOverviewCards } from "./overview-cards";
import { ProductCenterTable } from "./product-table/table";

const initialFilters: ProductCenterFilters = {
  search: "",
  productStatus: "all",
  channel: "all",
  channelState: "all",
};

export function ProductCenterPage() {
  const [filters, setFilters] = React.useState<ProductCenterFilters>(initialFilters);
  const deferredFilters = React.useDeferredValue(filters);
  const products = useProductCenterStore((store) => store.products);

  const metrics = React.useMemo(() => getProductCenterMetrics(products), [products]);
  const filteredProducts = React.useMemo(
    () => filterProductSummaries(products, deferredFilters),
    [deferredFilters, products],
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <ProductCenterOverviewCards metrics={metrics} />
      <ProductCenterFiltersBar filters={filters} onFiltersChange={setFilters} />
      <ProductCenterTable data={filteredProducts} />
    </div>
  );
}
