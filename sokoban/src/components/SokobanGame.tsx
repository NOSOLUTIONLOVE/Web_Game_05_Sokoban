/**
 * SokobanGame - 顶层游戏组件
 *
 * 职责：
 * - 实例化 GameEngine + Renderer（useEffect 内）
 * - 桥接 engine 回调 → Zustand store
 * - 同步 audioEnabled 到 engine
 * - 用 Context 暴露 engine 给子组件
 * - 渲染 HUD + Canvas + Overlays + ActionBar
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { Renderer } from '../engine/Renderer';
import { Input, type Action } from '../engine/Input';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';
import { HUD } from './HUD';
import { Overlays } from './Overlays';
import { ActionBar } from './ActionBar';
import { DeadlockToast } from './DeadlockToast';
import { Card, CardContent } from './ui/card';

const EngineContext = createContext<GameEngine | null>(null);

/** 子组件中获取 engine 实例（必须在 SokobanGame 内使用） */
export function useEngine(): GameEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error('useEngine must be used within SokobanGame');
  }
  return engine;
}

export function SokobanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<Input | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);

  // ============ 实例化引擎 + 渲染循环 ============
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. 创建引擎
    const e = new GameEngine(undefined, {
      onPhaseChange: (p) => {
        useGameStore.getState().setPhase(p);
        if (p === 'playing') {
          useGameStore.getState().resetRound();
        }
      },
      onLevelChange: (level, _id, total) => {
        useGameStore.getState().setLevel(level.id, level.name, total);
        // 重新计算 canvas 尺寸
        if (rendererRef.current) {
          rendererRef.current.resize(level.width, level.height);
        }
      },
      onMove: (moves, pushes) => {
        const isOptimal = e['_phase'] === 'over' && e.isOptimalCurrent();
        useGameStore.getState().setMoveCount(moves, pushes, isOptimal);
      },
      onPush: (moves, pushes) => {
        useGameStore.getState().setMoveCount(moves, pushes, false);
      },
      onWin: (moves, pushes, isOptimal) => {
        useGameStore.getState().setMoveCount(moves, pushes, isOptimal);
        useGameStore.getState().setFlashWin({
          levelId: e.currentLevel.id,
          isOptimal,
          moves,
          pushes,
        });
        useGameStore.getState().setWinTimestamp(Date.now());
        // 渲染器胜利动画
        if (rendererRef.current) {
          rendererRef.current.setWinAnimation(e.currentLevel.id, isOptimal, moves, pushes);
        }
        audio.playWin();
        // 6 秒后清除 flashWin（WinModal 关闭后）
        setTimeout(() => useGameStore.getState().clearFlashWin(), 6000);
      },
      onDeadlock: (positions) => {
        useGameStore.getState().setShowDeadlock(positions);
        setTimeout(() => useGameStore.getState().clearDeadlock(), 3000);
      },
      onProgressChange: (progress) => {
        useGameStore.getState().setProgress(progress);
      },
      onSettle: (position) => {
        if (rendererRef.current) {
          rendererRef.current.setSettleAnimation(position);
        }
      },
      onBlocked: (direction) => {
        if (rendererRef.current) {
          rendererRef.current.setBlockedAnimation(direction);
        }
        useGameStore.getState().setBlockedDirection(direction);
        setTimeout(() => useGameStore.getState().setBlockedDirection(null), 250);
        audio.playBlocked();
      },
    });

    // 2. 创建渲染器
    const level = e.currentLevel;
    const renderer = new Renderer(canvas, level.width, level.height);
    rendererRef.current = renderer;

    // 3. 初始化 store 状态
    const initStore = useGameStore.getState();
    initStore.setLevel(level.id, level.name, e.totalLevels);
    initStore.setProgress(e.currentProgress);
    initStore.setPhase('menu');

    setEngine(e);

    // 4. 启动渲染循环
    let rafId = 0;
    const renderLoop = () => {
      if (rendererRef.current) {
        rendererRef.current.render(e.getRenderSnapshot());
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      rendererRef.current = null;
      inputRef.current?.unbind();
      inputRef.current = null;
      setEngine(null);
    };
  }, []);

  // ============ 输入系统 ============
  useEffect(() => {
    if (!engine) return;
    const container = containerRef.current;
    if (!container) return;

    const input = new Input();
    const handleAction = (action: Action) => {
      // 首次交互时解锁 AudioContext
      audio.resume();

      const store = useGameStore.getState();
      switch (action) {
        case 'moveUp':
          engine.handleMove('up');
          break;
        case 'moveDown':
          engine.handleMove('down');
          break;
        case 'moveLeft':
          engine.handleMove('left');
          break;
        case 'moveRight':
          engine.handleMove('right');
          break;
        case 'undo':
          if (engine.undo()) {
            audio.playUndo();
          }
          break;
        case 'redo':
          if (engine.redo()) {
            audio.playUndo();
          }
          break;
        case 'reset':
          engine.resetLevel();
          break;
        case 'pause':
          if (store.phase === 'playing' || store.phase === 'paused') {
            engine.togglePause();
          }
          break;
        case 'menu':
          if (store.phase === 'paused' || store.phase === 'over') {
            engine.backToMenu();
          }
          break;
        case 'toggleMute':
          store.toggleAudio();
          break;
        case 'confirm':
          if (store.phase === 'menu') {
            engine.startGame();
          } else if (store.phase === 'over') {
            if (engine.nextLevel()) {
              // ok
            } else {
              engine.backToMenu();
            }
          }
          break;
      }
    };
    input.bind({ onAction: handleAction }, container);
    inputRef.current = input;

    return () => {
      input.unbind();
    };
  }, [engine]);

  // ============ 同步 audioEnabled ============
  const audioEnabled = useGameStore((s) => s.audioEnabled);
  useEffect(() => {
    audio.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // ============ 音效：根据移动播放 ============
  const moveCount = useGameStore((s) => s.moveCount);
  const pushCount = useGameStore((s) => s.pushCount);
  const prevMovesRef = useRef(0);
  const prevPushesRef = useRef(0);
  useEffect(() => {
    if (moveCount > prevMovesRef.current) {
      if (pushCount > prevPushesRef.current) {
        audio.playPush();
      } else if (pushCount === prevPushesRef.current) {
        audio.playMove();
      }
    }
    prevMovesRef.current = moveCount;
    prevPushesRef.current = pushCount;
  }, [moveCount, pushCount]);

  const phase = useGameStore((s) => s.phase);

  return (
    <EngineContext.Provider value={engine}>
      <div className="w-full space-y-4">
        <Card className="w-full">
          <CardContent className="space-y-3 p-4 md:p-6">
            <HUD />
            <div
              ref={containerRef}
              className="relative mx-auto flex items-center justify-center"
              style={{ touchAction: 'none' }}
            >
              <canvas
                ref={canvasRef}
                className="rounded-xl ring-1 ring-white/10 shadow-2xl shadow-purple-500/20"
                style={{ touchAction: 'none' }}
              />
              {engine && (phase === 'menu' || phase === 'paused') && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                  <Overlays />
                </div>
              )}
            </div>
            <ActionBar />
          </CardContent>
        </Card>
        <DeadlockToast />
      </div>
    </EngineContext.Provider>
  );
}
