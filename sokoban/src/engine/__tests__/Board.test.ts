/**
 * Board 单元测试
 *
 * 覆盖：tryMove（墙/地板/箱/推箱成功/推箱撞墙/推箱撞箱）/ 胜利判定 / 边界
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../Board';
import { parseXSB } from '../levels/xsbParser';
import type { Level } from '../../config';

function makeLevel(xsb: string, id = 1, name = 'Test'): Level {
  return parseXSB(xsb, id, name);
}

describe('Board', () => {
  it('initializes from a level correctly', () => {
    // 5x3 矩形，player(1,1) box(2,1) target(3,1)
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    expect(board.player).toEqual({ x: 1, y: 1 });
    expect(board.boxes).toEqual([{ x: 2, y: 1 }]);
    expect(board.targets).toEqual([{ x: 3, y: 1 }]);
    expect(board.width).toBe(5);
    expect(board.height).toBe(3);
  });

  it('detects wall (out of bounds)', () => {
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    expect(board.isWall({ x: -1, y: 1 })).toBe(true);
    expect(board.isWall({ x: 0, y: 0 })).toBe(true); // 墙
    expect(board.isWall({ x: 3, y: 1 })).toBe(false); // 目标点（不是墙）
  });

  it('moves player to floor (no box in path)', () => {
    // 6x3 矩形：box(3,1) target(4,1) → 工人 (1,1) 推到 (2,1) 地板
    const level = makeLevel(`######
#@ $. #
######`);
    const board = new Board(level);
    const result = board.tryMove('right');
    expect(result.moved).toBe(true);
    expect(result.pushed).toBe(false);
    expect(board.player).toEqual({ x: 2, y: 1 });
  });

  it('blocks move into wall', () => {
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    const result = board.tryMove('up');
    expect(result.moved).toBe(false);
    expect(result.blocked).toBe('wall');
    expect(board.player).toEqual({ x: 1, y: 1 });
  });

  it('pushes box successfully when target is floor', () => {
    // 7x5: box(2,2), target(5,2) - 注意 . 后面是空格填充
    // 工人 (3,2) 推箱子 (2,2) 朝左 → box(1,2) player(2,2)
    const level = makeLevel(`#######
#     #
# $@ .#
#     #
#######`);
    const board = new Board(level);
    const result = board.tryMove('left');
    expect(result.moved).toBe(true);
    expect(result.pushed).toBe(true);
    expect(board.boxes).toEqual([{ x: 1, y: 2 }]);
    expect(board.player).toEqual({ x: 2, y: 2 });
  });

  it('blocks push when target is wall', () => {
    // 5x3: player(1,1) box(2,1) wall(3,1) target(4,1)
    const level = makeLevel(`#####
#@$#.
#####`);
    const board = new Board(level);
    // 工人 (1,1) 推箱子 (2,1) 朝右 → beyond (3,1) 是墙 → 推不动
    const result = board.tryMove('right');
    expect(result.moved).toBe(false);
    expect(result.blocked).toBe('box');
    expect(board.boxes).toEqual([{ x: 2, y: 1 }]);
  });

  it('blocks push when target has another box', () => {
    // 6x3: player(1,1) box(2,1) box(3,1) target(4,1) target(5,1)
    const level = makeLevel(`######
#@$$..#
######`);
    const board = new Board(level);
    // 工人 (1,1) 推箱子 (2,1) 朝右 → beyond (3,1) 有另一个箱子
    const result = board.tryMove('right');
    expect(result.moved).toBe(false);
    expect(result.blocked).toBe('box');
  });

  it('detects won state when all boxes on targets', () => {
    // 4x3 矩形，player(1,1) box(2,1) target(2,1) - 起始归位
    const level = makeLevel(`####
#@*#
####`);
    const board = new Board(level);
    expect(board.isWon()).toBe(true);
  });

  it('detects not-won state when boxes not on targets', () => {
    // 5x3 矩形，box 在地板上，target 在不同位置
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    expect(board.isWon()).toBe(false);
  });

  it('counts boxes on target', () => {
    // 4x3 矩形：1 box + 1 target
    // row 0: # . @ # → 1 target, 1 player
    // row 1: # ' ' $ # → 1 box
    const level = makeLevel(`####
#.@#
# $#
####`);
    const board = new Board(level);
    expect(board.boxesOnTargetCount()).toBe(0);
  });

  it('detects target vs not-target', () => {
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    expect(board.isTarget({ x: 3, y: 1 })).toBe(true);
    expect(board.isTarget({ x: 0, y: 0 })).toBe(false);
  });

  it('detects walkable squares', () => {
    // 5x3 矩形，player(1,1) box(2,1) target(3,1)
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    expect(board.isWalkable({ x: 1, y: 1 })).toBe(true); // 工人位置
    expect(board.isWalkable({ x: 0, y: 1 })).toBe(false); // 墙
    expect(board.isWalkable({ x: 2, y: 1 })).toBe(false); // 箱子
    expect(board.isWalkable({ x: 0, y: 0 })).toBe(false); // 墙
  });

  it('snapshot and restore preserves state', () => {
    // 5x3 矩形，box 可推到 target
    const level = makeLevel(`#####
#@$.#
#####`);
    const board = new Board(level);
    // 第一次推：box 从 (2,1) 到 (3,1)，player 从 (1,1) 到 (2,1)
    board.tryMove('right');
    const snapshot = board.snapshot();
    expect(snapshot.player).toEqual({ x: 2, y: 1 });

    // 第二次推：player 在 (2,1)，右边 (3,1) 是 box，beyond (4,1) 是墙 → 推不动
    board.tryMove('right');
    expect(board.player).toEqual({ x: 2, y: 1 }); // 没动

    board.restore(snapshot);
    expect(board.player).toEqual({ x: 2, y: 1 });
  });

  it('player_on_target renders correctly when player on target', () => {
    // 4x3 矩形：+ 在 (1,1) = player on target，$ 在 (2,1) = box
    // target count = 1 (from +), box count = 1 (from $)
    const xsb = `####
#+$#
####`;
    const board = new Board(parseXSB(xsb, 1, 'Test'));
    expect(board.getCell({ x: 1, y: 1 })).toBe('player_on_target');
  });
});
