import { douyinExtensionSections } from "./platform-adapters/douyin-publish.adapter";
import { wechatExtensionSections } from "./platform-adapters/wechat-publish.adapter";
import { platformMeta } from "./platform-meta";
import { createPublishView } from "./publish.mock";
import type { PublishView } from "./publish.types";

export function getPublishView(productId: string): PublishView | undefined {
  const publishView = createPublishView(productId);

  if (!publishView) {
    return undefined;
  }

  return {
    ...publishView,
    platforms: publishView.platforms.map((platform) => ({
      ...platform,
      title: platformMeta[platform.platformId].title,
      summary: platformMeta[platform.platformId].summary,
      extensionSections: platform.platformId === "wechat" ? wechatExtensionSections : douyinExtensionSections,
    })),
  };
}
