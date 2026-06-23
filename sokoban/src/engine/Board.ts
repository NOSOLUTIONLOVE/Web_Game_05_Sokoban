/**
 * Board - 推箱子网格核心
 *
 * 设计要点：
 * - 内部状态可变（cells / player / boxes）
 * - 通过 clone() 创建快照用于撤销
 * - tryMove() 返回 MoveResult（moved + pushed + blocked 类型）
 *
 * 数据结构：
 * - cells[y][x] = CellType（墙/地板/目标点/箱/工人）
 * - player: Point
 * - boxes: Point[]
 * - targets: Point[]（关卡固有的，不变）
 *
 * 推箱算法（来自 PRD §8.4）：
 *   1. 计算 next = player + dir
 *   2. 若 next 是墙 → 撞墙，return blocked
 *   3. 若 next 是箱子：计算 beyond = next + dir
 *      - 若 beyond 是墙 / 箱子 → 推不动
 *      - 否则移动箱子到 beyond
 *   4. 移动 player 到 next
 *   5. 更新 cells 显示
 *   6. 返回 MoveResult
 */

import type { CellType, Direction, Level, MoveResult, Point } from '../config';
import { movePoint } from './Direction';

export class Board {
  /** 单元格类型二维数组（包含 box_on_target / player_on_target 等合成态） */
  private cells: CellType[][];
  /** 关卡原始背景（墙/地板/目标点，用于推箱后还原） */
  private readonly background: CellType[][];
  /** 关卡宽度 */
  readonly width: number;
  /** 关卡关卡高度 */
  readonly height: number;
  /** 工人位置 */
  player: Point;
  /** 箱子位置列表（不变顺序） */
  boxes: Point[];
  /** 目标点位置列表（关卡固有） */
  readonly targets: Point[];

  constructor(level: Level) {
    this.width = level.width;
    this.height = level.height;
    this.targets = [...level.targets];
    this.player = { ...level.playerStart };
    this.boxes = level.boxesStart.map((b) => ({ ...b }));

    // 深拷贝 cells
    this.cells = level.cells.map((row) => [...row]);
    this.background = level.cells.map((row) => [...row]);
  }

  // ============ 查询 ============

  /** 越界检查 */
  isOutOfBounds(p: Point): boolean {
    return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
  }

  /** 越界或为墙 */
  isWall(p: Point): boolean {
    if (this.isOutOfBounds(p)) return true; // 越界视为墙
    return this.cells[p.y]?.[p.x] === 'wall';
  }

  /** 该位置是否有箱子 */
  hasBox(p: Point): boolean {
    return this.boxes.some((b) => b.x === p.x && b.y === p.y);
  }

  /** 该位置是目标点（关卡固有） */
  isTarget(p: Point): boolean {
    return this.targets.some((t) => t.x === p.x && t.y === p.y);
  }

  /** 获取指定单元格当前显示类型 */
  getCell(p: Point): CellType {
    if (this.isOutOfBounds(p)) return 'wall';
    return this.cells[p.y]?.[p.x] ?? 'wall';
  }

  /** 该位置是否可站立（不是墙/箱） */
  isWalkable(p: Point): boolean {
    if (this.isWall(p)) return false;
    if (this.hasBox(p)) return false;
    return true;
  }

  /** 工人方向（用于动画） */
  playerFacing: Direction = 'down';

  // ============ 推箱逻辑 ============

  /**
   * 尝试按方向移动工人
   *
   * 副作用：会修改 cells / player / boxes
   *
   * @returns MoveResult - { moved, pushed, blocked? }
   */
  tryMove(direction: Direction): MoveResult {
    this.playerFacing = direction;
    const next = movePoint(this.player, direction);

    // 1. 撞墙
    if (this.isWall(next)) {
      return { moved: false, pushed: false, blocked: 'wall' };
    }

    // 2. 推动箱子
    if (this.hasBox(next)) {
      const beyond = movePoint(next, direction);
      // beyond 是墙 / 箱子 → 推不动
      if (this.isWall(beyond)) {
        return { moved: false, pushed: false, blocked: 'box' };
      }
      if (this.hasBox(beyond)) {
        return { moved: false, pushed: false, blocked: 'box' };
      }
      // 移动箱子
      const box = this.boxes.find((b) => b.x === next.x && b.y === next.y);
      if (!box) return { moved: false, pushed: false, blocked: 'box' };
      box.x = beyond.x;
      box.y = beyond.y;
      this.syncCells();
      // 移动工人
      this.movePlayer(next);
      return { moved: true, pushed: true };
    }

    // 3. 普通移动
    this.movePlayer(next);
    return { moved: true, pushed: false };
  }

  /** 移动工人到 newPos，并更新 cells 显示 */
  private movePlayer(newPos: Point): void {
    const oldPos = this.player;
    // 还原旧位置的 cells 状态
    this.cells[oldPos.y]![oldPos.x] = this.backgroundCell(oldPos);
    // 设置新位置的 cells 状态
    this.player = newPos;
    this.cells[newPos.y]![newPos.x] = this.isTarget(newPos) ? 'player_on_target' : 'player';
  }

  /** 获取指定位置在关卡背景中的状态（去除 box / player 影响） */
  private backgroundCell(p: Point): CellType {
    const bg = this.background[p.y]?.[p.x] ?? 'floor';
    // 如果背景是 player_on_target，去掉 player 标记，保留 target
    if (bg === 'player_on_target') return 'target';
    return bg;
  }

  /** 重新计算整个 cells 网格（推箱后调用） */
  private syncCells(): void {
    // 1. 重置 cells 为 background（去除 box / player 占用）
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const bg = this.background[y]?.[x] ?? 'floor';
        if (bg === 'player_on_target') {
          this.cells[y]![x] = 'target';
        } else if (bg === 'box_on_target') {
          this.cells[y]![x] = 'target';
        } else {
          this.cells[y]![x] = bg;
        }
      }
    }
    // 2. 放置箱子
    for (const box of this.boxes) {
      const isOnTarget = this.isTarget(box);
      this.cells[box.y]![box.x] = isOnTarget ? 'box_on_target' : 'box';
    }
    // 3. 放置工人
    const playerOnTarget = this.isTarget(this.player);
    this.cells[this.player.y]![this.player.x] = playerOnTarget ? 'player_on_target' : 'player';
  }

  // ============ 胜利判定 ============

  /** 所有箱子都已在目标点上 */
  isWon(): boolean {
    if (this.boxes.length !== this.targets.length) return false;
    for (const box of this.boxes) {
      if (!this.isTarget(box)) return false;
    }
    return true;
  }

  /** 已归位的箱子数量 */
  boxesOnTargetCount(): number {
    let n = 0;
    for (const box of this.boxes) {
      if (this.isTarget(box)) n++;
    }
    return n;
  }

  // ============ 快照（用于撤销） ============

  /** 创建 Board 状态快照 */
  snapshot(): BoardSnapshot {
    return {
      player: { ...this.player },
      boxes: this.boxes.map((b) => ({ ...b })),
      playerFacing: this.playerFacing,
    };
  }

  /** 从快照恢复 Board 状态 */
  restore(snapshot: BoardSnapshot): void {
    this.player = { ...snapshot.player };
    this.boxes = snapshot.boxes.map((b) => ({ ...b }));
    this.playerFacing = snapshot.playerFacing;
    this.syncCells();
  }
}

/** Board 状态快照（不包含 cells 数组，可由 boxes/player 重建） */
export interface BoardSnapshot {
  player: Point;
  boxes: Point[];
  playerFacing: Direction;
}
