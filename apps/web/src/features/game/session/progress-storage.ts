import { DEFAULT_SESSION_CONFIG } from "./config";
import { validatePlayerName } from "./player";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LocalProgress,
  SessionConfig,
} from "./types";

export const PROGRESS_STORAGE_KEY = "web-match3:progress";

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CompletedGameRecord {
  readonly progress: LocalProgress;
  readonly isNewBest: boolean;
  readonly rank: number | null;
}

interface RankedCandidate {
  readonly entry: LeaderboardEntry;
  readonly index: number;
  readonly isRecordedEntry: boolean;
}

export function createEmptyProgress(): LocalProgress {
  return {
    version: 1,
    bestScore: 0,
    bestCombo: 0,
    lastCompletedAt: null,
    leaderboard: [],
    history: [],
  };
}

export function getDefaultProgressStorage(): ProgressStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadLocalProgress(
  storage: ProgressStorage | null,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): LocalProgress {
  if (storage === null) {
    return createEmptyProgress();
  }

  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (raw === null) {
      return createEmptyProgress();
    }

    const parsed: unknown = JSON.parse(raw);
    if (isLocalProgress(parsed, config)) {
      return parsed;
    }
    if (isLegacyLocalProgress(parsed, config)) {
      return migrateLegacyProgress(parsed, config);
    }
    return createEmptyProgress();
  } catch {
    return createEmptyProgress();
  }
}

export function saveLocalProgress(
  storage: ProgressStorage | null,
  progress: LocalProgress,
): boolean {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function recordCompletedGame(
  progress: LocalProgress,
  entry: LeaderboardEntry,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): CompletedGameRecord {
  if (!isLeaderboardEntry(entry)) {
    throw new TypeError("A completed game contains invalid leaderboard data.");
  }

  const allTimeCandidates = createCandidates(
    [...progress.leaderboard, ...progress.history],
    entry,
  );
  const rankedCandidates = rankUniqueCandidates(allTimeCandidates);
  const retainedCandidates = rankedCandidates.slice(
    0,
    config.leaderboardLimit,
  );
  const recordedIndex = retainedCandidates.findIndex(
    ({ isRecordedEntry }) => isRecordedEntry,
  );
  const history = sortRecentHistory([...progress.history, entry]).slice(
    0,
    config.historyLimit,
  );
  const isNewBest = entry.score > progress.bestScore;

  return {
    progress: {
      version: 1,
      bestScore: Math.max(progress.bestScore, entry.score),
      bestCombo: Math.max(progress.bestCombo, entry.bestCombo),
      lastCompletedAt: entry.completedAt,
      leaderboard: retainedCandidates.map(({ entry: item }) => item),
      history,
    },
    isNewBest,
    rank: recordedIndex === -1 ? null : recordedIndex + 1,
  };
}

export function selectLeaderboard(
  progress: LocalProgress,
  period: LeaderboardPeriod,
  now: Date = new Date(),
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
): readonly LeaderboardEntry[] {
  if (!Number.isFinite(now.getTime())) {
    throw new RangeError("Leaderboard selection requires a valid date.");
  }

  const entries =
    period === "all"
      ? [...progress.leaderboard, ...progress.history]
      : progress.history.filter((entry) =>
          isWithinCurrentPeriod(entry.completedAt, period, now),
        );

  return rankUniqueCandidates(createCandidates(entries))
    .slice(0, config.leaderboardLimit)
    .map(({ entry }) => entry);
}

function migrateLegacyProgress(
  progress: Omit<LocalProgress, "history">,
  config: SessionConfig,
): LocalProgress {
  const legacyEntries = [...progress.leaderboard];
  return {
    ...progress,
    leaderboard: rankUniqueCandidates(createCandidates(legacyEntries))
      .slice(0, config.leaderboardLimit)
      .map(({ entry }) => entry),
    history: sortRecentHistory(legacyEntries).slice(0, config.historyLimit),
  };
}

function createCandidates(
  entries: readonly LeaderboardEntry[],
  recordedEntry?: LeaderboardEntry,
): RankedCandidate[] {
  const candidates = entries.map((entry, index) => ({
    entry,
    index,
    isRecordedEntry: false,
  }));
  if (recordedEntry !== undefined) {
    candidates.push({
      entry: recordedEntry,
      index: candidates.length,
      isRecordedEntry: true,
    });
  }
  return candidates;
}

function rankUniqueCandidates(
  candidates: readonly RankedCandidate[],
): RankedCandidate[] {
  const sorted = [...candidates].sort(compareCandidates);
  const seenPlayers = new Set<string>();

  return sorted.filter(({ entry }) => {
    if (seenPlayers.has(entry.playerName)) {
      return false;
    }
    seenPlayers.add(entry.playerName);
    return true;
  });
}

function compareCandidates(
  first: RankedCandidate,
  second: RankedCandidate,
): number {
  const byRank = compareEntries(first.entry, second.entry);
  return byRank !== 0 ? byRank : first.index - second.index;
}

function sortRecentHistory(
  entries: readonly LeaderboardEntry[],
): LeaderboardEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((first, second) => {
      const byTime = second.entry.completedAt.localeCompare(
        first.entry.completedAt,
      );
      return byTime !== 0 ? byTime : first.index - second.index;
    })
    .map(({ entry }) => entry);
}

