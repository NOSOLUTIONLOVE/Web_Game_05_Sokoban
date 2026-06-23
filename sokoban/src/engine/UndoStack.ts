/**
 * UndoStack - 撤销 / 重做栈
 *
 * 设计：
 * - history: 移动记录栈（可撤销）
 * - redoStack: 重做栈（已被撤销但未提交新操作）
 * - MAX_HISTORY 限制（来自 PRD §10：200 步）
 * - 新操作 push 时清空 redoStack（标准模式）
 */

import { CONFIG } from '../config';
import type { MoveRecord, Direction } from '../config';
import { opposite } from './Direction';
import type { BoardSnapshot } from './Board';

/** 撤销栈条目（含 Board 快照） */
export interface UndoEntry {
  record: MoveRecord;
  snapshot: BoardSnapshot;
}

export class UndoStack {
  private history: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory: number = CONFIG.UNDO.MAX_HISTORY) {
    this.maxHistory = maxHistory;
  }

  /** 是否可以撤销 */
  get canUndo(): boolean {
    return this.history.length > 0;
  }

  /** 是否可以重做 */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** 当前 history 长度 */
  get size(): number {
    return this.history.length;
  }

  /** 清空所有（重置关卡时调用） */
  clear(): void {
    this.history = [];
    this.redoStack = [];
  }

  /**
   * 推入一条新记录
   *
   * - 新操作 → 清空 redoStack
   * - 超过 maxHistory → 丢弃最旧
   */
  push(record: MoveRecord, snapshot: BoardSnapshot): void {
    this.redoStack = [];
    this.history.push({ record, snapshot });
    // 超过容量 → 丢弃最旧
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * 撤销一步
   *
   * @returns 撤销的条目（含反向方向），若无历史则返回 null
   */
  undo(): UndoEntry | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.redoStack.push(entry);
    return entry;
  }

  /**
   * 重做一步
   *
   * @returns 重做的条目，若无 redo 栈则返回 null
   */
  redo(): UndoEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.history.push(entry);
    return entry;
  }

  /** 构造"反向"移动记录（用于重做） */
  static invertRecord(record: MoveRecord): MoveRecord {
    return {
      ...record,
      direction: opposite(record.direction),
    };
  }

  /** 获取最近一次移动的方向（用于 UI 提示） */
  lastDirection(): Direction | null {
    const last = this.history[this.history.length - 1];
    return last ? last.record.direction : null;
  }

  /** 用于调试：导出 history */
  getHistory(): MoveRecord[] {
    return this.history.map((e) => e.record);
  }
}
