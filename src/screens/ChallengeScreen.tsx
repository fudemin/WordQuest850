/**
 * ChallengeScreen — 限时闯关模式（60 秒）
 *
 * 外层 ChallengeScreen 只持有一个 gameKey；
 * 每次"重玩"递增 gameKey，让 Game 完整重挂载，所有 useState / useRef / Animated.Value 自然归零。
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Shadow } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import { naturalWords, type Word } from '../data/words';
import { addPoints, markReviewed, storage } from '../store/mmkv';
import type { ChallengeScreenProps } from '../navigation/types';

// ── 常量 ──────────────────────────────────────────────────────────────────────

const TOTAL_SECONDS = 60;
const BEST_SCORE_KEY = 'challenge:best';
const PTS_BASE = 10;
const COMBO_BONUS_AT = 3;          // 连击 ≥ 3 时得分 ×1.5
const DELAY_CORRECT = 600;         // 答对后停留 ms
const DELAY_WRONG = 800;           // 答错后停留 ms
const GOLD = '#FFD700';
const { width: SCREEN_W } = Dimensions.get('window');
const OPT_W = Math.floor((SCREEN_W - 32 - 10) / 2); // 16px 双侧 + 10px 间距

// ── 类型 ──────────────────────────────────────────────────────────────────────

type GamePhase = 'playing' | 'revealing' | 'finished';
type OptionState = 'idle' | 'correct' | 'wrong';

interface Option {
  text: string;
  isCorrect: boolean;
}

// ── MMKV 高分辅助 ─────────────────────────────────────────────────────────────

function getHighScore(): number {
  return storage.getNumber(BEST_SCORE_KEY) ?? 0;
}

/** 若 score 超越历史，写入并返回 true */
function tryUpdateHighScore(score: number): boolean {
  if (score > getHighScore()) {
    storage.set(BEST_SCORE_KEY, score);
    return true;
  }
  return false;
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 生成 1 个正确 + 3 个干扰选项，已随机排序 */
function generateOptions(word: Word, pool: Word[]): Option[] {
  const distractors = shuffleArray(pool.filter((w) => w.id !== word.id)).slice(0, 3);
  return shuffleArray([
    { text: word.cn, isCorrect: true },
    ...distractors.map((w) => ({ text: w.cn, isCorrect: false })),
  ]);
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

/** 数据行单格 */
function ScoreCell({
  label,
  value,
  color,
  glow = false,
}: {
  label: string;
  value: number;
  color: string;
  glow?: boolean;
}) {
  return (
    <View style={sc.cell}>
      <Text
        style={[sc.value, { color }, glow && sc.glowText]}
      >
        {value}
      </Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  cell: { alignItems: 'center', flex: 1 },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    letterSpacing: -0.5,
  },
  glowText: {
    textShadowColor: Colors.primary,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 1,
  },
});

/** 选项按钮 */
function OptionButton({
  label,
  state,
  onPress,
}: {
  label: string;
  state: OptionState;
  onPress: () => void;
}) {
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';

  return (
    <TouchableOpacity
      style={[
        ob.btn,
        isCorrect && ob.btnCorrect,
        isWrong && ob.btnWrong,
      ]}
      onPress={onPress}
      disabled={state !== 'idle'}
      activeOpacity={0.7}
    >
      <Text
        style={[
          ob.text,
          isCorrect && ob.textCorrect,
          isWrong && ob.textWrong,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {label}
        {isCorrect ? ' ✓' : isWrong ? ' ✗' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const ob = StyleSheet.create({
  btn: {
    width: OPT_W,
    minHeight: 60,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  btnCorrect: {
    backgroundColor: 'rgba(46,204,113,0.22)',
    borderColor: Colors.green,
  },
  btnWrong: {
    backgroundColor: 'rgba(231,76,60,0.18)',
    borderColor: Colors.red,
  },
  text: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 20,
  },
  textCorrect: { color: Colors.green },
  textWrong:   { color: '#FF6B6B'   },
});

/** 结果弹窗单行数据 */
function ModalRow({
  label,
  value,
  accent = false,
  badge,
}: {
  label: string;
  value: string;
  accent?: boolean;
  badge?: string;
}) {
  return (
    <View style={mr.row}>
      <Text style={mr.label}>{label}</Text>
      <View style={mr.right}>
        {badge && (
          <View style={mr.badge}>
            <Text style={mr.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={[mr.value, accent && mr.valueAccent]}>{value}</Text>
      </View>
    </View>
  );
}

const mr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  label:  { fontSize: FontSize.base, color: 'rgba(255,255,255,0.55)' },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  valueAccent: { color: GOLD, fontSize: FontSize.lg, fontWeight: FontWeight.black },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white },
});

// ── 主游戏组件 ────────────────────────────────────────────────────────────────

interface GameProps extends ChallengeScreenProps {
  onReplay: () => void;
}

function Game({ navigation, onReplay }: GameProps) {
  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  // ── 游戏状态 ──────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState<GamePhase>('playing');
  const [timeLeft,     setTimeLeft]     = useState(TOTAL_SECONDS);
  const [score,        setScore]        = useState(0);
  const [combo,        setCombo]        = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [qIndex,       setQIndex]       = useState(0);
  const [optStates,    setOptStates]    = useState<OptionState[]>(['idle', 'idle', 'idle', 'idle']);

  // 结果弹窗数据（finish 时快照）
  const [finalScore,    setFinalScore]    = useState(0);
  const [isNewRecord,   setIsNewRecord]   = useState(false);

  // ── Refs（用于 closure 内读取最新值）─────────────────────────────────────
  const timerRef   = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const phaseRef   = useRef<GamePhase>('playing');
  const scoreRef   = useRef(0);
  const comboRef   = useRef(0);   // 避免 handleSelect 内连击值陈旧

  // 保持 refs 与 state 同步
  useEffect(() => { phaseRef.current = phase;  }, [phase]);
  useEffect(() => { scoreRef.current = score;  }, [score]);

  // ── 闪光动画 Animated.Value（useNativeDriver，JS 线程零开销）─────────────
  const greenOpacity = useRef(new Animated.Value(0)).current;
  const redOpacity   = useRef(new Animated.Value(0)).current;

  // ── 词库（整局不变，挂载时一次性洗牌）───────────────────────────────────
  const wordPool   = useMemo(() => shuffleArray(naturalWords), []);
  const currentWord = wordPool[qIndex % wordPool.length];
  const options    = useMemo(
    () => generateOptions(wordPool[qIndex % wordPool.length], wordPool),
    [qIndex], // wordPool stable，不需列入
  );

  // ── 倒计时：useRef 保存 interval ID，setTimeLeft 用回调形式防闭包陈旧 ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (phaseRef.current === 'finished') return; // 已结束则空转
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // 仅 mount 时启动一次

  // 时间归零 → 触发结束（Effect 保证在 render 后执行，不在 timer callback 内直接 setState 以外的逻辑）
  useEffect(() => {
    if (timeLeft === 0) handleFinish();
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 游戏结束 ──────────────────────────────────────────────────────────────
  const handleFinish = useCallback(() => {
    if (phaseRef.current === 'finished') return; // 幂等
    clearInterval(timerRef.current);
    phaseRef.current = 'finished';

    const pts     = scoreRef.current;
    const newBest = tryUpdateHighScore(pts);
    setFinalScore(pts);
    setIsNewRecord(newBest);
    setPhase('finished');
  }, []);

  // ── 选项点击 ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (idx: number) => {
      if (phaseRef.current !== 'playing') return; // 已答题或已结束
      phaseRef.current = 'revealing';
      setPhase('revealing');

      const isCorrect = options[idx].isCorrect;

      // 高亮所有选项（答错时同时亮出正确答案）
      setOptStates(
        options.map((o, i) => {
          if (i === idx) return isCorrect ? 'correct' : 'wrong';
          if (o.isCorrect) return 'correct';
          return 'idle';
        }),
      );

      // 艾宾浩斯记录
      markReviewed(currentWord.id, isCorrect);

      if (isCorrect) {
        // ── 答对 ──
        comboRef.current += 1;
        setCombo(comboRef.current);
        setCorrectCount((c) => c + 1);

        const pts = Math.round(
          PTS_BASE * (comboRef.current >= COMBO_BONUS_AT ? 1.5 : 1),
        );
        setScore((s) => s + pts);
        addPoints(pts);

        // 全屏闪绿
        Animated.sequence([
          Animated.timing(greenOpacity, { toValue: 0.28, duration: 80,  useNativeDriver: true }),
          Animated.timing(greenOpacity, { toValue: 0,    duration: DELAY_CORRECT - 80, useNativeDriver: true }),
        ]).start();
      } else {
        // ── 答错 ──
        comboRef.current = 0;
        setCombo(0);

        // 全屏闪红
        Animated.sequence([
          Animated.timing(redOpacity, { toValue: 0.28, duration: 80,  useNativeDriver: true }),
          Animated.timing(redOpacity, { toValue: 0,    duration: DELAY_WRONG - 80, useNativeDriver: true }),
        ]).start();
      }

      // 延迟进入下一题
      const delay = isCorrect ? DELAY_CORRECT : DELAY_WRONG;
      setTimeout(() => {
        if (phaseRef.current === 'finished') return;
        setQIndex((i) => i + 1);
        setOptStates(['idle', 'idle', 'idle', 'idle']);
        setPhase('playing');
        phaseRef.current = 'playing';
      }, delay);
    },
    [options, currentWord, greenOpacity, redOpacity],
  );

  // ── 计时器显示颜色：≤10 秒变红提示 ──────────────────────────────────────
  const timerColor = timeLeft <= 10 ? Colors.red : GOLD;

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.darkBg} translucent />

      {/* 全屏绿/红闪光叠层（pointer-events: none，不拦截触摸） */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: greenOpacity, backgroundColor: Colors.green }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: redOpacity, backgroundColor: Colors.red }]}
        pointerEvents="none"
      />

      {/* ── 1. 顶部：关卡名 / 倒计时 ───────────────────────────── */}
      <View style={[styles.header, { paddingTop: safeTop }]}>
        <View>
          <Text style={styles.levelName}>⚡ 闪电闯关</Text>
          <Text style={styles.levelSub}>
            {currentWord.theme} · 第 {Math.floor(qIndex / wordPool.length) + 1} 轮
          </Text>
        </View>
        <View style={[styles.timerBox, { borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>
            {String(Math.floor(timeLeft / 60)).padStart(1, '0')}
            :{String(timeLeft % 60).padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* ── 2. 数据行：答对 / 连击 / 分数 ──────────────────────── */}
      <View style={styles.scoreRow}>
        <ScoreCell label="答对" value={correctCount} color={GOLD} />
        <View style={styles.scoreDivider} />
        <ScoreCell
          label="连击"
          value={combo}
          color={combo >= COMBO_BONUS_AT ? Colors.primary : Colors.white}
          glow={combo >= COMBO_BONUS_AT}
        />
        <View style={styles.scoreDivider} />
        <ScoreCell label="分数" value={score} color={Colors.white} />
      </View>

      {/* ── 3. 单词图片（180px，圆角16） ────────────────────────── */}
      <View style={styles.wordImageWrap}>
        {currentWord.imageUrl ? (
          <Image
            source={{ uri: currentWord.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.emojiBg]}>
            <Text style={styles.emojiText}>{currentWord.emojiBackup}</Text>
          </View>
        )}
        {/* 底部渐变遮罩 */}
        <View style={styles.imageVignette} pointerEvents="none" />
      </View>

      {/* ── 4. 英文单词（白色 36px 900） ────────────────────────── */}
      <Text style={styles.wordEn}>{currentWord.en}</Text>

      {/* ── 5. 2×2 选项网格 ─────────────────────────────────────── */}
      <View style={styles.optGrid}>
        {options.map((opt, i) => (
          <OptionButton
            key={i}
            label={opt.text}
            state={optStates[i]}
            onPress={() => handleSelect(i)}
          />
        ))}
      </View>

      {/* ── 6. 底部：历史最高分 ──────────────────────────────────── */}
      <Text style={[styles.bestHint, { paddingBottom: (insets.bottom || 8) + 4 }]}>
        🏆 历史最高分：{getHighScore()} 分
      </Text>

      {/* ── 7. 结果弹窗 ─────────────────────────────────────────── */}
      <Modal
        visible={phase === 'finished'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => navigation.goBack()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* 头部 */}
            <Text style={styles.modalHeroEmoji}>
              {isNewRecord ? '🎉' : '🏆'}
            </Text>
            <Text style={styles.modalTitle}>挑战结束！</Text>
            {isNewRecord && (
              <View style={styles.newRecordBadge}>
                <Text style={styles.newRecordText}>✨ 新纪录</Text>
              </View>
            )}

            {/* 统计数据 */}
            <View style={styles.modalStats}>
              <ModalRow label="本次得分" value={`${finalScore} 分`} accent />
              <ModalRow label="答对题数" value={`${correctCount} 题`} />
              <ModalRow
                label="历史最高"
                value={`${getHighScore()} 分`}
                badge={isNewRecord ? '🆕 刚刚刷新' : undefined}
              />
            </View>

            {/* 按钮区 */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => navigation.goBack()}
                activeOpacity={0.75}
              >
                <Text style={styles.modalBtnSecondaryText}>返回首页</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={onReplay}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnPrimaryText}>🔄 再来一局</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── 导出：外层持有 gameKey，重玩时递增 key → Game 完整重挂载 ──────────────────

export default function ChallengeScreen(props: ChallengeScreenProps) {
  const [gameKey, setGameKey] = useState(0);
  return (
    <Game
      key={gameKey}
      {...props}
      onReplay={() => setGameKey((k) => k + 1)}
    />
  );
}

// ── 样式 ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // ── 顶部 ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  levelName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  levelSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  timerBox: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 74,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  timerText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },

  // ── 分数行 ──
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  scoreDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── 单词图片 ──
  wordImageWrap: {
    marginHorizontal: 16,
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.darkCard,
    ...Shadow.lg,
  },
  emojiBg: {
    backgroundColor: Colors.darkCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 88,
  },
  imageVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
    // 简化渐变遮罩（无 expo-linear-gradient）
    opacity: 0.55,
  },

  // ── 英文单词 ──
  wordEn: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    letterSpacing: -1.5,
  },

  // ── 选项网格 ──
  optGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
  },

  // ── 底部提示 ──
  bestHint: {
    textAlign: 'center',
    paddingTop: 12,
    color: 'rgba(255,255,255,0.28)',
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
  },

  // ── 结果弹窗 ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E1E32',
    borderRadius: Radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.lg,
    alignItems: 'center',
  },
  modalHeroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.white,
    marginBottom: 8,
  },
  newRecordBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  newRecordText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  modalStats: {
    width: '100%',
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.7)',
  },
  modalBtnPrimary: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    ...Shadow.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
  },
  modalBtnPrimaryText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
