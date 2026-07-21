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

export type CatReactionMotion =
  | "look"
  | "tail"
  | "purr"
  | "belly"
  | "yawn"
  | "paw";

export interface CatReaction {
  readonly id: string;
  readonly text: string;
  readonly motion: CatReactionMotion;
}

const REACTIONS: Readonly<Record<CatReactionContext, readonly CatReaction[]>> = {
  idle: [
    { id: "idle-meow", text: "喵～", motion: "tail" },
    { id: "idle-look", text: "看看这边", motion: "look" },
    { id: "idle-purr", text: "呼噜～", motion: "purr" },
  ],
  fed: [
    { id: "fed-more", text: "再来一条？", motion: "tail" },
    { id: "fed-tasty", text: "真好吃", motion: "purr" },
  ],
  full: [
    { id: "full-belly", text: "好饱呀", motion: "belly" },
    { id: "full-rest", text: "歇一会儿", motion: "belly" },
  ],
  sleeping: [
    { id: "sleep-purr", text: "呼噜…", motion: "purr" },
    { id: "sleep-dream", text: "梦见小鱼", motion: "yawn" },
  ],
  searching: [
    { id: "search-looking", text: "我找找", motion: "look" },
    { id: "search-sniff", text: "在附近哦", motion: "look" },
  ],
  guarding: [
    { id: "guard-here", text: "在这里", motion: "paw" },
    { id: "guard-found", text: "找到啦", motion: "tail" },
  ],
  unavailable: [
    { id: "unavailable-none", text: "暂时找不到", motion: "look" },
    { id: "unavailable-wait", text: "等一等哦", motion: "tail" },
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
