/**
 * Sokoban Web - 全局配置（v2.0）
 *
 * 所有可调参数集中在此处，单一数据源原则
 * 含 Zod schema 用于运行时校验
 */

import { z } from 'zod';

/**
 * Zod schema - 用于校验配置
 */
export const gameConfigSchema = z.object({
  cell: z.object({
    size: z.number().int().positive(),
    maxCanvasWidth: z.number().int().positive(),
    maxCanvasHeight: z.number().int().positive(),
  }),
  undo: z.object({
    maxHistory: z.number().int().positive(),
  }),
  audio: z.object({
    enabled: z.boolean(),
  }),
});

export type GameConfig = z.infer<typeof gameConfigSchema>;

/**
 * 坐标点
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 7 种格子类型（来自 PRD §3.2 / §8.1）
 *
 *  - wall:                墙 (#)
 *  - floor:               地板（空格）
 *  - target:              目标点 (.)
 *  - box:                 箱子 ($)
 *  - box_on_target:       归位箱子 (*)
 *  - player:              工人 (@)
 *  - player_on_target:    工人在目标点上 (+)
 */
export type CellType =
  | 'wall'
  | 'floor'
  | 'target'
  | 'box'
  | 'box_on_target'
  | 'player'
  | 'player_on_target';

/**
 * 4 个方向
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * 关卡（来自 PRD §8.1）
 */
export interface Level {
  id: number;
  name: string;
  /** 关卡原始宽度（行最长字符数） */
  width: number;
  /** 关卡高度（行数） */
  height: number;
  /** 格子类型二维数组（不可变快照） */
  cells: CellType[][];
  /** 工人初始位置 */
  playerStart: Point;
  /** 箱子初始位置列表 */
  boxesStart: Point[];
  /** 目标点位置列表 */
  targets: Point[];
  /** 最少步数（参考值） */
  optimalMoves?: number;
  /** 最少推箱数（参考值） */
  optimalPushes?: number;
  /** 难度标签 */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** 难度 1-5（1=最简单，5=最难） */
  difficultyRank: number;
  /** XSB 源文本（可选） */
  xsb?: string;
}

/**
 * 移动记录
 */
export interface MoveRecord {
  /** 移动方向 */
  direction: Direction;
  /** 移动前工人位置 */
  playerFrom: Point;
  /** 移动后工人位置 */
  playerTo: Point;
  /** 是否推箱 */
  pushed: boolean;
  /** 若推箱：箱子 from */
  boxFrom?: Point;
  /** 若推箱：箱子 to */
  boxTo?: Point;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 游戏阶段
 */
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over';

/**
 * 移动结果
 */
export interface MoveResult {
  moved: boolean;
  pushed: boolean;
  blocked?: 'wall' | 'box' | 'boundary';
}

/**
 * 配置常量
 *
 * 网格：每格 64×64 px（来自 PRD §6.2）
 * 画布大小：根据关卡自适应（每关尺寸可能不同）
 * 撤销栈：上限 200 步（来自 PRD §10）
 */
export const CONFIG = {
  /** 网格 */
  CELL: {
    /** 单元格尺寸（px） */
    SIZE: 64,
    /** 画布最大宽度（超过时缩放） */
    MAX_CANVAS_WIDTH: 896,
    /** 画布最大高度 */
    MAX_CANVAS_HEIGHT: 640,
  },

  /** 撤销栈 */
  UNDO: {
    /** 最大历史步数（来自 PRD §10） */
    MAX_HISTORY: 200,
  },

  /** 视觉颜色（来自 PRD §6.2） */
  COLORS: {
    BG: '#09090b', // zinc-950
    WALL: '#3a3a3a', // 深灰带砖纹
    WALL_BRIGHT: '#5a5a5a', // 砖纹高光
    FLOOR: '#8b6f47', // 木地板色
    FLOOR_DARK: '#6e563a', // 木地板暗纹
    TARGET: '#fbbf24', // 黄色脚印/十字
    BOX: '#a16207', // 棕色木箱
    BOX_DARK: '#854d05', // 木箱暗部
    BOX_ON_TARGET: '#22c55e', // 绿色木箱（归位）
    BOX_ON_TARGET_DARK: '#15803d', // 绿色木箱暗部
    PLAYER: '#3b82f6', // 蓝色小人
    PLAYER_DARK: '#1d4ed8', // 蓝色小人暗部
    PLAYER_FACE: '#fef3c7', // 工人肤色
    GRID_LINE: 'rgba(255, 255, 255, 0.04)',
    TEXT: '#e5e7eb',
    TEXT_DIM: '#9ca3af',
    TEXT_SHADOW: 'rgba(0, 0, 0, 0.6)',
    SHADOW: 'rgba(0, 0, 0, 0.3)',
  },

  /** 触屏滑动阈值（来自 PRD §6.3） */
  TOUCH: {
    THRESHOLD: 30,
    DEBOUNCE_MS: 50,
  },

  /** 动画 */
  ANIMATION: {
    /** 推箱过渡时长（ms） */
    PUSH_DURATION: 100,
    /** 归位绿光闪烁次数 */
    ON_TARGET_FLASH_COUNT: 2,
    /** 推不动抖动时长 */
    BLOCKED_SHAKE_MS: 200,
  },

  /** localStorage 键名 */
  STORAGE_KEYS: {
    /** Zustand persist */
    STORE: 'sokoban:store',
    /** 关卡进度（unlocked + best moves） */
    PROGRESS: 'sokoban:progress',
  },

  /** 起始关 */
  START_LEVEL_ID: 1,
} as const;
