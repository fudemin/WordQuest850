/**
 * MMKV 存储封装
 *
 * 所有持久化数据通过此模块读写，避免散落 key 字符串。
 *
 * 存储内容：
 *  - 学习进度（每个单词的 MasteryLevel）
 *  - 用户自定义图片绑定（wordId -> imageUri）
 *  - 打卡记录（日期字符串数组）
 *  - 积分
 */

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const storage: MMKV = createMMKV({ id: 'wordquest-store' });

// ── Key 命名空间 ────────────────────────────────────────────────────────────
const KEYS = {
  mastery: (wordId: string) => `mastery:${wordId}`,
  customImage: (wordId: string) => `img:${wordId}`,
  checkinDates: 'checkin:dates',
  totalPoints: 'user:points',
  lastReviewDate: (wordId: string) => `review:last:${wordId}`,
  reviewInterval: (wordId: string) => `review:interval:${wordId}`,
} as const;

// ── 掌握度 ──────────────────────────────────────────────────────────────────
export function getMastery(wordId: string): MasteryLevel {
  return (storage.getNumber(KEYS.mastery(wordId)) ?? 0) as MasteryLevel;
}

export function setMastery(wordId: string, level: MasteryLevel): void {
  storage.set(KEYS.mastery(wordId), level);
}

// ── 自定义图片 ───────────────────────────────────────────────────────────────
export function getCustomImage(wordId: string): string | undefined {
  return storage.getString(KEYS.customImage(wordId));
}

export function setCustomImage(wordId: string, uri: string): void {
  storage.set(KEYS.customImage(wordId), uri);
}

// ── 打卡 & 积分 ──────────────────────────────────────────────────────────────
export function getCheckinDates(): string[] {
  const raw = storage.getString(KEYS.checkinDates);
  return raw ? JSON.parse(raw) : [];
}

export function addCheckinDate(date: string): void {
  const dates = getCheckinDates();
  if (!dates.includes(date)) {
    storage.set(KEYS.checkinDates, JSON.stringify([...dates, date]));
  }
}

export function getTotalPoints(): number {
  return storage.getNumber(KEYS.totalPoints) ?? 0;
}

export function addPoints(delta: number): void {
  storage.set(KEYS.totalPoints, getTotalPoints() + delta);
}

// ── 艾宾浩斯复习间隔（天数） ─────────────────────────────────────────────────
// 默认间隔序列: 1, 2, 4, 7, 15, 30, 60 天
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60];

export function getNextReviewDate(wordId: string): Date {
  const last = storage.getString(KEYS.lastReviewDate(wordId));
  const step = storage.getNumber(KEYS.reviewInterval(wordId)) ?? 0;
  const interval = REVIEW_INTERVALS[Math.min(step, REVIEW_INTERVALS.length - 1)];
  const base = last ? new Date(last) : new Date();
  const next = new Date(base);
  next.setDate(next.getDate() + interval);
  return next;
}

export function markReviewed(wordId: string, correct: boolean): void {
  storage.set(KEYS.lastReviewDate(wordId), new Date().toISOString());
  if (correct) {
    const step = storage.getNumber(KEYS.reviewInterval(wordId)) ?? 0;
    storage.set(KEYS.reviewInterval(wordId), Math.min(step + 1, REVIEW_INTERVALS.length - 1));
  } else {
    storage.set(KEYS.reviewInterval(wordId), 0); // 答错重置间隔
  }
}
