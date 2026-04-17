"use client";

import * as React from "react";

import { getPublicationWorkbenchRows } from "../../_lib/product-center.selectors";
import { useProductCenterStore } from "../../_state/product-center-provider";
import { WorkbenchOverviewCards } from "./workbench-overview-cards";
import { PublicationWorkbenchTable } from "./workbench-table/table";

export function PublicationWorkbenchPage() {
  const products = useProductCenterStore((store) => store.products);
  const rows = React.useMemo(() => getPublicationWorkbenchRows(products), [products]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <WorkbenchOverviewCards rows={rows} />
      <PublicationWorkbenchTable rows={rows} />
    </div>
  );
}
