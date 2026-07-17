export type Match3EngineErrorCode =
  | "invalid-config"
  | "invalid-board"
  | "invalid-random-value"
  | "generation-failed"
  | "cascade-limit-exceeded";

export class Match3EngineError extends Error {
  readonly code: Match3EngineErrorCode;

  constructor(code: Match3EngineErrorCode, message: string) {
    super(message);
    this.name = "Match3EngineError";
    this.code = code;
  }
}
