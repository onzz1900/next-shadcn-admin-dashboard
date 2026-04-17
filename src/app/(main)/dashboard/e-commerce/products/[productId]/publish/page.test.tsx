import { isValidElement } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

import { notFound } from "next/navigation";

import Page from "./page";

describe("product publish route", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("returns the publish page element for an existing product", async () => {
    const element = await Page({
      params: Promise.resolve({ productId: "spu-hanger-coffee" }),
    });

    expect(notFound).not.toHaveBeenCalled();
    expect(isValidElement(element)).toBe(true);
  });

  it("calls notFound for an unknown product", async () => {
    await expect(
      Page({
        params: Promise.resolve({ productId: "missing-product" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
