import { notFound } from "next/navigation";

import { productCenterMock } from "../../_lib/product-center.mock";
import { getProductById } from "../../_lib/product-center.selectors";
import { AssetsCard } from "./_components/assets-card";
import { BasicInfoCard } from "./_components/basic-info-card";
import { ChannelPublicationTabs } from "./_components/channel-publication-tabs";
import { DetailHeader } from "./_components/detail-header";
import { SkuTable } from "./_components/sku-table";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default async function Page({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const product = getProductById(productCenterMock, productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <DetailHeader product={product} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] md:gap-6">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <BasicInfoCard product={product} />
          <ChannelPublicationTabs product={product} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <SkuTable skus={product.skus} />
          <AssetsCard assets={product.assets} />
        </div>
      </div>
    </div>
  );
}
