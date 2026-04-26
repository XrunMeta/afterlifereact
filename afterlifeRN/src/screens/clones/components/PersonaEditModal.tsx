import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import PersonaSection from '../../clone-creation/content/PersonaSection';
import {
  draftToL1Profile,
  l1ProfileToDraft,
  type L1ProfilePayload,
} from '../../../lib/personaPrompt';
import type { CloneCreationDraft } from '../../../types/clone';
import { COLORS, RADIUS, SIZES } from '../../../components/constants';

interface Props {
  visible: boolean;
  initial?: { attrs?: Record<string, string>; notes?: string } | null;
  onCancel: () => void;
  onSave: (l1: L1ProfilePayload) => void;
}

export default function PersonaEditModal({ visible, initial, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<CloneCreationDraft>({});

  useEffect(() => {
    if (visible) {
      setDraft(l1ProfileToDraft(initial) as CloneCreationDraft);
    }
  }, [visible, initial]);

  const handleSave = () => {

    const payload = draftToL1Profile(draft) ?? { attrs: {}, notes: '' };
    onSave(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={s.overlay} onPress={onCancel}>
        <Pressable style={s.box} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Text style={s.title}>페르소나 편집</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={s.cancel}>취소</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SIZES.large }}>
            <PersonaSection
              draft={draft}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            />
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.zinc900 },
  cancel: { fontSize: 14, color: COLORS.zinc500 },
  footer: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
  saveBtn: { padding: 14, backgroundColor: COLORS.violet600, borderRadius: RADIUS.md, alignItems: 'center' },
  saveText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
