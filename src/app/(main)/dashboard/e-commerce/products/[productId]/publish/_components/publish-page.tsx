"use client";

import { useState } from "react";

import type { ChannelId } from "../../../../_lib/product-center.types";
import { createDouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic";
import type { DouyinDynamicPanelState } from "../../../../_lib/publish/douyin-dynamic.types";
import type { PublishView } from "../../../../_lib/publish/publish.types";
import { CommonPublishSections } from "./common-publish-sections";
import { PlatformPublishPanel } from "./platform-publish-panel";
import { PublishHeader } from "./publish-header";
import { PublishValidationSummary } from "./publish-validation-summary";

interface PublishPageProps {
  publishView: PublishView;
}

export function PublishPage({ publishView }: PublishPageProps) {
  const [activePlatform, setActivePlatform] = useState<ChannelId>(publishView.platforms[0]?.platformId ?? "wechat");
  const [douyinState, setDouyinState] = useState<DouyinDynamicPanelState>(() => createDouyinDynamicPanelState());

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PublishHeader publishView={publishView} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CommonPublishSections publishView={publishView} />
          <PlatformPublishPanel
            publishView={publishView}
            activePlatform={activePlatform}
            onActivePlatformChange={setActivePlatform}
            douyinState={douyinState}
            onDouyinStateChange={setDouyinState}
          />
        </div>
        <PublishValidationSummary publishView={publishView} activePlatform={activePlatform} douyinState={douyinState} />
      </div>
    </div>
  );
}
