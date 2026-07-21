import type { RandomSource } from "./ambient-types";

export class AmbientEngineError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AmbientEngineError";
  }
}
export function createSeededRandom(seed: number): RandomSource {
  if (!Number.isFinite(seed)) {
    throw new AmbientEngineError("The random seed must be finite.");
  }

  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function sampleIndex(random: RandomSource, length: number): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new AmbientEngineError("A sample requires a positive integer length.");
  }

  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new AmbientEngineError(
      "Random sources must return a finite value in the [0, 1) interval.",
    );
  }

  return Math.floor(value * length);
}

export function randomBetween(
  random: RandomSource,
  minimum: number,
  maximum: number,
): number {
  const unit = random();
  if (!Number.isFinite(unit) || unit < 0 || unit >= 1) {
    throw new AmbientEngineError(
      "Random sources must return a finite value in the [0, 1) interval.",
    );
  }
  return minimum + unit * (maximum - minimum);
}
