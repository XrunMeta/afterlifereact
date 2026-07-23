

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const GOLD_DARK = "#D4A017";
const GOLD_LIGHT = "#F0C64A";

export default function ExpertBadge({ size = 44 }: { size?: number }) {
  const h = size * 1.5; 
  return (
    <View testID="expert-badge" style={{ width: size, height: h }}>
      <Svg width={size} height={h} viewBox="0 0 44 66">
        {}
        <Path d="M14 36 L11 62 L18 54 L22 64 Z" fill={GOLD_DARK} />
        <Path d="M30 36 L33 62 L26 54 L22 64 Z" fill={GOLD_LIGHT} />
        {}
        <Circle cx="22" cy="22" r="21" fill={GOLD_DARK} />
        <Circle cx="22" cy="22" r="17" fill={GOLD_LIGHT} />
        <Circle cx="22" cy="22" r="14" fill={GOLD_DARK} />
      </Svg>
      <View style={[styles.labelWrap, { width: size, height: size }]}>
        <Text style={[styles.label, { fontSize: size * 0.26 }]}>전문가</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: { position: "absolute", top: 0, alignItems: "center", justifyContent: "center" },
  label: { color: "#FFFFFF", fontWeight: "700" },
});
