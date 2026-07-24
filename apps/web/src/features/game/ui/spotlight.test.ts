import { describe, expect, it } from "vitest";

import type { PilePiece } from "../engine";
import {
  FULL_FIELD_PROJECTION,
  LANDSCAPE_FIELD_PROJECTION,
  PORTRAIT_FIELD_PROJECTION,
  createFieldProjectionScheduler,
  findNearestRevealedPiece,
  getFieldProjection,
  getRevealedPieceIds,
  isPointerTap,
  moveSpotlight,
  projectFieldPoint,
  unprojectFieldPoint,
  type FieldProjection,
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
  it("reveals only local fish while retaining active semantic and drag targets", () => {
    expect([...getRevealedPieceIds(
      pieces,
      { x: 0.5, y: 0.5 },
      ["far", "missing"],
    )]).toEqual([
      "far",
      "near",
    ]);
    expect(getRevealedPieceIds(pieces, null).size).toBe(0);
  });

  it("keeps a focused fish revealed when the light moves away", () => {
    expect(getRevealedPieceIds(
      pieces,
      { x: 0.85, y: 0.8 },
      ["near"],
    )).toEqual(new Set(["near", "far"]));
  });

  it("retains only the exact guided fish when no pointer light is active", () => {
    expect(getRevealedPieceIds(pieces, null, ["near"])).toEqual(
      new Set(["near"]),
    );
  });

  it("distinguishes a tap from a drag using the shared movement threshold", () => {
    expect(isPointerTap({ x: 10, y: 10 }, { x: 14, y: 14 })).toBe(true);
    expect(isPointerTap({ x: 10, y: 10 }, { x: 17, y: 10 })).toBe(false);
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

  it("reprojects compact surfaces without changing canonical coordinates", () => {
    expect(getFieldProjection(1440, 900)).toBe(LANDSCAPE_FIELD_PROJECTION);
    expect(getFieldProjection(900, 1200)).toBe(PORTRAIT_FIELD_PROJECTION);
    expect(FULL_FIELD_PROJECTION).toEqual({ left: 0, top: 0, width: 1, height: 1 });
    const compact = getFieldProjection(320, 568);
    const canonical = { x: 0.23, y: 0.66 };
    const projected = projectFieldPoint(canonical, compact);

    expect(projected.x).toBeCloseTo(0.23);
    expect(projected.y).toBeCloseTo(0.4884);
    const restored = unprojectFieldPoint(projected, compact);
    expect(restored.x).toBeCloseTo(canonical.x);
    expect(restored.y).toBeCloseTo(canonical.y);
  });

  it("coalesces resize projection commits and cancels pending work", () => {
    const frames = new Map<number, () => void>();
    const cancelled: number[] = [];
    const projections: FieldProjection[] = [];
    let nextFrameId = 1;
    const scheduler = createFieldProjectionScheduler(
      (projection) => projections.push(projection),
      (callback) => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frames.set(frameId, callback);
        return () => {
          cancelled.push(frameId);
          frames.delete(frameId);
        };
      },
    );

    scheduler.schedule(320, 568);
    scheduler.schedule(430, 560);
    scheduler.schedule(Number.NaN, 240);

    expect(frames.size).toBe(1);
    expect(projections).toEqual([]);
    frames.get(1)?.();
    frames.delete(1);
    expect(projections).toEqual([getFieldProjection(430, 560)]);

    scheduler.schedule(320, 240);
    expect(frames.size).toBe(1);
    scheduler.cancel();
    expect(frames.size).toBe(0);
    expect(cancelled).toEqual([2]);
    expect(projections).toHaveLength(1);
  });
});
