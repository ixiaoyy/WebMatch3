import { describe, expect, it } from "vitest";

import {
  getCatPresentation,
  getGrowthPercent,
  getFishPresentation,
  getPlantStage,
  getPlantStagePresentation,
} from "./game-ui";

describe("felt fish presentation", () => {
  it("maps every registered kind to one distinct asset and descriptive label", () => {
    const kinds = [
      "whale",
      "koi",
      "sardine",
      "pufferfish",
      "goldfish",
      "clownfish",
      "angelfish",
      "betta",
    ] as const;
    const presentations = kinds.map(getFishPresentation);

    expect(new Set(presentations.map(({ assetUrl }) => assetUrl)).size).toBe(8);
    expect(presentations.map(({ label }) => label)).toEqual([
      "蓝色毛毡鲸鱼",
      "白红毛毡锦鲤",
      "蓝色斑点毛毡沙丁鱼",
      "赭黄色圆鼓毛毡河豚",
      "橙白毛毡金鱼",
      "橙白条纹毛毡小丑鱼",
      "黄黑长鳍毛毡神仙鱼",
      "蓝紫长鳍毛毡斗鱼",
    ]);
  });
});

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

  it("maps every stage to a distinct non-numeric flower presentation", () => {
    const stages = ["growing", "flowering", "fruiting", "mature"] as const;
    const presentations = stages.map(getPlantStagePresentation);

    expect(new Set(presentations.map(({ assetUrl }) => assetUrl)).size).toBe(4);
    expect(presentations.map(({ label }) => label)).toEqual([
      "Growing plant",
      "Flowering plant",
      "Fruiting plant",
      "Mature plant",
    ]);
  });
});

describe("cat companion presentation", () => {
  it("maps every stable pose to a distinct asset and descriptive label", () => {
    const poses = ["idle", "eating", "full", "lying", "sleeping"] as const;
    const presentations = poses.map(getCatPresentation);

    expect(new Set(presentations.map(({ assetUrl }) => assetUrl)).size).toBe(5);
    expect(presentations.map(({ label }) => label)).toEqual([
      "橘色毛毡猫安静地站着",
      "橘色毛毡猫开心地吃东西",
      "橘色毛毡猫吃饱了，双爪捧着肚子",
      "橘色毛毡猫清醒地趴着休息",
      "橘色毛毡猫正趴着睡觉",
    ]);
  });
});
