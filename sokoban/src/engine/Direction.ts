/**
 * Direction - 4 个方向枚举 + offset 转换
 */

import type { Direction, Point } from '../config';

export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'] as const;

const OFFSETS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 方向 → 偏移量 */
export function getOffset(direction: Direction): Point {
  return OFFSETS[direction];
}

/** 从 A 点按方向移动到 B 点 */
export function movePoint(from: Point, direction: Direction): Point {
  const offset = OFFSETS[direction];
  return { x: from.x + offset.x, y: from.y + offset.y };
}

/** 反向方向（用于撤销时） */
export function opposite(direction: Direction): Direction {
  switch (direction) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}
