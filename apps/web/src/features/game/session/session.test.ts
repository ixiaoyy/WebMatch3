import { describe, expect, it } from "vitest";

import {
  createSeededRandom,
  DEFAULT_ENGINE_CONFIG,
  executeSwap,
  generateBoard,
  listLegalMoves,
  type MatchGroup,
} from "@/features/game/engine";

import {
  createEmptyProgress,
  DEFAULT_SESSION_CONFIG,
  loadLocalProgress,
  PROGRESS_STORAGE_KEY,
  recordCompletedGame,
  safeAdd,
  saveLocalProgress,
  scoreCascadeRound,
  selectLeaderboard,
  validatePlayerName,
  type LeaderboardEntry,
  type LocalProgress,
  type ProgressStorage,
  type SessionConfig,
} from ".";

function coordinates(count: number) {
  return Array.from({ length: count }, (_, column) => ({ row: 0, column }));
}

describe("player name", () => {
  it("normalizes whitespace and accepts Unicode names", () => {
    expect(validatePlayerName("  小 明  ")).toEqual({
      ok: true,
      playerName: "小 明",
    });
    expect(validatePlayerName(" 🎮玩家 ")).toEqual({
      ok: true,
      playerName: "🎮玩家",
    });
  });

  it("rejects empty and overlong names by Unicode code point", () => {
    expect(validatePlayerName(" \n ")).toMatchObject({
      ok: false,
      reason: "empty",
    });
    expect(validatePlayerName("一二三四五六七八九十一二三")).toMatchObject({
      ok: false,
      reason: "too-long",
    });
  });
});

