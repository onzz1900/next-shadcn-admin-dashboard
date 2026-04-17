import { describe, expect, it } from "vitest";

import { getChannelPrimaryStatusMeta } from "./channel-status";

describe("getChannelPrimaryStatusMeta", () => {
  it("prioritizes sync errors over field completeness", () => {
    expect(
      getChannelPrimaryStatusMeta({
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "delisted",
        missingFields: [],
      }),
    ).toEqual({
      label: "同步失败",
      variant: "destructive",
    });
  });

  it("shows in review before ready state", () => {
    expect(
      getChannelPrimaryStatusMeta({
        publicationStatus: "in_review",
        auditStatus: "pending",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      label: "审核中",
      variant: "outline",
    });
  });

  it("shows missing fields when content is incomplete", () => {
    expect(
      getChannelPrimaryStatusMeta({
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: ["商品轮播图", "运费模板"],
      }),
    ).toEqual({
      label: "缺 2 项",
      variant: "destructive",
    });
  });

  it("supports channel-prefixed labels", () => {
    expect(
      getChannelPrimaryStatusMeta(
        {
          publicationStatus: "ready_to_list",
          auditStatus: "approved",
          listingStatus: "not_listed",
          missingFields: [],
        },
        { channelLabel: "抖音" },
      ),
    ).toEqual({
      label: "抖音待上架",
      variant: "secondary",
    });
  });
});
