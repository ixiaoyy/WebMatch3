import { describe, expect, it } from "vitest";

import type { PilePiece } from "../engine";
import {
  findNearestRevealedPiece,
  getRevealedPieceIds,
  moveSpotlight,
} from "./spotlight";

const pieces: readonly PilePiece[] = [
  {
    id: "near",
    kind: "whale",
    pile: { x: 0.5, y: 0.5 },
    spread: { x: 0.5, y: 0.5 },
    rotation: 0,
    scale: 1,
    layer: 0,
  },
  {
    id: "far",
    kind: "koi",
    pile: { x: 0.85, y: 0.8 },
    spread: { x: 0.85, y: 0.8 },
    rotation: 0,
    scale: 1,
    layer: 0,
  },
];

describe("spotlight projection", () => {
  it("reveals only local fish while always retaining a dragged fish", () => {
    expect([...getRevealedPieceIds(pieces, { x: 0.5, y: 0.5 }, "far")]).toEqual([
      "far",
      "near",
    ]);
    expect(getRevealedPieceIds(pieces, null, null).size).toBe(0);
  });

  it("moves and clamps the keyboard light", () => {
    expect(moveSpotlight({ x: 0.93, y: 0.11 }, "right", true).x).toBe(0.94);
    expect(moveSpotlight({ x: 0.93, y: 0.11 }, "up", true).y).toBe(0.1);
  });

  it("chooses the closest revealed semantic target", () => {
    expect(findNearestRevealedPiece(
      pieces,
      new Set(["near", "far"]),
      { x: 0.52, y: 0.52 },
    )?.id).toBe("near");
  });
});
