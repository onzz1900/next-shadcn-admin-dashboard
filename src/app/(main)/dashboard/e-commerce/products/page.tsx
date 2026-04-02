import { productCenterMock } from "../_lib/product-center.mock";
import { ProductCenterPage } from "./_components/product-center-page";

export default function Page() {
  return <ProductCenterPage products={productCenterMock} />;
}
