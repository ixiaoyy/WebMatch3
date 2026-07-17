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
| [Game Engine Contract](./game-engine-contract.md) | Deterministic board rules and UI-facing result contracts | Active |
| [Game UI Contract](./game-ui-contract.md) | Playable board state, animation order, input, and presentation boundaries | Active |
| [Fresh Glass Candy Visual Design](./visual-design-contract.md) | Visual hierarchy, tokens, glass surfaces, candy pieces, motion, and responsive layout | Active |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | To fill |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## Pre-Development Checklist

- Read [Directory Structure](./directory-structure.md) before adding or moving frontend modules.
- Read [Toolchain Contract](./toolchain-contract.md) before changing dependencies, package scripts, Vite, TypeScript, ESLint, Vitest, or workspace configuration.
- Read [Game Engine Contract](./game-engine-contract.md) before changing game rules, session scoring inputs, board animation data, or game UI state transitions.
- Read [Game UI Contract](./game-ui-contract.md) before changing playable components, input, animation phases, HUD/result contracts, or restart behavior.
- Read [Fresh Glass Candy Visual Design](./visual-design-contract.md) before changing the game shell, visual tokens, panels, board, pieces, controls, effects, or responsive layout.
- Read the topic-specific guide only when the task touches that topic; files marked `To fill` are templates, not project conventions.

## Quality Check

- Run `pnpm ci:web` from the repository root after frontend code or toolchain changes.
- For dependency changes, also run `pnpm install --frozen-lockfile` after the lockfile is generated.
- Confirm new modules respect the ownership boundaries in [Directory Structure](./directory-structure.md).
- For game-rule changes, run the deterministic engine tests and verify every consumer imports only from the engine `index.ts`.
- For playable UI changes, run controller tests and browser checks from [Game UI Contract](./game-ui-contract.md).
- For visual UI changes, verify token usage, state contrast, reduced motion, and responsive screenshots using [Fresh Glass Candy Visual Design](./visual-design-contract.md).
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
