/**
 * GameEngine - 游戏引擎编排器
 *
 * 职责：
 * - 持有 Board + UndoStack + LevelManager
 * - 状态机：menu / playing / paused / over
 * - 事件回调：onPhaseChange / onLevelChange / onMove / onPush / onWin / onDeadlock / onStateChange
 * - 胜利时持久化进度
 *
 * 设计原则：
 * - 内部状态（cells / boxes / player / undoStack）私有，不暴露给 store
 * - 外部通过回调订阅关键事件
 * - 单向数据流：用户操作 → Engine → 回调 → UI/Store
 */

import type { Direction, GamePhase, Level, MoveRecord, Point } from '../config';
import { Board } from './Board';
import { UndoStack } from './UndoStack';
import { LevelManager } from './LevelManager';
import { BUILTIN_LEVELS } from './levels/builtinLevels';
import {
  loadProgress,
  saveProgress,
  submitClear,
  type LevelProgress,
} from './levels/levelProgress';
import { isAnyDeadlock } from './DeadlockDetector';

/** GameEngine 事件回调 */
export interface GameEngineCallbacks {
  onPhaseChange?: (phase: GamePhase) => void;
  onLevelChange?: (level: Level, levelId: number, total: number) => void;
  onMove?: (moves: number, pushes: number) => void;
  onPush?: (moves: number, pushes: number) => void;
  onWin?: (moves: number, pushes: number, isOptimal: boolean) => void;
  onDeadlock?: (positions: Point[]) => void;
  onStateChange?: () => void;
  onProgressChange?: (progress: LevelProgress) => void;
  /** 推箱成功且箱子归位 */
  onSettle?: (position: Point) => void;
  /** 推不动（撞墙/撞箱） */
  onBlocked?: (direction: Direction) => void;
}

export class GameEngine {
  private levelManager: LevelManager;
  private board: Board;
  private undoStack: UndoStack;
  private _phase: GamePhase = 'menu';
  private _moveCount: number = 0;
  private _pushCount: number = 0;
  /** 进度数据（关卡解锁 + 最优解） */
  private _progress: LevelProgress;
  private callbacks: GameEngineCallbacks = {};
  /** 移动时是否触发死锁检测（性能考虑，仅在推箱后检测） */
  private deadlockCheckEnabled: boolean = true;

  constructor(
    levels: Level[] = [...BUILTIN_LEVELS],
    callbacks: GameEngineCallbacks = {},
  ) {
    this.levelManager = new LevelManager(levels);
    this.board = new Board(this.levelManager.getCurrent());
    this.undoStack = new UndoStack();
    this._progress = loadProgress();
    this.callbacks = callbacks;
  }

  // ============ 状态查询 ============

  get phase(): GamePhase {
    return this._phase;
  }

  get moveCount(): number {
    return this._moveCount;
  }

  get pushCount(): number {
    return this._pushCount;
  }

  get currentLevel(): Level {
    return this.levelManager.getCurrent();
  }

  get currentBoard(): Board {
    return this.board;
  }

  get currentProgress(): LevelProgress {
    return this._progress;
  }

  get canUndo(): boolean {
    return this.undoStack.canUndo;
  }

  get canRedo(): boolean {
    return this.undoStack.canRedo;
  }

  get totalLevels(): number {
    return this.levelManager.total;
  }

  // ============ 状态切换 ============

