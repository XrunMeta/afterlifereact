import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from '../ui/Button';
import { COLORS, RADIUS, SIZES } from '../constants';

interface Props {
  visible: boolean;
  onAddNow: () => void;
  onLater: () => void;
}

export default function MissingAssetsModal({ visible, onAddNow, onLater }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>잠깐, 추가 정보가 필요해요</Text>
          <Text style={styles.body}>
            사진과 음성은 대화 품질을 위해 <Text style={styles.bold}>필수</Text>입니다.{'\n'}
            지금 없으면 My Clones에서 언제든 추가할 수 있지만,{'\n'}
            그 전까지는 <Text style={styles.bold}>[생성대기중]</Text> 상태로 표시됩니다.
          </Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Button title="지금 추가하러" onPress={onAddNow} />
            <Button title="나중에 추가" variant="ghost" onPress={onLater} />
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
