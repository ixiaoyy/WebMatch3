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
- The cat body and yarn ball are always-direct native controls. The visible cat
  body is divided vertically into head, belly, and paws responses; its target
  must hug the rendered bitmap rather than transparent pixels above the ears.
- Cat play reuses the yarn-ball and existing cat assets for three bounded 1040ms
  variants: pounce, bat, and cuddle. The variants stay inside the home vignette,
  never cross into the fish field, and never act as gameplay guidance. Under
  reduced motion, keep only the selected pose, static yarn emphasis, and
  readable reaction copy.
- Reaction bubbles anchor inside the cat canvas. Negative top offsets are
  forbidden because the desktop cat canvas may already begin above the viewport.
- Field-to-tray handoff has exactly one visible fish actor. In the render that
  removes the selected field fish, hide its retained leave node and mount the
  flight proxy at the source's rendered center, size, and rotation. Derive the
  proxy's final scale from the destination tray slot; never combine a source
  fade with a fixed-size proxy, which reads as disappear-then-reappear.
- The outgoing school stays visible through catch and merge. A new wave arrives
  at feeding contact with a short stagger derived from authored positions.
- Quiet controls remain readable but subordinate. The seven-slot tray is the
  only persistent glass grouping and never becomes a dashboard.
- At `<=620px`, use compact cat/plant/tray variables and the 44px fish target.
  Move the cat and 44px yarn control above the persistent hint/tray so the toy
  remains visible and neither control is visually masked. No horizontal
  overflow, clipped controls, fish/pet collision, or hidden tray.
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
| Cat face, belly, or paws is clicked | matching region, pose, and copy are visibly distinct |
| Cat play at desktop or compact width | pounce, bat, cuddle rotate inside the right vignette, then return to idle |
| Cat bubble appears | full bubble rectangle remains inside the viewport |
| Reduced motion | retain hierarchy, pressed state, phase order, and readable arrival |
| Reduced-motion cat play | static yarn emphasis and reaction copy; no translated or rolling motion |
| Away state | pause loops and travel without hiding canonical progress |
| Selected fish begins catch travel | source leave node is not visible; proxy starts at the same rendered center, size, and rotation |
| Reference comparison uses mismatched dimensions | recapture before judging |
| Console reports layout/runtime warnings | fix before visual approval |

## 5. Good / Base / Bad Cases

- Good: level one resembles a calm illustrated school with obvious negative
  space rather than nine unrelated stickers in one knot.
- Base: nine fish, cat, pot, hint, controls, and empty tray are all legible
  before interaction.
- Good: level two adds fish but uses a slightly smaller scale and keeps every
  hit rectangle separate.
- Good: clicking a 104px rotated field fish produces one 104px proxy at that
  exact origin before it scales toward the measured tray slot.
- Good: direct cat touches produce a nuzzle, belly wiggle, or paws response;
  three yarn activations visibly progress through pounce, bat, and cuddle while
  leaving the fish composition visually and semantically untouched.
- Bad: fish all occupy the middle-left third while the top and lower-left stay
  empty.
- Bad: artwork becomes larger while the semantic button remains 44px.
- Bad: scaling fish from the current remaining count, causing survivors to jump
  larger after every selection.
- Bad: retaining a 220ms field leave animation while a fixed 70px catch proxy
  starts from the same fish; the duplicate actors create a visible pop.
- Bad: moving the cat beside a fish or using its gaze, light, or position to
  disclose the match.
- Bad: a transparent oversized cat target maps the visible face to the belly
  zone, or the compact hint hides the yarn control.
- Bad: hiding fish, using layers, or letting cat art mask a target.

## 6. Tests Required

1. exact-dimension combined reference/build comparison for the opening state;
2. desktop first-level capture and a later 11-fish wave capture;
3. compact `430x560` capture with target-rectangle overlap count zero, cat and
   yarn targets at least 44px, yarn visibly above the hint, and no overflow;
4. browser path through first-level groups `6 -> 3 -> level-two 11`;
5. rapid-click completion, feed contact, refresh arrival, no visible retained
   source node, and catch-proxy start-size parity at desktop and compact sizes;
6. keyboard focus, reduced motion, away, all three cat pet zones, all three yarn
   variants, tray pressure, loss, and Picture-in-Picture spot checks; cat play
   must not move toward any fish and every reaction bubble stays in view;
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
