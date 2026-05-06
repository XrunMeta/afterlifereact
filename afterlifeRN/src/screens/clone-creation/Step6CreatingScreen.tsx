import React, { useState, useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useCloneStore } from "../../stores/cloneStore";
import MissingAssetsModal from "../../components/common/MissingAssetsModal";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step6">;
};

export default function Step6CreatingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = useCloneStore(s => s.creationDraft);
  const missingAssets =
    draft.cloneType === 'memlow' &&
    (!draft.imageFile || (!draft.voiceFile && (draft.recordDuration ?? 0) < 30));
  const [guardOpen, setGuardOpen] = useState(missingAssets);
  const [proceeding, setProceeding] = useState(!missingAssets);

  const [progress, setProgress] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    if (!proceeding) return;
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 2));
    }, 100);
    return () => clearInterval(interval);
  }, [proceeding]);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => navigation.navigate("Step7"), 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="클론 생성" />
      <StepIndicator currentStep={6} totalSteps={7} />

      <View style={styles.center}>
        {}
        <View style={styles.ringContainer}>
          <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]}>
            <View style={styles.outerRingInner} />
          </Animated.View>
          <View style={styles.innerCircle}>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>

        <Text style={styles.title}>페르소나를 생성하고 있어요</Text>
        <Text style={styles.subtitle}>약 2~5분 정도 소요됩니다</Text>

        {}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.labelRow}>
          <Feather name="cpu" size={14} color={COLORS.violet500} />
          <Text style={styles.labelText}>MUSETALK SYNC</Text>
        </View>
      </View>
      <MissingAssetsModal
        visible={guardOpen}
        onAddNow={() => {
          setGuardOpen(false);
          setProceeding(false);
          navigation.navigate('Step3');
        }}
        onLater={() => {
          setGuardOpen(false);
          setProceeding(true);
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SIZES.xlarge, gap: 16 },
  ringContainer: { width: 140, height: 140, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  outerRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: COLORS.violet500,
    borderRightColor: COLORS.violet500,
  },
  outerRingInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: { fontSize: 28, fontWeight: "bold", color: COLORS.violet500 },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  subtitle: { fontSize: 14, color: COLORS.zinc500 },
  barTrack: {
    width: "80%",
    height: 6,
    backgroundColor: COLORS.zinc200,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  barFill: { height: "100%", backgroundColor: COLORS.violet500, borderRadius: 3 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  labelText: { fontSize: 12, fontWeight: "600", color: COLORS.violet500 },
});
