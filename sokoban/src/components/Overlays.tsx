/**
 * Overlays - 覆盖层状态机管理
 *
 * 根据 phase 渲染：
 * - menu   → MainMenu
 * - paused → PauseOverlay
 * - over   → WinModal
 */

import { useGameStore } from '../store/useGameStore';
import { MainMenu } from './MainMenu';
import { PauseOverlay } from './PauseOverlay';
import { WinModal } from './WinModal';

export function Overlays() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'menu') {
    return <MainMenu />;
  }
  if (phase === 'paused') {
    return <PauseOverlay />;
  }
  if (phase === 'over') {
    return <WinModal />;
  }
  return null;
}
