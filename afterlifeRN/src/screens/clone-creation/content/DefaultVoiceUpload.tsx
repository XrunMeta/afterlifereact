import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

export const VOICE_SAMPLES = [
  { id: 'v1', name: 'Nova', desc: '따뜻하고 부드러운' },
  { id: 'v2', name: 'Ursa', desc: '차분하고 깊은' },
  { id: 'v3', name: 'Vega', desc: '밝고 활기찬' },
  { id: 'v4', name: 'Orion', desc: '신뢰감 있는' },
  { id: 'v5', name: 'Luna', desc: '감성적인' },
  { id: 'v6', name: 'Stella', desc: '우아하고 섬세한' },
] as const;

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

async function pickFile(onChange: Props['onChange']) {
  try {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!r.canceled && r.assets[0]) {
      onChange({ voiceFile: r.assets[0].uri, voiceSampleId: undefined });
    }
  } catch {
    Alert.alert('오류', '파일을 선택할 수 없습니다.');
  }
}

function Component({ draft, onChange }: Props) {
  const [useCustom, setUseCustom] = useState<boolean>(Boolean(draft.voiceFile));
  return (
    <View style={styles.wrap}>
      {!useCustom && (
        <View style={styles.grid}>
          {VOICE_SAMPLES.map(v => {
            const active = draft.voiceSampleId === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => onChange({ voiceSampleId: v.id, voiceFile: undefined })}
              >
                <Text style={styles.cardName}>{v.name}</Text>
                <Text style={styles.cardDesc}>{v.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <TouchableOpacity style={styles.toggleRow} onPress={() => setUseCustom(!useCustom)}>
        <Feather
          name={useCustom ? 'check-square' : 'square'}
          size={18}
          color={useCustom ? COLORS.violet600 : COLORS.zinc400}
        />
        <Text style={styles.toggleText}>직접 녹음/업로드 사용</Text>
      </TouchableOpacity>
      {useCustom && (
        <TouchableOpacity style={styles.upload} onPress={() => pickFile(onChange)}>
          <Feather name="upload" size={20} color={COLORS.violet600} />
          <Text style={styles.uploadText}>{draft.voiceFile ? '파일 선택됨' : '오디오 파일 선택'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  Boolean(d.voiceSampleId || d.voiceFile);

const DefaultVoiceUpload = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default DefaultVoiceUpload;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '48%',
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  cardActive: { borderColor: COLORS.violet600, backgroundColor: COLORS.violet100 },
  cardName: { fontSize: 14, fontWeight: '600', color: COLORS.zinc800 },
  cardDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  toggleText: { color: COLORS.zinc700 },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.violet200,
  },
  uploadText: { color: COLORS.violet700 },
});
