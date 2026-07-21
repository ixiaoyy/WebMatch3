# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

This directory contains guidelines for frontend development. Fill in each file with your project's specific conventions.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Active |
| [Toolchain Contract](./toolchain-contract.md) | Workspace commands, dependency installation, and validation | Active |
| [Ambient Jelly Engine Contract](./game-engine-contract.md) | Freeform pile, blockers, tray clears, replenishment, and recovery | Active |
| [Ambient Jelly UI Contract](./game-ui-contract.md) | Persistence, attention, input, sound, and Picture-in-Picture boundaries | Active |
| [Rain-Washed Ambient Jelly Visual Design](./visual-design-contract.md) | Wallpaper, generated assets, gather/scatter layout, growth, and responsive composition | Active |
| [Production Deployment](./deployment-contract.md) | GitHub Actions, immutable releases, container health checks, and rollback | Active |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | To fill |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- Read [Directory Structure](./directory-structure.md) before adding or moving frontend modules.
- Read [Toolchain Contract](./toolchain-contract.md) before changing dependencies, package scripts, Vite, TypeScript, ESLint, Vitest, or workspace configuration.
- Read [Ambient Jelly Engine Contract](./game-engine-contract.md) before changing pile generation, blockers, tray clears, replenishment, recovery, or UI-facing transitions.
- Read [Ambient Jelly UI Contract](./game-ui-contract.md) before changing persistence, attention, input, audio, controller timing, or Picture-in-Picture.
- Read [Rain-Washed Ambient Jelly Visual Design](./visual-design-contract.md) before changing wallpaper, visual tokens, generated assets, gather/scatter layout, plant growth, controls, or responsive composition.
- Read [Production Deployment](./deployment-contract.md) before changing GitHub Actions, release packaging, SSH upload, container activation, or rollback.
- Read the topic-specific guide only when the task touches that topic; files marked `To fill` are templates, not project conventions.

## Quality Check

- Run `pnpm ci:web` from the repository root after frontend code or toolchain changes.
- For dependency changes, also run `pnpm install --frozen-lockfile` after the lockfile is generated.
- Confirm new modules respect the ownership boundaries in [Directory Structure](./directory-structure.md).
- For game-rule changes, run the deterministic ambient engine tests and verify feature consumers import only from the engine public barrel.
- For playable UI changes, run controller tests and browser checks from [Game UI Contract](./game-ui-contract.md).
- For visual UI changes, verify the reference comparison, state contrast, reduced motion, and responsive screenshots using [Rain-Washed Ambient Jelly Visual Design](./visual-design-contract.md).
- For deployment changes, validate workflow YAML and shell syntax, then verify one real production run and its public release marker.
- Do not treat files marked `To fill` as authoritative until the bootstrap task replaces their placeholder content with codebase evidence.

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
