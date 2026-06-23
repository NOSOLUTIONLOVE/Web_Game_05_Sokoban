/**
 * LevelSelect - 关卡选择对话框
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Check, Lock, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEngine } from './SokobanGame';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';

interface LevelSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (id: number) => void;
}

export function LevelSelect({ open, onOpenChange, onSelect }: LevelSelectProps) {
  const engine = useEngine();
  const unlockedLevels = useGameStore((s) => s.unlockedLevels);
  const levelBestMoves = useGameStore((s) => s.levelBestMoves);
  const levelBestPushes = useGameStore((s) => s.levelBestPushes);
  const currentLevelId = useGameStore((s) => s.currentLevelId);

  const levels = engine.getAllLevels();

  const handleClick = (id: number) => {
    if (!engine.isLevelAccessible(id)) return;
    audio.playClick();
    onSelect?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择关卡</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {levels.map((lv) => {
            const unlocked = unlockedLevels.includes(lv.id);
            const isCurrent = lv.id === currentLevelId;
            const cleared =
              (levelBestMoves[lv.id] ?? 0) > 0 || (levelBestPushes[lv.id] ?? 0) > 0;
            const bestMoves = levelBestMoves[lv.id];
            return (
              <button
                key={lv.id}
                type="button"
                disabled={!unlocked}
                onClick={() => handleClick(lv.id)}
                className={cn(
                  'group relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition',
                  'hover:scale-105 hover:border-primary/50',
                  isCurrent && 'border-primary ring-2 ring-primary/50',
                  !isCurrent && 'border-white/10',
                  cleared
                    ? 'bg-green-500/15'
                    : unlocked
                    ? 'bg-secondary/40'
                    : 'bg-secondary/10 opacity-40',
                  !unlocked && 'cursor-not-allowed hover:scale-100',
                )}
              >
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {unlocked ? (
                    cleared ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <span className="h-3 w-3" />
                    )
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  L{lv.id}
                </div>
                <div className="truncate text-[10px] font-medium">{lv.name}</div>
                {cleared && bestMoves && (
                  <div className="flex items-center gap-0.5 text-[9px] text-yellow-400">
                    <Star className="h-2 w-2 fill-yellow-400" />
                    {bestMoves}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
