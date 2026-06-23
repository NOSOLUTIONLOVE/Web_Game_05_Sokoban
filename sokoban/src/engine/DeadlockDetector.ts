/**
 * DeadlockDetector - 死锁检测器
 *
 * 检测"推箱进入必败状态"的两种典型模式：
 *
 * 1. 角落死锁（Corner Deadlock）：
 *    箱子被推到角落（沿两个互相垂直方向都是墙），
 *    而该角落不是目标点 → 永远无法将此箱归位。
 *
 * 2. 边墙死锁（Wall Line Deadlock）：
 *    箱子沿墙推时，墙不终止 → 永远无法将箱子从墙边拉离。
 *    检测：箱子紧贴墙（非目标点），且沿墙方向上无目标点。
 *
 * 注意：死锁检测是"过度保守"的：
 * - 命中规则 → 必败，可阻止玩家
 * - 未命中 → 不代表可解（仍有可能是更复杂的死锁）
 *
 * 调用方式：
 * - `detectDeadlock(board)` 返回 Point[]（被死锁的箱子列表）
 * - `isAnyDeadlock(board)` 返回 boolean
 */

import type { Point } from '../config';
import type { Board } from './Board';

/** 死锁位置信息 */
export interface DeadlockInfo {
  /** 死锁的箱子位置 */
  box: Point;
  /** 死锁类型 */
  type: 'corner' | 'wall-line';
  /** 死锁描述（中文） */
  reason: string;
}

/**
 * 角落死锁：箱子四周 2 个垂直方向均为墙
 */
export function isCornerDeadlock(
  box: Point,
  isWallFn: (p: Point) => boolean,
  isTargetFn: (p: Point) => boolean,
): boolean {
  // 在目标点上 → 不是死锁
  if (isTargetFn(box)) return false;
  // 检查两组对角 (上+左, 上+右, 下+左, 下+右)
  const walls: Point[] = [
    { x: box.x - 1, y: box.y }, // 左
    { x: box.x + 1, y: box.y }, // 右
    { x: box.x, y: box.y - 1 }, // 上
    { x: box.x, y: box.y + 1 }, // 下
  ];
  // 任一对角组合都是墙 → 角落死锁
  const isLeftWall = isWallFn(walls[0]!);
  const isRightWall = isWallFn(walls[1]!);
  const isUpWall = isWallFn(walls[2]!);
  const isDownWall = isWallFn(walls[3]!);
  return (isLeftWall || isRightWall) && (isUpWall || isDownWall);
}

/**
 * 边墙死锁：箱子紧贴墙（左右或上下），
 * 且沿墙方向上（每格）都没有目标点
 *
 * 注意：此检测为简化版本，仅判断箱子的左右或上下是否为墙。
 * 严格判定需要遍历墙线至尽头，记录目标点是否能在墙线终止前抵达。
 */
export function isWallLineDeadlock(
  box: Point,
  isWallFn: (p: Point) => boolean,
  isTargetFn: (p: Point) => boolean,
): boolean {
  // 在目标点上 → 不是死锁
  if (isTargetFn(box)) return false;

  // 检查水平墙线（箱子上下是墙）
  const isUpWall = isWallFn({ x: box.x, y: box.y - 1 });
  const isDownWall = isWallFn({ x: box.x, y: box.y + 1 });

  if (isUpWall || isDownWall) {
    // 水平墙线死锁：需要沿水平方向找到目标点
    // 简化检测：箱子左右无目标点 + 沿墙 → 死锁
    const hasHorizontalTarget = hasTargetAlongDirection(box, 'left', isWallFn, isTargetFn) ||
                                hasTargetAlongDirection(box, 'right', isWallFn, isTargetFn);
    if (!hasHorizontalTarget) return true;
  }

  // 检查垂直墙线（箱子左右是墙）
  const isLeftWall = isWallFn({ x: box.x - 1, y: box.y });
  const isRightWall = isWallFn({ x: box.x + 1, y: box.y });

  if (isLeftWall || isRightWall) {
    // 垂直墙线死锁：需要沿垂直方向找到目标点
    const hasVerticalTarget = hasTargetAlongDirection(box, 'up', isWallFn, isTargetFn) ||
                              hasTargetAlongDirection(box, 'down', isWallFn, isTargetFn);
    if (!hasVerticalTarget) return true;
  }

  return false;
}

/** 沿指定方向检查是否能到达目标点（遇墙停止） */
function hasTargetAlongDirection(
  start: Point,
  direction: 'up' | 'down' | 'left' | 'right',
  isWallFn: (p: Point) => boolean,
  isTargetFn: (p: Point) => boolean,
): boolean {
  let p: Point = { x: start.x, y: start.y };
  for (let i = 0; i < 64; i++) {
    switch (direction) {
      case 'up':
        p = { x: p.x, y: p.y - 1 };
        break;
      case 'down':
        p = { x: p.x, y: p.y + 1 };
        break;
      case 'left':
        p = { x: p.x - 1, y: p.y };
        break;
      case 'right':
        p = { x: p.x + 1, y: p.y };
        break;
    }
    // 遇墙停止
    if (isWallFn(p)) return false;
    // 找到目标点
    if (isTargetFn(p)) return true;
  }
  return false;
}

/**
 * 检测整个 Board 的死锁情况
 *
 * @returns 死锁信息列表（空数组 = 无死锁）
 */
export function detectDeadlock(board: Board): DeadlockInfo[] {
  const deadlocks: DeadlockInfo[] = [];
  for (const box of board.boxes) {
    // 跳过已在目标点上的箱子
    if (board.isTarget(box)) continue;

    // 角落死锁优先检测
    if (isCornerDeadlock(box, (p) => board.isWall(p), (p) => board.isTarget(p))) {
      deadlocks.push({
        box: { x: box.x, y: box.y },
        type: 'corner',
        reason: `箱子 (${box.x}, ${box.y}) 被推到角落`,
      });
      continue;
    }
    // 边墙死锁
    if (isWallLineDeadlock(box, (p) => board.isWall(p), (p) => board.isTarget(p))) {
      deadlocks.push({
        box: { x: box.x, y: box.y },
        type: 'wall-line',
        reason: `箱子 (${box.x}, ${box.y}) 沿墙无法归位`,
      });
    }
  }
  return deadlocks;
}

/** 是否有任何死锁 */
export function isAnyDeadlock(board: Board): boolean {
  return detectDeadlock(board).length > 0;
}
