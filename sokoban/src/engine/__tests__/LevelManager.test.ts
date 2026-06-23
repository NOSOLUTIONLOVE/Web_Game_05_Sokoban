/**
 * LevelManager 单元测试
 */

import { describe, it, expect } from 'vitest';
import { LevelManager } from '../LevelManager';
import { BUILTIN_LEVELS } from '../levels/builtinLevels';
import { loadProgress } from '../levels/levelProgress';

describe('LevelManager', () => {
  it('initializes with default 20 levels', () => {
    const mgr = new LevelManager();
    expect(mgr.total).toBe(20);
    expect(mgr.currentId).toBe(1);
    expect(mgr.currentNumber).toBe(1);
  });

  it('clamps startIndex to valid range', () => {
    const mgr1 = new LevelManager(BUILTIN_LEVELS, -5);
    expect(mgr1.currentIndex).toBe(0);

    const mgr2 = new LevelManager(BUILTIN_LEVELS, 100);
    expect(mgr2.currentIndex).toBe(BUILTIN_LEVELS.length - 1);
  });

  it('throws on empty levels', () => {
    expect(() => new LevelManager([])).toThrow(/empty/);
  });

  it('next() advances to next level', () => {
    const mgr = new LevelManager();
    const lv = mgr.next();
    expect(mgr.currentId).toBe(2);
    expect(lv.id).toBe(2);
  });

  it('next() stays on last level', () => {
    const mgr = new LevelManager(BUILTIN_LEVELS, 19);
    mgr.next();
    expect(mgr.currentId).toBe(20);
  });

  it('prev() goes back to previous level', () => {
    const mgr = new LevelManager(BUILTIN_LEVELS, 5);
    mgr.prev();
    expect(mgr.currentId).toBe(5);
  });

  it('prev() stays on first level', () => {
    const mgr = new LevelManager();
    mgr.prev();
    expect(mgr.currentId).toBe(1);
  });

  it('loadById() jumps to specified level', () => {
    const mgr = new LevelManager();
    const lv = mgr.loadById(5);
    expect(lv).not.toBeNull();
    expect(mgr.currentId).toBe(5);
  });

  it('loadById() returns null for unknown id', () => {
    const mgr = new LevelManager();
    const lv = mgr.loadById(999);
    expect(lv).toBeNull();
    // 当前关卡不变
    expect(mgr.currentId).toBe(1);
  });

  it('loadByIndex() jumps to index', () => {
    const mgr = new LevelManager();
    mgr.loadByIndex(9);
    expect(mgr.currentId).toBe(10);
  });

  it('getById() returns level or null', () => {
    const mgr = new LevelManager();
    expect(mgr.getById(1)).not.toBeNull();
    expect(mgr.getById(999)).toBeNull();
  });

  it('hasNext / hasPrev', () => {
    const mgr = new LevelManager();
    expect(mgr.hasPrev()).toBe(false);
    expect(mgr.hasNext()).toBe(true);

    mgr.loadByIndex(19);
    expect(mgr.hasNext()).toBe(false);
    expect(mgr.hasPrev()).toBe(true);
  });

  it('isLastLevel / isFirstLevel', () => {
    const mgr = new LevelManager();
    expect(mgr.isFirstLevel()).toBe(true);
    expect(mgr.isLastLevel()).toBe(false);

    mgr.loadByIndex(19);
    expect(mgr.isFirstLevel()).toBe(false);
    expect(mgr.isLastLevel()).toBe(true);
  });

  it('unlockNext() advances unlocked list', () => {
    const mgr = new LevelManager();
    const progress = loadProgress();
    const updated = mgr.unlockNext(progress);
    expect(updated.unlocked).toContain(2);
  });

  it('unlockNext() no-op on last level', () => {
    const mgr = new LevelManager(BUILTIN_LEVELS, 19);
    const progress = loadProgress();
    const updated = mgr.unlockNext(progress);
    expect(updated).toBe(progress); // 引用相同
  });

  it('isCurrentUnlocked / isIdUnlocked', () => {
    const mgr = new LevelManager();
    const progress = loadProgress();
    expect(mgr.isCurrentUnlocked(progress)).toBe(true);
    expect(mgr.isIdUnlocked(progress, 1)).toBe(true);
    expect(mgr.isIdUnlocked(progress, 20)).toBe(false);
  });

  it('resetToFirst() returns to level 1', () => {
    const mgr = new LevelManager(BUILTIN_LEVELS, 10);
    mgr.resetToFirst();
    expect(mgr.currentId).toBe(1);
  });

  it('getAllLevels() returns all 20', () => {
    const mgr = new LevelManager();
    expect(mgr.getAllLevels()).toHaveLength(20);
  });
});
