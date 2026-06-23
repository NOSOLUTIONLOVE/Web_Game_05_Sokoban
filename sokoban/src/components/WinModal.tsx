/**
 * WinModal - 胜利弹窗
 *
 * 显示：步数 + 推箱数 + 是否最优解 + 历史最佳 + 下一关 + 重玩 + 回菜单
 */

import { motion } from 'framer-motion';
import { Trophy, ArrowRight, RotateCcw, Home, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useEngine } from './SokobanGame';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';

export function WinModal() {
  const engine = useEngine();
  const moveCount = useGameStore((s) => s.moveCount);
  const pushCount = useGameStore((s) => s.pushCount);
  const isOptimal = useGameStore((s) => s.isOptimal);
  const flashWin = useGameStore((s) => s.flashWin);
  const levelBestMoves = useGameStore((s) => s.levelBestMoves);
  const levelBestPushes = useGameStore((s) => s.levelBestPushes);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const totalLevels = useGameStore((s) => s.totalLevels);

  const bestMoves = levelBestMoves[currentLevelId] ?? 0;
  const bestPushes = levelBestPushes[currentLevelId] ?? 0;
  const hasNext = currentLevelId < totalLevels;

  const handleNext = () => {
    audio.playClick();
    if (engine.nextLevel()) {
      // 成功进入下一关
    } else {
      engine.backToMenu();
    }
  };

  const handleReplay = () => {
    audio.playClick();
    engine.resetLevel();
  };

  const handleMenu = () => {
    audio.playClick();
    engine.backToMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, type: 'spring' }}
      className="w-full max-w-sm"
    >
      <Card className="border-primary/30 bg-card/95 shadow-2xl shadow-green-500/20 backdrop-blur-md">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-400" />
            <h2 className="text-3xl font-extrabold text-primary text-glow">VICTORY!</h2>
            <Trophy className="h-7 w-7 text-yellow-400" />
          </div>

          {isOptimal && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                <Star className="mr-1 h-3 w-3" />
                最优解
              </Badge>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="步数"
              value={moveCount}
              best={bestMoves}
              isRecord={moveCount <= bestMoves && bestMoves > 0}
            />
            <StatCard
              label="推箱数"
              value={pushCount}
              best={bestPushes}
              isRecord={pushCount <= bestPushes && bestPushes > 0}
            />
          </div>

          {flashWin?.isOptimal && (
            <div className="text-xs text-yellow-400">⭐ 达成最优解 ⭐</div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {hasNext && (
              <Button onClick={handleNext} size="lg" className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                下一关
              </Button>
            )}
            <Button onClick={handleReplay} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              重玩
            </Button>
            <Button onClick={handleMenu} variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              返回菜单
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  best: number;
  isRecord: boolean;
}

function StatCard({ label, value, best, isRecord }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        isRecord
          ? 'border-green-500/50 bg-green-500/10'
          : 'border-white/10 bg-secondary/40'
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-2xl font-bold tabular-nums">{value}</div>
      {best > 0 && (
        <div className="text-[10px] text-muted-foreground">最佳 {best}</div>
      )}
    </div>
  );
}
