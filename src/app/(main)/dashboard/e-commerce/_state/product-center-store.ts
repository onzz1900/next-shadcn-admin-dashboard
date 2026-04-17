import { createStore, type StoreApi } from "zustand/vanilla";

import { productCenterMock } from "../_lib/product-center.mock";
import {
  filterProductSummaries,
  getProductById as findProductById,
  getProductCenterMetrics,
  getPublicationWorkbenchRows,
} from "../_lib/product-center.selectors";
import type {
  ChannelId,
  ProductCenterFilters,
  ProductCenterMetrics,
  PublicationWorkbenchRow,
  SPUDetail,
} from "../_lib/product-center.types";
import { saveChannelFieldDraft } from "../_lib/product-center-editing";
import type {
  ChannelFieldDraft,
  ChannelFieldMutationOptions,
  ChannelFieldMutationResult,
  EditableChannelId,
} from "../_lib/product-center-editing.types";

export interface ProductCenterStoreState {
  products: SPUDetail[];
  saveDraft: (
    productId: string,
    channelId: EditableChannelId,
    draft: ChannelFieldDraft,
    options?: ChannelFieldMutationOptions,
  ) => ChannelFieldMutationResult;
  retryChannelSync: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  submitChannelForReview: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  updateChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  listChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  delistChannel: (productId: string, channelId: ChannelId, syncAt?: string) => void;
  getProductById: (id: string) => SPUDetail | undefined;
  getMetrics: () => ProductCenterMetrics;
  getFilteredProducts: (filters: ProductCenterFilters) => ReturnType<typeof filterProductSummaries>;
  getWorkbenchRows: () => PublicationWorkbenchRow[];
}

export type ProductCenterStore = StoreApi<ProductCenterStoreState>;

function cloneChannelPublication<TChannel extends keyof SPUDetail["channels"]>(
  channel: SPUDetail["channels"][TChannel],
): SPUDetail["channels"][TChannel] {
  return {
    ...channel,
    missingFields: [...channel.missingFields],
    channelSpecificFields: channel.channelSpecificFields.map((field) => ({ ...field })),
  };
}

function cloneProducts(products: SPUDetail[]): SPUDetail[] {
  return products.map((product): SPUDetail => {
    const douyin: SPUDetail["channels"]["douyin"] = cloneChannelPublication<"douyin">(product.channels.douyin);
    const wechat: SPUDetail["channels"]["wechat"] = cloneChannelPublication<"wechat">(product.channels.wechat);

    return {
      ...product,
      tags: [...product.tags],
      skus: product.skus.map((sku) => ({
        ...sku,
        channelPublishing: sku.channelPublishing
          ? {
              ...sku.channelPublishing,
              wechat: sku.channelPublishing.wechat
                ? {
                    ...sku.channelPublishing.wechat,
                    skuAttrs: [...sku.channelPublishing.wechat.skuAttrs],
                  }
                : undefined,
            }
          : undefined,
      })),
      assets: product.assets.map((asset) => ({ ...asset })),
      channels: {
        douyin,
        wechat,
      },
    };
  });
}

function formatSyncAt(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function createProductCenterStore(initialProducts: SPUDetail[] = productCenterMock) {
  return createStore<ProductCenterStoreState>()((set, get) => ({
    products: cloneProducts(initialProducts),
    saveDraft: (productId, channelId, draft, options) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      const result = saveChannelFieldDraft(currentProduct, channelId, draft, options);

      set((state) => ({
        ...state,
        products: state.products.map((item) => (item.id === productId ? result.product : item)),
      }));

      return result;
    },
    retryChannelSync: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                publicationStatus: "ready_to_list",
                listingStatus: "not_listed",
                rejectionReason: undefined,
                lastSyncAt: syncAt,
                channelSpecificFields: channel.channelSpecificFields.map((field) => ({
                  ...field,
                  state: field.value === "同步失败" ? "ready" : field.state,
                  value: field.value === "同步失败" ? "已同步" : field.value,
                })),
              },
            },
          };
        }),
      }));
    },
    submitChannelForReview: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      const channel = currentProduct.channels[channelId];
      if (channel.missingFields.length > 0) {
        throw new Error(`Cannot submit ${productId}/${channelId} for review while fields are missing`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                publicationStatus: "in_review",
                auditStatus: "pending",
                listingStatus: "not_listed",
                rejectionReason: undefined,
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
    updateChannel: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
    listChannel: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                publicationStatus: "live",
                listingStatus: "listed",
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
    delistChannel: (productId, channelId, syncAt = formatSyncAt(new Date())) => {
      const currentProduct = get().getProductById(productId);
      if (!currentProduct) {
        throw new Error(`Product ${productId} not found`);
      }

      set((state) => ({
        ...state,
        products: state.products.map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const channel = item.channels[channelId];

          return {
            ...item,
            channels: {
              ...item.channels,
              [channelId]: {
                ...channel,
                publicationStatus: "offline",
                listingStatus: "delisted",
                lastSyncAt: syncAt,
              },
            },
          };
        }),
      }));
    },
    getProductById: (id) => findProductById(get().products, id),
    getMetrics: () => getProductCenterMetrics(get().products),
    getFilteredProducts: (filters) => filterProductSummaries(get().products, filters),
    getWorkbenchRows: () => getPublicationWorkbenchRows(get().products),
  }));
}
