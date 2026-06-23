import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 数字格式化：1000 -> 1,000 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** 限制数值在 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 线性映射 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax - inMin === 0) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
