/**
 * 图片搜索九宫格（Screen 03）
 * 支持单选高亮（橙色边框 + 勾选角标）
 */
import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/theme';
import type { ImageResult } from '../services/imageService';

const COLS = 3;
const GAP = 3;
const CELL = (Dimensions.get('window').width - GAP * (COLS + 1)) / COLS;

interface Props {
  images: ImageResult[];
  loading?: boolean;
  onSelect: (image: ImageResult) => void;
}

export default function ImageGrid({ images, loading, onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePress = (img: ImageResult) => {
    setSelectedId(img.id);
    onSelect(img);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={images}
      numColumns={COLS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <TouchableOpacity
            style={[styles.cell, selected && styles.selectedCell]}
            onPress={() => handlePress(item)}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: item.url_thumb }}
              style={styles.cellImage}
              resizeMode="cover"
            />
            {selected && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
            <View style={styles.overlay}>
              <Text style={styles.overlayText} numberOfLines={1}>
                {item.alt_description}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: { padding: GAP },
  row: { gap: GAP, marginBottom: GAP },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cell: {
    width: CELL,
    height: CELL,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
    borderRadius: 4,
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  cellImage: { width: '100%', height: '100%' },
  checkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: Colors.white, fontSize: 10, fontWeight: '900' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
});
