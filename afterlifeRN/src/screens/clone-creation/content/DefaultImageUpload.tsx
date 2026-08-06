import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import { runImageSourcePick } from './pickImageSource';
import CropImageModal from './CropImageModal';
import CaptureWithGuideModal from './CaptureWithGuideModal';
import { openImageSourcePicker } from './t208ImagePick';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const [source, setSource] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const guidelines = [
    t('create.image.guide1'),
    t('create.image.guide2'),
    t('create.image.guide3'),
  ];

  const runLibrary = async () => {
    const picked = await runImageSourcePick(false, t);
    if (picked) setSource(picked);
  };

  const onPickPress = () => {
    openImageSourcePicker({
      title: t('create.image.sourceTitle'),
      cameraLabel: t('create.image.sourceCamera'),
      libraryLabel: t('create.image.sourceLibrary'),
      cancelLabel: t('common.cancel'),
      onCamera: () => setCameraOpen(true),
      onLibrary: () => {
        void runLibrary();
      },
      onApplyT208Crop: (uri) => onChange({ imageFile: uri }),
    });
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.preview} onPress={onPickPress}>
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
      <CaptureWithGuideModal
        visible={cameraOpen}
        onCancel={() => setCameraOpen(false)}
        onCapture={(picked) => {
          setCameraOpen(false);
          setSource(picked);
        }}
      />
      <CropImageModal
        visible={!!source}
        source={source}
        onCancel={() => setSource(null)}
        onConfirm={(uri) => {
          onChange({ imageFile: uri });
          setSource(null);
        }}
      />
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
    aspectRatio: 1 / 2,
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
