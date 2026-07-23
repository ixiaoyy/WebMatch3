import { describe, expect, it } from "vitest";

import {
  createInitialState,
  createSeededRandom,
  getBlockerIds,
} from "../engine";
import {
  getFishAccessibleLabel,
  getCatPresentation,
  getGrowthPercent,
  getHigherOverlapCounts,
  getIntroTargetIds,
  getFishPresentation,
  getPlantStage,
  getPlantStagePresentation,
  getTrayPressure,
  projectGameFeedback,
  shouldStartIntro,
} from "./game-ui";

describe("fish spatial accessibility", () => {
  it("describes one-based layer, higher overlaps, and the current actions", () => {
    expect(getFishAccessibleLabel({
      kind: "koi",
      layer: 2,
      higherOverlapCount: 0,
      feedable: true,
    })).toBe(
      "白红毛毡锦鲤，第3层，上方没有小鱼重叠；Enter或空格放入托盘，按F喂给小猫",
    );
    expect(getFishAccessibleLabel({
      kind: "whale",
      layer: 0,
      higherOverlapCount: 1,
      feedable: false,
    })).toBe(
      "蓝色毛毡鲸鱼，第1层，上方有1条小鱼重叠；Enter或空格放入托盘；小猫正在休息，按F可听取提示",
    );
    expect(getFishAccessibleLabel({
      kind: "betta",
      layer: 1,
      higherOverlapCount: 2,
      feedable: true,
    })).toContain("第2层，上方有2条小鱼重叠");
  });

  it("reprojects overlap counts from the current remaining pieces", () => {
    const pieces = createInitialState(createSeededRandom(38)).pieces;
    const lowerPiece = pieces.find(
      (piece) => getBlockerIds(pieces, piece.id).length > 0,
    );
    expect(lowerPiece).toBeDefined();
    if (!lowerPiece) return;

    const blockerId = getBlockerIds(pieces, lowerPiece.id)[0];
    expect(blockerId).toBeDefined();
    if (!blockerId) return;

    const before = getHigherOverlapCounts(pieces);
    const remainingPieces = pieces.filter((piece) => piece.id !== blockerId);
    const after = getHigherOverlapCounts(remainingPieces);

    expect(after.get(lowerPiece.id)).toBe(
      (before.get(lowerPiece.id) ?? 0) - 1,
    );
    expect(getFishAccessibleLabel({
      kind: lowerPiece.kind,
      layer: lowerPiece.layer,
      higherOverlapCount: after.get(lowerPiece.id) ?? 0,
      feedable: true,
    })).not.toBe(getFishAccessibleLabel({
      kind: lowerPiece.kind,
      layer: lowerPiece.layer,
      higherOverlapCount: before.get(lowerPiece.id) ?? 0,
      feedable: true,
    }));
  });
});

describe("interaction feedback projection", () => {
  it("distinguishes tray risk without turning ordinary occupancy into warning", () => {
    expect([0, 1, 4].map(getTrayPressure)).toEqual(["calm", "calm", "calm"]);
    expect(getTrayPressure(5)).toBe("caution");
    expect(getTrayPressure(6)).toBe("critical");
    expect(getTrayPressure(7)).toBe("lost");
  });

  it("keeps settle separate from plant clear and only locks terminal transitions", () => {
    expect(projectGameFeedback("clear")).toMatchObject({
      celebratesPlant: true,
      locksInput: false,
    });
    expect(projectGameFeedback("settle")).toMatchObject({
      celebratesPlant: false,
      locksInput: false,
    });
    expect(projectGameFeedback("level")).toMatchObject({
      levelArriving: true,
      locksInput: true,
    });
    expect(projectGameFeedback("loss")).toMatchObject({
      loss: true,
      locksInput: true,
    });
    expect(projectGameFeedback("feed").catFeedResponse).toBe("accepted");
    expect(projectGameFeedback("feed-rejected").catFeedResponse).toBe("rejected");
  });

  it("targets one cross-layer match and starts only from untouched state", () => {
    const game = createInitialState(createSeededRandom(38));
    const targetIds = getIntroTargetIds(game.pieces);
    const targets = game.pieces.filter((piece) => targetIds.includes(piece.id));

    expect(targetIds).toHaveLength(3);
    expect(new Set(targets.map((piece) => piece.kind)).size).toBe(1);
    expect(new Set(targets.map((piece) => piece.layer)).size).toBeGreaterThan(1);
    expect(shouldStartIntro(game, null)).toBe(true);
    expect(shouldStartIntro({ ...game, clearCount: 1 }, null)).toBe(false);
    expect(shouldStartIntro({
      ...game,
      tray: [{ id: "used", kind: "whale" }],
    }, null)).toBe(false);
    expect(shouldStartIntro({
      ...game,
      fed: [{ id: "fed", kind: "koi", settled: false }],
    }, null)).toBe(false);
    expect(shouldStartIntro({ ...game, level: 2 }, null)).toBe(false);
    expect(shouldStartIntro({ ...game, nextPieceId: game.nextPieceId + 36 }, null))
      .toBe(false);
    expect(shouldStartIntro(game, targetIds[0])).toBe(false);
  });

  it("selects a cross-layer intro triple for every validated initial seed", () => {
    for (let seed = 1; seed <= 64; seed += 1) {
      const game = createInitialState(createSeededRandom(seed));
      const targetIds = getIntroTargetIds(game.pieces);
      const targets = targetIds.map((pieceId) =>
        game.pieces.find((piece) => piece.id === pieceId)
      );

      expect(targets, `seed ${seed} has three intro targets`).toHaveLength(3);
      expect(targets.every(Boolean), `seed ${seed} resolves every target`).toBe(true);
      expect(
        new Set(targets.map((piece) => piece?.kind)).size,
        `seed ${seed} uses one fish kind`,
      ).toBe(1);
      expect(
        new Set(targets.map((piece) => piece?.layer)).size,
        `seed ${seed} spans layers`,
      ).toBeGreaterThan(1);
      expect(shouldStartIntro(game, null)).toBe(true);
    }
  });
});

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

  it("grows continuously from the first clear to the first-field milestone", () => {
    expect(getGrowthPercent(0)).toBe(0);
    expect(getGrowthPercent(1)).toBe(4);
    expect(getGrowthPercent(2)).toBeGreaterThan(getGrowthPercent(1));
    expect(getGrowthPercent(11)).toBeLessThan(18);
    expect(getGrowthPercent(12)).toBe(18);
    expect(getGrowthPercent(100)).toBe(30);
    expect(getGrowthPercent(1_000)).toBe(67);
    expect(getGrowthPercent(8_000)).toBe(100);
    expect(getGrowthPercent(10_000)).toBe(101);
    expect(getGrowthPercent(16_000)).toBe(104);
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
