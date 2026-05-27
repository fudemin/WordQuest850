/**
 * 首页 —— 打卡条幅 + 今日单词 + 闯关地图（Screen 01）
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import { wordGroups, sampleWords } from '../data/words';
import { getTotalPoints, getCheckinDates, getMastery } from '../store/mmkv';
import type { HomeScreenProps } from '../navigation/types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const points = getTotalPoints();
  const streakDays = getCheckinDates().length; // 简化：用总打卡数示意
  const todayWord = sampleWords[0];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>早上好 👋</Text>
          <Text style={styles.name}>小明同学</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ color: Colors.white, fontWeight: FontWeight.black, fontSize: 16 }}>小</Text>
        </View>
      </View>

      {/* 打卡横幅 */}
      <View style={styles.streakBanner}>
        <Text style={{ fontSize: 32 }}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakDays}>{streakDays} 天</Text>
          <Text style={styles.streakLabel}>连续学习打卡</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.streakPts}>{points.toLocaleString()}</Text>
          <Text style={styles.streakPtsLabel}>总积分</Text>
        </View>
      </View>

      {/* 今日单词 */}
      <Text style={styles.sectionTitle}>📖 今日单词</Text>
      <View style={styles.wordHero}>
        <View style={styles.wordHeroImg}>
          <Text style={{ fontSize: 80 }}>{todayWord.emoji}</Text>
          <View style={styles.wordHeroTag}><Text style={{ color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold }}>今日推荐</Text></View>
        </View>
        <View style={{ padding: 14 }}>
          <Text style={styles.wordEn}>{todayWord.en}</Text>
          <Text style={styles.wordPhonetic}>{todayWord.phonetic}  {todayWord.wordClass}</Text>
          <Text style={styles.wordCn}>{todayWord.cn}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: Colors.primary }]}
              onPress={() =>
                navigation.navigate('Learn', {
                  groupId: todayWord.groupId,
                  wordIds: sampleWords.map((w) => w.id),
                })
              }
            >
              <Text style={{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>开始学习</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]}>
              <Text style={{ color: Colors.gray700, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>🔊 发音</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 闯关地图 */}
      <Text style={styles.sectionTitle}>🗺 闯关地图</Text>
      {wordGroups.map((group) => {
        const mastery = getMastery(`group-${group.id}`);
        const isUnlocked = group.id <= 3;
        const isCurrent = group.id === 3;
        return (
          <View key={group.id} style={styles.levelRow}>
            <View style={[styles.levelNode, isCurrent && styles.nodeCurrent, !isUnlocked && styles.nodeLocked]}>
              <Text style={{ fontSize: 18 }}>{isUnlocked ? group.icon : '🔒'}</Text>
              <Text style={{ fontSize: 9, fontWeight: FontWeight.bold, color: isUnlocked ? Colors.white : Colors.gray400 }}>第{group.id}关</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelName}>{group.name}</Text>
              <Text style={styles.levelSub}>{group.totalWords}个词汇</Text>
            </View>
            <Text style={{ fontSize: 13, opacity: isUnlocked ? 1 : 0.2 }}>
              {'⭐'.repeat(Math.min(mastery, 3))}{'☆'.repeat(Math.max(0, 3 - mastery))}
            </Text>
          </View>
        );
      })}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.primaryBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16 },
  greeting: { fontSize: FontSize.sm, color: Colors.gray400 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.gray900 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  streakBanner: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    ...Shadow.md,
  },
  streakDays: { fontSize: 22, fontWeight: FontWeight.black, color: Colors.white },
  streakLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  streakPts: { fontSize: 18, fontWeight: FontWeight.extrabold, color: Colors.white },
  streakPtsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.gray700, paddingHorizontal: 16, paddingBottom: 10 },
  wordHero: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  wordHeroImg: { width: '100%', height: 140, backgroundColor: Colors.blueBg, alignItems: 'center', justifyContent: 'center' },
  wordHeroTag: { position: 'absolute', top: 10, left: 10, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  wordEn: { fontSize: 26, fontWeight: FontWeight.black, color: Colors.gray900, letterSpacing: -0.5 },
  wordPhonetic: { fontSize: FontSize.sm, color: Colors.gray400, marginVertical: 2 },
  wordCn: { fontSize: FontSize.base, color: Colors.gray700 },
  btn: { flex: 1, padding: 8, borderRadius: Radius.sm, alignItems: 'center' },
  btnOutline: { borderWidth: 1.5, borderColor: Colors.gray200 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  levelNode: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center',
  },
  nodeCurrent: { backgroundColor: Colors.primary },
  nodeLocked: { backgroundColor: Colors.gray200 },
  levelName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray900 },
  levelSub: { fontSize: FontSize.xs, color: Colors.gray400 },
});
