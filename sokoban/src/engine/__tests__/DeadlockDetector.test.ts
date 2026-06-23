/**
 * DeadlockDetector 单元测试
 *
 * 覆盖：4 种典型死锁模式 + 2 个负样本
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { parseXSB } from '../levels/xsbParser';
import {
  detectDeadlock,
  isAnyDeadlock,
  isCornerDeadlock,
  isWallLineDeadlock,
} from '../DeadlockDetector';

function makeBoard(xsb: string) {
  return new Board(parseXSB(xsb, 1, 'Test'));
}

/** 构造一个 5x5 棋盘用于纯函数测试 */
function makeFakeBoard(boxes: { x: number; y: number }[], targetPositions: { x: number; y: number }[] = []) {
  return {
    isWall: (p: { x: number; y: number }) => p.y === 0 || p.y === 4 || p.x === 0 || p.x === 4,
    isTarget: (p: { x: number; y: number }) =>
      targetPositions.some((t) => t.x === p.x && t.y === p.y),
    boxes,
    isOutOfBounds: (p: { x: number; y: number }) => p.x < 0 || p.x >= 5 || p.y < 0 || p.y >= 5,
  } as unknown as Board;
}

describe('DeadlockDetector - corner deadlock', () => {
  it('detects corner deadlock: box at (1,1) with walls on 3 sides', () => {
    const fakeBoard = makeFakeBoard([{ x: 1, y: 1 }]);
    const result = isCornerDeadlock(
      { x: 1, y: 1 },
      (p) => fakeBoard.isWall(p),
      (p) => fakeBoard.isTarget(p),
    );
    expect(result).toBe(true);
  });

  it('does not flag box on target as corner deadlock', () => {
    const fakeBoard = makeFakeBoard([{ x: 2, y: 2 }], [{ x: 2, y: 2 }]);
    const result = isCornerDeadlock(
      { x: 2, y: 2 },
      (p) => fakeBoard.isWall(p),
      (p) => fakeBoard.isTarget(p),
    );
    expect(result).toBe(false);
  });

  it('does not flag box not in corner', () => {
    const fakeBoard = makeFakeBoard([{ x: 2, y: 2 }]);
    const result = isCornerDeadlock(
      { x: 2, y: 2 },
      (p) => fakeBoard.isWall(p),
      (p) => fakeBoard.isTarget(p),
    );
    expect(result).toBe(false);
  });
});

describe('DeadlockDetector - wall line deadlock', () => {
  it('detects wall line deadlock: box against wall with no target along wall', () => {
    // 5x5 棋盘，箱子 (2,1) 紧贴上墙 (0,1)，水平方向无 target
    const fakeBoard = makeFakeBoard([{ x: 2, y: 1 }]);
    const result = isWallLineDeadlock(
      { x: 2, y: 1 },
      (p) => fakeBoard.isWall(p),
      (p) => fakeBoard.isTarget(p),
    );
    expect(result).toBe(true);
  });

  it('does not flag wall line when target is reachable along wall', () => {
    // 5x5 棋盘，箱子 (2,1) 紧贴上墙 (0,1)，水平方向有 target (3,1)
    const fakeBoard = makeFakeBoard([{ x: 2, y: 1 }], [{ x: 3, y: 1 }]);
    const result = isWallLineDeadlock(
      { x: 2, y: 1 },
      (p) => fakeBoard.isWall(p),
      (p) => fakeBoard.isTarget(p),
    );
    expect(result).toBe(false);
  });
});

describe('DeadlockDetector - detectDeadlock', () => {
  it('returns empty array for starting level', () => {
    // 5x3: box 1 + target 1
    const xsb = `#####
#@$.#
#   #
#####`;
    const board = makeBoard(xsb);
    const result = detectDeadlock(board);
    expect(result).toHaveLength(0);
  });

  it('detects corner deadlock via Board', () => {
    // 5x5 棋盘，box 在 (1,1) 角落
    const fakeBoard = makeFakeBoard([{ x: 1, y: 1 }]);
    const result = detectDeadlock(fakeBoard);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.type).toBe('corner');
  });

  it('detects wall line deadlock via Board', () => {
    // 5x5 棋盘，box (2,1) 紧贴上墙
    const fakeBoard = makeFakeBoard([{ x: 2, y: 1 }]);
    const result = detectDeadlock(fakeBoard);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('DeadlockDetector - isAnyDeadlock', () => {
  it('returns false for starting level', () => {
    const xsb = `#####
#@$.#
#   #
#####`;
    const board = makeBoard(xsb);
    expect(isAnyDeadlock(board)).toBe(false);
  });

  it('returns true when box is in corner', () => {
    const fakeBoard = makeFakeBoard([{ x: 1, y: 1 }]);
    expect(isAnyDeadlock(fakeBoard)).toBe(true);
  });
});
