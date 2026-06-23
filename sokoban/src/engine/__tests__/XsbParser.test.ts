/**
 * XSB 解析器单元测试
 *
 * 覆盖：单行 / 多行 / 不规则宽度（padding）/ 混合符号 / 错误情况
 */

import { describe, it, expect } from 'vitest';
import { parseXSB } from '../levels/xsbParser';

describe('xsbParser', () => {
  it('parses a simple 1-box level', () => {
    const xsb = `######
#    #
# .$@#
#    #
######`;
    const level = parseXSB(xsb, 1, 'Test 1');

    expect(level.id).toBe(1);
    expect(level.width).toBe(6);
    expect(level.height).toBe(5);
    expect(level.playerStart).toEqual({ x: 4, y: 2 });
    expect(level.boxesStart).toEqual([{ x: 3, y: 2 }]);
    expect(level.targets).toEqual([{ x: 2, y: 2 }]);
  });

  it('handles padding to rectangle (irregular width)', () => {
    const xsb = `#####
#   #
#@$.#`;
    const level = parseXSB(xsb, 2, 'Test 2');
    expect(level.width).toBe(5);
    expect(level.height).toBe(3);
    expect(level.playerStart).toEqual({ x: 1, y: 2 });
    expect(level.boxesStart).toEqual([{ x: 2, y: 2 }]);
    expect(level.targets).toEqual([{ x: 3, y: 2 }]);
  });

  it('recognizes player_on_target (+) and extracts target', () => {
    const xsb = `####
#+ #
#$ #
####`;
    const level = parseXSB(xsb, 3, 'Test 3');
    expect(level.playerStart).toEqual({ x: 1, y: 1 });
    expect(level.boxesStart).toEqual([{ x: 1, y: 2 }]);
    // + counts as a target (player on target)
    expect(level.targets).toEqual([{ x: 1, y: 1 }]);
  });

  it('handles box_on_target (*) correctly', () => {
    const xsb = `####
#@*#
####`;
    const level = parseXSB(xsb, 4, 'Test 4');
    expect(level.boxesStart.length).toBe(1);
    expect(level.targets.length).toBe(1);
  });

  it('handles multiple boxes and targets', () => {
    const xsb = `#####
#@$.#
#$. #
#####`;
    const level = parseXSB(xsb, 5, 'Test 5');
    expect(level.boxesStart).toHaveLength(2);
    expect(level.targets).toHaveLength(2);
  });

  it('skips comment lines (starting with ;)', () => {
    const xsb = `; This is a comment
######
; another comment
#@$.#
######`;
    const level = parseXSB(xsb, 6, 'Test 6');
    expect(level.height).toBe(3); // 注释被跳过
    expect(level.width).toBe(6);
  });

  it('skips leading empty lines', () => {
    const xsb = `

######
#@$.#
######`;
    const level = parseXSB(xsb, 7, 'Test 7');
    expect(level.height).toBe(3);
  });

  it('throws on empty XSB', () => {
    expect(() => parseXSB('', 8, 'Empty')).toThrow();
  });

  it('throws on missing player', () => {
    const xsb = `####
#$.#
####`;
    expect(() => parseXSB(xsb, 9, 'No player')).toThrow(/no player/);
  });

  it('throws on box/target count mismatch', () => {
    const xsb = `#####
# @$#
# .$#
#   #
#####`;
    expect(() => parseXSB(xsb, 10, 'Mismatch')).toThrow(/count/);
  });

  it('throws on missing boxes', () => {
    const xsb = `####
#@.#
####`;
    expect(() => parseXSB(xsb, 11, 'No box')).toThrow(/no boxes/);
  });

  it('throws on missing targets', () => {
    const xsb = `####
#@$#
####`;
    expect(() => parseXSB(xsb, 12, 'No target')).toThrow(/no targets/);
  });

  it('preserves metadata (optimalMoves, difficulty)', () => {
    const xsb = `####
#@$.#
####`;
    const level = parseXSB(xsb, 13, 'Meta', {
      optimalMoves: 5,
      optimalPushes: 2,
      difficulty: 'medium',
      difficultyRank: 3,
    });
    expect(level.optimalMoves).toBe(5);
    expect(level.optimalPushes).toBe(2);
    expect(level.difficulty).toBe('medium');
    expect(level.difficultyRank).toBe(3);
  });
});
