"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ChannelId } from "../../../../_lib/product-center.types";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import type { PublishView } from "../../../../_lib/publish/publish.types";
import { DouyinPlatformPanel } from "./douyin-platform-panel";
import { WechatPublishPanel } from "./wechat-publish-panel";

interface PlatformPublishPanelProps {
  publishView: PublishView;
  activePlatform: ChannelId;
  onActivePlatformChange: (platformId: ChannelId) => void;
  douyinState: DouyinDynamicPanelState;
  onDouyinStateChange: (nextState: DouyinDynamicPanelState) => void;
}

export function PlatformPublishPanel({
  publishView,
  activePlatform,
  onActivePlatformChange,
  douyinState,
  onDouyinStateChange,
}: PlatformPublishPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>平台配置</CardTitle>
        <CardDescription>在这里切换平台扩展区，后续会继续拆分平台专属能力。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activePlatform}
          onValueChange={(value) => onActivePlatformChange(value as ChannelId)}
          className="w-full"
        >
          <TabsList className="mb-4 w-full">
            {publishView.platforms.map((platform) => (
              <TabsTrigger key={platform.platformId} value={platform.platformId}>
                {platform.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {publishView.platforms.map((platform) => {
            return (
              <TabsContent key={platform.platformId} value={platform.platformId}>
                <div id={`channel-${platform.platformId}-editor`} tabIndex={-1} className="grid gap-3 outline-none">
                  {platform.platformId === "wechat" ? (
                    <WechatPublishPanel publishView={publishView} />
                  ) : (
                    <DouyinPlatformPanel state={douyinState} onStateChange={onDouyinStateChange} />
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
