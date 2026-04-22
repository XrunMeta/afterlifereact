import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

const GUIDELINES = [
  '정면을 바라보는 사진을 사용해주세요',
  '얼굴이 선명하게 보이는 사진이 좋아요',
  '배경이 단순할수록 좋은 결과를 얻을 수 있어요',
];

async function pick(onChange: (p: Partial<CloneCreationDraft>) => void) {
  try {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) onChange({ imageFile: r.assets[0].uri });
  } catch {
    Alert.alert('오류', '사진을 불러올 수 없어요.');
  }
}

function Component({ draft, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.preview} onPress={() => pick(onChange)}>
        {draft.imageFile ? (
          <Image source={{ uri: draft.imageFile }} style={styles.previewImg} />
        ) : (
          <>
            <Feather name="image" size={32} color={COLORS.zinc400} />
            <Text style={styles.hint}>사진을 선택해 주세요</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.guideTitle}>가이드</Text>
      {GUIDELINES.map((g, i) => (
        <Text key={i} style={styles.guideText}>
          • {g}
        </Text>
      ))}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean => Boolean(d.imageFile);

const DefaultImageUpload = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default DefaultImageUpload;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  preview: {
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.zinc50,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  hint: { marginTop: 8, color: COLORS.zinc500 },
  guideTitle: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  guideText: { fontSize: 12, color: COLORS.zinc600 },
});
