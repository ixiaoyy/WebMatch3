# Directory Structure

> How frontend code is organized in this project.

---

## Overview

All browser runtime code lives in `apps/web`. The application uses a small
feature-oriented structure: top-level assembly belongs to `app`, Ambient Fish
behavior belongs to `features/game`, and genuinely reusable code belongs to
`shared`.

---

## Directory Layout

```text
apps/web/
├── index.html
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── app/
    │   ├── App.vue
    │   ├── main.ts
    │   └── styles/
    │       └── global.scss
    ├── features/
    │   └── game/
    │       ├── engine/   # pure solvable levels, blockers, tray, clear, recovery
    │       ├── session/  # versioned local snapshot validation
    │       └── ui/       # Vue, attention, sound, PiP, generated assets
    └── shared/
```

---

## Module Organization

- `src/app`: application entry points, global styles, and top-level assembly.
- `src/features/game`: ambient pile rules, local state, and game-specific UI.
  Pure rules must remain independent from Vue, the DOM, and animation timing.
- `src/shared`: types, utilities, and UI primitives that have real consumers
  outside one game submodule.

Do not pre-create `entities`, `pages`, `api`, or `router` layers. Add a new
layer only when implemented behavior has a concrete owner that does not fit
the existing boundaries.

---

## Naming Conventions

- Vue components use PascalCase filenames.
- TypeScript modules and directories use lowercase names; use kebab-case when
  a name contains multiple words.
- Global application styles live under `src/app/styles`; component-specific
  styles stay with the owning component.

---

## Examples

- `apps/web/src/app/main.ts` owns Vue application creation and mounting.
- `apps/web/src/app/App.vue` is the current top-level assembly point.
- `apps/web/src/app/styles/global.scss` owns document-level defaults.

### Wrong

```text
src/App.vue                    # mixes entry location with feature logic
src/utils/game-rules.ts        # game-owned logic disguised as generic utility
src/entities/                  # empty architecture placeholder
```

### Correct

```text
src/app/App.vue
src/features/game/engine/
src/shared/                    # only after a real cross-feature consumer exists
```
