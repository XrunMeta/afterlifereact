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
  const rights = draft.rightsAcknowledged ?? false;
  return (
    <View style={styles.wrap}>
      <Text style={styles.note}>사진은 지금 추가하거나, 나중에 추가할 수 있어요.</Text>
      <TouchableOpacity style={styles.preview} onPress={() => pick(onChange)}>
        {draft.imageFile ? (
          <Image source={{ uri: draft.imageFile }} style={styles.img} />
        ) : (
          <>
            <Feather name="image" size={32} color={COLORS.zinc400} />
            <Text style={styles.hint}>사진을 선택하거나 건너뛸 수 있어요</Text>
          </>
        )}
      </TouchableOpacity>
      {draft.imageFile && (
        <TouchableOpacity
          style={styles.rightsRow}
          onPress={() => onChange({ rightsAcknowledged: !rights })}
        >
          <Feather
            name={rights ? 'check-square' : 'square'}
            size={18}
            color={rights ? COLORS.violet600 : COLORS.zinc400}
          />
          <Text style={styles.rightsText}>
            고인 사진 사용에 대한 권리를 확인했어요 (가족 동의·초상권).
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  !d.imageFile || Boolean(d.rightsAcknowledged);

const MemlowImageUpload = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default MemlowImageUpload;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  note: { fontSize: 13, color: COLORS.zinc600 },
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
  img: { width: '100%', height: '100%' },
  hint: { marginTop: 8, color: COLORS.zinc500, textAlign: 'center', paddingHorizontal: 12 },
  rightsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightsText: { fontSize: 13, color: COLORS.zinc700, flex: 1 },
});
