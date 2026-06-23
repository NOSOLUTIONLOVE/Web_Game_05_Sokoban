/**
 * DeadlockToast - 死锁提示（顶部弹窗，3 秒后消失）
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export function DeadlockToast() {
  const showDeadlock = useGameStore((s) => s.showDeadlock);

  return (
    <AnimatePresence>
      {showDeadlock && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground shadow-2xl shadow-destructive/30 backdrop-blur-md">
            <AlertTriangle className="h-4 w-4" />
            <span>死锁！请撤销或重置关卡</span>
            {showDeadlock.length > 0 && (
              <span className="text-xs opacity-80">({showDeadlock.length} 个箱子)</span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
