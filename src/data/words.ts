/**
 * 词库类型定义 + 种子数据
 *
 * 完整 850 词通过 OTA 热更新下发，此处提供"自然环境"主题 20 个种子词。
 */

// ── 类型定义 ─────────────────────────────────────────────────────────────────

export type PartOfSpeech = 'n' | 'v' | 'adj' | 'adv' | 'prep' | 'conj';

export interface Word {
  /** 词库唯一 ID，格式 "w001"–"w850" */
  id: string;
  /** 英文单词 */
  en: string;
  /** 中文释义 */
  cn: string;
  /** 音标，e.g. "/ˈoʊʃn/" */
  phonetic: string;
  /** 词性 */
  partOfSpeech: PartOfSpeech;
  /** 例句（目标词用 **word** 包裹，便于组件高亮渲染） */
  example: string;
  /** 图片 URL（CDN 预置，可选；无则降级 emojiBackup） */
  imageUrl?: string;
  /** 无图降级 Emoji */
  emojiBackup: string;
  /** 发音音频 URL（TTS 或预录 MP3，可选） */
  audioUrl?: string;
  /** 所属关卡编号 1–85（17 主题 × 5 小关） */
  level: number;
  /** 主题分类名 */
  theme: string;
}

// ── 自然环境主题 — 20 个种子词（level 11–15，对应第3大关）────────────────────

export const naturalWords: Word[] = [
  {
    id: 'w101',
    en: 'ocean',
    cn: '海洋；大量',
    phonetic: '/ˈoʊʃn/',
    partOfSpeech: 'n',
    example: 'The **ocean** covers more than 70% of the Earth.',
    emojiBackup: '🌊',
    level: 11,
    theme: '自然环境',
  },
  {
    id: 'w102',
    en: 'forest',
    cn: '森林',
    phonetic: '/ˈfɔːrɪst/',
    partOfSpeech: 'n',
    example: 'Many rare animals live deep in the **forest**.',
    emojiBackup: '🌲',
    level: 11,
    theme: '自然环境',
  },
  {
    id: 'w103',
    en: 'mountain',
    cn: '山；山脉',
    phonetic: '/ˈmaʊntən/',
    partOfSpeech: 'n',
    example: 'We reached the top of the **mountain** at noon.',
    emojiBackup: '⛰️',
    level: 11,
    theme: '自然环境',
  },
  {
    id: 'w104',
    en: 'river',
    cn: '河流',
    phonetic: '/ˈrɪvər/',
    partOfSpeech: 'n',
    example: 'The **river** flows quietly through the valley.',
    emojiBackup: '🏞️',
    level: 11,
    theme: '自然环境',
  },
  {
    id: 'w105',
    en: 'desert',
    cn: '沙漠',
    phonetic: '/ˈdezərt/',
    partOfSpeech: 'n',
    example: 'It almost never rains in the **desert**.',
    emojiBackup: '🏜️',
    level: 11,
    theme: '自然环境',
  },
  {
    id: 'w106',
    en: 'sky',
    cn: '天空',
    phonetic: '/skaɪ/',
    partOfSpeech: 'n',
    example: 'The **sky** turned orange and pink at sunset.',
    emojiBackup: '🌤️',
    level: 12,
    theme: '自然环境',
  },
  {
    id: 'w107',
    en: 'cloud',
    cn: '云；云朵',
    phonetic: '/klaʊd/',
    partOfSpeech: 'n',
    example: 'A dark **cloud** appeared over the hills.',
    emojiBackup: '☁️',
    level: 12,
    theme: '自然环境',
  },
  {
    id: 'w108',
    en: 'sun',
    cn: '太阳；阳光',
    phonetic: '/sʌn/',
    partOfSpeech: 'n',
    example: 'The **sun** rises in the east every morning.',
    emojiBackup: '☀️',
    level: 12,
    theme: '自然环境',
  },
  {
    id: 'w109',
    en: 'rain',
    cn: '雨；下雨',
    phonetic: '/reɪn/',
    partOfSpeech: 'n',
    example: 'The **rain** washed the dust off the streets.',
    emojiBackup: '🌧️',
    level: 12,
    theme: '自然环境',
  },
  {
    id: 'w110',
    en: 'tree',
    cn: '树；树木',
    phonetic: '/triː/',
    partOfSpeech: 'n',
    example: 'The old **tree** in the yard gives us shade in summer.',
    emojiBackup: '🌳',
    level: 12,
    theme: '自然环境',
  },
  {
    id: 'w111',
    en: 'wind',
    cn: '风',
    phonetic: '/wɪnd/',
    partOfSpeech: 'n',
    example: 'A cold **wind** blew from the north.',
    emojiBackup: '🌬️',
    level: 13,
    theme: '自然环境',
  },
  {
    id: 'w112',
    en: 'stone',
    cn: '石头；岩石',
    phonetic: '/stoʊn/',
    partOfSpeech: 'n',
    example: 'She picked up a smooth **stone** from the riverbank.',
    emojiBackup: '🪨',
    level: 13,
    theme: '自然环境',
  },
  {
    id: 'w113',
    en: 'flower',
    cn: '花；开花',
    phonetic: '/ˈflaʊər/',
    partOfSpeech: 'n',
    example: 'She gave him a beautiful **flower** she found in the garden.',
    emojiBackup: '🌸',
    level: 13,
    theme: '自然环境',
  },
  {
    id: 'w114',
    en: 'grass',
    cn: '草；草地',
    phonetic: '/ɡræs/',
    partOfSpeech: 'n',
    example: 'The children played on the green **grass**.',
    emojiBackup: '🌿',
    level: 13,
    theme: '自然环境',
  },
  {
    id: 'w115',
    en: 'lake',
    cn: '湖；湖泊',
    phonetic: '/leɪk/',
    partOfSpeech: 'n',
    example: 'We went swimming in the cool **lake**.',
    emojiBackup: '🏔️',
    level: 13,
    theme: '自然环境',
  },
  {
    id: 'w116',
    en: 'island',
    cn: '岛屿；小岛',
    phonetic: '/ˈaɪlənd/',
    partOfSpeech: 'n',
    example: 'The small **island** is surrounded by clear blue water.',
    emojiBackup: '🏝️',
    level: 14,
    theme: '自然环境',
  },
  {
    id: 'w117',
    en: 'valley',
    cn: '山谷；流域',
    phonetic: '/ˈvæli/',
    partOfSpeech: 'n',
    example: 'The village is hidden in a quiet **valley**.',
    emojiBackup: '🏕️',
    level: 14,
    theme: '自然环境',
  },
  {
    id: 'w118',
    en: 'snow',
    cn: '雪；下雪',
    phonetic: '/snoʊ/',
    partOfSpeech: 'n',
    example: 'The children played in the **snow** all afternoon.',
    emojiBackup: '❄️',
    level: 14,
    theme: '自然环境',
  },
  {
    id: 'w119',
    en: 'soil',
    cn: '土壤；土地',
    phonetic: '/sɔɪl/',
    partOfSpeech: 'n',
    example: 'Farmers need healthy **soil** to grow good crops.',
    emojiBackup: '🌱',
    level: 14,
    theme: '自然环境',
  },
  {
    id: 'w120',
    en: 'coast',
    cn: '海岸；沿海地区',
    phonetic: '/koʊst/',
    partOfSpeech: 'n',
    example: 'They drove along the **coast** and watched the waves.',
    emojiBackup: '🏖️',
    level: 15,
    theme: '自然环境',
  },
];

