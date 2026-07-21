import { describe, expect, it } from "vitest";

import { chooseCatReaction } from "./cat-reactions";

describe("cat reactions", () => {
  it("does not repeat the previous eligible reaction", () => {
    const first = chooseCatReaction("idle", null, () => 0);
    const second = chooseCatReaction("idle", first.id, () => 0);

    expect(second.id).not.toBe(first.id);
  });

  it("keeps full and sleeping copy inside their own state", () => {
    expect(chooseCatReaction("full", null, () => 0).text).toBe("好饱呀");
    expect(chooseCatReaction("sleeping", null, () => 0).text).toBe("呼噜…");
  });
});
