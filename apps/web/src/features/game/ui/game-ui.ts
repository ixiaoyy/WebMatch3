import type { JellyKind } from "../engine";

import jellyAmberUrl from "./assets/ambient/jelly-amber.webp";
import jellyAquaUrl from "./assets/ambient/jelly-aqua.webp";
import jellyLimeUrl from "./assets/ambient/jelly-lime.webp";
import jellyRoseUrl from "./assets/ambient/jelly-rose.webp";

export type FocusDirection = "up" | "right" | "down" | "left";
export type PlantStage = "growing" | "flowering" | "fruiting" | "mature";

export interface JellyPresentation {
  readonly label: string;
  readonly assetUrl: string;
}

const PRESENTATIONS: Readonly<Record<JellyKind, JellyPresentation>> = {
  aqua: { label: "水蓝圆形果冻", assetUrl: jellyAquaUrl },
  amber: { label: "琥珀水滴果冻", assetUrl: jellyAmberUrl },
  lime: { label: "青柠叶片果冻", assetUrl: jellyLimeUrl },
  rose: { label: "玫瑰心形果冻", assetUrl: jellyRoseUrl },
};

export function getJellyPresentation(kind: JellyKind): JellyPresentation {
  return PRESENTATIONS[kind];
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
