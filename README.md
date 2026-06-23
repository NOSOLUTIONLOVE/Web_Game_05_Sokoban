<div align="center">

# Sokoban Web

> A modern, browser-native take on the classic 1981 Sokoban puzzle — 20 handcrafted Microban-style levels, a 60 fps Canvas renderer, undo/redo with deadlock detection, and a dark-violet UI tuned for both desktop and touch.

[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#-license)
[![GitHub Repo](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NOSOLUTIONLOVE/Web_Game_05_Sokoban)
[![Tech](https://img.shields.io/badge/React%2018%20%2B%20TS%205%20%2B%20Vite%205-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#-tech-stack)
[![Tests](https://img.shields.io/badge/tests-84%20passed-brightgreen?style=for-the-badge)](#-testing)
[![Version](https://img.shields.io/badge/version-0.1.0-blueviolet?style=for-the-badge)](#-roadmap)

<br />

[Live Demo](#-live-demo) · [Features](#-features) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [Documentation](#-documentation) · [License](#-license)

**简体中文** · [English](./README.md)

</div>

---

## About

Sokoban Web is a browser-native reimplementation of the iconic warehouse-pusher puzzle designed by Hiroyuki Imabayashi in 1981. The player controls a warehouse worker who must push every crate onto a target footprint — crates can only be pushed (never pulled), one at a time, and the level is won when every crate is settled.

This project is the fifth entry in a personal **Web_Game_01** learning library (alongside Snake, 2048, Tetris, and Flappy Bird), built to demonstrate a repeatable "v2.0 quality-first" stack for 2D puzzle games on the web. It is engineered as a portfolio piece: a strict three-layer architecture, 84 passing unit tests, zero external asset dependencies (audio is synthesized live via the Web Audio API), and a responsive UI that runs from 375 px phones up to desktop.

### Why this project?

- **Algorithm showcase** — Sokoban is the canonical example for grid state machines, undo/redo stacks, and deadlock detection. Almost every classic 2D-puzzle algorithm shows up here.
- **Engineering rigor** — The game engine is pure TypeScript with private internal state, fully decoupled from React, and covered by 84 unit tests.
- **Industry-standard level format** — Levels are authored in [XSB](https://sokobano.de/) format, the de-facto standard used by sokobano.de and the Sokoban community.
- **Zero-asset audio** — Five sound effects (move / push / undo / win / blocked) are synthesized at runtime with the Web Audio API, so the bundle ships no audio files.

---

## Live Demo

> Deployment link will be updated here once the project is published to Vercel.
>
> **Deploy target:** Vercel · **Root directory:** `sokoban/` · **Build command:** `pnpm build`

---

## Features

### Gameplay

- **20 built-in levels** — Microban-style progression, difficulty rank 1–5, from gentle tutorials to genuinely tricky puzzles.
- **Undo / Redo** — 200-step history stack. Step back through the entire level if you want.
- **Deadlock detection** — Corner deadlocks and wall-edge deadlocks are detected in real time; the player is notified the moment a position becomes unsolvable.
- **Level progress persistence** — Clearing a level auto-unlocks the next one and records your best move count, saved to `localStorage`.
- **Optimal-move tracking** — Each level ships with a reference optimal move/push count; clearing a level flags whether your solution was optimal.

### Presentation

- **60 fps Canvas 2D renderer** — Seven cell types (wall / floor / target / box / box-on-target / player / player-on-target) drawn with wood-grain and brick textures, plus push transitions, green settle flashes, and blocked-shake animations.
- **Dark-violet UI** — Project-library design language: zinc-950 background, violet accents, Framer Motion transitions, shadcn/ui primitives.
- **Responsive layout** — Works from 375 px mobile up to desktop. Touch devices get a bottom action bar with undo / redo / reset buttons.
- **Five synthesized sound effects** — Move, push, undo, win, and blocked — all generated live via the Web Audio API (no audio files shipped).

### Input

| Input | Action |
| --- | --- |
| `↑ ↓ ← →` / `W A S D` | Move |
| `U` / `Z` | Undo |
| `Y` / `X` | Redo |
| `R` | Reset level |
| `P` / `Esc` | Pause / Resume |
| `M` | Toggle mute |
| `Enter` / `Space` | Confirm (menu / advance to next level) |
| Touch swipe (≥ 30 px) | Move |

---

## Game Rules

1. You are a warehouse worker.
2. Push every crate onto a target footprint (the yellow marks).
3. A level is won when **all** crates are settled on targets.
4. You can only push **one** crate at a time.
5. You can **push** crates, never pull them.
6. You cannot push a crate into a wall or into another crate.

---

## Quick Start

```bash
# 1. Clone
git clone git@github.com:NOSOLUTIONLOVE/Web_Game_05_Sokoban.git
cd Web_Game_05_Sokoban

# 2. Enter the app directory
cd sokoban

# 3. Install dependencies (Node.js 18+ required)
pnpm install
# or: npm install

# 4. Start the dev server
pnpm dev
# → http://127.0.0.1:5177/

# 5. Open the production preview
pnpm build && pnpm preview
# → http://127.0.0.1:4177/
```

---

## Installation

**Prerequisites**

- Node.js **18+**
- pnpm **9+** (recommended) or npm 9+

**Dependencies**

The project uses a standard Vite + React + TypeScript toolchain. All dependencies are declared in [`sokoban/package.json`](./sokoban/package.json). There are no native modules and no system-level prerequisites beyond Node.

```bash
cd sokoban
pnpm install
```

---

## Usage

### Development

```bash
pnpm dev          # Start Vite dev server with HMR
pnpm type-check   # TypeScript strict-mode type check (no emit)
pnpm lint         # ESLint over src/**/*.{ts,tsx}
pnpm format       # Prettier write
```

### Testing

```bash
pnpm test         # Run Vitest once
pnpm test:watch   # Watch mode
```

### Production Build

```bash
pnpm build        # tsc + vite build → sokoban/dist/
pnpm preview      # Serve the built dist/ locally
```

### Deployment (Vercel)

The repository includes a [`sokoban/vercel.json`](./sokoban/vercel.json) with an SPA rewrite rule. To deploy:

1. Push the repository to GitHub.
2. Visit [vercel.com/new](https://vercel.com/new) and import the `NOSOLUTIONLOVE/Web_Game_05_Sokoban` repo.
3. Set **Root Directory** to `sokoban/`.
4. Click **Deploy**.

---

## Architecture

The project follows a strict **three-layer separation** to keep the game engine pure, testable, and decoupled from React.

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer  (React + Framer Motion + shadcn/ui)              │
│  - SokobanGame, HUD, MainMenu, LevelSelect, WinModal, ...   │
│  - Subscribes to store; dispatches user intent              │
└──────────────────────────┬──────────────────────────────────┘
                           │ callbacks / selectors
┌──────────────────────────▼──────────────────────────────────┐
│  State Layer  (Zustand + persist middleware)                │
│  - useGameStore: phase, level, moves, pushes, progress      │
│  - Calls engine.action() and reacts to engine callbacks     │
└──────────────────────────┬──────────────────────────────────┘
                           │ getState().action()
┌──────────────────────────▼──────────────────────────────────┐
│  Engine Layer  (pure TypeScript, zero React deps)           │
│  - GameEngine orchestrates Board + UndoStack + LevelManager │
│  - Internal state (cells, boxes, player) is private         │
│  - Emits events via callbacks: onMove / onPush / onWin ...  │
│  - 100% unit-test coverage on core algorithms               │
└─────────────────────────────────────────────────────────────┘
```

### Key design decisions

- **Private engine state** — `GameEngine` holds `board`, `undoStack`, and `levelManager` as private fields. The outside world can only query via getters (`currentLevel`, `canUndo`, `moveCount`, …) and mutate via action methods (`move()`, `undo()`, `reset()`).
- **Render-snapshot pattern** — The engine exposes `getRenderSnapshot()` returning an immutable view of the board. The Canvas renderer pulls a fresh snapshot each `requestAnimationFrame`, keeping rendering and simulation decoupled.
- **Callback-driven data flow** — The engine never imports React or Zustand. It communicates purely through the `GameEngineCallbacks` interface (`onPhaseChange`, `onMove`, `onPush`, `onWin`, `onDeadlock`, `onSettle`, `onBlocked`, …).
- **XSB level format** — Levels are authored in the industry-standard [XSB format](https://sokobano.de/wiki/Level_format) and parsed by `XsbParser`. The 20 built-in levels live in `builtinLevels.ts`.
- **Deadlock detection** — `DeadlockDetector` checks for two common deadlock families: corner deadlocks (a non-target crate pushed into a corner) and wall-edge deadlocks (a crate pushed against a wall with no target along that edge). Detection runs after every push.

### Project structure

```
Web_Game_05_Sokoban/
├── sokoban/                    # The application
│   ├── public/
│   ├── src/
│   │   ├── components/         # React UI components
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── SokobanGame.tsx # Top-level game component
│   │   │   ├── HUD.tsx
│   │   │   ├── MainMenu.tsx
│   │   │   ├── LevelSelect.tsx
│   │   │   ├── PauseOverlay.tsx
│   │   │   ├── WinModal.tsx
│   │   │   ├── ActionBar.tsx
│   │   │   ├── DeadlockToast.tsx
│   │   │   └── Overlays.tsx
│   │   ├── config/             # Global config + Zod schema
│   │   ├── engine/             # Pure-TS game logic
│   │   │   ├── levels/         # XSB parser + level data
│   │   │   ├── __tests__/      # Unit tests (84 tests)
│   │   │   ├── Board.ts
│   │   │   ├── UndoStack.ts
│   │   │   ├── DeadlockDetector.ts
│   │   │   ├── LevelManager.ts
│   │   │   ├── GameEngine.ts
│   │   │   ├── Renderer.ts
│   │   │   └── Input.ts
│   │   ├── store/              # Zustand store
│   │   ├── lib/                # storage / audio / utils
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── docs/                   # 6 design documents (Chinese)
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
├── PRD-推箱子.md                # Product requirements doc
├── README.md                   # You are here (English)
└── README.zh-CN.md             # Chinese version
```

---

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build tool | **Vite 5** | Fast HMR, ESM-native, zero-config TS support |
| UI framework | **React 18** | Component model, hooks, concurrent rendering |
| Language | **TypeScript 5** (strict) | Type safety across engine + UI boundary |
| Styling | **Tailwind CSS 3** | Utility-first, consistent design tokens |
| UI primitives | **shadcn/ui** (Radix UI) | Accessible, customizable, no runtime lock-in |
| State | **Zustand 4** + persist | Minimal boilerplate, SSR-friendly, middleware |
| Animation | **Framer Motion 11** | Declarative transitions for menus / modals |
| Rendering | **Canvas 2D** | 60 fps grid rendering with custom textures |
| Audio | **Web Audio API** | Synthesized SFX, zero asset weight |
| Testing | **Vitest 1** + happy-dom | Vite-native, fast, Jest-compatible API |
| Lint / Format | **ESLint 8** + **Prettier 3** | Conventional, integrated with Vite |
| Deploy | **Vercel** | Zero-config SPA hosting, GitHub integration |

---

## Testing

The engine layer is fully unit-tested with **Vitest**. All 84 tests pass.

```bash
cd sokoban
pnpm test
```

```
 ✓ Board.test.ts               (14 tests)
 ✓ DeadlockDetector.test.ts    (10 tests)
 ✓ GameEngine.test.ts          (23 tests)
 ✓ LevelManager.test.ts        (18 tests)
 ✓ XsbParser.test.ts           (13 tests)
 ✓ builtinLevels.test.ts        (6 tests)

 Test Files  6 passed (6)
      Tests  84 passed (84)
```

Test files live next to the source they cover, under [`sokoban/src/engine/__tests__/`](./sokoban/src/engine/__tests__/).

---

## Performance

| Metric | Measured |
| --- | --- |
| First load (gzip) | ~138 KB |
| Frame rate | Stable 60 fps |
| Memory footprint | < 60 MB |
| Unit tests | 84 / 84 passing |
| Core algorithm coverage | 100% |

---

## Documentation

The `sokoban/docs/` folder contains six design documents (written in Chinese) that walk through the full project lifecycle — from立项 to deployment.

| Doc | Contents |
| --- | --- |
| [01-项目立项](./sokoban/docs/01-项目立项.md) | Background, goals, scope, user personas |
| [02-需求拆分](./sokoban/docs/02-需求拆分.md) | MVP / V2 split + acceptance criteria |
| [03-技术选型](./sokoban/docs/03-技术选型.md) | Why Vite + Canvas 2D + Zustand + dark-violet UI |
| [04-项目架构](./sokoban/docs/04-项目架构.md) | Three-layer architecture, data flow, file inventory |
| [05-执行规划](./sokoban/docs/05-执行规划.md) | 9-phase milestone plan + commit strategy |
| [06-部署指南](./sokoban/docs/06-部署指南.md) | Vercel deployment + base-path config |

The original product requirements document lives at [`PRD-推箱子.md`](./PRD-推箱子.md).

---

## Roadmap

- [x] MVP — 20 levels, undo/redo, deadlock detection, Canvas renderer
- [x] Audio — 5 synthesized sound effects
- [x] Persistence — level unlock + best-move tracking
- [x] Responsive UI — desktop + touch (≥ 375 px)
- [ ] Vercel deployment + live demo URL
- [ ] Level editor (import / export XSB)
- [ ] Additional level packs
- [ ] Solution replay & share

---

## Acknowledgements

- **Sokoban** — Designed by Hiroyuki Imabayashi (1981), published by Thinking Rabbit.
- **XSB level format** — The community standard, documented at [sokobano.de](https://sokobano.de/).
- **Microban** — The classic level set that inspired the 20 built-in levels.
- **shadcn/ui** — Built on Radix UI + Tailwind CSS.
- **Web Audio API** — Makes zero-asset sound synthesis possible.

---

## License

This project is released under the **MIT License**.

> Note: a dedicated `LICENSE` file is not yet committed. The license declaration follows the original project README and `package.json` description. Add a `LICENSE` file before any public redistribution.

---

<div align="center">

**Project library:** Web_Game_01 · Sokoban #5
**Last updated:** 2026-06-23

</div>
