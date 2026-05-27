/**
 * 学习统计页（Screen 05）
 * 热力图 + 掌握率分布
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import { getTotalPoints, getCheckinDates, getMastery } from '../store/mmkv';
import { sampleWords } from '../data/words';

const HEATMAP_DAYS = 45;

export default function StatsScreen() {
  const points = getTotalPoints();
  const checkins = getCheckinDates();
  const streakDays = checkins.length;

  const masteredCount = useMemo(
    () => sampleWords.filter((w) => getMastery(w.id) >= 5).length,
    [],
  );

  // 简易热力图（随机填充示意，真实实现从 MMKV 读取每日学习量）
  const heatmapCells = useMemo(
    () => Array.from({ length: HEATMAP_DAYS }, (_, i) => Math.floor(Math.random() * 5)),
    [],
  );

  const heatColor = (level: number) => {
    if (level === 0) return Colors.gray200;
    if (level === 1) return '#FDDFD5';
    if (level === 2) return '#FFB199';
    if (level === 3) return '#FF8C5A';
    return Colors.primary;
  };

  const mastery = [
    { label: '名词', pct: 72, color: Colors.green },
    { label: '动词', pct: 55, color: Colors.blue },
    { label: '形容词', pct: 38, color: Colors.purple },
    { label: '副词', pct: 22, color: Colors.amber },
  ];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* 紫色头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 我的学习报告</Text>
        <View style={styles.statsGrid}>
          {[
            { num: masteredCount, lbl: '已掌握单词' },
            { num: streakDays,    lbl: '连续打卡天' },
            { num: `${Math.round((masteredCount / 850) * 100)}%`, lbl: '850词完成' },
            { num: points.toLocaleString(), lbl: '总积分' },
          ].map((item, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statNum}>{item.num}</Text>
              <Text style={styles.statLbl}>{item.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 热力图 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 最近学习热力图</Text>
        <View style={styles.heatmapGrid}>
          {heatmapCells.map((level, i) => (
            <View
              key={i}
              style={[styles.heatCell, { backgroundColor: heatColor(level) }]}
            />
          ))}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>少</Text>
          {[0, 1, 3, 4].map((l) => (
            <View key={l} style={[styles.legendDot, { backgroundColor: heatColor(l) }]} />
          ))}
          <Text style={styles.legendText}>多</Text>
        </View>
      </View>

      {/* 掌握分布 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 词汇掌握分布</Text>
        {mastery.map((item) => (
          <View key={item.label} style={styles.masteryRow}>
            <Text style={styles.masteryLabel}>{item.label}</Text>
            <View style={styles.masteryBarWrap}>
              <View style={[styles.masteryBar, { width: `${item.pct}%`, backgroundColor: item.color }]} />
            </View>
            <Text style={styles.masteryPct}>{item.pct}%</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    backgroundColor: Colors.purple,
    padding: 20,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white },
  statLbl: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  section: { padding: 16 },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray700, marginBottom: 10 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: 18, height: 18, borderRadius: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: FontSize.xs, color: Colors.gray400 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  masteryLabel: { fontSize: FontSize.sm, color: Colors.gray700, width: 48 },
  masteryBarWrap: { flex: 1, height: 10, backgroundColor: Colors.gray200, borderRadius: 5, overflow: 'hidden' },
  masteryBar: { height: '100%', borderRadius: 5 },
  masteryPct: { fontSize: FontSize.xs, color: Colors.gray400, width: 30, textAlign: 'right' },
});
