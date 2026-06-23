/**
 * 验证 20 关能全部成功解析
 */

import { describe, it, expect } from 'vitest';
import { BUILTIN_LEVELS } from '../levels/builtinLevels';

describe('builtinLevels', () => {
  it('has exactly 20 levels', () => {
    expect(BUILTIN_LEVELS.length).toBe(20);
  });

  it('every level has consistent width/height/cells', () => {
    for (const lv of BUILTIN_LEVELS) {
      expect(lv.cells.length).toBe(lv.height);
      for (const row of lv.cells) {
        expect(row.length).toBe(lv.width);
      }
    }
  });

  it('every level has same number of boxes and targets', () => {
    for (const lv of BUILTIN_LEVELS) {
      expect(lv.boxesStart.length).toBe(lv.targets.length);
    }
  });

  it('every level has exactly one player', () => {
    for (const lv of BUILTIN_LEVELS) {
      // 通过 playerStart 不为 null 隐式验证
      expect(lv.playerStart.x).toBeGreaterThanOrEqual(0);
      expect(lv.playerStart.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('levels are ordered by id 1..20', () => {
    BUILTIN_LEVELS.forEach((lv, i) => {
      expect(lv.id).toBe(i + 1);
    });
  });

  it('difficulty distribution: 5 easy, 10 medium, 5 hard', () => {
    const easy = BUILTIN_LEVELS.filter((l) => l.difficulty === 'easy').length;
    const medium = BUILTIN_LEVELS.filter((l) => l.difficulty === 'medium').length;
    const hard = BUILTIN_LEVELS.filter((l) => l.difficulty === 'hard').length;
    expect(easy).toBe(5);
    expect(medium).toBe(10);
    expect(hard).toBe(5);
  });
});
