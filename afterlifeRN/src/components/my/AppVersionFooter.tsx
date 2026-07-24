

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Constants from "expo-constants";
import { useUpdates } from "expo-updates";
import { COLORS } from "../constants";
import { formatOtaLine, formatVersionLine } from "./appVersionInfo";

export default function AppVersionFooter() {
  const { currentlyRunning } = useUpdates();

  const build =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  const versionLine = formatVersionLine(Constants.expoConfig?.version, build);
  const otaLine = formatOtaLine(currentlyRunning);
  const channel = currentlyRunning.channel;

  return (
    <View style={styles.wrap}>
      <Text style={styles.line}>{versionLine}</Text>
      <Text style={styles.line}>{otaLine}</Text>
      {channel ? <Text style={styles.dim}>ch: {channel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
    gap: 2,
  },
  line: {
    fontSize: 11,
    color: COLORS.zinc400,
  },
  dim: {
    fontSize: 10,
    color: COLORS.zinc300,
  },
});
