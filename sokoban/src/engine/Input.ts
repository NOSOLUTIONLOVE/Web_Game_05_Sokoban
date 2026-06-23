/**
 * Input - 输入系统
 *
 * - 键盘 + 触屏双输入
 * - 通过回调向 GameEngine 发送事件（观察者模式）
 * - 防止默认行为（如方向键滚动）
 */

import { CONFIG } from '../config';

export type Action =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'undo'
  | 'redo'
  | 'reset'
  | 'pause'
  | 'menu'
  | 'toggleMute'
  | 'confirm';

export interface InputCallbacks {
  onAction: (action: Action) => void;
}

export class Input {
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private boundElement: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;

  bind(callbacks: InputCallbacks, target: HTMLElement): void {
    this.boundElement = target;

    this.keyHandler = (e: KeyboardEvent) => this.handleKey(e, callbacks);
    window.addEventListener('keydown', this.keyHandler);

    this.touchStartHandler = (e: TouchEvent) => this.handleTouchStart(e);
    this.touchEndHandler = (e: TouchEvent) => this.handleTouchEnd(e, callbacks);
    target.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    target.addEventListener('touchend', this.touchEndHandler, { passive: true });
  }

  unbind(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    if (this.boundElement) {
      if (this.touchStartHandler) {
        this.boundElement.removeEventListener('touchstart', this.touchStartHandler);
      }
      if (this.touchEndHandler) {
        this.boundElement.removeEventListener('touchend', this.touchEndHandler);
      }
      this.touchStartHandler = null;
      this.touchEndHandler = null;
      this.boundElement = null;
    }
  }

  // ============ 键盘 ============

  private handleKey(e: KeyboardEvent, cb: InputCallbacks): void {
    const key = e.key.toLowerCase();

    // 方向键 + WASD
    if (key === 'arrowup' || key === 'w') {
      cb.onAction('moveUp');
      e.preventDefault();
      return;
    }
    if (key === 'arrowdown' || key === 's') {
      cb.onAction('moveDown');
      e.preventDefault();
      return;
    }
    if (key === 'arrowleft' || key === 'a') {
      cb.onAction('moveLeft');
      e.preventDefault();
      return;
    }
    if (key === 'arrowright' || key === 'd') {
      cb.onAction('moveRight');
      e.preventDefault();
      return;
    }

    // 操作键
    if (key === 'u' || key === 'z') {
      cb.onAction('undo');
      e.preventDefault();
      return;
    }
    if (key === 'y' || key === 'x') {
      cb.onAction('redo');
      e.preventDefault();
      return;
    }
    if (key === 'r') {
      cb.onAction('reset');
      e.preventDefault();
      return;
    }
    if (key === 'p' || key === 'escape') {
      cb.onAction('pause');
      e.preventDefault();
      return;
    }
    if (key === 'm') {
      cb.onAction('toggleMute');
      return;
    }
    if (key === 'enter' || key === ' ') {
      cb.onAction('confirm');
      e.preventDefault();
      return;
    }
  }

  // ============ 触屏 ============

  private handleTouchStart(_e: TouchEvent): void {
    const touch = _e.touches[0];
    if (!touch) return;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  private handleTouchEnd(e: TouchEvent, cb: InputCallbacks): void {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const threshold = CONFIG.TOUCH.THRESHOLD;

    // 滑动方向判定
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) >= threshold) {
        cb.onAction(dx > 0 ? 'moveRight' : 'moveLeft');
      }
    } else {
      if (Math.abs(dy) >= threshold) {
        cb.onAction(dy > 0 ? 'moveDown' : 'moveUp');
      }
    }
  }
}