function isWithinCurrentPeriod(
  completedAt: string,
  period: Exclude<LeaderboardPeriod, "all">,
  now: Date,
): boolean {
  const [start, end] =
    period === "week" ? localWeekBounds(now) : localMonthBounds(now);
  const timestamp = Date.parse(completedAt);
  return timestamp >= start.getTime() && timestamp < end.getTime();
}

function localWeekBounds(now: Date): readonly [Date, Date] {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return [start, end];
}

function localMonthBounds(now: Date): readonly [Date, Date] {
  return [
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
  ];
}

function isLocalProgress(
  value: unknown,
  config: SessionConfig,
): value is LocalProgress {
  if (!hasValidProgressBase(value, config)) {
    return false;
  }
  if (
    !Array.isArray(value.history) ||
    value.history.length > config.historyLimit ||
    !value.history.every(isLeaderboardEntry)
  ) {
    return false;
  }

  return (
    hasUniquePlayers(value.leaderboard) &&
    isLeaderboardSorted(value.leaderboard) &&
    isHistorySorted(value.history)
  );
}

function isLegacyLocalProgress(
  value: unknown,
  config: SessionConfig,
): value is Omit<LocalProgress, "history"> {
  return (
    hasValidProgressBase(value, config) &&
    !Object.prototype.hasOwnProperty.call(value, "history") &&
    isLeaderboardSorted(value.leaderboard)
  );
}

function hasValidProgressBase(
  value: unknown,
  config: SessionConfig,
): value is Omit<LocalProgress, "history"> & Record<string, unknown> {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isNonNegativeSafeInteger(value.bestScore) &&
    isNonNegativeSafeInteger(value.bestCombo) &&
    isNullableIsoTimestamp(value.lastCompletedAt) &&
    Array.isArray(value.leaderboard) &&
    value.leaderboard.length <= config.leaderboardLimit &&
    value.leaderboard.every(isLeaderboardEntry)
  );
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!isRecord(value)) {
    return false;
  }

  const name =
    typeof value.playerName === "string"
      ? validatePlayerName(value.playerName)
      : null;
  return (
    name?.ok === true &&
    name.playerName === value.playerName &&
    isNonNegativeSafeInteger(value.score) &&
    isNonNegativeSafeInteger(value.bestCombo) &&
    isIsoTimestamp(value.completedAt) &&
    (value.outcome === "won" || value.outcome === "lost")
  );
}

function hasUniquePlayers(entries: readonly LeaderboardEntry[]): boolean {
  return new Set(entries.map(({ playerName }) => playerName)).size ===
    entries.length;
}

function isLeaderboardSorted(entries: readonly LeaderboardEntry[]): boolean {
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1];
    const current = entries[index];
    if (compareEntries(previous, current) > 0) {
      return false;
    }
  }
  return true;
}

function isHistorySorted(entries: readonly LeaderboardEntry[]): boolean {
  for (let index = 1; index < entries.length; index += 1) {
    if (entries[index - 1].completedAt < entries[index].completedAt) {
      return false;
    }
  }
  return true;
}

function compareEntries(
  first: LeaderboardEntry,
  second: LeaderboardEntry,
): number {
  if (first.score !== second.score) {
    return second.score - first.score;
  }
  if (first.bestCombo !== second.bestCombo) {
    return second.bestCombo - first.bestCombo;
  }
  return first.completedAt.localeCompare(second.completedAt);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isNullableIsoTimestamp(value: unknown): value is string | null {
  return value === null || isIsoTimestamp(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}
