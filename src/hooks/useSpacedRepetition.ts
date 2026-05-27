/**
 * 艾宾浩斯遗忘曲线复习调度
 * 从 MMKV 读取下次复习日期，返回今日待复习的单词 ID 列表。
 */
import { useMemo } from 'react';
import { getNextReviewDate } from '../store/mmkv';

export function useSpacedRepetition(wordIds: string[]): string[] {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return wordIds.filter((id) => {
      const next = getNextReviewDate(id);
      next.setHours(0, 0, 0, 0);
      return next <= today;
    });
  }, [wordIds]);
}
