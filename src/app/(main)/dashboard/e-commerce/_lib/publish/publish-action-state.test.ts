import { describe, expect, it } from "vitest";

import { getPublishActionState } from "./publish-action-state";

describe("publish action state", () => {
  it("prioritizes missing fields", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "missing_fields",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primary: "focus_editor",
      secondary: null,
      hint: "当前平台仍有待补字段，先回到表单补齐后再继续提交流程。",
    });
  });

  it("suggests submit review when the channel is ready but not submitted", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "ready_to_list",
        auditStatus: "not_submitted",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primary: "submit_review",
      secondary: "update_channel",
      hint: "当前字段已齐备，但还未进入审核流程。",
    });
  });

  it("suggests retry sync for failed channels", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "sync_error",
        auditStatus: "approved",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primary: "retry_sync",
      secondary: null,
      hint: "当前渠道存在异常，优先重新同步后再继续后续动作。",
    });
  });

  it("suggests list for ready channels waiting to be listed", () => {
    expect(
      getPublishActionState({
        platformId: "wechat",
        publicationStatus: "ready_to_list",
        auditStatus: "approved",
        listingStatus: "not_listed",
        missingFields: [],
      }),
    ).toEqual({
      primary: "list",
      secondary: "update_channel",
      hint: "当前渠道已完成审核，可以直接上架或先刷新渠道信息。",
    });
  });
});
