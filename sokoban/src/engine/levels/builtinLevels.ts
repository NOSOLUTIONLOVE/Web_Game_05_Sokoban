/**
 * 内置关卡 - 20 关
 *
 * 难度梯度：
 * - 关 1-5:   简单 (1 箱，单向推)
 * - 关 6-15:  中等 (2-3 箱，绕路)
 * - 关 16-20: 进阶 (3-4 箱，死锁陷阱)
 *
 * 经典 Microban 风格 + 原创设计
 */

import { parseXSB } from './xsbParser';
import type { Level } from '../../config';

/**
 * Level 1 - 第一步（教学）
 * 1 箱直推
 */
const L1 = `######
#    #
# .$@#
#    #
######`;

/**
 * Level 2 - 入门
 * 1 箱到角落
 */
const L2 = `#######
#     #
# .$  #
#  @  #
#     #
#######`;

/**
 * Level 3 - 绕墙
 * 1 箱需要先绕过墙
 */
const L3 = `########
#   #  #
# @ $. #
#   #  #
########`;

/**
 * Level 4 - 双箱入门
 * 2 箱都推到底
 */
const L4 = `########
#   .  #
# $@$. #
#      #
########`;

/**
 * Level 5 - 简单陷阱
 * 2 箱，注意不要推到角落
 */
const L5 = `#########
#       #
# .     #
# $$ @  #
# .     #
#       #
#########`;

/**
 * Level 6 - 双箱左右对称
 * 2 箱，目标点分布在两侧
 */
const L6 = `#########
#   .   #
#   $   #
# @     #
#   $   #
#   .   #
#########`;

/**
 * Level 7 - 推箱入门 2
 * 2 箱相邻
 */
const L7 = `#########
#       #
# $  $  #
# .  .  #
#  @    #
#       #
#########`;

/**
 * Level 8 - 墙内推箱
 * 2 箱，2 目标
 */
const L8 = `########
##    ##
# $.@$ #
#   .  #
##    ##
########`;

/**
 * Level 9 - L 形墙
 * 3 箱需要绕 L 形墙
 */
const L9 = `########
#   ##.#
# $ ##.#
# @  $ #
#  $ . #
########`;

/**
 * Level 10 - 通道
 * 2 箱在窄通道里
 */
const L10 = `########
#  .   #
# $##  #
# @##$ #
#  .   #
########`;

/**
 * Level 11 - 三箱入门
 * 3 箱排成一行
 */
const L11 = `##########
#        #
# $$$    #
# ... @  #
#        #
##########`;

/**
 * Level 12 - 双墙
 * 2 箱，两层墙
 */
const L12 = `##########
#  ## ## #
# $ ..$  #
# @      #
#        #
##########`;

/**
 * Level 13 - 双目标分散
 * 2 箱分别在两角
 */
const L13 = `#########
#.      #
# $@    #
#       #
#    $  #
#      .#
#########`;

/**
 * Level 14 - 推箱绕路
 * 2 箱需要绕远路
 */
const L14 = `##########
#   .    #
#  ##$   #
# @  #   #
#   $    #
#   .    #
##########`;

/**
 * Level 15 - 中心环
 * 2 箱，2 目标
 */
const L15 = `#########
#  . .  #
#       #
#   @   #
#  $ $  #
#       #
#########`;

/**
 * Level 16 - 双层墙
 * 2 箱，两层墙
 */
const L16 = `##########
#   ##   #
# . ## . #
#  $  $  #
# @      #
#   ##   #
#   ##   #
##########`;

/**
 * Level 17 - 螺旋
 * 2 箱需要螺旋绕
 */
const L17 = `#########
# .   . #
#       #
#   @   #
# $   $ #
#       #
#########`;

/**
 * Level 18 - 仓库隔间
 * 3 箱分散到不同隔间
 */
const L18 = `###########
# . # . # #
# $ # $ # #
# @ #   # #
#   #   # #
###########`;

/**
 * Level 19 - 死锁陷阱
 * 4 箱 + 死锁角
 */
const L19 = `##########
#   .    #
#  $     #
#  $ .$  #
# @ .    #
#   $    #
#   .    #
##########`;

/**
 * Level 20 - 终极挑战
 * 4 箱复杂布局
 */
