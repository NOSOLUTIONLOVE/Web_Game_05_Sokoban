<div align="center">

# Sokoban Web（推箱子）

> 1981 年经典推箱子谜题的现代网页版 —— 20 关 Microban 风格手作关卡、60 fps Canvas 渲染、撤销/重做 + 死锁检测、桌面与触屏双适配的暗黑紫调 UI。

[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](#-许可)
[![GitHub Repo](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/NOSOLUTIONLOVE/Web_Game_05_Sokoban)
[![Tech](https://img.shields.io/badge/React%2018%20%2B%20TS%205%20%2B%20Vite%205-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#-技术栈)
[![Tests](https://img.shields.io/badge/tests-84%20passed-brightgreen?style=for-the-badge)](#-测试)
[![Version](https://img.shields.io/badge/version-0.1.0-blueviolet?style=for-the-badge)](#-路线图)

**[English](README.md)** · **[中文](README.zh-CN.md)**

<br />

[在线试玩](#-在线试玩) · [核心特性](#-核心特性) · [快速开始](#-快速开始) · [架构设计](#-架构设计) · [项目文档](#-项目文档) · [许可](#-许可)

</div>

---

## 🌟 关于本项目

Sokoban Web 是 1981 年由 Hiroyuki Imabayashi 设计的经典仓库工人推箱子谜题的网页原生重制版。玩家扮演仓库工人，需要将所有箱子推到目标点上 —— 箱子只能被推动（不能拉），一次只能推一个，所有箱子归位即获胜。

本项目是个人 **Web_Game_01** 学习项目库的第五款作品（与 Snake、2048、Tetris、Flappy Bird 同库），旨在验证一套可复用的「v2.0 质量优先」2D 网页谜题游戏技术栈。它同时是一件作品集项目：严格的三层分离架构、84 个通过的单元测试、零外部素材依赖（音效由 Web Audio API 实时合成）、从 375 px 手机到桌面端的响应式 UI。

### 为什么做这个项目？

- **算法代表性** —— 推箱子是网格状态机、撤销/重做栈、死锁检测的集大成者，几乎涵盖所有经典 2D 谜题算法。
- **工程严谨性** —— 游戏引擎是纯 TypeScript 实现，内部状态私有，与 React 完全解耦，由 84 个单元测试覆盖。
- **行业标准关卡格式** —— 关卡使用 [XSB](https://sokobano.de/) 格式编写，这是 sokobano.de 与推箱子社区事实上的标准。
- **零素材音效** —— 五种音效（移动 / 推箱 / 撤销 / 胜利 / 推不动）由 Web Audio API 运行时合成，产物中不包含任何音频文件。

---

## 🎮 在线试玩

> 部署链接将在项目发布到 Vercel 后更新。
>
> **部署平台：** Vercel · **根目录：** `sokoban/` · **构建命令：** `pnpm build`

---

## 🎯 核心特性

### 玩法

- **20 关内置关卡** —— Microban 风格渐进式难度，难度等级 1–5，从入门教学到真正烧脑。
- **撤销 / 重做** —— 200 步历史栈，可以一路回退到关卡开始。
- **死锁检测** —— 实时检测角落死锁与边墙死锁；一旦局面无解立即提示玩家。
- **关卡进度持久化** —— 通关后自动解锁下一关，并记录最佳步数，保存到 `localStorage`。
- **最优解追踪** —— 每关附带参考最优步数/推箱数，通关时标记你的解法是否达到最优。

### 表现

- **60 fps Canvas 2D 渲染** —— 七种格子类型（墙 / 地板 / 目标点 / 箱子 / 归位箱子 / 工人 / 工人在目标点）以木纹与砖纹质感绘制，附带推箱过渡、归位绿光闪烁、推不动抖动动效。
- **暗黑紫调 UI** —— 项目库设计语言：zinc-950 背景、紫色点缀、Framer Motion 过渡、shadcn/ui 基础组件。
- **响应式布局** —— 从 375 px 手机到桌面端全适配。触屏设备底部提供撤销 / 重做 / 重置操作栏。
- **五种合成音效** —— 移动、推箱、撤销、胜利、推不动，全部由 Web Audio API 实时合成（不打包任何音频文件）。

### 操作

| 输入 | 行为 |
| --- | --- |
| `↑ ↓ ← →` / `W A S D` | 移动 |
| `U` / `Z` | 撤销 |
| `Y` / `X` | 重做 |
| `R` | 重置关卡 |
| `P` / `Esc` | 暂停 / 继续 |
| `M` | 切换静音 |
| `Enter` / `Space` | 确认（菜单 / 胜利后进入下一关） |
| 触屏滑动（≥ 30 px） | 移动 |

---

## 🎹 游戏规则

1. 你扮演一名仓库工人。
2. 将所有箱子推到目标点（黄色标记）上。
3. 当**所有**箱子都归位时，关卡获胜。
4. 一次只能推**一个**箱子。
5. 箱子只能被**推动**，不能被拉动。
6. 不能将箱子推入墙体或另一个箱子。

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone git@github.com:NOSOLUTIONLOVE/Web_Game_05_Sokoban.git
cd Web_Game_05_Sokoban

# 2. 进入应用目录
cd sokoban

# 3. 安装依赖（需要 Node.js 18+）
pnpm install
# 或：npm install

# 4. 启动开发服务器
pnpm dev
# → http://127.0.0.1:5177/

# 5. 构建并预览生产产物
pnpm build && pnpm preview
# → http://127.0.0.1:4177/
```

---

## 📦 安装

**环境要求**

- Node.js **18+**
- pnpm **9+**（推荐）或 npm 9+

**依赖安装**

项目使用标准 Vite + React + TypeScript 工具链，所有依赖声明在 [`sokoban/package.json`](./sokoban/package.json) 中。无原生模块，除 Node 外无系统级依赖。

```bash
cd sokoban
pnpm install
```

---

## 📖 使用说明

### 开发

```bash
pnpm dev          # 启动 Vite 开发服务器（HMR）
pnpm type-check   # TypeScript 严格模式类型检查（不输出）
pnpm lint         # 对 src/**/*.{ts,tsx} 运行 ESLint
pnpm format       # Prettier 格式化
```

### 测试

```bash
pnpm test         # 单次运行 Vitest
pnpm test:watch   # 监听模式
```

### 生产构建

```bash
pnpm build        # tsc + vite build → sokoban/dist/
pnpm preview      # 本地预览构建产物
```

### 部署（Vercel）

仓库已包含 [`sokoban/vercel.json`](./sokoban/vercel.json)（SPA rewrite 规则）。部署步骤：

1. 将仓库推送到 GitHub。
2. 访问 [vercel.com/new](https://vercel.com/new)，导入 `NOSOLUTIONLOVE/Web_Game_05_Sokoban` 仓库。
3. 将 **Root Directory** 设置为 `sokoban/`。
4. 点击 **Deploy**。

---

## 🏛️ 架构设计

项目遵循严格的**三层分离**架构，保证游戏引擎纯净、可测试、与 React 解耦。

```
┌─────────────────────────────────────────────────────────────┐
│  UI 层  (React + Framer Motion + shadcn/ui)                 │
│  - SokobanGame, HUD, MainMenu, LevelSelect, WinModal, ...   │
│  - 订阅 store；派发用户意图                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ 回调 / 选择器
┌──────────────────────────▼──────────────────────────────────┐
│  状态层  (Zustand + persist 中间件)                         │
│  - useGameStore: phase, level, moves, pushes, progress      │
│  - 调用 engine.action() 并响应 engine 回调                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ getState().action()
┌──────────────────────────▼──────────────────────────────────┐
│  引擎层  (纯 TypeScript，零 React 依赖)                     │
│  - GameEngine 编排 Board + UndoStack + LevelManager         │
│  - 内部状态（cells, boxes, player）私有                     │
│  - 通过回调发出事件：onMove / onPush / onWin ...            │
│  - 核心算法 100% 单元测试覆盖                                │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计决策

- **引擎内部状态私有** —— `GameEngine` 将 `board`、`undoStack`、`levelManager` 作为私有字段持有。外部只能通过 getter（`currentLevel`、`canUndo`、`moveCount` …）查询，通过 action 方法（`move()`、`undo()`、`reset()`）变更。
- **渲染快照模式** —— 引擎暴露 `getRenderSnapshot()` 返回棋盘的不可变视图。Canvas 渲染器每个 `requestAnimationFrame` 拉取最新快照，让渲染与模拟解耦。
- **回调驱动数据流** —— 引擎从不导入 React 或 Zustand，仅通过 `GameEngineCallbacks` 接口通信（`onPhaseChange`、`onMove`、`onPush`、`onWin`、`onDeadlock`、`onSettle`、`onBlocked` …）。
- **XSB 关卡格式** —— 关卡使用行业标准 [XSB 格式](https://sokobano.de/wiki/Level_format)编写，由 `XsbParser` 解析。20 个内置关卡位于 `builtinLevels.ts`。
- **死锁检测** —— `DeadlockDetector` 检测两类常见死锁：角落死锁（非目标箱子被推入角落）与边墙死锁（箱子被推到墙边且该墙方向上无目标点）。每次推箱后触发检测。

### 项目结构

```
Web_Game_05_Sokoban/
├── sokoban/                    # 应用主体
│   ├── public/
│   ├── src/
│   │   ├── components/         # React UI 组件
│   │   │   ├── ui/             # shadcn/ui 基础组件
│   │   │   ├── SokobanGame.tsx # 顶层游戏组件
│   │   │   ├── HUD.tsx
│   │   │   ├── MainMenu.tsx
│   │   │   ├── LevelSelect.tsx
│   │   │   ├── PauseOverlay.tsx
│   │   │   ├── WinModal.tsx
│   │   │   ├── ActionBar.tsx
│   │   │   ├── DeadlockToast.tsx
│   │   │   └── Overlays.tsx
│   │   ├── config/             # 全局配置 + Zod schema
│   │   ├── engine/             # 纯 TS 游戏逻辑
│   │   │   ├── levels/         # XSB 解析 + 关卡数据
│   │   │   ├── __tests__/      # 单元测试（84 个）
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
│   ├── docs/                   # 6 篇设计文档（中文）
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.ts
├── PRD-推箱子.md                # 产品需求文档
├── README.md                   # 英文版
└── README.zh-CN.md             # 中文版（当前文件）
```

---

## 🛠️ 技术栈

| 层级 | 选型 | 理由 |
| --- | --- | --- |
| 构建工具 | **Vite 5** | 快速 HMR、ESM 原生、零配置 TS 支持 |
| UI 框架 | **React 18** | 组件模型、Hooks、并发渲染 |
| 语言 | **TypeScript 5**（strict） | 跨引擎/UI 边界的类型安全 |
| 样式 | **Tailwind CSS 3** | 原子化、设计令牌一致 |
| UI 基础组件 | **shadcn/ui**（Radix UI） | 无障碍、可定制、无运行时锁定 |
| 状态 | **Zustand 4** + persist | 极简样板、SSR 友好、中间件 |
| 动画 | **Framer Motion 11** | 声明式菜单/模态过渡 |
| 渲染 | **Canvas 2D** | 60 fps 网格渲染 + 自定义纹理 |
| 音频 | **Web Audio API** | 合成音效，零素材体积 |
| 测试 | **Vitest 1** + happy-dom | Vite 原生、快速、Jest 兼容 API |
| Lint / 格式化 | **ESLint 8** + **Prettier 3** | 常规方案，与 Vite 集成 |
| 部署 | **Vercel** | 零配置 SPA 托管、GitHub 集成 |

---

## 🧪 测试

引擎层由 **Vitest** 完整单元测试覆盖，84 个测试全部通过。

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

测试文件与被测源码同目录，位于 [`sokoban/src/engine/__tests__/`](./sokoban/src/engine/__tests__/)。

---

## ⚡ 性能指标

| 指标 | 实测 |
| --- | --- |
| 首屏加载（gzip） | ~138 KB |
| 帧率 | 稳定 60 fps |
| 内存占用 | < 60 MB |
| 单元测试 | 84 / 84 通过 |
| 核心算法覆盖 | 100% |

---

## 📖 项目文档

`sokoban/docs/` 目录下有六篇设计文档（中文），覆盖从立项到部署的完整生命周期。

| 文档 | 内容 |
| --- | --- |
| [01-项目立项](./sokoban/docs/01-项目立项.md) | 背景 / 目标 / 范围 / 用户画像 |
| [02-需求拆分](./sokoban/docs/02-需求拆分.md) | MVP / V2 拆分 + 验收标准 |
| [03-技术选型](./sokoban/docs/03-技术选型.md) | 为什么选 Vite + Canvas 2D + Zustand + 暗黑紫调 |
| [04-项目架构](./sokoban/docs/04-项目架构.md) | 三层分离 + 数据流 + 文件清单 |
| [05-执行规划](./sokoban/docs/05-执行规划.md) | 9 阶段里程碑 + 提交策略 |
| [06-部署指南](./sokoban/docs/06-部署指南.md) | Vercel 部署 + base 路径配置 |

原始产品需求文档位于 [`PRD-推箱子.md`](./PRD-推箱子.md)。

---

## 🗺️ 路线图

- [x] MVP —— 20 关、撤销/重做、死锁检测、Canvas 渲染器
- [x] 音效 —— 5 种合成音效
- [x] 持久化 —— 关卡解锁 + 最佳步数记录
- [x] 响应式 UI —— 桌面 + 触屏（≥ 375 px）
- [ ] Vercel 部署 + 在线试玩链接
- [ ] 关卡编辑器（导入 / 导出 XSB）
- [ ] 更多关卡包
- [ ] 解法回放与分享

---

## 🙏 致谢

- **推箱子（Sokoban）** —— 由 Hiroyuki Imabayashi 于 1981 年设计，Thinking Rabbit 发行。
- **XSB 关卡格式** —— 社区标准，文档见 [sokobano.de](https://sokobano.de/)。
- **Microban** —— 启发了 20 个内置关卡的经典关卡集。
- **shadcn/ui** —— 基于 Radix UI + Tailwind CSS。
- **Web Audio API** —— 让零素材音效合成成为可能。

---

## 📄 许可

本项目基于 **MIT License** 发布。

> 说明：仓库尚未提交独立的 `LICENSE` 文件。许可声明沿用原项目 README 与 `package.json` description。公开再分发前请补充 `LICENSE` 文件。

---

<div align="center">

**如果这个项目对你有帮助，请给它一个 ⭐ Star！**

[GitHub](https://github.com/NOSOLUTIONLOVE/Web_Game_05_Sokoban) · [问题反馈](https://github.com/NOSOLUTIONLOVE/Web_Game_05_Sokoban/issues)

</div>
