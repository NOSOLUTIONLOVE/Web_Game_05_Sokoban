/**
 * PauseOverlay - 暂停覆盖层
 *
 * 显示：暂停文字 + 继续 + 重置 + 回菜单
 */

import { motion } from 'framer-motion';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useEngine } from './SokobanGame';
import { useGameStore } from '../store/useGameStore';
import { audio } from '../lib/audio';

export function PauseOverlay() {
  const engine = useEngine();
  const audioEnabled = useGameStore((s) => s.audioEnabled);
  const toggleAudio = useGameStore((s) => s.toggleAudio);

  const handleResume = () => {
    audio.playClick();
    engine.togglePause();
  };

  const handleReset = () => {
    audio.playClick();
    engine.resetLevel();
  };

  const handleMenu = () => {
    audio.playClick();
    engine.backToMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-xs"
    >
      <Card className="border-primary/20 bg-card/90 backdrop-blur-md">
        <CardContent className="space-y-3 p-5 text-center">
          <h2 className="text-2xl font-extrabold text-primary text-glow">PAUSED</h2>
          <div className="flex flex-col gap-2">
            <Button onClick={handleResume} size="lg" className="w-full">
              <Play className="mr-2 h-4 w-4" />
              继续
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              重置关卡
            </Button>
            <Button onClick={handleMenu} variant="ghost" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              返回菜单
            </Button>
            <Button onClick={toggleAudio} variant="ghost" className="w-full">
              {audioEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
              {audioEnabled ? '关闭音效' : '开启音效'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
