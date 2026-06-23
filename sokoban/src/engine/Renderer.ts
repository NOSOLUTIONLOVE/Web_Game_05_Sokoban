/**
 * Renderer - Canvas 2D 渲染
 *
 * 职责：
 * - 7 种 CellType 绘制（wall / floor / target / box / box_on_target / player / player_on_target）
 * - 动效：归位绿光闪烁（2 次）/ 推不动抖动（200ms）/ 目标点持续脉冲
 * - 自适应画布尺寸
 * - HUD 绘制（关卡名 / 步数 / 推箱数）
 * - 暂停 / 过关遮罩
 *
 * 设计要点：
 * - 框架无关：只依赖 Canvas API
 * - 每帧清空 + 重绘，性能优先
 * - 动画状态由外部驱动（通过 setSettleAnimation / setBlockedAnimation）
 */

import { CONFIG, type Direction, type GamePhase, type Point } from '../config';
import type { Board } from './Board';

export interface RenderSnapshot {
  board: Board;
  moveCount: number;
  pushCount: number;
  levelName: string;
  levelId: number;
  totalLevels: number;
  phase: GamePhase;
  isOptimal: boolean;
  bestMoves?: number;
  bestPushes?: number;
}

interface SettleAnimation {
  position: Point;
  startTime: number;
}

interface BlockedAnimation {
  startTime: number;
  direction: Direction;
}

interface WinAnimation {
  startTime: number;
  levelId: number;
  isOptimal: boolean;
  moves: number;
  pushes: number;
}

