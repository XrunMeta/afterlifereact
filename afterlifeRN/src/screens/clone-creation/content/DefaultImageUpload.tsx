import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import { pickAndCropImage } from '../../../lib/imagePicker';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

async function pick(
  onChange: (p: Partial<CloneCreationDraft>) => void,
  errorTitle: string,
  errorMsg: string,
) {
  try {
    const r = await pickAndCropImage({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) onChange({ imageFile: r.assets[0].uri });
  } catch {
    Alert.alert(errorTitle, errorMsg);
  }
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const guidelines = [
    t('create.image.guide1'),
    t('create.image.guide2'),
    t('create.image.guide3'),
  ];
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.preview}
        onPress={() => pick(onChange, t('common.error'), t('create.image.loadFailed'))}
      >
        {draft.imageFile ? (
          <Image source={{ uri: draft.imageFile }} style={styles.previewImg} />
        ) : (
          <>
            <Feather name="image" size={32} color={COLORS.zinc400} />
            <Text style={styles.hint}>{t('create.image.selectHint')}</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.guideTitle}>{t('create.image.guideTitle')}</Text>
      {guidelines.map((g, i) => (
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
