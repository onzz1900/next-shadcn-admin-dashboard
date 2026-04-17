import type { ChannelId } from "../product-center.types";

export interface PublishPlatformMeta {
  title: string;
  summary: string;
}

export const platformMeta: Record<ChannelId, PublishPlatformMeta> = {
  douyin: {
    title: "抖店配置",
    summary: "保留抖店平台专属入口。",
  },
  wechat: {
    title: "视频号配置",
    summary: "维护视频号平台专属入口。",
  },
};
