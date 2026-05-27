/**
 * 单词学习 + 第1关选择题（Screen 02）
 * wordIds 由 HomeScreen 传入，按顺序逐词展示。
 */
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import WordCard from '../components/WordCard';
import QuizOption from '../components/QuizOption';
import { sampleWords } from '../data/words';
import { setMastery, getMastery, addPoints, markReviewed } from '../store/mmkv';
import { useAudio } from '../hooks/useAudio';
import type { LearnScreenProps } from '../navigation/types';

type OptionState = 'idle' | 'correct' | 'wrong';

export default function LearnScreen({ route, navigation }: LearnScreenProps) {
  const { wordIds } = route.params;
  const words = useMemo(
    () => wordIds.map((id) => sampleWords.find((w) => w.id === id)).filter(Boolean) as typeof sampleWords,
    [wordIds],
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [optStates, setOptStates] = useState<OptionState[]>(['idle', 'idle', 'idle', 'idle']);

  const word = words[index];

  // 构造4个选项（1个正确 + 3个干扰项）
  const options = useMemo(() => {
    if (!word) return [];
    const others = words.filter((w) => w.id !== word.id).slice(0, 3);
    const opts = [{ cn: word.cn, correct: true }, ...others.map((w) => ({ cn: w.cn, correct: false }))];
    return opts.sort(() => Math.random() - 0.5);
  }, [word]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = options[idx].correct;
    setOptStates((prev) =>
      prev.map((_, i) => {
        if (i === idx) return isCorrect ? 'correct' : 'wrong';
        if (options[i].correct) return 'correct';
        return 'idle';
      }),
    );
    if (word) {
      markReviewed(word.id, isCorrect);
      if (isCorrect) {
        addPoints(10);
        const current = getMastery(word.id);
        if (current < 1) setMastery(word.id, 1);
      }
    }
  };

  const handleNext = () => {
    if (index < words.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setOptStates(['idle', 'idle', 'idle', 'idle']);
    } else {
      navigation.goBack();
    }
  };

  const { play } = useAudio();

  if (!word) return null;

  const progress = (index + 1) / words.length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>自然环境 · 第3关</Text>
        <Text style={{ fontSize: 13 }}>❤️❤️❤️</Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{index + 1} / {words.length}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 单词卡 */}
        <View style={{ marginTop: 16 }}>
          <WordCard
            word={word}
            onNext={handleNext}
            onAudio={() => play(word.id, word.audioUrl)}
          />
        </View>

        {/* 选择题 */}
        <View style={styles.quizArea}>
          <Text style={styles.quizQ}>选出 "{word.en}" 的正确中文意思</Text>
          <View style={styles.optGrid}>
            {options.map((opt, i) => (
              <QuizOption
                key={i}
                label={opt.cn}
                state={optStates[i]}
                onPress={() => handleSelect(i)}
              />
            ))}
          </View>

          {selected !== null && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {index < words.length - 1 ? '下一个 →' : '完成 🎉'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.gray200,
  },
  backBtn: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.extrabold, color: Colors.gray900 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.gray200, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressLabel: { fontSize: FontSize.sm, color: Colors.gray400, fontWeight: FontWeight.semibold },
  quizArea: { padding: 16 },
  quizQ: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gray700, textAlign: 'center', marginBottom: 12 },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nextBtn: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  nextBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
