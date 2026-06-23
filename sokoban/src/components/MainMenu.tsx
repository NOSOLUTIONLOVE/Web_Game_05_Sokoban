/**
 * MainMenu - 主菜单覆盖层
 *
 * 显示：标题 + 开始按钮 + 关卡选择按钮 + 操作说明
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ListChecks, Keyboard } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useEngine } from './SokobanGame';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';
import { LevelSelect } from './LevelSelect';

export function MainMenu() {
  const engine = useEngine();
  const unlockedLevels = useGameStore((s) => s.unlockedLevels);
  const [selectOpen, setSelectOpen] = useState(false);

  const handleStart = () => {
    audio.resume();
    audio.playClick();
    engine.startGame();
  };

  const handleSelect = (id: number) => {
    audio.playClick();
    engine.loadLevel(id);
    engine.startGame();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Card className="border-primary/20 bg-card/80 backdrop-blur-md">
          <CardContent className="space-y-5 p-6 text-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-primary text-glow">
                SOKOBAN
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">推箱子 · 共 20 关</p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleStart} className="w-full" size="lg">
                <Play className="mr-2 h-4 w-4" />
                开始游戏
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectOpen(true)}
                className="w-full"
                size="lg"
              >
                <ListChecks className="mr-2 h-4 w-4" />
                选择关卡 ({unlockedLevels.length}/20)
              </Button>
            </div>

            <div className="space-y-1 text-left text-xs text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold text-foreground/80">
                <Keyboard className="h-3 w-3" />
                操作说明
              </div>
              <div>↑↓←→ / WASD · 移动</div>
              <div>U · 撤销 / Y · 重做</div>
              <div>R · 重置 / P · 暂停</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <LevelSelect open={selectOpen} onOpenChange={setSelectOpen} onSelect={handleSelect} />
    </>
  );
}
