import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Coowner { userId: number; displayName: string; }
interface Props {
  visible: boolean;
  coowners: Coowner[];
  onClose: () => void;
  onSubmit: (toUserId: number) => void;
}

export function EditorTransferModal({ visible, coowners, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('edit.transferEditor', { defaultValue: '편집 권한 이전' })}</Text>
          <FlatList
            data={coowners}
            keyExtractor={(c) => String(c.userId)}
            renderItem={({ item }) => (
              <TouchableOpacity
                accessibilityLabel={`transfer-target-${item.userId}`}
                style={[styles.row, selected === item.userId && styles.rowSelected]}
                onPress={() => setSelected(item.userId)}
              >
                <Text>{item.displayName}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}><Text>{t('common.cancel', { defaultValue: '취소' })}</Text></TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="transfer-submit"
              disabled={selected == null}
              onPress={() => selected != null && onSubmit(selected)}
            >
              <Text style={selected == null ? styles.disabled : styles.cta}>{t('edit.transferSubmit', { defaultValue: '요청 보내기' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '80%', maxHeight: '70%' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowSelected: { backgroundColor: '#eef2ff' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cta: { color: '#1e40af', fontWeight: '700' },
  disabled: { color: '#9ca3af' },
});
