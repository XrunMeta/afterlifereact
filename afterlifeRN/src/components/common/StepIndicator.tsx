import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>STEP {currentStep}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]}>
          <View style={styles.gradient} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.violet500,
    marginBottom: 6,
  },
  track: {
    height: 4,
    backgroundColor: COLORS.zinc200,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    backgroundColor: COLORS.violet500,
  },
});

export default StepIndicator;
