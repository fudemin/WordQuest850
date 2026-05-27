/**
 * 图片搜索服务
 *
 * 环境变量配置（.env 文件，需 EXPO_PUBLIC_ 前缀才能在客户端 bundle 中可见）：
 *   EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_key
 *   EXPO_PUBLIC_PIXABAY_API_KEY=your_key
 *
 * 如果使用旧式 app.config.js extra 方案，把 EXPO_PUBLIC_ 改为从 expo-constants 读取即可。
 */

import axios, { AxiosError } from 'axios';
import type { Word } from '../data/words';
import { storage } from '../store/mmkv';

// ── API Keys ─────────────────────────────────────────────────────────────────
// Expo SDK 49+ 会在构建时将 EXPO_PUBLIC_* 变量注入到 process.env
const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ?? '';
const PIXABAY_API_KEY = process.env.EXPO_PUBLIC_PIXABAY_API_KEY ?? '';

// ── 类型 ──────────────────────────────────────────────────────────────────────
export interface ImageResult {
  /** 来源平台前缀 + 原始 ID，e.g. "unsplash-abc123" */
  id: string;
  /** 缩略图 URL（搜索九宫格展示，~400px） */
  url_thumb: string;
  /** 全尺寸 URL（单词卡大图，~1080px） */
  url_full: string;
  /** 图片描述文字 */
  alt_description: string;
}

// MMKV key 格式
const IMG_CACHE_KEY = (wordId: string) => `word_img_${wordId}`;

// ── 1. searchImages ───────────────────────────────────────────────────────────
/**
 * 搜索图片，默认调用 Unsplash；Unsplash 失败时自动降级到 Pixabay。
 *
 * @param keyword  搜索关键词（建议传英文单词）
 * @param page     分页页码，默认 1
 * @returns        最多 9 条结果，失败时返回空数组
 */
export async function searchImages(
  keyword: string,
  page = 1,
): Promise<ImageResult[]> {
  try {
    return await _searchUnsplash(keyword, page);
  } catch (err) {
    const e = err as AxiosError;
    // 401 = key 无效；429 = 超出限额 → 降级 Pixabay
    if (e.response?.status === 401 || e.response?.status === 429 || !e.response) {
      return searchPixabay(keyword);
    }
    return [];
  }
}

// 内部实现，供 searchImages 调用
async function _searchUnsplash(keyword: string, page: number): Promise<ImageResult[]> {
  if (!UNSPLASH_ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY 未配置');

  const { data } = await axios.get<UnsplashSearchResponse>(
    'https://api.unsplash.com/search/photos',
    {
      params: {
        query: keyword,
        per_page: 9,
        page,
        orientation: 'squarish',
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
      timeout: 8000,
    },
  );

  return data.results.map((item) => ({
    id: `unsplash-${item.id}`,
    url_thumb: item.urls.small,
    url_full: item.urls.regular,
    alt_description: item.alt_description ?? keyword,
  }));
}

// ── 2. searchPixabay ──────────────────────────────────────────────────────────
/**
 * Pixabay 备用图源，返回格式与 searchImages 完全一致。
 *
 * @param keyword  搜索关键词
 * @returns        最多 9 条结果，失败时返回空数组
 */
export async function searchPixabay(keyword: string): Promise<ImageResult[]> {
  if (!PIXABAY_API_KEY) return [];

  try {
    const { data } = await axios.get<PixabaySearchResponse>(
      'https://pixabay.com/api/',
      {
        params: {
          key: PIXABAY_API_KEY,
          q: keyword,
          per_page: 9,
          image_type: 'photo',
          safesearch: true,
        },
        timeout: 8000,
      },
    );

    return data.hits.map((item) => ({
      id: `pixabay-${item.id}`,
      url_thumb: item.webformatURL,
      url_full: item.largeImageURL,
      alt_description: item.tags,
    }));
  } catch {
    return [];
  }
}

// ── 3. cacheImage ─────────────────────────────────────────────────────────────
/**
 * 将图片 URL 持久化到 MMKV，key 格式：word_img_{wordId}
 *
 * @param wordId    词库 ID，e.g. "w101"
 * @param imageUrl  要缓存的图片 URL（可以是 CDN URL 或本地 file:// URI）
 */
export function cacheImage(wordId: string, imageUrl: string): void {
  storage.set(IMG_CACHE_KEY(wordId), imageUrl);
}

/**
 * 读取已缓存的图片 URL，无缓存时返回 undefined
 */
export function getCachedImage(wordId: string): string | undefined {
  return storage.getString(IMG_CACHE_KEY(wordId)) ?? undefined;
}

/**
 * 清除指定单词的图片缓存
 */
export function clearCachedImage(wordId: string): void {
  storage.remove(IMG_CACHE_KEY(wordId));
}

// ── 4. getWordImage ───────────────────────────────────────────────────────────
/**
 * 获取单词图片，三层优先级：
 *   1. MMKV 缓存（用户已选或上次命中的 URL）
 *   2. Word.imageUrl（CDN 预置图片）
 *   3. Unsplash 实时搜索，命中后自动写入缓存
 *   4. 全部失败 → 返回 null，调用方降级使用 word.emojiBackup
 *
 * @param word  词库 Word 对象
 * @returns     图片 URL 字符串，或 null（降级场景）
 */
export async function getWordImage(word: Word): Promise<string | null> {
  // 1. 读 MMKV 缓存
  const cached = getCachedImage(word.id);
  if (cached) return cached;

  // 2. 使用词库预置 CDN 图片
  if (word.imageUrl) {
    cacheImage(word.id, word.imageUrl); // 写入缓存，下次直接命中
    return word.imageUrl;
  }

  // 3. 实时 Unsplash 搜索
  try {
    const results = await _searchUnsplash(word.en, 1);
    if (results.length > 0) {
      const url = results[0].url_full;
      cacheImage(word.id, url); // 自动缓存第一条结果
      return url;
    }
  } catch {
    // 搜索失败不抛出，继续降级
  }

  // 4. 降级：前端使用 word.emojiBackup
  return null;
}

// ── API 响应类型（仅声明用到的字段）────────────────────────────────────────────
interface UnsplashSearchResponse {
  results: Array<{
    id: string;
    alt_description: string | null;
    urls: { small: string; regular: string };
  }>;
}

interface PixabaySearchResponse {
  hits: Array<{
    id: number;
    tags: string;
    webformatURL: string;
    largeImageURL: string;
  }>;
}
