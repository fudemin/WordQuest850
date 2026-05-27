/**
 * ImagePickerScreen — 图片搜索与选择
 *
 * 路由参数：{ wordId, wordEn }
 * 确认后：cacheImage(wordId, url) → navigation.goBack()
 * 调用方通过 useFocusEffect + getCachedImage(wordId) 读取返回值。
 *
 * Emoji 存储格式：'emoji:🌊'（前缀 emoji:，供词卡层识别渲染）。
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ExpoImagePicker from 'expo-image-picker';

import { Colors, Radius, Shadow } from '../constants/theme';
import { FontSize, FontWeight } from '../constants/typography';
import {
  searchImages,
  searchPixabay,
  cacheImage,
  type ImageResult,
} from '../services/imageService';
import type { ImagePickerScreenProps } from '../navigation/types';

// ── 常量 ──────────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = 3;
const GRID_GAP = 3;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_GAP * (GRID_COLS + 1)) / GRID_COLS);

/**
 * 30个常用自然/物品 Emoji（Emoji Tab 备用图源，无需网络）
 */
const EMOJI_LIST: string[] = [
  '🌊', '🌲', '⛰️', '🌧️', '☀️', '❄️', '🌸', '🌿', '🏖️', '🌺',
  '🐋', '🦁', '🐘', '🦋', '🐠', '🌙', '⭐', '🌈', '🍎', '🏠',
  '🚗', '✈️', '📚', '💡', '🎵', '❤️', '🔥', '💧', '🌍', '🎨',
];

// ── 类型 ──────────────────────────────────────────────────────────────────────

type TabKey = 'unsplash' | 'pixabay' | 'emoji' | 'album';

/**
 * 统一网格数据项，Emoji 和网络图片共享同一 FlatList。
 */
type GridItem =
  | { kind: 'image'; data: ImageResult }
  | { kind: 'emoji'; char: string };

interface NetState {
  results: ImageResult[];
  loading: boolean;
  error: string | null;
}

const NET_INIT: NetState = { results: [], loading: false, error: null };

const TABS: { key: TabKey; label: string }[] = [
  { key: 'unsplash', label: 'Unsplash' },
  { key: 'pixabay',  label: 'Pixabay'  },
  { key: 'emoji',    label: 'Emoji'    },
  { key: 'album',    label: '相册'     },
];

// ── 组件 ──────────────────────────────────────────────────────────────────────

