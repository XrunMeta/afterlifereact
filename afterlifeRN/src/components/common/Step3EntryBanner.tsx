import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SIZES } from '../constants';

interface Props {
  onDismiss: () => void;
}

export default function Step3EntryBanner({ onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Feather name="info" size={16} color={COLORS.amber700} />
      <Text style={styles.text}>
        이후 단계부터는 타입·관계는 수정할 수 없어요. 다른 타입이면 이전 단계에서 고쳐주세요.
      </Text>
      <TouchableOpacity accessibilityLabel="배너 닫기" onPress={onDismiss}>
        <Feather name="x" size={16} color={COLORS.amber700} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.amber50,
    borderRadius: RADIUS.sm,
    padding: SIZES.small,
    marginHorizontal: SIZES.large,
    marginTop: SIZES.small,
  },
  text: { flex: 1, fontSize: 12, color: COLORS.amber800 },
});
