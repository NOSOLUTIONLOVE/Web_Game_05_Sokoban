/**
 * useGameStore - Zustand 全局状态
 *
 * 桥接 UI 层（React）与游戏层（GameEngine）
 * - GameEngine 通过 actions 通知 UI 状态变化
 * - UI 通过 actions 触发 GameEngine 行为
 * - 持久化关卡进度 + 音量设置到 localStorage
 *
 * 设计原则：
 * - 引擎内部状态（cells/boxes/player/undoStack）私有持有，store 仅缓存 UI 关心的快照
 * - 仅事件触发 store 更新（移动/推箱/胜利/死锁等关键事件）
 * - 一次性事件（死锁 toast / 胜利闪烁）通过 clearXxx actions 主动清除
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFIG, type Direction, type GamePhase, type Point } from '../config';

export interface GameStore {
  // ============ 阶段 / 引擎状态摘要 ============
  phase: GamePhase;
  currentLevelId: number;
  totalLevels: number;
  levelName: string;
  moveCount: number;
  pushCount: number;
  isOptimal: boolean;

  // ============ 关卡进度（持久化）============
  unlockedLevels: number[];
  levelBestMoves: Record<number, number>;
  levelBestPushes: Record<number, number>;
  levelCleared: Record<number, number>;

  // ============ 设置（持久化）============
  audioEnabled: boolean;

  // ============ 一次性事件标记 ============
  showDeadlock: Point[] | null; // 死锁位置（toast 触发）
  flashWin: { levelId: number; isOptimal: boolean; moves: number; pushes: number } | null;
  blockedDirection: Direction | null; // 推不动方向（抖动动画触发）
  winTimestamp: number; // 用于触发 winModal 弹出

  // ============ actions（GameEngine 调用）============
  setPhase: (phase: GamePhase) => void;
  setLevel: (id: number, name: string, total: number) => void;
  setMoveCount: (moves: number, pushes: number, isOptimal: boolean) => void;
  setProgress: (progress: {
    unlocked: number[];
    bestMoves: Record<number, number>;
    bestPushes: Record<number, number>;
    cleared: Record<number, number>;
  }) => void;
  setShowDeadlock: (positions: Point[] | null) => void;
  setFlashWin: (
    payload: { levelId: number; isOptimal: boolean; moves: number; pushes: number } | null
  ) => void;
  setBlockedDirection: (direction: Direction | null) => void;
  setWinTimestamp: (ts: number) => void;

  // ============ actions（UI 调用）============
  toggleAudio: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  resetRound: () => void;
  clearDeadlock: () => void;
  clearFlashWin: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // ============ 初始状态 ============
      phase: 'menu',
      currentLevelId: CONFIG.START_LEVEL_ID,
      totalLevels: 0,
      levelName: '',
      moveCount: 0,
      pushCount: 0,
      isOptimal: false,

      unlockedLevels: [CONFIG.START_LEVEL_ID],
      levelBestMoves: {},
      levelBestPushes: {},
      levelCleared: {},

      audioEnabled: true,

      showDeadlock: null,
      flashWin: null,
      blockedDirection: null,
      winTimestamp: 0,

      // ============ GameEngine 回调 ============
      setPhase: (phase) => set({ phase }),
      setLevel: (id, name, total) =>
        set({
          currentLevelId: id,
          levelName: name,
          totalLevels: total,
          moveCount: 0,
          pushCount: 0,
          isOptimal: false,
        }),
      setMoveCount: (moveCount, pushCount, isOptimal) =>
        set({ moveCount, pushCount, isOptimal }),
      setProgress: (progress) =>
        set({
          unlockedLevels: [...progress.unlocked],
          levelBestMoves: { ...progress.bestMoves },
          levelBestPushes: { ...progress.bestPushes },
          levelCleared: { ...progress.cleared },
        }),
      setShowDeadlock: (positions) => set({ showDeadlock: positions }),
      setFlashWin: (payload) => set({ flashWin: payload }),
      setBlockedDirection: (direction) => set({ blockedDirection: direction }),
      setWinTimestamp: (ts) => set({ winTimestamp: ts }),

      // ============ UI 回调 ============
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
      resetRound: () =>
        set({
          moveCount: 0,
          pushCount: 0,
          isOptimal: false,
          showDeadlock: null,
          flashWin: null,
          blockedDirection: null,
        }),
      clearDeadlock: () => set({ showDeadlock: null }),
      clearFlashWin: () => set({ flashWin: null }),
    }),
    {
      name: CONFIG.STORAGE_KEYS.STORE, // 'sokoban:store'
      // 仅持久化进度 + 设置；游戏运行时状态不持久化
      partialize: (s) => ({
        unlockedLevels: s.unlockedLevels,
        levelBestMoves: s.levelBestMoves,
        levelBestPushes: s.levelBestPushes,
        levelCleared: s.levelCleared,
        audioEnabled: s.audioEnabled,
      }),
    }
  )
);
