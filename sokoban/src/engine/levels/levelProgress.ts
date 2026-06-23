/**
 * 关卡进度管理 - localStorage 持久化
 *
 * 记录：
 * - unlockedLevels: 已解锁的关卡 ID 集合
 * - bestMoves: 每个关卡的最少步数
 * - bestPushes: 每个关卡的最少推箱数
 */

import { storage } from '../../lib/storage';
import { CONFIG } from '../../config';
import type { Level } from '../../config';

export interface LevelProgress {
  /** 已解锁关卡 ID 列表（含起始关） */
  unlocked: number[];
  /** 关卡 ID → 最少步数 */
  bestMoves: Record<number, number>;
  /** 关卡 ID → 最少推箱数 */
  bestPushes: Record<number, number>;
  /** 关卡 ID → 已通关次数（用于展示熟练度） */
  cleared: Record<number, number>;
}

const DEFAULT_PROGRESS: LevelProgress = {
  unlocked: [CONFIG.START_LEVEL_ID], // 起始关默认解锁
  bestMoves: {},
  bestPushes: {},
  cleared: {},
};

/** 读取全部进度 */
export function loadProgress(): LevelProgress {
  const stored = storage.get<LevelProgress | null>(CONFIG.STORAGE_KEYS.PROGRESS, null);
  if (!stored) {
    // 返回深拷贝，避免外部修改影响 DEFAULT_PROGRESS
    return {
      unlocked: [...DEFAULT_PROGRESS.unlocked],
      bestMoves: { ...DEFAULT_PROGRESS.bestMoves },
      bestPushes: { ...DEFAULT_PROGRESS.bestPushes },
      cleared: { ...DEFAULT_PROGRESS.cleared },
    };
  }
  return {
    unlocked: stored.unlocked?.length ? [...stored.unlocked] : [...DEFAULT_PROGRESS.unlocked],
    bestMoves: { ...(stored.bestMoves ?? {}) },
    bestPushes: { ...(stored.bestPushes ?? {}) },
    cleared: { ...(stored.cleared ?? {}) },
  };
}

/** 写入全部进度 */
export function saveProgress(progress: LevelProgress): void {
  storage.set(CONFIG.STORAGE_KEYS.PROGRESS, progress);
}

/** 检查关卡是否已解锁 */
export function isLevelUnlocked(progress: LevelProgress, levelId: number): boolean {
  return progress.unlocked.includes(levelId);
}

/** 解锁下一关 */
export function unlockNext(progress: LevelProgress, levels: Level[], currentId: number): LevelProgress {
  const currentIndex = levels.findIndex((l) => l.id === currentId);
  const nextLevel = currentIndex >= 0 ? levels[currentIndex + 1] : null;
  if (!nextLevel) return progress;

  if (progress.unlocked.includes(nextLevel.id)) return progress;

  return {
    ...progress,
    unlocked: [...progress.unlocked, nextLevel.id],
  };
}

/** 提交通关记录（仅在更优时更新） */
export function submitClear(
  progress: LevelProgress,
  levelId: number,
  moves: number,
  pushes: number,
): LevelProgress {
  const prevMoves = progress.bestMoves[levelId] ?? Number.POSITIVE_INFINITY;
  const prevPushes = progress.bestPushes[levelId] ?? Number.POSITIVE_INFINITY;
  const prevCleared = progress.cleared[levelId] ?? 0;

  return {
    ...progress,
    bestMoves: { ...progress.bestMoves, [levelId]: Math.min(prevMoves, moves) },
    bestPushes: { ...progress.bestPushes, [levelId]: Math.min(prevPushes, pushes) },
    cleared: { ...progress.cleared, [levelId]: prevCleared + 1 },
  };
}

/** 重置全部进度（调试用） */
export function resetProgress(): void {
  storage.remove(CONFIG.STORAGE_KEYS.PROGRESS);
}
