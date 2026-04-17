import { describe, expect, it } from "vitest";

import type { ChannelFieldDraft } from "../../../_lib/product-center-editing.types";
import { countChannelFieldErrors } from "./channel-field-editor";

describe("countChannelFieldErrors", () => {
  it("counts leaf field errors instead of top-level groups", () => {
    const errors = {
      basic: {
        shortTitle: { type: "required", message: "带货短标题不能为空" },
        recommendedScene: { type: "required", message: "推荐场景不能为空" },
      },
      media: {
        salesVideo: { type: "required", message: "卖点视频不能为空" },
      },
    } satisfies Partial<Record<keyof ChannelFieldDraft, Record<string, { type: string; message: string }>>>;

    expect(countChannelFieldErrors(errors as never)).toBe(3);
  });

  it("counts number, boolean, and nested sku row field errors without being confused by row metadata", () => {
    const errors = {
      fulfillment: {
        weight: { type: "required", message: "重量不能为空" },
      },
      compliance: {
        sevenDayReturn: { type: "required", message: "七天退货不能为空" },
      },
      sku: {
        rows: [
          {
            type: "row",
            message: "SKU 行需要补齐字段",
            fields: {
              stockNum: { type: "required", message: "库存不能为空" },
              thumbImg: { type: "required", message: "缩略图不能为空" },
            },
          },
        ],
      },
    } satisfies Partial<Record<keyof ChannelFieldDraft, unknown>>;

    expect(countChannelFieldErrors(errors as never)).toBe(4);
  });
});
