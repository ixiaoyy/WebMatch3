import type { RandomSource } from "../engine";

export type CatReactionContext =
  | "idle"
  | "fed"
  | "full"
  | "sleeping"
  | "searching"
  | "guarding"
  | "unavailable";

export type CatTravelPhase = "home" | "looking" | "travelling" | "guarding";
export type CatBondStage = "newcomer" | "familiar" | "bonded";

export type CatMotion =
  | "idle"
  | "feeding"
  | "petting"
  | "searching"
  | "guarding"
  | "resting"
  | "sleeping"
  | "loss";

export interface CatReaction {
  readonly id: string;
  readonly text: string;
}

const REACTIONS: Readonly<Record<CatReactionContext, readonly CatReaction[]>> = {
  idle: [
    { id: "idle-meow", text: "喵～" },
    { id: "idle-look", text: "看看这边" },
    { id: "idle-purr", text: "呼噜～" },
  ],
  fed: [
    { id: "fed-more", text: "再来一条？" },
    { id: "fed-tasty", text: "真好吃" },
  ],
  full: [
    { id: "full-belly", text: "好饱呀" },
    { id: "full-rest", text: "歇一会儿" },
  ],
  sleeping: [
    { id: "sleep-purr", text: "呼噜…" },
    { id: "sleep-dream", text: "梦见小鱼" },
  ],
  searching: [
    { id: "search-looking", text: "我找找" },
    { id: "search-sniff", text: "在附近哦" },
  ],
  guarding: [
    { id: "guard-here", text: "在这里" },
    { id: "guard-found", text: "找到啦" },
  ],
  unavailable: [
    { id: "unavailable-none", text: "暂时找不到" },
    { id: "unavailable-wait", text: "等一等哦" },
  ],
};

export function chooseCatReaction(
  context: CatReactionContext,
  previousId: string | null,
  random: RandomSource = Math.random,
): CatReaction {
  const pool = REACTIONS[context];
  const eligible = pool.length > 1
    ? pool.filter((reaction) => reaction.id !== previousId)
    : pool;
  const index = Math.min(
    eligible.length - 1,
    Math.floor(random() * eligible.length),
  );
  const reaction = eligible[index];
  if (!reaction) throw new Error(`Missing cat reaction for ${context}`);
  return reaction;
}
