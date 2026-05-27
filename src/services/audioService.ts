/**
 * 音频播放服务（expo-av）
 *
 * 策略：优先播放本地预录 MP3（/assets/audio/<wordId>.mp3），
 *       如果不存在，回退到在线 TTS（此处预留接口）。
 */

import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

/**
 * 播放单词发音
 * @param wordId  词库 ID，对应 assets/audio/<wordId>.mp3
 * @param ttsUrl  可选 TTS URL（在线备用）
 */
export async function playWord(wordId: string, ttsUrl?: string): Promise<void> {
  // 停止上一个
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

  try {
    // 尝试本地音频（打包时放入 assets/audio/）
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const localAsset = getLocalAsset(wordId);
    const { sound } = await Audio.Sound.createAsync(localAsset);
    currentSound = sound;
  } catch {
    // 降级到 TTS URL
    if (ttsUrl) {
      const { sound } = await Audio.Sound.createAsync({ uri: ttsUrl });
      currentSound = sound;
    } else {
      return;
    }
  }

  await currentSound.playAsync();
}

export async function stopAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
}

/**
 * 返回本地音频 require 路径
 * 由于 React Native 的 require() 必须是静态字符串，
 * 实际项目中需用 codegen 脚本生成静态映射表。
 * 此处先用 map 示意。
 */
const audioMap: Record<string, ReturnType<typeof require>> = {
  // w001: require('../../assets/audio/w001.mp3'),
  // 其余词条由 codegen 脚本自动填充
};

function getLocalAsset(wordId: string) {
  const asset = audioMap[wordId];
  if (!asset) throw new Error(`No local audio for ${wordId}`);
  return asset;
}
