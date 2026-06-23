/**
 * HUD - 顶部状态栏
 *
 * 显示：关卡名 + 步数 + 推箱数 + 音量按钮 + 设置按钮
 */

import { Volume2, VolumeX, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useGameStore } from '../store/useGameStore';
import { useEngine } from './SokobanGame';

export function HUD() {
  const engine = useEngine();
  const phase = useGameStore((s) => s.phase);
  const audioEnabled = useGameStore((s) => s.audioEnabled);
  const moveCount = useGameStore((s) => s.moveCount);
  const pushCount = useGameStore((s) => s.pushCount);
  const levelName = useGameStore((s) => s.levelName);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const totalLevels = useGameStore((s) => s.totalLevels);
  const toggleAudio = useGameStore((s) => s.toggleAudio);

  const inGame = phase === 'playing' || phase === 'paused' || phase === 'over';

  return (
    <div className="flex w-full items-center justify-between gap-2">
      {/* 左：标题 + 关卡名 */}
      <div className="flex flex-col">
        <h1 className="text-xl font-extrabold tracking-tight text-primary text-glow md:text-2xl">
          SOKOBAN
        </h1>
        {inGame && levelName && (
          <div className="text-xs text-muted-foreground md:text-sm">
            L{currentLevelId} / {totalLevels} · {levelName}
          </div>
        )}
      </div>

      {/* 中：状态卡片 */}
      {inGame && (
        <div className="flex items-center gap-2">
          <NumberCard label="MOVES" value={moveCount} />
          <NumberCard label="PUSH" value={pushCount} />
        </div>
      )}

      {/* 右：操作按钮 */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAudio}
          aria-label={audioEnabled ? '关闭音效' : '开启音效'}
          title={audioEnabled ? 'M' : 'M'}
        >
          {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        {engine && phase === 'playing' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => engine.togglePause()}
            aria-label="暂停"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NumberCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-white/10 bg-card/40 px-2 py-1 backdrop-blur-sm md:px-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold tabular-nums text-foreground md:text-base">
        {value}
      </div>
    </div>
  );
}
