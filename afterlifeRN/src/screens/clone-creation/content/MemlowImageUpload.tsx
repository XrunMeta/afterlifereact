import { showAlert } from "../../../stores/dialogStore";
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';
import { runImageSourcePick } from './pickImageSource';
import CropImageModal from './CropImageModal';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const [source, setSource] = useState<{ uri: string; width: number; height: number } | null>(null);
  const rights = draft.rightsAcknowledged ?? false;

  const runPick = async (fromCamera: boolean) => {
    const picked = await runImageSourcePick(fromCamera, t);
    if (picked) setSource(picked);
  };

  const onPickPress = () => {
    showAlert(t('create.image.sourceTitle'), undefined, [
      { text: t('create.image.sourceCamera'), onPress: () => runPick(true) },
      { text: t('create.image.sourceLibrary'), onPress: () => runPick(false) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.note}>{t('create.image.memlowNote')}</Text>
      <TouchableOpacity style={styles.preview} onPress={onPickPress}>
        {draft.imageFile ? (
          <Image source={{ uri: draft.imageFile }} style={styles.img} />
        ) : (
          <>
            <Feather name="image" size={32} color={COLORS.zinc400} />
            <Text style={styles.hint}>{t('create.image.memlowSelectHint')}</Text>
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
            {t('create.image.memlowRights')}
          </Text>
        </TouchableOpacity>
      )}
      <CropImageModal
        visible={!!source}
        source={source}
        onCancel={() => setSource(null)}
        onConfirm={(uri) => {
          onChange({ imageFile: uri, rightsAcknowledged: false });
          setSource(null);
        }}
      />
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
    aspectRatio: 1 / 2,
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