describe("cascade scoring", () => {
  it("scores unique tiles without double-counting an intersection", () => {
    const horizontal: MatchGroup = {
      axis: "horizontal",
      coordinates: [
        { row: 1, column: 0 },
        { row: 1, column: 1 },
        { row: 1, column: 2 },
      ],
    };
    const vertical: MatchGroup = {
      axis: "vertical",
      coordinates: [
        { row: 0, column: 1 },
        { row: 1, column: 1 },
        { row: 2, column: 1 },
      ],
    };
    const result = scoreCascadeRound({
      index: 1,
      matches: {
        groups: [horizontal, vertical],
        coordinates: [
          { row: 0, column: 1 },
          { row: 1, column: 0 },
          { row: 1, column: 1 },
          { row: 1, column: 2 },
          { row: 2, column: 1 },
        ],
      },
    });

    expect(result).toEqual({
      basePoints: 500,
      longMatchBonus: 0,
      multiGroupBonus: 150,
      multiplier: 1,
      total: 650,
    });
  });

  it("adds long-match bonuses and multiplies later cascades", () => {
    const result = scoreCascadeRound({
      index: 3,
      matches: {
        groups: [
          { axis: "horizontal", coordinates: coordinates(5) },
          { axis: "vertical", coordinates: coordinates(4) },
        ],
        coordinates: coordinates(7),
      },
    });

    expect(result).toEqual({
      basePoints: 700,
      longMatchBonus: 225,
      multiGroupBonus: 150,
      multiplier: 3,
      total: 3_225,
    });
  });

  it("saturates score addition at the safe integer limit", () => {
    expect(safeAdd(Number.MAX_SAFE_INTEGER - 10, 20)).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(
      scoreCascadeRound(
        {
          index: Number.MAX_SAFE_INTEGER,
          matches: {
            groups: [
              { axis: "horizontal", coordinates: coordinates(3) },
            ],
            coordinates: coordinates(3),
          },
        },
        DEFAULT_SESSION_CONFIG,
      ).total,
    ).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("difficulty calibration", () => {
  it("keeps the target in a reasonable fixed-seed completion band", () => {
    const scores = Array.from({ length: 100 }, (_, index) =>
      simulateSession(index + 1),
    ).sort((first, second) => first - second);
    const at = (percentile: number) =>
      scores[Math.floor((scores.length - 1) * percentile)] ?? 0;
    const wins = scores.filter(
      (score) => score >= DEFAULT_SESSION_CONFIG.targetScore,
    ).length;

    expect(DEFAULT_SESSION_CONFIG.targetScore).toBe(12_000);
    expect(at(0.4)).toBeLessThanOrEqual(
      DEFAULT_SESSION_CONFIG.targetScore,
    );
    expect(at(0.6)).toBeGreaterThanOrEqual(
      DEFAULT_SESSION_CONFIG.targetScore,
    );
    expect(wins).toBeGreaterThanOrEqual(50);
    expect(wins).toBeLessThanOrEqual(70);
  });
});

function simulateSession(seed: number): number {
  const random = createSeededRandom(seed);
  let board = generateBoard(DEFAULT_ENGINE_CONFIG, random).board;
  let score = 0;

  for (let moveIndex = 0; moveIndex < 18; moveIndex += 1) {
    const legalMoves = listLegalMoves(board);
    const move = legalMoves[Math.floor(random() * legalMoves.length)];
    if (!move) {
      throw new Error("Expected every generated board to have a legal move.");
    }

    const result = executeSwap(board, move.from, move.to, random);
    if (result.kind !== "resolved") {
      throw new Error("Expected a listed legal move to resolve.");
    }
    for (const round of result.cascades) {
      score = safeAdd(
        score,
        scoreCascadeRound(round, DEFAULT_SESSION_CONFIG).total,
      );
    }
    board = result.board;
  }

  return score;
}

class MemoryStorage implements ProgressStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const baseEntry: LeaderboardEntry = {
  playerName: "小明",
  score: 5_000,
  bestCombo: 2,
  completedAt: "2026-07-17T10:00:00.000Z",
  outcome: "lost",
};

function entry(
  playerName: string,
  score: number,
  completedAt: string,
  overrides: Partial<LeaderboardEntry> = {},
): LeaderboardEntry {
  return {
    ...baseEntry,
    playerName,
    score,
    completedAt,
    ...overrides,
  };
}

function localIso(
  year: number,
  month: number,
  day: number,
  hour = 12,
): string {
  return new Date(year, month, day, hour).toISOString();
}

function recordAll(
  entries: readonly LeaderboardEntry[],
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): LocalProgress {
  return entries.reduce(
    (progress, item) => recordCompletedGame(progress, item, config).progress,
    createEmptyProgress(),
  );
}

describe("local progress storage", () => {
  it("round-trips a validated versioned record", () => {
    const storage = new MemoryStorage();
    const recorded = recordCompletedGame(createEmptyProgress(), baseEntry);

    expect(saveLocalProgress(storage, recorded.progress)).toBe(true);
    expect(loadLocalProgress(storage)).toEqual(recorded.progress);
    expect(recorded.progress.history).toEqual([baseEntry]);
  });

  it("rejects an invalid completed record before changing progress", () => {
    const progress = createEmptyProgress();
    const invalidEntry = { ...baseEntry, score: -1 };

    expect(() => recordCompletedGame(progress, invalidEntry)).toThrow(
      TypeError,
    );
    expect(progress).toEqual(createEmptyProgress());
  });

  it("migrates a legacy v1 snapshot and uses its ranking as history", () => {
    const storage = new MemoryStorage();
    const legacyEntries = [
      entry("小明", 9_000, "2026-06-01T10:00:00.000Z"),
      entry("小明", 8_000, "2026-07-01T10:00:00.000Z"),
      entry("小红", 7_000, "2026-07-02T10:00:00.000Z"),
    ];
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        bestScore: 9_000,
        bestCombo: 2,
        lastCompletedAt: "2026-07-02T10:00:00.000Z",
        leaderboard: legacyEntries,
      }),
    );

    const migrated = loadLocalProgress(storage);
    expect(migrated.history).toEqual([
      legacyEntries[2],
      legacyEntries[1],
      legacyEntries[0],
    ]);
    expect(migrated.leaderboard.map(({ playerName }) => playerName)).toEqual([
      "小明",
      "小红",
    ]);
  });

  it("falls back when JSON, the new schema, or storage access is invalid", () => {
    const storage = new MemoryStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, "{broken");
    expect(loadLocalProgress(storage)).toEqual(createEmptyProgress());

    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyProgress(),
        leaderboard: [{ ...baseEntry, score: -1 }],
      }),
    );
    expect(loadLocalProgress(storage)).toEqual(createEmptyProgress());

    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyProgress(),
        history: [
          entry("较早", 100, "2026-07-16T10:00:00.000Z"),
          entry("较新", 200, "2026-07-17T10:00:00.000Z"),
        ],
      }),
    );
    expect(loadLocalProgress(storage)).toEqual(createEmptyProgress());

    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyProgress(),
        leaderboard: [baseEntry, { ...baseEntry, score: 4_000 }],
        history: [baseEntry],
      }),
    );
    expect(loadLocalProgress(storage)).toEqual(createEmptyProgress());

    const smallConfig = {
      ...DEFAULT_SESSION_CONFIG,
      historyLimit: 1,
    };
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createEmptyProgress(),
        history: [
          baseEntry,
          entry("小红", 4_000, "2026-07-16T10:00:00.000Z"),
        ],
      }),
    );
    expect(loadLocalProgress(storage, smallConfig)).toEqual(
      createEmptyProgress(),
    );

    const inaccessible: ProgressStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    expect(loadLocalProgress(inaccessible)).toEqual(createEmptyProgress());
    expect(saveLocalProgress(inaccessible, createEmptyProgress())).toBe(false);
  });

  it("keeps bounded history and a stable unique all-time ranking", () => {
    const config = {
      ...DEFAULT_SESSION_CONFIG,
      leaderboardLimit: 3,
      historyLimit: 4,
    };
    let progress = createEmptyProgress();
    const records = [
      entry("小明", 5_000, "2026-07-10T10:00:00.000Z"),
      entry("小红", 5_000, "2026-07-11T10:00:00.000Z", {
        bestCombo: 4,
      }),
      entry("小蓝", 5_000, "2026-07-09T10:00:00.000Z"),
      entry("小明", 6_000, "2026-07-12T10:00:00.000Z"),
      entry("小绿", 4_000, "2026-07-13T10:00:00.000Z"),
    ];
    for (const item of records) {
      progress = recordCompletedGame(progress, item, config).progress;
    }

    expect(progress.history).toEqual([
      records[4],
      records[3],
      records[1],
      records[0],
    ]);
    expect(progress.leaderboard.map(({ playerName }) => playerName)).toEqual([
      "小明",
      "小红",
      "小蓝",
    ]);
    expect(progress.leaderboard[0]).toBe(records[3]);

    const lowerPersonalScore = recordCompletedGame(
      progress,
      entry("小明", 1_000, "2026-07-14T10:00:00.000Z"),
      config,
    );
    expect(lowerPersonalScore.rank).toBeNull();
    expect(lowerPersonalScore.progress.leaderboard[0]).toBe(records[3]);

    const higherPersonalScore = recordCompletedGame(
      progress,
      entry("小明", 7_000, "2026-07-14T11:00:00.000Z"),
      config,
    );
    expect(higherPersonalScore.rank).toBe(1);
    expect(higherPersonalScore.progress.leaderboard[0].score).toBe(7_000);
  });

  it("keeps a stable top ten by score, combo, then completion time", () => {
    let progress = createEmptyProgress();
    for (let index = 0; index < 12; index += 1) {
      progress = recordCompletedGame(progress, {
        ...baseEntry,
        playerName: `玩家${index}`,
        score: index < 2 ? 5_000 : index * 1_000,
        bestCombo: index,
        completedAt: new Date(
          Date.UTC(2026, 6, 17, 10, index),
        ).toISOString(),
      }).progress;
    }

    expect(progress.leaderboard).toHaveLength(10);
    expect(progress.leaderboard[0].score).toBe(11_000);
    expect(progress.leaderboard[0].playerName).toBe("玩家11");
    expect(progress.leaderboard.at(-1)?.score).toBe(4_000);

    const tied = recordCompletedGame(createEmptyProgress(), baseEntry);
    const laterHighCombo = recordCompletedGame(tied.progress, {
      ...baseEntry,
      playerName: "小红",
      bestCombo: 4,
      completedAt: "2026-07-17T11:00:00.000Z",
    });
    expect(laterHighCombo.progress.leaderboard.map((entry) => entry.playerName))
      .toEqual(["小红", "小明"]);
    expect(laterHighCombo.rank).toBe(1);
  });

  it("reports null when a completed personal best is outside the top ten", () => {
    let progress = createEmptyProgress();
    for (let index = 0; index < 10; index += 1) {
      progress = recordCompletedGame(progress, {
        ...baseEntry,
        playerName: `高手${index}`,
        score: 20_000 - index * 500,
        completedAt: new Date(
          Date.UTC(2026, 6, 17, 8, index),
        ).toISOString(),
      }).progress;
    }
    const result = recordCompletedGame(progress, {
      ...baseEntry,
      playerName: "新手",
      score: 100,
      completedAt: "2026-07-17T12:00:00.000Z",
    });

    expect(result.rank).toBeNull();
    expect(result.progress.leaderboard).toHaveLength(10);
    expect(result.isNewBest).toBe(false);
  });
});

