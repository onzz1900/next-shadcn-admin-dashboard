"use client";

import { createContext, useContext, useState } from "react";

import { type StoreApi, useStore } from "zustand";

import {
  createProductCenterStore,
  type ProductCenterStore,
  type ProductCenterStoreState,
} from "./product-center-store";

const ProductCenterStoreContext = createContext<ProductCenterStore | null>(null);

export function ProductCenterStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<ProductCenterStore>(() => createProductCenterStore());

  return <ProductCenterStoreContext.Provider value={store}>{children}</ProductCenterStoreContext.Provider>;
}

export function useProductCenterStore<T>(selector: (state: ProductCenterStoreState) => T): T {
  const store = useContext(ProductCenterStoreContext);
  if (!store) {
    throw new Error("Missing ProductCenterStoreProvider");
  }

  return useStore(store as StoreApi<ProductCenterStoreState>, selector);
}
