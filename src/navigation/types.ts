/**
 * React Navigation 路由参数类型
 * 所有 Screen 的 Props 通过此文件统一推导，避免 any。
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { CompositeScreenProps } from '@react-navigation/native';

// ── Bottom Tab ───────────────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Stats: undefined;
};

// ── Root Stack（全屏页面覆盖 Tab）───────────────────────────────────────────
export type RootStackParamList = {
  MainTabs: undefined;
  Learn: { groupId: number; wordIds: string[] };
  Challenge: { groupId: number };
  ImagePicker: { wordId: string; wordEn: string };
};

// ── 便捷类型别名 ─────────────────────────────────────────────────────────────
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export type StatsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Stats'>,
  StackScreenProps<RootStackParamList>
>;

export type LearnScreenProps = StackScreenProps<RootStackParamList, 'Learn'>;
export type ChallengeScreenProps = StackScreenProps<RootStackParamList, 'Challenge'>;
export type ImagePickerScreenProps = StackScreenProps<RootStackParamList, 'ImagePicker'>;
