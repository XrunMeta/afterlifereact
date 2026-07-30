import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import { COLORS, RADIUS, SIZES } from '../constants';

interface Props {
  visible: boolean;
  onAddNow: () => void;
  onLater: () => void;
}

export default function MissingAssetsModal({ visible, onAddNow, onLater }: Props) {
  const { t } = useTranslation();
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('assetsHint.title')}</Text>
          <Text style={styles.body}>{t('assetsHint.body')}</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Button title={t('assetsHint.addNow')} onPress={onAddNow} />
            <Button title={t('assetsHint.later')} variant="ghost" onPress={onLater} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.large,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SIZES.large,
    width: '100%',
    maxWidth: 360,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.zinc900, marginBottom: 8 },
  body: { fontSize: 13, color: COLORS.zinc700, lineHeight: 20 },
  bold: { fontWeight: '700' },
});
