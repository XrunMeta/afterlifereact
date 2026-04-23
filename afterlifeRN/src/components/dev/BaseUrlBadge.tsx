import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConfigStore } from '../../stores/configStore';

export function BaseUrlBadge() {
  const testMode = useConfigStore((s) => s.testMode);
  if (!testMode) return null;
  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={styles.text}>PREVIEW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
