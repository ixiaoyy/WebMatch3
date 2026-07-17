# WebMatch3 姓名入口与排行榜 Design QA

## Comparison target

- Player-start source visual truth:
  `.trellis/tasks/07-17-session-progression/research/player-start-screen-reference.png`
- Leaderboard source visual truth:
  `.trellis/tasks/07-17-session-progression/research/leaderboard-reference.png`
- Desktop implementation screenshots:
  - `.trellis/tasks/07-17-session-progression/research/start-screen-final-1440x900.jpg`
  - `.trellis/tasks/07-17-session-progression/research/leaderboard-final-1440x900.jpg`
- Mobile implementation screenshots:
  - `.trellis/tasks/07-17-session-progression/research/start-screen-final-390x844.jpg`
  - `.trellis/tasks/07-17-session-progression/research/leaderboard-final-390x844.jpg`
- Full-view comparison evidence:
  - `.trellis/tasks/07-17-session-progression/research/qa-start-full-comparison.jpg`
  - `.trellis/tasks/07-17-session-progression/research/qa-leaderboard-full-comparison.jpg`
- Focused-region comparison evidence:
  - `.trellis/tasks/07-17-session-progression/research/qa-start-focused-comparison.jpg`
  - `.trellis/tasks/07-17-session-progression/research/qa-leaderboard-focused-comparison.jpg`

The browser comparison used 1440×900 for the desktop states and 390×844 for
the mobile states. The player-start state has an empty, focused input. The
leaderboard state uses four completed local players, the `本周` tab, three
podium entries, one list entry, and `小紫` as the highlighted current player.
The 320×568 minimum viewport was also measured in the browser: the 273×352
dialog stayed between x=16–289 and y=118–470, and document scroll width equaled
the 320px viewport.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation intentionally uses the existing
  WebMatch3 system-sans hierarchy instead of copying the reference's branded
  bubble lettering. Headings, labels, numeric scores, tab labels, and small
  supporting copy remain distinct and legible at both captured sizes.
- Spacing and layout rhythm: the source's centered form hierarchy is preserved
  as a compact modal over a blurred live board. The leaderboard preserves a
  raised first place, flanking second and third places, compact lower rows,
  right-aligned scores, and a full-row current-player highlight. The full-screen
  reference is intentionally translated into the existing game-side panel.
- Colors and visual tokens: cream reference surfaces are translated into the
  approved Fresh Glass tokens. The start action now uses the warm reward color;
  podium medals and the current-player row use restrained gold, silver, bronze,
  and reward accents without weakening text contrast.
- Image quality and asset fidelity: the live board and all leaderboard avatars
  use the existing sharp local candy PNGs. Every ranking entry uses the same
  bundled 512×512 lime candy image as requested; no placeholder, emoji, cropped
  reference art, CSS illustration, or remote image is used.
- Copy and content: the entry dialog contains only player name and `开始游戏`.
  There is no guest or settings action. Ranking scope is exactly `本周`,
  `本月`, and `总排行`; there is no friends, season, countdown, reward, or
  online-identity copy.

Intentional deviations from the source are supported by the product brief:
brand logos, illustrated character avatars, guest/settings controls, friends
ranking, season UI, page navigation, and challenge buttons are excluded.

## Interaction and responsive evidence

- Empty submission showed the inline name error; a valid normalized name
  started the board.
- The three ranking tabs changed by pointer, and ArrowLeft moved selection and
  focus from `总排行` to `本月`.
- Desktop ranking evidence contained four image avatars, three podium entries,
  one lower row, and exactly one current-player highlight.
- At 390px, the ranking panel stayed within x=9–381 with no horizontal document
  overflow; the mobile screenshot shows the complete podium, highlighted row,
  and following controls.
- At 320×568, the start dialog fit inside the viewport and document scroll width
  remained 320px.
- Browser error/warning logs were empty, and no Vite error overlay was present.

## Comparison history

### Iteration 1

- Earlier P2: the start CTA used the purple general-primary treatment, which
  weakened fidelity to the warm dominant action in the source.
- Fix: scoped the entry CTA to the reward-orange token with a matching hover
  state.
- Post-fix evidence:
  `.trellis/tasks/07-17-session-progression/research/start-screen-final-1440x900.jpg`
  and
  `.trellis/tasks/07-17-session-progression/research/qa-start-focused-comparison.jpg`.

- Earlier P2: the ranking panel followed the instructions panel, leaving most
  of the new ranking hierarchy below the initial desktop viewport.
- Fix: placed the ranking first in the side stack while preserving the same
  mobile document order.
- Post-fix evidence:
  `.trellis/tasks/07-17-session-progression/research/leaderboard-final-1440x900.jpg`
  and
  `.trellis/tasks/07-17-session-progression/research/qa-leaderboard-focused-comparison.jpg`.

### Final comparison

The post-fix desktop and mobile captures contain no remaining P0/P1/P2
mismatches. Full-view evidence confirms the intended Fresh Glass translation;
focused evidence confirms form hierarchy, three ranking scopes, podium order,
default-avatar consistency, score alignment, and current-player emphasis.

## Implementation checklist

- [x] One-field name entry with one primary action.
- [x] No guest or settings controls.
- [x] 本周 / 本月 / 总排行 only.
- [x] Shared default avatar for every player.
- [x] Top-three hierarchy, compact lower ranks, current-player highlight.
- [x] Keyboard-operable tablist and visible focus.
- [x] Desktop, mobile, minimum-width, and browser-log checks.

## Follow-up polish

No blocking polish remains. A future product decision could replace the shared
candy avatar with a dedicated branded default-avatar asset without changing
the ranking data contract.

final result: passed
