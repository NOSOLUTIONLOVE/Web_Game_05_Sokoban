/**
 * XSB 解析器 - 将 XSB 文本格式转换为 Level
 *
 * XSB 格式（来自 PRD §8.2 + Sokoban 行业标准）：
 * - #   = 墙
 * - 空格  = 地板
 * - .   = 目标点
 * - $   = 箱子
 * - *   = 归位箱子
 * - @   = 工人
 * - +   = 工人在目标点
 *
 * 特性：
 * - 自动 padding 到矩形（每行用空格补齐到 max width）
 * - 自动从 cells 提取 player / boxes / targets 位置
 * - 自动展开为内部 7 种 CellType 网格
 */

import type { CellType, Level, Point } from '../../config';

const XSB_TO_CELL: Record<string, CellType> = {
  '#': 'wall',
  ' ': 'floor',
  '.': 'target',
  $: 'box',
  '*': 'box_on_target',
  '@': 'player',
  '+': 'player_on_target',
};

/**
 * 解析 XSB 文本 → Level
 *
 * @param xsb XSB 格式文本
 * @param id  关卡 ID
 * @param name 关卡名
 * @param options 可选：难度等元信息
 */
export function parseXSB(
  xsb: string,
  id: number,
  name: string,
  options: {
    optimalMoves?: number;
    optimalPushes?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    difficultyRank?: number;
  } = {},
): Level {
  // 1. 按行分割（去掉首尾空行 + 注释行 ";"）
  const rawLines = xsb.split(/\r?\n/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if (line.startsWith(';')) continue; // XSB 注释
    if (line.trim() === '' && lines.length === 0) continue; // 跳过开头空行
    lines.push(line);
  }

  if (lines.length === 0) {
    throw new Error(`[xsbParser] empty XSB for level ${id}: ${name}`);
  }

  // 2. 计算最大宽度
  const maxWidth = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const height = lines.length;

  // 3. 解析每个字符
  const cells: CellType[][] = [];
  const playerStart: Point | null = null;
  let foundPlayer: Point | null = null;
  const boxesStart: Point[] = [];
  const targets: Point[] = [];
  const tmpPlayer: Point = { x: 0, y: 0 };

  for (let y = 0; y < height; y++) {
    const line = lines[y] ?? '';
    const row: CellType[] = [];
    for (let x = 0; x < maxWidth; x++) {
      const ch = line[x] ?? ' '; // padding 视为地板
      const cell = XSB_TO_CELL[ch];
      if (!cell) {
        throw new Error(
          `[xsbParser] invalid XSB char "${ch}" at level ${id} (${x}, ${y})`,
        );
      }
      row.push(cell);

      // 提取 player / boxes / targets
      if (cell === 'player') {
        foundPlayer = { x, y };
        tmpPlayer.x = x;
        tmpPlayer.y = y;
      } else if (cell === 'player_on_target') {
        foundPlayer = { x, y };
        targets.push({ x, y });
        tmpPlayer.x = x;
        tmpPlayer.y = y;
      } else if (cell === 'box') {
        boxesStart.push({ x, y });
      } else if (cell === 'box_on_target') {
        boxesStart.push({ x, y });
        targets.push({ x, y });
      } else if (cell === 'target') {
        targets.push({ x, y });
      }
    }
    cells.push(row);
  }

  if (!foundPlayer) {
    throw new Error(`[xsbParser] no player (@ or +) found in level ${id}: ${name}`);
  }
  if (boxesStart.length === 0) {
    throw new Error(`[xsbParser] no boxes ($ or *) found in level ${id}: ${name}`);
  }
  if (targets.length === 0) {
    throw new Error(`[xsbParser] no targets (. or * or +) found in level ${id}: ${name}`);
  }
  if (boxesStart.length !== targets.length) {
    throw new Error(
      `[xsbParser] box count (${boxesStart.length}) != target count (${targets.length}) in level ${id}`,
    );
  }

  // 抑制 lint 警告：playerStart 是占位
  void playerStart;

  return {
    id,
    name,
    width: maxWidth,
    height,
    cells,
    playerStart: foundPlayer,
    boxesStart,
    targets,
    optimalMoves: options.optimalMoves,
    optimalPushes: options.optimalPushes,
    difficulty: options.difficulty,
    difficultyRank: options.difficultyRank ?? 3,
    xsb,
  };
}
