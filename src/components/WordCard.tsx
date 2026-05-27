/**
 * WordCard — 单词学习卡片
 *
 * 进场动画：每次 word.id 变化时从屏幕右侧（translateX = screenWidth）
 *           滑入至原位（translateX = 0），duration 300ms，useNativeDriver。
 *
 * 图片区 / 内容区 / 底部按钮三段式布局。
 *
 * 注意：Nunito 字体需在 App.tsx 用 expo-font useFonts 预加载：
 *   { 'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'), ... }
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, Radius, Shadow } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import type { PartOfSpeech, Word } from '../data/words';

// ── 상수 ──────────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;

/** 图片区高度（与 FAB 定位计算强依赖） */
const IMAGE_HEIGHT = 200;

/** FAB 尺寸 */
const FAB_SIZE = 44;

/**
 * Emoji 降级背景色方案，按 word.id 末字符码取余选取，
 * 保证同一单词每次渲染颜色一致且不需要 expo-linear-gradient。
 */
const FALLBACK_BG: string[] = [
  '#D5E8F8', // 蓝
  '#D5F5E3', // 绿
  '#FAE5D3', // 橙
  '#E8DAEF', // 紫
  '#FEF9E7', // 琥珀
  '#FDEDEC', // 红
];

/** 词性中英对照 pill 文字 */
const POS_LABEL: Record<PartOfSpeech, string> = {
  n:    '名词 n.',
  v:    '动词 v.',
  adj:  '形容词 adj.',
  adv:  '副词 adv.',
  prep: '介词 prep.',
  conj: '连词 conj.',
};

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * 根据图片 URL 推断来源标签文字。
 * imageUrl 为 undefined 时（Emoji 降级）返回 "🎨 插图"。
 */
function resolveSourceTag(imageUrl?: string): string {
  if (!imageUrl) return '🎨 插图';
  if (imageUrl.includes('unsplash.com')) return '📸 Unsplash';
  if (imageUrl.includes('pixabay.com')) return '📷 Pixabay';
  return '🖼️ 图片';
}

/**
 * 将例句字符串按 **word** 语法分段，返回 React 元素数组。
 * 奇数段（**包裹内容**）渲染为橙色加粗，偶数段渲染为普通灰色斜体。
 *
 * 使用带捕获组的正则：split(/(\*\*[^*]+\*\*)/) 会把分隔符本身保留在数组里。
 */