export default function ImagePickerScreen({
  route,
  navigation,
}: ImagePickerScreenProps) {
  const { wordId, wordEn } = route.params;
  const insets = useSafeAreaInsets();

  // ── 搜索栏 ──
  const [query, setQuery] = useState(wordEn);
  const inputRef = useRef<TextInput>(null);

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<TabKey>('unsplash');

  // ── 网络请求状态（Unsplash / Pixabay 共用，切 Tab 时替换） ──
  const [netState, setNetState] = useState<NetState>(NET_INIT);

  /**
   * 每个网络 Tab 的结果缓存。
   * key = tabKey，避免切换 Tab 时重复请求同一关键词。
   */
  const tabCacheRef = useRef<Partial<Record<TabKey, ImageResult[]>>>({});

  // ── 选中项 ──
  const [selectedId, setSelectedId]   = useState<string | null>(null); // 高亮用
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null); // 存储用

  // ── 初始加载 Unsplash ──────────────────────────────────────────────────────
  useEffect(() => {
    doSearch('unsplash', wordEn);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 搜索逻辑 ──────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (tab: TabKey, keyword: string) => {
    if (tab === 'emoji' || tab === 'album') return;

    // 命中缓存直接展示
    const cached = tabCacheRef.current[tab];
    if (cached) {
      setNetState({ results: cached, loading: false, error: null });
      return;
    }

    setNetState({ results: [], loading: true, error: null });
    try {
      const results =
        tab === 'unsplash'
          ? await searchImages(keyword)    // Unsplash 优先，失败自动降级 Pixabay
          : await searchPixabay(keyword);  // Pixabay 直接调用

      tabCacheRef.current[tab] = results;
      setNetState({ results, loading: false, error: null });
    } catch (e: any) {
      setNetState({ results: [], loading: false, error: e.message ?? '搜索失败' });
    }
  }, []);

  // ── 切换 Tab ──────────────────────────────────────────────────────────────
  const handleTabPress = useCallback((tab: TabKey) => {
    Keyboard.dismiss();

    if (tab === 'album') {
      handleAlbumPick();
      return; // 不切换 activeTab，保持当前 tab 可见
    }

    // 清空上一次的选中
    setSelectedId(null);
    setSelectedUrl(null);
    setActiveTab(tab);

    if (tab !== 'emoji') {
      // 切换时使用当前 query 重新查；doSearch 内部会命中缓存，不重复请求。
      // 缓存只在关键词变化时（handleSearch）才整体清空，Tab 切换不清。
      doSearch(tab, query);
    }
  }, [query, doSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 手动重新搜索（修改关键词后按回车） ───────────────────────────────────
  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    if (!query.trim()) return;
    // 清空所有 Tab 缓存（关键词变化，旧缓存失效）
    tabCacheRef.current = {};
    if (activeTab !== 'emoji' && activeTab !== 'album') {
      doSearch(activeTab, query.trim());
    }
  }, [query, activeTab, doSearch]);

  // ── 重试 ──────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    tabCacheRef.current[activeTab] = undefined as any;
    doSearch(activeTab, query);
  }, [activeTab, query, doSearch]);

  // ── 相册选图 ──────────────────────────────────────────────────────────────
  const handleAlbumPick = useCallback(async () => {
    const { status } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        '需要相册权限',
        '请前往"设置 → 隐私 → 照片"允许本应用访问相册',
        [{ text: '好的' }],
      );
      return;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],   // expo-image-picker v56 新 API
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      cacheImage(wordId, uri);
      navigation.goBack();
    }
  }, [wordId, navigation]);

  // ── 选中网格项 ────────────────────────────────────────────────────────────
  const handleSelectImage = useCallback((item: GridItem) => {
    if (item.kind === 'image') {
      setSelectedId(item.data.id);
      setSelectedUrl(item.data.url_full);
    } else {
      const emojiUrl = `emoji:${item.char}`;
      setSelectedId(item.char);
      setSelectedUrl(emojiUrl);
    }
  }, []);

  // ── 确认选择 ──────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!selectedUrl) return;
    cacheImage(wordId, selectedUrl);
    navigation.goBack();
  }, [wordId, selectedUrl, navigation]);

  // ── FlatList 数据 ─────────────────────────────────────────────────────────
  const listData = useMemo<GridItem[]>(() => {
    if (activeTab === 'emoji') {
      return EMOJI_LIST.map((char) => ({ kind: 'emoji', char }));
    }
    return netState.results.map((data) => ({ kind: 'image', data }));
  }, [activeTab, netState.results]);

  // ── 渲染单个网格格子 ──────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      const isSelected =
        item.kind === 'image'
          ? item.data.id === selectedId
          : item.char === selectedId;

      return (
        <TouchableOpacity
          style={[styles.cell, isSelected && styles.cellSelected]}
          onPress={() => handleSelectImage(item)}
          activeOpacity={0.75}
        >
          {item.kind === 'image' ? (
            <>
              <Image
                source={{ uri: item.data.url_thumb }}
                style={styles.cellImage}
                resizeMode="cover"
              />
              {/* 底部描述（截断 12 字符） */}
              <View style={styles.cellCaption}>
                <Text style={styles.cellCaptionText} numberOfLines={1}>
                  {item.data.alt_description.slice(0, 12)}
                </Text>
              </View>
            </>
          ) : (
            /* Emoji 格子 */
            <View style={styles.emojiCell}>
              <Text style={styles.emojiChar}>{item.char}</Text>
            </View>
          )}

          {/* 选中徽章 */}
          {isSelected && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkBadgeText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedId, handleSelectImage],
  );

  const keyExtractor = useCallback(
    (item: GridItem) =>
      item.kind === 'image' ? item.data.id : `emoji-${item.char}`,
    [],
  );

  // ── 空/加载/错误 占位区 ───────────────────────────────────────────────────
  const renderListPlaceholder = () => {
    if (activeTab === 'emoji') return null; // emoji 列表不会为空

    if (netState.loading) {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.placeholderText}>搜索中…</Text>
        </View>
      );
    }

    if (netState.error) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>😕</Text>
          <Text style={styles.placeholderText}>{netState.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (netState.results.length === 0) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🔍</Text>
          <Text style={styles.placeholderText}>未找到相关图片</Text>
          <Text style={styles.placeholderSub}>尝试换个关键词</Text>
        </View>
      );
    }

    return null;
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ── 顶部搜索栏 ──────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* 标题行：返回按钮 + 标题 */}
        <View style={styles.headerTitle}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            为 "{wordEn}" 选图
          </Text>
        </View>

        {/* 搜索输入框 */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="输入关键词重新搜索…"
            placeholderTextColor={Colors.gray400}
            returnKeyType="search"
            clearButtonMode="while-editing"  // iOS 原生清除按钮
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* ── Tab 栏 ──────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 网格主区域 ──────────────────────────────────────────── */}
      {renderListPlaceholder() ?? (
        <FlatList<GridItem>
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={GRID_COLS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.gridContent,
            // 底部留出 action bar 高度，防止最后一行被遮挡
            { paddingBottom: 80 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={9}
          maxToRenderPerBatch={9}
          windowSize={3}
        />
      )}

      {/* ── 底部固定操作栏 ───────────────────────────────────────── */}
      <View
        style={[
          styles.actionBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
        ]}
      >
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            !selectedUrl && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedUrl}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>✓ 使用此图片</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 样式 ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },

  // ── 头部 ──
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: 10,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 13,
    color: Colors.gray700,
    fontWeight: FontWeight.bold,
    lineHeight: 16,
  },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.gray900,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.gray900,
    padding: 0,            // 消除 Android 默认 padding
    includeFontPadding: false,
  },

  // ── Tab 栏 ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray400,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },

  // ── 网格 ──
  gridContent: {
    padding: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  // ── 图片格子 ──
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cellSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 4,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.48)',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  cellCaptionText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
  },

  // ── Emoji 格子 ──
  emojiCell: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChar: {
    fontSize: 40,
  },

  // ── 选中徽章 ──
  checkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  checkBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.black,
    lineHeight: 14,
  },

  // ── 占位区（加载/错误/空） ──
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: FontSize.base,
    color: Colors.gray400,
    fontWeight: FontWeight.semibold,
  },
  placeholderSub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },

  // ── 底部操作栏 ──
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    ...Shadow.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.gray700,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.38,
  },
  confirmText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
