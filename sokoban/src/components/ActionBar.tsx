/**
 * ActionBar - 移动端底部操作栏
 *
 * 撤销 / 重做 / 重置
 */

import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useEngine } from './SokobanGame';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';

export function ActionBar() {
  const engine = useEngine();
  const phase = useGameStore((s) => s.phase);
  const moveCount = useGameStore((s) => s.moveCount);

  if (!engine || phase !== 'playing') return null;

  const canUndo = moveCount > 0;
  // canRedo 走 engine 的 getter（基于 UndoStack.canRedo）
  const canRedo = engine.canRedo;

  const handleUndo = () => {
    if (engine.undo()) {
      audio.playUndo();
    }
  };
  const handleRedo = () => {
    if (engine.redo()) {
      audio.playUndo();
    }
  };
  const handleReset = () => {
    audio.playClick();
    engine.resetLevel();
  };

  return (
    <div className="flex items-center justify-around gap-2 border-t border-white/5 pt-3 md:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={!canUndo}
        className="flex-1"
      >
        <Undo2 className="mr-1 h-3.5 w-3.5" />
        撤销
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRedo}
        disabled={!canRedo}
        className="flex-1"
      >
        <Redo2 className="mr-1 h-3.5 w-3.5" />
        重做
      </Button>
      <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        重置
      </Button>
    </div>
  );
}