/** 计算自适应画布尺寸 */
export function computeCanvasSize(
  width: number,
  height: number,
): { cellSize: number; canvasW: number; canvasH: number } {
  const base = CONFIG.CELL.SIZE; // 64
  const maxW = CONFIG.CELL.MAX_CANVAS_WIDTH; // 896
  const maxH = CONFIG.CELL.MAX_CANVAS_HEIGHT; // 640
  const idealW = width * base;
  const idealH = height * base;
  const scale = Math.min(maxW / idealW, maxH / idealH, 1);
  const cellSize = Math.max(20, Math.floor(base * scale));
  return { cellSize, canvasW: width * cellSize, canvasH: height * cellSize };
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cellSize: number;
  private boardX: number;
  private boardY: number;
  private boardWidth: number;
  private boardHeight: number;
  private gridWidth: number;
  private gridHeight: number;

  private settleAnims: SettleAnimation[] = [];
  private blockedAnim: BlockedAnimation | null = null;
  private winAnim: WinAnimation | null = null;

  constructor(canvas: HTMLCanvasElement, gridWidth: number, gridHeight: number) {
    this.canvas = canvas;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not supported');
    this.ctx = ctx;

    const { cellSize, canvasW, canvasH } = computeCanvasSize(gridWidth, gridHeight);
    this.cellSize = cellSize;
    this.boardWidth = canvasW;
    this.boardHeight = canvasH;

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;
    this.boardX = 0;
    this.boardY = 0;
  }

  // ============ 公开 API ============

  setSettleAnimation(position: Point): void {
    this.settleAnims.push({ position: { ...position }, startTime: performance.now() });
  }

  setBlockedAnimation(direction: Direction): void {
    this.blockedAnim = { startTime: performance.now(), direction };
  }

  setWinAnimation(levelId: number, isOptimal: boolean, moves: number, pushes: number): void {
    this.winAnim = { startTime: performance.now(), levelId, isOptimal, moves, pushes };
  }

  clearAnimations(): void {
    this.settleAnims = [];
    this.blockedAnim = null;
    this.winAnim = null;
  }

  /** 自适应窗口尺寸（DPR 感知） */
  resize(gridWidth: number, gridHeight: number): void {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    const { cellSize, canvasW, canvasH } = computeCanvasSize(gridWidth, gridHeight);
    this.cellSize = cellSize;
    this.boardWidth = canvasW;
    this.boardHeight = canvasH;
    this.canvas.width = canvasW;
    this.canvas.height = canvasH;
  }

  // ============ 主渲染流程 ============

  render(snapshot: RenderSnapshot): void {
    this.clear();
    this.drawBoard(snapshot);
    this.drawAnimations(snapshot);
  }

  private clear(): void {
    this.ctx.fillStyle = CONFIG.COLORS.BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ============ 主网格 ============

  private drawBoard(snapshot: RenderSnapshot): void {
    const { board } = snapshot;

    // 1. 背景（关卡区域内）
    this.ctx.fillStyle = CONFIG.COLORS.BG;
    this.ctx.fillRect(this.boardX, this.boardY, this.boardWidth, this.boardHeight);

    // 2. 地板（遍历 cells）
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const cell = board.getCell({ x, y });
        // 地板层：wall / floor / target
        if (cell === 'floor' || cell === 'target' || cell === 'wall' || cell === 'box_on_target' || cell === 'player_on_target') {
          this.drawFloor(x, y);
        }
      }
    }

    // 3. 目标点（持续脉冲）
    for (const target of board.targets) {
      this.drawTarget(target.x, target.y);
    }

    // 4. 墙
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const cell = board.getCell({ x, y });
        if (cell === 'wall') {
          this.drawWall(x, y);
        }
      }
    }

    // 5. 箱子
    for (const box of board.boxes) {
      const onTarget = board.isTarget(box);
      this.drawBox(box.x, box.y, onTarget);
    }

    // 6. 工人（顶层）
    let px = board.player.x;
    let py = board.player.y;
    const playerOnTarget = board.isTarget(board.player);
    if (this.blockedAnim) {
      const elapsed = performance.now() - this.blockedAnim.startTime;
      if (elapsed < CONFIG.ANIMATION.BLOCKED_SHAKE_MS) {
        const offset = Math.sin((elapsed / CONFIG.ANIMATION.BLOCKED_SHAKE_MS) * Math.PI * 4) * 0.2;
        switch (this.blockedAnim.direction) {
          case 'up':
            py -= offset;
            break;
          case 'down':
            py += offset;
            break;
          case 'left':
            px -= offset;
            break;
          case 'right':
            px += offset;
            break;
        }
      } else {
        this.blockedAnim = null;
      }
    }
    this.drawPlayer(Math.round(px), Math.round(py), board.playerFacing, playerOnTarget);

    // 7. 网格线（仅地板区域）
    this.drawGridLines();
  }

  // ============ 单元绘制 ============

  private cellPos(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: this.boardX + x * this.cellSize,
      cy: this.boardY + y * this.cellSize,
    };
  }

  private drawFloor(x: number, y: number): void {
    const { cx, cy } = this.cellPos(x, y);
    const size = this.cellSize;
    // 基础地板色
    this.ctx.fillStyle = CONFIG.COLORS.FLOOR;
    this.ctx.fillRect(cx, cy, size, size);
    // 木地板斜线纹理（仅当尺寸足够大时）
    if (size >= 40) {
      this.ctx.strokeStyle = CONFIG.COLORS.FLOOR_DARK;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy + size);
      this.ctx.lineTo(cx + size, cy);
      this.ctx.stroke();
    }
  }

  private drawTarget(x: number, y: number): void {
    const { cx, cy } = this.cellPos(x, y);
    const size = this.cellSize;
    const t = performance.now() / 1000;
    const pulse = (Math.sin(t * 4) + 1) / 2; // 0..1
    const alpha = 0.5 + 0.4 * pulse;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = CONFIG.COLORS.TARGET;
    // 中心点
    this.ctx.beginPath();
    this.ctx.arc(cx + size / 2, cy + size / 2, size * 0.08, 0, Math.PI * 2);
    this.ctx.fill();
    // 四个角的方块
    const corner = size * 0.18;
    const off = size * 0.22;
    this.ctx.fillRect(cx + off - corner / 2, cy + off - corner / 2, corner, corner);
    this.ctx.fillRect(cx + size - off - corner / 2, cy + off - corner / 2, corner, corner);
    this.ctx.fillRect(cx + off - corner / 2, cy + size - off - corner / 2, corner, corner);
    this.ctx.fillRect(cx + size - off - corner / 2, cy + size - off - corner / 2, corner, corner);
    this.ctx.restore();
  }

  private drawWall(x: number, y: number): void {
    const { cx, cy } = this.cellPos(x, y);
    const size = this.cellSize;
    // 主体
    this.ctx.fillStyle = CONFIG.COLORS.WALL;
    this.ctx.fillRect(cx, cy, size, size);
    // 砖纹高光线
    if (size >= 32) {
      this.ctx.strokeStyle = CONFIG.COLORS.WALL_BRIGHT;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy + size * 0.33);
      this.ctx.lineTo(cx + size, cy + size * 0.33);
      this.ctx.moveTo(cx, cy + size * 0.66);
      this.ctx.lineTo(cx + size, cy + size * 0.66);
      this.ctx.stroke();
    }
    // 边线
    this.ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(cx + 0.5, cy + 0.5, size - 1, size - 1);
  }

  private drawBox(x: number, y: number, onTarget: boolean): void {
    const { cx, cy } = this.cellPos(x, y);
    const size = this.cellSize;
    const padding = Math.max(2, size * 0.1);
    const mainColor = onTarget ? CONFIG.COLORS.BOX_ON_TARGET : CONFIG.COLORS.BOX;
    const darkColor = onTarget ? CONFIG.COLORS.BOX_ON_TARGET_DARK : CONFIG.COLORS.BOX_DARK;

    // 主体
    this.ctx.fillStyle = mainColor;
    this.ctx.fillRect(cx + padding, cy + padding, size - padding * 2, size - padding * 2);

    // 板条横纹
    if (size >= 32) {
      this.ctx.strokeStyle = darkColor;
      this.ctx.lineWidth = 1;
      const midY = cy + size / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(cx + padding + 2, midY);
      this.ctx.lineTo(cx + size - padding - 2, midY);
      this.ctx.stroke();
    }

    // 边框
    this.ctx.strokeStyle = darkColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cx + padding + 1, cy + padding + 1, size - padding * 2 - 2, size - padding * 2 - 2);

    // 归位时持续微脉冲
    if (onTarget) {
      const t = performance.now() / 1000;
      const pulse = (Math.sin(t * 3) + 1) / 2;
      this.ctx.save();
      this.ctx.globalAlpha = 0.2 + 0.2 * pulse;
      this.ctx.fillStyle = CONFIG.COLORS.BOX_ON_TARGET;
      this.ctx.fillRect(cx + padding, cy + padding, size - padding * 2, size - padding * 2);
      this.ctx.restore();
    }
  }

  private drawPlayer(x: number, y: number, facing: Direction, onTarget: boolean): void {
    const { cx, cy } = this.cellPos(x, y);
    const size = this.cellSize;
    const centerX = cx + size / 2;
    const centerY = cy + size / 2;
    const bodyRadius = size * 0.28;
    const headRadius = size * 0.16;

    // 阴影
    this.ctx.save();
    this.ctx.fillStyle = CONFIG.COLORS.SHADOW;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, cy + size * 0.82, bodyRadius * 0.9, bodyRadius * 0.3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 身体（圆形）
    this.ctx.fillStyle = CONFIG.COLORS.PLAYER;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY + bodyRadius * 0.2, bodyRadius, 0, Math.PI * 2);
    this.ctx.fill();
    // 身体高光
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.ctx.beginPath();
    this.ctx.arc(centerX - bodyRadius * 0.3, centerY, bodyRadius * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
    // 身体暗部
    this.ctx.fillStyle = CONFIG.COLORS.PLAYER_DARK;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY + bodyRadius * 0.6, bodyRadius * 0.7, 0, Math.PI);
    this.ctx.fill();

    // 头（肤色圆）
    this.ctx.fillStyle = CONFIG.COLORS.PLAYER_FACE;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - bodyRadius * 0.55, headRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // 眼睛（表示朝向）
    let eyeX1 = centerX - headRadius * 0.3;
    let eyeX2 = centerX + headRadius * 0.3;
    let eyeY = centerY - headRadius * 0.55;
    switch (facing) {
      case 'up':
        eyeY -= headRadius * 0.2;
        break;
      case 'down':
        eyeY += headRadius * 0.2;
        break;
      case 'left':
        eyeX1 -= headRadius * 0.3;
        eyeX2 -= headRadius * 0.3;
        break;
      case 'right':
        eyeX1 += headRadius * 0.3;
        eyeX2 += headRadius * 0.3;
        break;
    }
    this.ctx.fillStyle = '#1f2937';
    this.ctx.beginPath();
    this.ctx.arc(eyeX1, eyeY, headRadius * 0.12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(eyeX2, eyeY, headRadius * 0.12, 0, Math.PI * 2);
    this.ctx.fill();

    // 目标点标记
    if (onTarget) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.4;
      this.ctx.fillStyle = CONFIG.COLORS.TARGET;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, size * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private drawGridLines(): void {
    this.ctx.strokeStyle = CONFIG.COLORS.GRID_LINE;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    for (let i = 1; i < this.gridWidth; i++) {
      const x = this.boardX + i * this.cellSize;
      this.ctx.moveTo(x, this.boardY);
      this.ctx.lineTo(x, this.boardY + this.boardHeight);
    }
    for (let i = 1; i < this.gridHeight; i++) {
      const y = this.boardY + i * this.cellSize;
      this.ctx.moveTo(this.boardX, y);
      this.ctx.lineTo(this.boardX + this.boardWidth, y);
    }
    this.ctx.stroke();
  }

  // ============ 动效 ============

  private drawAnimations(_snapshot: RenderSnapshot): void {
    // 归位绿光
    this.settleAnims = this.settleAnims.filter((anim) => {
      const elapsed = performance.now() - anim.startTime;
      const duration = 400;
      if (elapsed > duration) return false;
      const phase = Math.sin((elapsed / duration) * Math.PI * 2);
      if (phase > 0) {
        const { cx, cy } = this.cellPos(anim.position.x, anim.position.y);
        const size = this.cellSize;
        this.ctx.save();
        this.ctx.globalAlpha = 0.5 * phase;
        this.ctx.fillStyle = CONFIG.COLORS.BOX_ON_TARGET;
        this.ctx.beginPath();
        this.ctx.arc(cx + size / 2, cy + size / 2, size * 0.55, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      return true;
    });

    // 胜利动画
    if (this.winAnim) {
      const elapsed = performance.now() - this.winAnim.startTime;
      const duration = 1500;
      if (elapsed < duration) {
        const alpha = elapsed < 600 ? elapsed / 600 : 1 - (elapsed - 600) / 900;
        this.ctx.save();
        this.ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.15})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        this.ctx.font = `bold ${Math.floor(this.cellSize * 1.2)}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
        this.ctx.shadowBlur = 16;
        this.ctx.fillText(
          this.winAnim.isOptimal ? 'OPTIMAL!' : 'CLEAR!',
          this.canvas.width / 2,
          this.canvas.height / 2,
        );
        this.ctx.restore();
      } else {
        this.winAnim = null;
      }
    }
  }

  // ============ 工具 ============

  getDimensions(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }
}