function renderHighlightedExample(example: string): React.ReactNode[] {
  return example.split(/(\*\*[^*]+\*\*)/).map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <Text key={i} style={styles.exampleHighlight}>
          {seg.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{seg}</Text>;
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  word: Word;
  /** 点击"知道了 →"回调 */
  onNext: () => void;
  /** 点击音频 FAB 回调 */
  onAudio: () => void;
}

// ── 组件 ──────────────────────────────────────────────────────────────────────

export default function WordCard({ word, onNext, onAudio }: Props) {
  // translateX 起始值为屏幕宽度（卡片在右侧屏幕外），动画到 0（原位）
  const slideX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    // word.id 变化（切词）时重置起点并重新播放进场动画
    slideX.setValue(SCREEN_WIDTH);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true, // translateX 支持 nativeDriver，性能最优
    }).start();
  }, [word.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fallbackBg =
    FALLBACK_BG[word.id.charCodeAt(word.id.length - 1) % FALLBACK_BG.length];
  const sourceTag = resolveSourceTag(word.imageUrl);

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateX: slideX }] }]}
    >
      {/* ── 1. 图片区 ────────────────────────────────────────────── */}
      {/*
       * imageWrap 单独设置 overflow: hidden + borderTopRadius，
       * 这样 card 本身不需要 overflow: hidden，
       * FAB 才能用 absolute 定位跨越图文分界线而不被裁切。
       */}
      <View style={styles.imageWrap}>
        {word.imageUrl ? (
          <Image
            source={{ uri: word.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackBg, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.emojiText}>{word.emojiBackup}</Text>
          </View>
        )}

        {/* 右下角：图片来源标签（毛玻璃效果用半透明背景模拟） */}
        <View style={styles.sourceTag}>
          <Text style={styles.sourceTagText}>{sourceTag}</Text>
        </View>
      </View>

      {/*
       * 音频 FAB：相对于 card 绝对定位，
       * top = IMAGE_HEIGHT - FAB_SIZE / 2，令按钮圆心正好压在图文分界线上。
       * zIndex 保证悬浮在内容区之上。
       */}
      <TouchableOpacity
        style={styles.audioFab}
        onPress={onAudio}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="播放发音"
        accessibilityRole="button"
      >
        <Text style={styles.audioIcon}>🔊</Text>
      </TouchableOpacity>

      {/* ── 2. 内容区 ────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* 英文单词 —— Nunito ExtraBold 32px */}
        <Text style={styles.wordEn} numberOfLines={1} adjustsFontSizeToFit>
          {word.en}
        </Text>

        {/* 音标 */}
        <Text style={styles.phonetic}>{word.phonetic}</Text>

        {/* 词性 pill */}
        <View style={styles.posBadge}>
          <Text style={styles.posBadgeText}>{POS_LABEL[word.partOfSpeech]}</Text>
        </View>

        {/* 中文释义 */}
        <Text style={styles.wordCn}>{word.cn}</Text>

        {/* 例句（斜体，目标词橙色加粗） */}
        <Text style={styles.example}>{renderHighlightedExample(word.example)}</Text>
      </View>

      {/* ── 3. 底部"知道了"按钮 ──────────────────────────────────── */}
      <TouchableOpacity
        style={styles.nextBtn}
        onPress={onNext}
        activeOpacity={0.85}
        accessibilityLabel="已掌握，下一个单词"
        accessibilityRole="button"
      >
        <Text style={styles.nextBtnText}>知道了 →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── 样式 ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── 卡片外壳 ──
  card: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,   // 16
    // overflow: 'hidden' 故意不设，允许 audioFab 溢出图文分界线
    ...Shadow.md,
  },

  // ── 图片区 ──
  imageWrap: {
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: 'hidden',         // 只裁切图片本身的圆角
  },
  emojiText: {
    fontSize: 80,
    textAlign: 'center',
  },
  sourceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sourceTagText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },

  // ── 音频 FAB（压图文分界线） ──
  audioFab: {
    position: 'absolute',
    // 圆心 = IMAGE_HEIGHT，按钮从 IMAGE_HEIGHT - FAB_SIZE/2 开始
    top: IMAGE_HEIGHT - FAB_SIZE / 2,
    left: 16,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Shadow.md,
    // 覆盖 Shadow.md 的 shadowColor 使其更橙
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
  },
  audioIcon: {
    fontSize: 20,
  },

  // ── 内容区 ──
  body: {
    paddingTop: FAB_SIZE / 2 + 10, // 为 FAB 留出空间（22 + 10 = 32）
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  wordEn: {
    fontFamily: 'Nunito',        // 需通过 expo-font 预加载 Nunito-ExtraBold.ttf
    fontSize: FontSize['2xl'],   // 32
    fontWeight: FontWeight.extrabold, // '800'
    color: Colors.gray900,
    letterSpacing: -1,
  },
  phonetic: {
    fontSize: FontSize.base,     // 13 ≈ spec 的 13px
    color: Colors.gray400,
    marginTop: 3,
    marginBottom: 8,
  },
  posBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.blueBg,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 10,
  },
  posBadgeText: {
    fontSize: FontSize.xs,       // 10
    fontWeight: FontWeight.bold,
    color: Colors.blue,
  },
  wordCn: {
    fontSize: FontSize.lg,       // 20
    fontWeight: FontWeight.bold, // '700'
    color: Colors.gray900,
    marginBottom: 8,
  },
  example: {
    fontSize: 13,
    color: Colors.gray400,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  exampleHighlight: {
    color: Colors.primary,
    fontStyle: 'normal',
    fontWeight: FontWeight.bold,
  },

  // ── 底部按钮 ──
  nextBtn: {
    margin: 16,
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    // 底部两角与卡片等弧度
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,       // 16
    fontWeight: FontWeight.bold, // '700'
    letterSpacing: 0.5,
  },
});
