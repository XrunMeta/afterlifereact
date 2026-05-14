import { showAlert } from "../../../stores/dialogStore";
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { MEMLOW_VOICE_SCRIPTS } from '../../../mocks/cloneTypeCatalog';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS } from '../../../components/constants';

interface Props {
  draft: CloneCreationDraft;
  onChange: (patch: Partial<CloneCreationDraft>) => void;
}

async function pickFile(
  onChange: Props['onChange'],
  errorTitle: string,
  errorMsg: string,
) {
  try {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!r.canceled && r.assets[0]) {
      onChange({ voiceFile: r.assets[0].uri, recordDuration: 0 });
    }
  } catch {
    showAlert(errorTitle, errorMsg);
  }
}

function Component({ draft, onChange }: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (tick.current) clearInterval(tick.current);
    },
    [],
  );

  const startStop = () => {
    if (recording) {
      if (tick.current) clearInterval(tick.current);
      setRecording(false);
      return;
    }
    setRecording(true);
    tick.current = setInterval(() => {
      const cur = (draft.recordDuration ?? 0) + 1;
      onChange({ recordDuration: cur, voiceFile: undefined });
      if (cur >= 60) {
        if (tick.current) clearInterval(tick.current);
        setRecording(false);
      }
    }, 1000);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t("create.voice.memlowTitle")}</Text>
      <View style={styles.scriptList}>
        {MEMLOW_VOICE_SCRIPTS.map(s => {
          const active = draft.voiceScriptId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.scriptCard, active && styles.scriptCardActive]}
              onPress={() => onChange({ voiceScriptId: s.id })}
            >
              <Text style={styles.scriptTitle}>{s.title}</Text>
              <Text style={styles.scriptText} numberOfLines={2}>
                {s.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.rec, recording && styles.recActive]} onPress={startStop}>
        <Feather name={recording ? 'square' : 'mic'} size={22} color={COLORS.white} />
        <Text style={styles.recText}>
          {recording ? t("create.voice.recordStop") : t("create.voice.recordStart")} ({draft.recordDuration ?? 0}s / {t("create.voice.recordRange")})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.upload}
        onPress={() => pickFile(onChange, t("common.error"), t("create.voice.fileError"))}
      >
        <Feather name="upload" size={20} color={COLORS.violet600} />
        <Text style={styles.uploadText}>
          {draft.voiceFile ? t("create.voice.uploadedFile") : t("create.voice.uploadFileMemlow")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

Component.validate = (d: CloneCreationDraft): boolean =>
  (d.recordDuration ?? 0) >= 30 || Boolean(d.voiceFile);

const MemlowVoiceUpload = Component as typeof Component & {
  validate: (d: CloneCreationDraft) => boolean;
};
export default MemlowVoiceUpload;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.zinc800 },
  scriptList: { gap: 8 },
  scriptCard: {
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  scriptCardActive: { borderColor: COLORS.violet600, backgroundColor: COLORS.violet100 },
  scriptTitle: { fontSize: 13, fontWeight: '600', color: COLORS.zinc800 },
  scriptText: { fontSize: 12, color: COLORS.zinc600, marginTop: 4 },
  rec: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.violet600,
    padding: 14,
    borderRadius: RADIUS.md,
  },
  recActive: { backgroundColor: COLORS.rose500 },
  recText: { color: COLORS.white, fontWeight: '600' },
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
