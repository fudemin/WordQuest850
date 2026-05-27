# WordQuest 850

> 英语850单词闯关学习 App — React Native + Expo

面向中文零基础学习者的游戏化英语词汇 App。850个核心词按17个主题分组，每组5种闯关模式（选择题 → 拼写 → 配对 → 限时挑战 → AI造句）。

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# iOS 模拟器
npx expo start --ios

# Android 模拟器
npx expo start --android
```

---

## 环境变量配置

项目使用 Unsplash 和 Pixabay 提供单词图片。在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

然后填入你的 API Key：

```env
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
EXPO_PUBLIC_PIXABAY_API_KEY=your_pixabay_api_key_here
```

### 获取 API Key

| 服务 | 注册地址 | 免费额度 |
|------|---------|--------|
| Unsplash | https://unsplash.com/developers | 50次/小时（Demo），审核通过后无限制 |
| Pixabay | https://pixabay.com/api/docs/ | 100次/分钟 |

> **说明**：两个 Key 均为可选。
> - 只配置 Unsplash：正常搜索，限额超出时降级展示 Emoji。
> - 只配置 Pixabay：直接走 Pixabay 图源。
> - 均未配置：图片区自动降级为 Emoji 插图，不影响学习功能。

### 工作原理（三级降级）

```
用户选词 → MMKV缓存命中？→ 是 → 直接显示
                ↓ 否
         Word.imageUrl（CDN预置）→ 有 → 显示并写缓存
                ↓ 无
         Unsplash 实时搜索 → 成功 → 显示并写缓存
                ↓ 失败(401/429/超时)
         Pixabay 备用搜索 → 成功 → 显示并写缓存
                ↓ 失败
         降级：显示 word.emojiBackup 🌊
```

---

## 项目结构

```
src/
  constants/     # 主题色、字体大小
  data/          # 词库类型 + 20个种子词（自然环境主题）
  navigation/    # React Navigation Stack + BottomTab
  screens/       # HomeScreen / LearnScreen / ChallengeScreen / ImagePickerScreen / StatsScreen
  components/    # WordCard / QuizOption / ImageGrid
  services/      # imageService（Unsplash + Pixabay）
  store/         # MMKV 存储封装（学习进度、积分、打卡）
  hooks/         # useAudio
```

---

## 技术栈

- **React Native + Expo SDK 56**（TypeScript 严格模式）
- **react-native-mmkv v4**（本地持久化，NitroModules）
- **React Navigation v7**（Stack + BottomTabs）
- **expo-image-picker v15**（相册选图）
- **expo-av**（发音播放）
- **axios**（网络请求）

---

## 开发规范

- 修改代码后运行类型检查：`npx tsc --noEmit`
- 组件文件 PascalCase，hooks 用 `useXxx`，工具函数 camelCase
- 主色 `#FF6B35`（橙），写在 `src/constants/theme.ts` 的 `Colors.primary`

---

## 许可证

MIT
