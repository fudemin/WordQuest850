/**
 * 选择题选项（第1关 / 第4关 / 限时闯关）
 * state: idle | correct | wrong
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';

type OptionState = 'idle' | 'correct' | 'wrong';

interface Props {
  label: string;
  state?: OptionState;
  onPress?: () => void;
  dark?: boolean; // 限时闯关深色主题
}

export default function QuizOption({
  label,
  state = 'idle',
  onPress,
  dark = false,
}: Props) {
  const containerStyle = [
    styles.base,
    dark && styles.darkBase,
    state === 'correct' && (dark ? styles.darkCorrect : styles.correct),
    state === 'wrong' && (dark ? styles.darkWrong : styles.wrong),
  ];

  const textStyle = [
    styles.text,
    dark && styles.darkText,
    state === 'correct' && styles.correctText,
    state === 'wrong' && styles.wrongText,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={state !== 'idle'}
    >
      <Text style={textStyle}>
        {label}
        {state === 'correct' ? ' ✓' : state === 'wrong' ? ' ✗' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    padding: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  darkBase: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  correct: { borderColor: Colors.green, backgroundColor: Colors.greenBg },
  wrong: { borderColor: Colors.red, backgroundColor: Colors.redBg },
  darkCorrect: {
    backgroundColor: 'rgba(46,204,113,0.25)',
    borderColor: Colors.green,
  },
  darkWrong: {
    backgroundColor: 'rgba(231,76,60,0.2)',
    borderColor: Colors.red,
  },
  text: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 20,
  },
  darkText: { color: 'rgba(255,255,255,0.9)' },
  correctText: { color: Colors.green },
  wrongText: { color: Colors.red },
});
