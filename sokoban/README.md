# Sokoban Web（推箱子）

> 网页版推箱子游戏 · 20 关 Microban 风格 · 60fps · 暗黑紫调 UI

![Version](https://img.shields.io/badge/version-0.1.0--sokoban-blueviolet)
![Tech](https://img.shields.io/badge/tech-React%2018%20%2B%20TypeScript%20%2B%20Vite%205-blue)
![Tests](https://img.shields.io/badge/tests-84%20passed-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 项目简介

经典的推箱子（Sokoban）网页版，基于 Microban 仓库风格设计，20 关从易到难。

**技术栈**：Vite 5 + React 18 + TypeScript 5 (strict) + Tailwind CSS 3 + shadcn/ui + Zustand 4 + Canvas 2D + Framer Motion + Vitest

**项目库**：Web_Game_01（#5）— 与 snake / 2048 / tetris / flappybird 同属一个项目库

## 在线试玩

> 部署链接待定：Vercel 部署后更新

## 操作说明

| 输入 | 行为 |
| --- | --- |
| `↑ ↓ ← →` / `W A S D` | 移动 |
| `U` / `Z` | 撤销 |
| `Y` / `X` | 重做 |
| `R` | 重置关卡 |
| `P` / `Esc` | 暂停 / 继续 |
| `M` | 切换静音 |
| `Enter` / `Space` | 确认（菜单 / 胜利后进入下一关） |
| 触屏滑动（≥ 30px） | 移动 |

**移动端**：底部 ActionBar 提供撤销 / 重做 / 重置按钮

## 游戏规则

1. 玩家是仓库工人
2. 推动箱子到目标点（黄色脚印）
3. 所有箱子都归位 → 胜利
4. 一次只能推一个箱子
5. 不能拉箱子
6. 不能同时推两个箱子

## 核心特性

- ✅ **20 关内置**（Microban 风格，难度 1-5）
- ✅ **撤销 / 重做**：200 步历史栈
- ✅ **死锁检测**：角落死锁 + 边墙死锁
- ✅ **关卡进度持久化**：自动解锁下一关，记录最佳步数
- ✅ **5 个音效**：移动 / 推箱 / 撤销 / 胜利 / 推不动
- ✅ **60fps Canvas 渲染**：7 种 CellType + 动效
- ✅ **响应式 UI**：桌面端 + 移动端（≥ 375px）
- ✅ **键盘 + 触屏双输入**

## 技术亮点

### 1. 三层分离架构

```
UI 层（React + Zustand）
  ↓ 回调
状态层（Zustand + persist）
  ↓ getState().action()
引擎层（纯 TypeScript）
  - 内部状态私有持有
  - 仅事件触发回调
  - 100% 单元测试覆盖
```

### 2. 引擎内部状态私有

```ts
class GameEngine {
  private board: Board;          // 私有
  private undoStack: UndoStack;  // 私有
  // 外部只能通过 getter 查询
  get currentLevel() { ... }
  get canUndo() { ... }
}
```

### 3. 渲染快照模式

```ts
// Engine 暴露快照
getRenderSnapshot(): RenderSnapshot {
  return { board, moveCount, pushCount, phase, ... };
}

// Renderer 每帧拉取
requestAnimationFrame(() => {
  renderer.render(engine.getRenderSnapshot());
});
```

### 4. 84 个单元测试全绿

```bash
✓ Board.test.ts               (14 tests)
✓ DeadlockDetector.test.ts    (10 tests)
✓ GameEngine.test.ts          (23 tests)
✓ LevelManager.test.ts        (18 tests)
✓ XsbParser.test.ts           (13 tests)
✓ builtinLevels.test.ts        (6 tests)

Test Files  6 passed (6)
     Tests  84 passed (84)
```

## 项目结构

```
games/sokoban/
├── public/
├── src/
│   ├── components/         # React 组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   ├── SokobanGame.tsx # 顶层游戏组件
│   │   ├── HUD.tsx
│   │   ├── MainMenu.tsx
│   │   ├── LevelSelect.tsx
│   │   ├── PauseOverlay.tsx
│   │   ├── WinModal.tsx
│   │   ├── ActionBar.tsx
│   │   ├── DeadlockToast.tsx
│   │   └── Overlays.tsx
│   ├── config/             # 全局配置
│   ├── engine/             # 纯 TS 游戏逻辑
│   │   ├── levels/         # XSB 解析 + 关卡数据
│   │   ├── __tests__/      # 单元测试
│   │   ├── Board.ts
│   │   ├── UndoStack.ts
│   │   ├── DeadlockDetector.ts
│   │   ├── LevelManager.ts
│   │   ├── GameEngine.ts
│   │   ├── Renderer.ts
│   │   └── Input.ts
│   ├── store/              # Zustand
│   ├── lib/                # 工具库（storage / audio / utils）
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/                   # 项目文档（6 篇）
├── index.html
├── package.json
└── vercel.json
```

## 本地开发

### 环境要求

- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 安装依赖
cd games/sokoban
npm install

# 启动开发服务器
npm run dev
# → http://127.0.0.1:5177/

# 类型检查
npm run type-check

# 单元测试
npm run test

# Lint
npm run lint

# 生产构建
npm run build

# 预览生产产物
npm run preview
# → http://127.0.0.1:4177/
```

## 部署

推荐使用 Vercel，详见 [06-部署指南](./docs/06-部署指南.md)。

```bash
# 推送代码后
# 1. 访问 https://vercel.com/new
# 2. 选 Web_Game_01 仓库
# 3. Root Directory: games/sokoban
# 4. 点击 Deploy
```

## 项目文档

| 文档 | 内容 |
| --- | --- |
| [01-项目立项](./docs/01-项目立项.md) | 背景 / 目标 / 范围 / 用户画像 |
| [02-需求拆分](./docs/02-需求拆分.md) | MVP / V2 拆分 + 验收标准 |
| [03-技术选型](./docs/03-技术选型.md) | Vite + Canvas 2D + Zustand + 暗黑紫调 |
| [04-项目架构](./docs/04-项目架构.md) | 三层分离 + 数据流 + 文件清单 |
| [05-执行规划](./docs/05-执行规划.md) | 9 阶段里程碑 + 提交策略 |
| [06-部署指南](./docs/06-部署指南.md) | Vercel + base 配置 |

## 性能指标

| 指标 | 实测 |
| --- | --- |
| 首屏加载（gzip） | ~138 KB |
| 60fps | 稳定 |
| 内存占用 | < 60 MB |
| 单元测试 | 84/84 通过 |
| 单元测试覆盖 | 核心算法 100% |

## 致谢

- **XSB 关卡格式**：参考 [sokobano.de](https://sokobano.de/) 行业标准
- **Microban 关卡**：经典仓库风格关卡集
- **shadcn/ui**：基于 Radix UI + Tailwind CSS
- **Web Audio API**：零素材依赖的音效合成

## 许可

MIT License

---

**项目库**：Web_Game_01 · 推箱子 #5
**最后更新**：2026-06-23
