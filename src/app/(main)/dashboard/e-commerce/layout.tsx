import { ProductCenterStoreProvider } from "./_state/product-center-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProductCenterStoreProvider>{children}</ProductCenterStoreProvider>;
}