  /** 设置回调（可整体替换） */
  setCallbacks(callbacks: GameEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  /** 开始游戏（从 menu → playing） */
  startGame(): void {
    this.transitionTo('playing');
  }

  /** 暂停 / 继续 */
  togglePause(): void {
    if (this._phase === 'playing') {
      this.transitionTo('paused');
    } else if (this._phase === 'paused') {
      this.transitionTo('playing');
    }
  }

  /** 返回主菜单 */
  backToMenu(): void {
    this.transitionTo('menu');
  }

  /** 重置当前关卡 */
  resetLevel(): void {
    this.board = new Board(this.levelManager.getCurrent());
    this.undoStack.clear();
    this._moveCount = 0;
    this._pushCount = 0;
    this.transitionTo('playing');
    this.emitLevelChange();
    this.emitStateChange();
  }

  /** 进入下一关 */
  nextLevel(): boolean {
    if (!this.levelManager.hasNext()) return false;
    this.levelManager.next();
    this.board = new Board(this.levelManager.getCurrent());
    this.undoStack.clear();
    this._moveCount = 0;
    this._pushCount = 0;
    // 解锁下一关
    this._progress = this.levelManager.unlockNext(this._progress);
    saveProgress(this._progress);
    this.callbacks.onProgressChange?.(this._progress);
    this.transitionTo('playing');
    this.emitLevelChange();
    this.emitStateChange();
    return true;
  }

  /** 进入上一关 */
  prevLevel(): boolean {
    if (!this.levelManager.hasPrev()) return false;
    this.levelManager.prev();
    this.board = new Board(this.levelManager.getCurrent());
    this.undoStack.clear();
    this._moveCount = 0;
    this._pushCount = 0;
    this.transitionTo('playing');
    this.emitLevelChange();
    this.emitStateChange();
    return true;
  }

  /** 通过 ID 加载关卡 */
  loadLevel(id: number): boolean {
    if (this.levelManager.loadById(id) === null) return false;
    this.board = new Board(this.levelManager.getCurrent());
    this.undoStack.clear();
    this._moveCount = 0;
    this._pushCount = 0;
    this.transitionTo('playing');
    this.emitLevelChange();
    this.emitStateChange();
    return true;
  }

  // ============ 移动 / 推箱 ============

  /**
   * 尝试按方向移动工人
   *
   * @returns MoveResult
   */
  handleMove(direction: Direction) {
    if (this._phase !== 'playing') {
      return { moved: false, pushed: false, blocked: 'boundary' as const };
    }
    // 推箱前 snapshot（用于 undo）
    const snapshot = this.board.snapshot();
    const fromPlayer = { ...snapshot.player };
    const result = this.board.tryMove(direction);

    if (!result.moved) {
      // 撞墙 / 撞箱 → 触发 blocked 动画（不计入历史）
      this.callbacks.onBlocked?.(direction);
      this.emitStateChange();
      return result;
    }

    // 计算 next / beyond（用于 boxFrom / boxTo）
    const offsets: Record<Direction, { x: number; y: number }> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const off = offsets[direction];
    const nextPos = { x: fromPlayer.x + off.x, y: fromPlayer.y + off.y };
    const beyondPos = { x: fromPlayer.x + 2 * off.x, y: fromPlayer.y + 2 * off.y };

    // 成功移动 → 推入 UndoStack
    const record: MoveRecord = {
      direction,
      playerFrom: fromPlayer,
      playerTo: { ...this.board.player },
      pushed: result.pushed,
      boxFrom: result.pushed ? nextPos : undefined,
      boxTo: result.pushed ? beyondPos : undefined,
      timestamp: Date.now(),
    };
    this.undoStack.push(record, snapshot);
    this._moveCount += 1;
    if (result.pushed) this._pushCount += 1;

    this.callbacks.onMove?.(this._moveCount, this._pushCount);
    if (result.pushed) this.callbacks.onPush?.(this._moveCount, this._pushCount);

    // 推箱成功且归位 → 触发 settle 动画
    if (result.pushed && this.board.isTarget(beyondPos)) {
      this.callbacks.onSettle?.(beyondPos);
    }

    // 检查胜利
    if (this.board.isWon()) {
      this.handleWin();
      return result;
    }

    // 检查死锁（仅在推箱时）
    if (result.pushed && this.deadlockCheckEnabled) {
      if (isAnyDeadlock(this.board)) {
        this.callbacks.onDeadlock?.(
          this.board.boxes
            .filter((b) => !this.board.isTarget(b))
            .map((b) => ({ ...b })),
        );
      }
    }

    this.emitStateChange();
    return result;
  }

  /** 撤销 */
  undo(): boolean {
    if (this._phase !== 'playing') return false;
    if (!this.undoStack.canUndo) return false;
    const entry = this.undoStack.undo();
    if (!entry) return false;
    this.board.restore(entry.snapshot);
    this._moveCount = Math.max(0, this._moveCount - 1);
    if (entry.record.pushed) {
      this._pushCount = Math.max(0, this._pushCount - 1);
    }
    this.callbacks.onMove?.(this._moveCount, this._pushCount);
    this.emitStateChange();
    return true;
  }

  /** 重做 - 重新执行被撤销的移动 */
  redo(): boolean {
    if (this._phase !== 'playing') return false;
    if (!this.undoStack.canRedo) return false;
    const entry = this.undoStack.redo();
    if (!entry) return false;
    // 重新执行移动：此时 board 处于 entry 撤销后的状态（即移动前状态），
    // 重新调用 tryMove 应用该方向的移动，得到移动后状态。
    this.board.tryMove(entry.record.direction);
    this._moveCount += 1;
    if (entry.record.pushed) this._pushCount += 1;
    this.callbacks.onMove?.(this._moveCount, this._pushCount);
    this.emitStateChange();
    return true;
  }

  // ============ 内部 ============

  /** 状态转移 */
  private transitionTo(next: GamePhase): void {
    if (this._phase === next) return;
    this._phase = next;
    this.callbacks.onPhaseChange?.(next);
  }

  /** 胜利处理 */
  private handleWin(): void {
    const level = this.levelManager.getCurrent();
    const optimalMoves = level.optimalMoves ?? Infinity;
    const optimalPushes = level.optimalPushes ?? Infinity;
    const isOptimal = this._moveCount <= optimalMoves && this._pushCount <= optimalPushes;
    // 持久化
    this._progress = submitClear(this._progress, this.currentLevel.id, this._moveCount, this._pushCount);
    this._progress = this.levelManager.unlockNext(this._progress);
    saveProgress(this._progress);
    this.callbacks.onProgressChange?.(this._progress);
    this.transitionTo('over');
    this.callbacks.onWin?.(this._moveCount, this._pushCount, isOptimal);
    this.emitStateChange();
  }

  private emitLevelChange(): void {
    this.callbacks.onLevelChange?.(
      this.levelManager.getCurrent(),
      this.levelManager.currentId,
      this.levelManager.total,
    );
  }

  private emitStateChange(): void {
    this.callbacks.onStateChange?.();
  }

  // ============ 调试 ============

  /** 获取所有关卡元信息（UI 用） */
  getAllLevels(): readonly Level[] {
    return this.levelManager.getAllLevels();
  }

  /** 获取指定 ID 的关卡元信息 */
  getLevelById(id: number): Level | null {
    return this.levelManager.getById(id);
  }

  /** 是否可加载指定关卡（已解锁） */
  isLevelAccessible(id: number): boolean {
    return this.levelManager.isIdUnlocked(this._progress, id);
  }

  /** 当前回合是否最优解（用于 HUD 显示） */
  isOptimalCurrent(): boolean {
    const level = this.levelManager.getCurrent();
    return (
      this._moveCount <= (level.optimalMoves ?? Infinity) &&
      this._pushCount <= (level.optimalPushes ?? Infinity)
    );
  }

  // ============ 渲染快照 ============

  /** 获取当前渲染快照（供 Renderer 拉取） */
  getRenderSnapshot(): import('./Renderer').RenderSnapshot {
    const level = this.levelManager.getCurrent();
    return {
      board: this.board,
      moveCount: this._moveCount,
      pushCount: this._pushCount,
      levelName: level.name,
      levelId: level.id,
      totalLevels: this.levelManager.total,
      phase: this._phase,
      isOptimal:
        this._phase === 'over' &&
        this._moveCount <= (level.optimalMoves ?? Infinity) &&
        this._pushCount <= (level.optimalPushes ?? Infinity),
      bestMoves: this._progress.bestMoves[level.id],
      bestPushes: this._progress.bestPushes[level.id],
    };
  }
}