// 向后兼容旧字段名（供旧组件过渡期使用）
export const sampleWords = naturalWords.map((w) => ({
  ...w,
  wordClass: `${w.partOfSpeech}.` as `${PartOfSpeech}.`,
  emoji: w.emojiBackup,
  groupId: 3,
  exampleCn: '',       // 待补充中文翻译
}));

// 17 个主题大关元数据
export const wordGroups = [
  { id: 1,  name: '基础名词', icon: '📦', totalWords: 50 },
  { id: 2,  name: '日常动词', icon: '🎯', totalWords: 50 },
  { id: 3,  name: '自然环境', icon: '🌊', totalWords: 50 },
  { id: 4,  name: '人物描述', icon: '👤', totalWords: 50 },
  { id: 5,  name: '日常行为', icon: '🏃', totalWords: 50 },
  { id: 6,  name: '时间地点', icon: '🕐', totalWords: 50 },
  { id: 7,  name: '情感表达', icon: '❤️', totalWords: 50 },
  { id: 8,  name: '饮食购物', icon: '🍎', totalWords: 50 },
  { id: 9,  name: '交通出行', icon: '🚗', totalWords: 50 },
  { id: 10, name: '家庭住所', icon: '🏠', totalWords: 50 },
  { id: 11, name: '学校教育', icon: '📚', totalWords: 50 },
  { id: 12, name: '工作职业', icon: '💼', totalWords: 50 },
  { id: 13, name: '身体健康', icon: '💪', totalWords: 50 },
  { id: 14, name: '科技数字', icon: '💻', totalWords: 50 },
  { id: 15, name: '艺术文化', icon: '🎨', totalWords: 50 },
  { id: 16, name: '社会生活', icon: '🌍', totalWords: 50 },
  { id: 17, name: '进阶表达', icon: '🚀', totalWords: 50 },
];
