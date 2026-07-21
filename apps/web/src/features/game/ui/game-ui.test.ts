import { describe, expect, it } from "vitest";

import { getGrowthPercent, getPlantStage } from "./game-ui";

describe("ambient plant presentation", () => {
  it("requires both slower clear milestones and minimum plant age", () => {
    expect(getPlantStage(999, 30)).toBe("growing");
    expect(getPlantStage(1_000, 2)).toBe("growing");
    expect(getPlantStage(1_000, 3)).toBe("flowering");
    expect(getPlantStage(3_000, 9)).toBe("flowering");
    expect(getPlantStage(3_000, 10)).toBe("fruiting");
    expect(getPlantStage(8_000, 29)).toBe("fruiting");
    expect(getPlantStage(8_000, 30)).toBe("mature");
  });

  it("spreads foliage growth across the multiplied-by-one-hundred curve", () => {
    expect(getGrowthPercent(1)).toBe(0);
    expect(getGrowthPercent(100)).toBe(18);
    expect(getGrowthPercent(1_000)).toBe(55);
    expect(getGrowthPercent(8_000)).toBe(100);
  });
});
