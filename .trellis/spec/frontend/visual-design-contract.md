# Rain-Washed Ambient Fish Visual Contract

## 1. Scope / Trigger

Apply this contract when changing wallpaper, fish/cat/plant assets, fish-school
composition, tray placement, responsive projection, hit geometry, or motion.
The approved direction is the cool-lavender rainy windowsill with an open
S-shaped fish school on the left, cat and pot on the right, and quiet tray at
the bottom.

## 2. Signatures / Asset Slots

```text
ui/assets/ambient/wallpaper.webp
ui/assets/fish/fish-{whale,koi,sardine,puffer,goldfish,clownfish,angelfish,betta}.webp
ui/assets/cat/cat-{idle,eating,full,lying,sleeping}.webp
ui/assets/cat/cat-{yarn-ball,cushion}.webp
ui/assets/ambient/plant-{pot,foliage,flowering,fruiting,mature}.webp
ui/assets/ambient/plant-stage-{bud,lily-of-the-valley,pomegranate,peony}.webp
```

```ts
interface FieldProjection {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

getFieldProjection(width: number, height: number): FieldProjection
projectFieldPoint(point: Point, projection: FieldProjection): Point
```

## 3. Contracts

- Use real bitmap assets. Never replace visible fish, cat, plant, wallpaper, or
  tray material with emoji, CSS drawings, inline SVG approximations, or boxes.
- The full-bleed wallpaper supplies cool daylight, wall/table horizon, and left
  foliage shadows. No board, card, grid, top bar, logo, or conventional HUD.
- Fish follow one authored, open S-route through the left and center. The route
  spans high, middle, and low zones; it must not collapse into a central clump.
- New fish are single-layer, complete silhouettes with `-8..8` degree tilt.
  Piling, occlusion, fanning, arbitrary rotation, and reveal-gated visibility
  are forbidden gameplay devices.
- The home cat and pot form a right-side vignette. Their transparent canvases
  do not overlap fish interaction; the tray remains centered near the bottom.
- At the approved desktop reference size, level-one fish use the largest art
  scale. Wave capacities 11, 13, 15, and 17 step down only enough to preserve
  breathing room. Remaining fish do not grow when selected siblings leave.
- The native hit target grows with desktop artwork but must remain disjoint from
  neighboring targets. Mobile targets are exactly or above 44px and disjoint.
  A visual-size change is incomplete until rendered target rectangles are
  checked, not merely the image pixels.
- Fish use independent, low-amplitude drift timing. Canonical centers and hit
  identity never move. Guided, pressed, dragged, reduced-motion, and away states
  stop or simplify the decorative loop.
- Direct press feedback, catch travel, three-fish gather, large-fish delivery,
  cat reaction, and plant response form one restrained causal chain. Do not use
  casino particles, full-screen flashes, or springy spectacle.
- The outgoing school stays visible through catch and merge. A new wave arrives
  at feeding contact with a short stagger derived from authored positions.
- Quiet controls remain readable but subordinate. The seven-slot tray is the
  only persistent glass grouping and never becomes a dashboard.
- At `<=620px`, use compact cat/plant/tray variables and the 44px fish target.
  No horizontal overflow, clipped controls, fish/pet collision, or hidden tray.
- Picture-in-Picture uses the same composition and mounted assets at its actual
  surface size; it does not substitute a second compact implementation.
- Reference QA uses the same pixel dimensions and state for source and build,
  then places both captures in one comparison image before judging differences.

## 4. Validation & Error Matrix

| Condition | Required outcome |
|---|---|
| Level-one desktop | 9 large fish across the S-route, right vignette, visible tray |
| Later capacity is 11/13/15/17 | apply matching density size; no target rectangles overlap |
| Fish image is visible beyond its button | enlarge target or magnetic reach before accepting |
| Cat/plant artwork crosses a fish | move/scale the vignette; do not rely on transparent pixels |
| Compact width `<=620px` | 44px disjoint targets, full tray, no scroll overflow |
| Reduced motion | retain hierarchy, pressed state, phase order, and readable arrival |
| Away state | pause loops and travel without hiding canonical progress |
| Reference comparison uses mismatched dimensions | recapture before judging |
| Console reports layout/runtime warnings | fix before visual approval |

## 5. Good / Base / Bad Cases

- Good: level one resembles a calm illustrated school with obvious negative
  space rather than nine unrelated stickers in one knot.
- Base: nine fish, cat, pot, hint, controls, and empty tray are all legible
  before interaction.
- Good: level two adds fish but uses a slightly smaller scale and keeps every
  hit rectangle separate.
- Bad: fish all occupy the middle-left third while the top and lower-left stay
  empty.
- Bad: artwork becomes larger while the semantic button remains 44px.
- Bad: scaling fish from the current remaining count, causing survivors to jump
  larger after every selection.
- Bad: hiding fish, using layers, or letting cat art mask a target.

## 6. Tests Required

1. exact-dimension combined reference/build comparison for the opening state;
2. desktop first-level capture and a later 11-fish wave capture;
3. compact `430x560` capture with target-rectangle overlap count zero;
4. browser path through first-level groups `6 -> 3 -> level-two 11`;
5. rapid-click completion, feed contact, refresh arrival, and no ghost fish;
6. keyboard focus, reduced motion, away, cat search, tray pressure, loss, and
   Picture-in-Picture spot checks;
7. lint, type-check, unit tests, build, and browser warning/error log check.

## 7. Wrong vs Correct

### Wrong

```scss
.fish-field { width: 48%; height: 36%; }
.fish-piece { width: 44px; height: 44px; }
```

This compresses the school into one knot and makes large artwork hard to hit.

### Correct

```scss
.fish-field {
  --fish-visual-size: clamp(72px, min(8.4vw, 13.5vh), 128px);
}

.fish-piece {
  width: max(44px, calc(var(--fish-visual-size) * 0.86));
  height: max(44px, calc(var(--fish-visual-size) * 0.86));
}
```

The authored projection creates the composition; density variables preserve
the same hierarchy without recreating overlap.