describe("leaderboard periods", () => {
  it("filters the current local Monday-to-Sunday week and calendar month", () => {
    const now = new Date(2026, 6, 15, 12);
    const progress = recordAll([
      entry("上月", 9_500, localIso(2026, 5, 30)),
      entry("上周", 9_000, localIso(2026, 6, 12)),
      entry("周一", 6_000, localIso(2026, 6, 13)),
      entry("周日", 5_000, localIso(2026, 6, 19)),
      entry("下周", 8_000, localIso(2026, 6, 20)),
      entry("下月", 9_900, localIso(2026, 7, 1)),
    ]);

    expect(
      selectLeaderboard(progress, "week", now).map(
        ({ playerName }) => playerName,
      ),
    ).toEqual(["周一", "周日"]);
    expect(
      selectLeaderboard(progress, "month", now).map(
        ({ playerName }) => playerName,
      ),
    ).toEqual(["上周", "下周", "周一", "周日"]);
    expect(
      selectLeaderboard(progress, "all", now).map(
        ({ playerName }) => playerName,
      ),
    ).toEqual(["下月", "上月", "上周", "下周", "周一", "周日"]);
  });

  it("keeps each exact normalized player name's best entry per period", () => {
    const now = new Date(2026, 6, 15, 12);
    const progress = recordAll([
      entry("小明", 9_000, localIso(2026, 5, 20)),
      entry("小明", 2_000, localIso(2026, 6, 13)),
      entry("小明", 4_000, localIso(2026, 6, 14)),
      entry("小 明", 3_000, localIso(2026, 6, 15)),
    ]);

    expect(selectLeaderboard(progress, "week", now)).toMatchObject([
      { playerName: "小明", score: 4_000 },
      { playerName: "小 明", score: 3_000 },
    ]);
    expect(selectLeaderboard(progress, "all", now)).toMatchObject([
      { playerName: "小明", score: 9_000 },
      { playerName: "小 明", score: 3_000 },
    ]);
  });

  it("orders score, combo, time, then original order and caps at ten", () => {
    const now = new Date(2026, 6, 15, 12);
    const sameTime = localIso(2026, 6, 15);
    const entries = [
      entry("较晚", 5_000, localIso(2026, 6, 16)),
      entry("高连击", 5_000, localIso(2026, 6, 17), { bestCombo: 4 }),
      entry("较早", 5_000, localIso(2026, 6, 14)),
      entry("同序一", 4_000, sameTime),
      entry("同序二", 4_000, sameTime),
      ...Array.from({ length: 8 }, (_, index) =>
        entry(
          `补位${index}`,
          3_000 - index,
          localIso(2026, 6, 15, index),
        ),
      ),
    ];
    const progress = recordAll(entries);

    expect(
      selectLeaderboard(progress, "month", now).map(
        ({ playerName }) => playerName,
      ),
    ).toEqual([
      "高连击",
      "较早",
      "较晚",
      "同序一",
      "同序二",
      "补位0",
      "补位1",
      "补位2",
      "补位3",
      "补位4",
    ]);
  });

  it("preserves an old all-time best after it falls out of recent history", () => {
    const config = {
      ...DEFAULT_SESSION_CONFIG,
      leaderboardLimit: 10,
      historyLimit: 2,
    };
    const progress = recordAll(
      [
        entry("老高手", 20_000, "2025-01-01T10:00:00.000Z"),
        entry("新玩家", 5_000, "2026-07-16T10:00:00.000Z"),
        entry("又一位", 4_000, "2026-07-17T10:00:00.000Z"),
      ],
      config,
    );

    expect(progress.history.map(({ playerName }) => playerName)).toEqual([
      "又一位",
      "新玩家",
    ]);
    expect(
      selectLeaderboard(
        progress,
        "all",
        new Date(2026, 6, 17),
        config,
      )[0]?.playerName,
    ).toBe("老高手");
  });

  it("rejects an invalid selection date", () => {
    expect(() =>
      selectLeaderboard(createEmptyProgress(), "week", new Date("invalid")),
    ).toThrow(RangeError);
  });
});
