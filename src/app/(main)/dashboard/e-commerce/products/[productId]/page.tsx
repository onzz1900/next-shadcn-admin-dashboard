import { notFound } from "next/navigation";

import { productCenterMock } from "../../_lib/product-center.mock";
import { getProductById } from "../../_lib/product-center.selectors";
import type { ChannelId } from "../../_lib/product-center.types";
import { ProductDetailPage } from "./_components/product-detail-page";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<{ channel?: string | string[] }>;
}

function isChannelId(value: string): value is ChannelId {
  return value === "douyin" || value === "wechat";
}

export default async function Page({ params, searchParams }: ProductDetailPageProps) {
  const { productId } = await params;
  const { channel } = (await searchParams) ?? {};
  const product = getProductById(productCenterMock, productId);
  const requestedChannel = Array.isArray(channel) ? channel[0] : channel;
  const initialChannel =
    typeof requestedChannel === "string" && isChannelId(requestedChannel) ? requestedChannel : undefined;

  if (!product) {
    notFound();
  }

  return <ProductDetailPage productId={productId} initialChannel={initialChannel} />;
}
