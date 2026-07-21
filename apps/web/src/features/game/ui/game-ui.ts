import type { FishKind } from "../engine";

import catEatingUrl from "./assets/cat/cat-eating.png";
import catFullUrl from "./assets/cat/cat-full.png";
import catIdleUrl from "./assets/cat/cat-idle.png";
import catLyingUrl from "./assets/cat/cat-lying.png";
import catSleepingUrl from "./assets/cat/cat-sleeping.png";
import fishAngelfishUrl from "./assets/fish/fish-angelfish.png";
import fishBettaUrl from "./assets/fish/fish-betta.png";
import fishClownfishUrl from "./assets/fish/fish-clownfish.png";
import fishGoldfishUrl from "./assets/fish/fish-goldfish.png";
import fishKoiUrl from "./assets/fish/fish-koi.png";
import fishPufferUrl from "./assets/fish/fish-puffer.png";
import fishSardineUrl from "./assets/fish/fish-sardine.png";
import fishWhaleUrl from "./assets/fish/fish-whale.png";
import plantStageBudUrl from "./assets/ambient/plant-stage-bud.webp";
import plantStageLilyOfTheValleyUrl from "./assets/ambient/plant-stage-lily-of-the-valley.webp";
import plantStagePeonyUrl from "./assets/ambient/plant-stage-peony.webp";
import plantStagePomegranateUrl from "./assets/ambient/plant-stage-pomegranate.webp";

export type FocusDirection = "up" | "right" | "down" | "left";
export type PlantStage = "growing" | "flowering" | "fruiting" | "mature";
export type CatPose = "idle" | "eating" | "full" | "lying" | "sleeping";

export interface FishPresentation {
  readonly label: string;
  readonly assetUrl: string;
}

export interface PlantStagePresentation {
  readonly label: string;
  readonly assetUrl: string;
}

export interface CatPresentation {
  readonly label: string;
  readonly assetUrl: string;
}

const PRESENTATIONS: Readonly<Record<FishKind, FishPresentation>> = {
  whale: { label: "蓝色毛毡鲸鱼", assetUrl: fishWhaleUrl },
  koi: { label: "白红毛毡锦鲤", assetUrl: fishKoiUrl },
  sardine: { label: "蓝色斑点毛毡沙丁鱼", assetUrl: fishSardineUrl },
  pufferfish: { label: "赭黄色圆鼓毛毡河豚", assetUrl: fishPufferUrl },
  goldfish: { label: "橙白毛毡金鱼", assetUrl: fishGoldfishUrl },
  clownfish: { label: "橙白条纹毛毡小丑鱼", assetUrl: fishClownfishUrl },
  angelfish: { label: "黄黑长鳍毛毡神仙鱼", assetUrl: fishAngelfishUrl },
  betta: { label: "蓝紫长鳍毛毡斗鱼", assetUrl: fishBettaUrl },
};

const PLANT_STAGE_PRESENTATIONS: Readonly<Record<PlantStage, PlantStagePresentation>> = {
  growing: { label: "Growing plant", assetUrl: plantStageBudUrl },
  flowering: { label: "Flowering plant", assetUrl: plantStageLilyOfTheValleyUrl },
  fruiting: { label: "Fruiting plant", assetUrl: plantStagePomegranateUrl },
  mature: { label: "Mature plant", assetUrl: plantStagePeonyUrl },
};

const CAT_PRESENTATIONS: Readonly<Record<CatPose, CatPresentation>> = {
  idle: { label: "橘色毛毡猫安静地站着", assetUrl: catIdleUrl },
  eating: { label: "橘色毛毡猫开心地吃东西", assetUrl: catEatingUrl },
  full: { label: "橘色毛毡猫吃饱了，双爪捧着肚子", assetUrl: catFullUrl },
  lying: { label: "橘色毛毡猫清醒地趴着休息", assetUrl: catLyingUrl },
  sleeping: { label: "橘色毛毡猫正趴着睡觉", assetUrl: catSleepingUrl },
};

export function getFishPresentation(kind: FishKind): FishPresentation {
  return PRESENTATIONS[kind];
}

export function getPlantStagePresentation(stage: PlantStage): PlantStagePresentation {
  return PLANT_STAGE_PRESENTATIONS[stage];
}

export function getCatPresentation(pose: CatPose): CatPresentation {
  return CAT_PRESENTATIONS[pose];
}

export function getGrowthPercent(clearCount: number): number {
  const milestones = [0, 100, 300, 600, 1_000, 1_800, 3_000, 5_000, 8_000] as const;
  let stage = 0;
  for (let index = 0; index < milestones.length; index += 1) {
    if (clearCount >= milestones[index]) stage = index;
  }
  const base = [0, 18, 30, 42, 55, 67, 78, 90, 100][stage];
  if (clearCount <= 8_000) return base;
  return Math.min(104, base + Math.floor((clearCount - 8_000) / 2_000));
}

export function getPlantStage(clearCount: number, ageDays: number): PlantStage {
  if (clearCount >= 8_000 && ageDays >= 30) return "mature";
  if (clearCount >= 3_000 && ageDays >= 10) return "fruiting";
  if (clearCount >= 1_000 && ageDays >= 3) return "flowering";
  return "growing";
}
