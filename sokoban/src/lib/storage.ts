/**
 * localStorage 封装（带类型安全 + 错误处理）
 */

const PREFIX = 'sokoban:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storage] read ${key} failed:`, err);
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[storage] write ${key} failed:`, err);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch (err) {
      console.warn(`[storage] remove ${key} failed:`, err);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX));
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn('[storage] clear failed:', err);
    }
  },
};
