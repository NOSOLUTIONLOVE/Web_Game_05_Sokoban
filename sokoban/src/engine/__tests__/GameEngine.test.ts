/**
 * GameEngine 单元测试
 *
 * 覆盖：状态机流转 / 推箱 / 胜利回调 / 撤销重做 / 重置 / 关卡切换 / 进度持久化
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../GameEngine';
import { parseXSB } from '../levels/xsbParser';
import { storage } from '../../lib/storage';
import { resetProgress } from '../levels/levelProgress';

// 简单测试关卡：5x3 矩形，1 box 1 target
const SIMPLE_XSB = `#####
#@$.#
#####`;

// 非获胜关卡：1 box 推到 floor（非 target），避免一推就过关
// Player(2,3), Box(3,3), Target(3,1) — handleMove('right') 推 box (3,3)→(4,3) (floor, not target)
const NON_WINNING_XSB = `########
#  .   #
#      #
# @$   #
#      #
########`;

function makeTestLevels() {
  return [parseXSB(SIMPLE_XSB, 1, 'Test Level 1')];
}

function makeNonWinningLevels() {
  return [parseXSB(NON_WINNING_XSB, 1, 'Non Winning Level')];
}

describe('GameEngine', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      storage.clear();
    }
    resetProgress();
  });

  it('initializes with menu phase', () => {
    const engine = new GameEngine(makeTestLevels());
    expect(engine.phase).toBe('menu');
    expect(engine.moveCount).toBe(0);
    expect(engine.pushCount).toBe(0);
  });

  it('startGame transitions to playing', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    expect(engine.phase).toBe('playing');
  });

  it('handleMove moves player and increments moveCount', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    const result = engine.handleMove('right');
    expect(result.moved).toBe(true);
    expect(result.pushed).toBe(true);
    expect(engine.moveCount).toBe(1);
    expect(engine.pushCount).toBe(1);
  });

  it('handleMove is ignored when not playing', () => {
    const engine = new GameEngine(makeTestLevels());
    const result = engine.handleMove('right');
    expect(result.moved).toBe(false);
    expect(engine.moveCount).toBe(0);
  });

  it('togglePause toggles between playing and paused', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    expect(engine.phase).toBe('playing');
    engine.togglePause();
    expect(engine.phase).toBe('paused');
    engine.togglePause();
    expect(engine.phase).toBe('playing');
  });

  it('togglePause is no-op from menu', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.togglePause();
    expect(engine.phase).toBe('menu');
  });

  it('backToMenu returns to menu phase', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    engine.backToMenu();
    expect(engine.phase).toBe('menu');
  });

  it('resetLevel resets state', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    engine.handleMove('right');
    expect(engine.moveCount).toBe(1);
    engine.resetLevel();
    expect(engine.moveCount).toBe(0);
    expect(engine.pushCount).toBe(0);
    expect(engine.canUndo).toBe(false);
  });

  it('undo restores previous state', () => {
    const engine = new GameEngine(makeNonWinningLevels());
    engine.startGame();
    engine.handleMove('right');
    expect(engine.moveCount).toBe(1);
    const undoResult = engine.undo();
    expect(undoResult).toBe(true);
    expect(engine.moveCount).toBe(0);
    expect(engine.canRedo).toBe(true);
  });

  it('undo returns false when no history', () => {
    const engine = new GameEngine(makeNonWinningLevels());
    engine.startGame();
    const result = engine.undo();
    expect(result).toBe(false);
  });

  it('redo restores undone state', () => {
    const engine = new GameEngine(makeNonWinningLevels());
    engine.startGame();
    engine.handleMove('right');
    engine.undo();
    expect(engine.moveCount).toBe(0);
    engine.redo();
    expect(engine.moveCount).toBe(1);
  });

  it('handleMove triggers onMove callback', () => {
    const engine = new GameEngine(makeTestLevels());
    let moves = 0;
    let pushes = 0;
    engine.setCallbacks({
      onMove: (m, p) => {
        moves = m;
        pushes = p;
      },
    });
    engine.startGame();
    engine.handleMove('right');
    expect(moves).toBe(1);
    expect(pushes).toBe(1);
  });

  it('handleMove triggers onPhaseChange when starting', () => {
    const engine = new GameEngine(makeTestLevels());
    let lastPhase = '';
    engine.setCallbacks({
      onPhaseChange: (p) => {
        lastPhase = p;
      },
    });
    engine.startGame();
    expect(lastPhase).toBe('playing');
  });

  it('win triggers onWin callback and transitions to over', () => {
    const levels = [parseXSB(SIMPLE_XSB, 1, 'Move+Win Test')];
    const engine = new GameEngine(levels);
    let won2 = false;
    engine.setCallbacks({
      onWin: () => {
        won2 = true;
      },
    });
    engine.startGame();
    engine.handleMove('right');
    expect(won2).toBe(true);
    expect(engine.phase).toBe('over');
  });

  it('win persists best moves', () => {
    const levels = [parseXSB(SIMPLE_XSB, 1, 'Test L1')];
    const engine = new GameEngine(levels);
    engine.startGame();
    engine.handleMove('right');
    expect(engine.currentProgress.bestMoves[1]).toBeDefined();
  });

  it('loadLevel jumps to specified level', () => {
    const levels = [
      parseXSB(SIMPLE_XSB, 1, 'L1'),
      parseXSB(`#####
#$.@#
#####`, 2, 'L2'),
    ];
    const engine = new GameEngine(levels);
    engine.startGame();
    const result = engine.loadLevel(2);
    expect(result).toBe(true);
    expect(engine.currentLevel.id).toBe(2);
  });

  it('loadLevel returns false for unknown id', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    const result = engine.loadLevel(999);
    expect(result).toBe(false);
  });

  it('nextLevel advances when next exists', () => {
    const levels = [
      parseXSB(SIMPLE_XSB, 1, 'L1'),
      parseXSB(`#####
#$.@#
#####`, 2, 'L2'),
    ];
    const engine = new GameEngine(levels);
    engine.startGame();
    // 先解锁 L2
    engine['_progress'].unlocked.push(2);
    const result = engine.nextLevel();
    expect(result).toBe(true);
    expect(engine.currentLevel.id).toBe(2);
  });

  it('nextLevel returns false on last level', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    const result = engine.nextLevel();
    expect(result).toBe(false);
  });

  it('prevLevel goes back', () => {
    const levels = [
      parseXSB(SIMPLE_XSB, 1, 'L1'),
      parseXSB(`#####
#$.@#
#####`, 2, 'L2'),
    ];
    const engine = new GameEngine(levels);
    engine.loadLevel(2);
    const result = engine.prevLevel();
    expect(result).toBe(true);
    expect(engine.currentLevel.id).toBe(1);
  });

  it('prevLevel returns false on first level', () => {
    const engine = new GameEngine(makeTestLevels());
    engine.startGame();
    const result = engine.prevLevel();
    expect(result).toBe(false);
  });

  it('getAllLevels returns all levels', () => {
    const engine = new GameEngine(makeTestLevels());
    expect(engine.getAllLevels()).toHaveLength(1);
  });

  it('isLevelAccessible respects unlock state', () => {
    const levels = [
      parseXSB(SIMPLE_XSB, 1, 'L1'),
      parseXSB(`#####
#$.@#
#####`, 2, 'L2'),
    ];
    const engine = new GameEngine(levels);
    expect(engine.isLevelAccessible(1)).toBe(true);
    expect(engine.isLevelAccessible(2)).toBe(false);
  });
});
