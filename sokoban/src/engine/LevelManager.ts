/**
 * LevelManager - 关卡管理
 *
 * 职责：
 * - 持有内置关卡列表（BUILTIN_LEVELS）
 * - 管理当前关卡索引
 * - 提供 next / prev / loadById 等操作
 * - 跟踪已解锁关卡（基于 LevelProgress）
 *
 * 设计：
 * - 不直接操作 localStorage（由调用方通过 LevelProgress 模块管理）
 * - 解锁逻辑独立（unlockNext 调用外部 LevelProgress.unlockNext）
 */

import type { Level } from '../config';
import { BUILTIN_LEVELS } from './levels/builtinLevels';
import {
  isLevelUnlocked,
  type LevelProgress,
  unlockNext as progressUnlockNext,
} from './levels/levelProgress';

export class LevelManager {
  /** 全部关卡（只读） */
  readonly levels: readonly Level[];
  /** 当前关卡索引（从 0 开始） */
  private _currentIndex: number;

  constructor(levels: readonly Level[] = BUILTIN_LEVELS, startIndex: number = 0) {
    if (levels.length === 0) {
      throw new Error('[LevelManager] cannot initialize with empty levels');
    }
    this.levels = levels;
    this._currentIndex = this.clampIndex(startIndex);
  }

  // ============ 查询 ============

  /** 总关数 */
  get total(): number {
    return this.levels.length;
  }

  /** 当前关卡索引 */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /** 当前关卡 */
  getCurrent(): Level {
    const lv = this.levels[this._currentIndex];
    if (!lv) {
      throw new Error(`[LevelManager] invalid currentIndex ${this._currentIndex}`);
    }
    return lv;
  }

  /** 当前关卡 ID（1-based） */
  get currentId(): number {
    return this.getCurrent().id;
  }

  /** 当前关卡在列表中的位置（1-based） */
  get currentNumber(): number {
    return this._currentIndex + 1;
  }

  /** 通过 ID 获取关卡 */
  getById(id: number): Level | null {
    return this.levels.find((l) => l.id === id) ?? null;
  }

  /** 通过索引获取关卡 */
  getByIndex(index: number): Level | null {
    const idx = this.clampIndex(index);
    return this.levels[idx] ?? null;
  }

  /** 是否有下一关 */
  hasNext(): boolean {
    return this._currentIndex < this.levels.length - 1;
  }

  /** 是否有上一关 */
  hasPrev(): boolean {
    return this._currentIndex > 0;
  }

  /** 是否已通关最后一关 */
  isLastLevel(): boolean {
    return this._currentIndex === this.levels.length - 1;
  }

  /** 是否已通关第一关 */
  isFirstLevel(): boolean {
    return this._currentIndex === 0;
  }

  // ============ 导航 ============

  /** 跳到下一关（若无则返回当前关卡） */
  next(): Level {
    if (this.hasNext()) {
      this._currentIndex += 1;
    }
    return this.getCurrent();
  }

  /** 跳到上一关（若无则返回当前关卡） */
  prev(): Level {
    if (this.hasPrev()) {
      this._currentIndex -= 1;
    }
    return this.getCurrent();
  }

  /** 通过 ID 加载关卡（不存在则不改变） */
  loadById(id: number): Level | null {
    const idx = this.levels.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this._currentIndex = idx;
    return this.getCurrent();
  }

  /** 通过索引加载关卡（越界则 clamp） */
  loadByIndex(index: number): Level {
    this._currentIndex = this.clampIndex(index);
    return this.getCurrent();
  }

  // ============ 解锁管理 ============

  /**
   * 解锁下一关（包装 LevelProgress.unlockNext）
   *
   * @returns 更新后的 progress（需由调用方持久化）
   */
  unlockNext(progress: LevelProgress): LevelProgress {
    if (!this.hasNext()) return progress;
    const next = this.levels[this._currentIndex + 1];
    if (!next) return progress;
    if (isLevelUnlocked(progress, next.id)) return progress;
    return progressUnlockNext(progress, this.levels as Level[], this.currentId);
  }

  /** 检查当前关是否已解锁 */
  isCurrentUnlocked(progress: LevelProgress): boolean {
    return isLevelUnlocked(progress, this.currentId);
  }

  /** 检查指定 ID 是否已解锁 */
  isIdUnlocked(progress: LevelProgress, id: number): boolean {
    return isLevelUnlocked(progress, id);
  }

  // ============ 辅助 ============

  /** 限制索引在有效范围 */
  private clampIndex(index: number): number {
    if (index < 0) return 0;
    if (index >= this.levels.length) return this.levels.length - 1;
    return index;
  }

  /** 重置到第一关 */
  resetToFirst(): Level {
    this._currentIndex = 0;
    return this.getCurrent();
  }

  /** 获取所有关卡元信息（关卡选择 UI 用） */
  getAllLevels(): readonly Level[] {
    return this.levels;
  }
}