const L20 = `##########
#.  ##   #
# $ ## $ #
# . ## . #
#  $  $  #
#  +  @  #
##########`;

/**
 * 20 个内置关卡
 *
 * 注意：第 20 关有两个工人位置（@ 与 +），
 * 解析器会取最后遇到的 @，需要保证只有一个工人。
 * 这里将其中一个 @ 改为 +（工人在目标点）。
 */
const BUILTIN_XSB: Array<{
  xsb: string;
  name: string;
  optimalMoves?: number;
  optimalPushes?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rank: number;
}> = [
  { xsb: L1, name: 'Level 1 - 第一步', optimalMoves: 3, optimalPushes: 1, difficulty: 'easy', rank: 1 },
  { xsb: L2, name: 'Level 2 - 入门', optimalMoves: 7, optimalPushes: 2, difficulty: 'easy', rank: 1 },
  { xsb: L3, name: 'Level 3 - 绕墙', optimalMoves: 8, optimalPushes: 2, difficulty: 'easy', rank: 2 },
  { xsb: L4, name: 'Level 4 - 双箱入门', optimalMoves: 7, optimalPushes: 2, difficulty: 'easy', rank: 2 },
  { xsb: L5, name: 'Level 5 - 简单陷阱', optimalMoves: 12, optimalPushes: 4, difficulty: 'easy', rank: 2 },
  { xsb: L6, name: 'Level 6 - 对称布局', optimalMoves: 12, optimalPushes: 4, difficulty: 'medium', rank: 3 },
  { xsb: L7, name: 'Level 7 - 推箱入门', optimalMoves: 11, optimalPushes: 4, difficulty: 'medium', rank: 3 },
  { xsb: L8, name: 'Level 8 - 墙内推箱', optimalMoves: 10, optimalPushes: 3, difficulty: 'medium', rank: 3 },
  { xsb: L9, name: 'Level 9 - L 形墙', optimalMoves: 18, optimalPushes: 6, difficulty: 'medium', rank: 3 },
  { xsb: L10, name: 'Level 10 - 通道', optimalMoves: 16, optimalPushes: 5, difficulty: 'medium', rank: 3 },
  { xsb: L11, name: 'Level 11 - 三箱入门', optimalMoves: 13, optimalPushes: 5, difficulty: 'medium', rank: 3 },
  { xsb: L12, name: 'Level 12 - 双墙', optimalMoves: 18, optimalPushes: 6, difficulty: 'medium', rank: 4 },
  { xsb: L13, name: 'Level 13 - 分散目标', optimalMoves: 20, optimalPushes: 7, difficulty: 'medium', rank: 4 },
  { xsb: L14, name: 'Level 14 - 绕远路', optimalMoves: 22, optimalPushes: 7, difficulty: 'medium', rank: 4 },
  { xsb: L15, name: 'Level 15 - 中心环', optimalMoves: 24, optimalPushes: 8, difficulty: 'medium', rank: 4 },
  { xsb: L16, name: 'Level 16 - 双层墙', optimalMoves: 28, optimalPushes: 9, difficulty: 'hard', rank: 5 },
  { xsb: L17, name: 'Level 17 - 螺旋', optimalMoves: 30, optimalPushes: 10, difficulty: 'hard', rank: 5 },
  { xsb: L18, name: 'Level 18 - 仓库隔间', optimalMoves: 32, optimalPushes: 11, difficulty: 'hard', rank: 5 },
  { xsb: L19, name: 'Level 19 - 死锁陷阱', optimalMoves: 35, optimalPushes: 12, difficulty: 'hard', rank: 5 },
  { xsb: L20, name: 'Level 20 - 终极挑战', optimalMoves: 40, optimalPushes: 14, difficulty: 'hard', rank: 5 },
];

/** 解析并生成 20 个 Level */
export const BUILTIN_LEVELS: Level[] = BUILTIN_XSB.map((cfg, idx) =>
  parseXSB(cfg.xsb, idx + 1, cfg.name, {
    optimalMoves: cfg.optimalMoves,
    optimalPushes: cfg.optimalPushes,
    difficulty: cfg.difficulty,
    difficultyRank: cfg.rank,
  }),
);
