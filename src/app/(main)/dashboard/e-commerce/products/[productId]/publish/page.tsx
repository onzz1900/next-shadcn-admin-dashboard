import { notFound } from "next/navigation";

import { getPublishView } from "../../../_lib/publish/publish.selectors";
import { PublishPage } from "./_components/publish-page";

interface ProductPublishPageProps {
  params: Promise<{ productId: string }>;
}

export default async function Page({ params }: ProductPublishPageProps) {
  const { productId } = await params;
  const publishView = getPublishView(productId);

  if (!publishView) {
    notFound();
  }

  return <PublishPage publishView={publishView} />;
}
