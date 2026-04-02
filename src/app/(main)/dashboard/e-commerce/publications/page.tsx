import { productCenterMock } from "../_lib/product-center.mock";
import { getPublicationWorkbenchRows } from "../_lib/product-center.selectors";
import { WorkbenchOverviewCards } from "./_components/workbench-overview-cards";
import { PublicationWorkbenchTable } from "./_components/workbench-table/table";

export default function Page() {
  const rows = getPublicationWorkbenchRows(productCenterMock);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <WorkbenchOverviewCards rows={rows} />
      <PublicationWorkbenchTable rows={rows} />
    </div>
  );
}
