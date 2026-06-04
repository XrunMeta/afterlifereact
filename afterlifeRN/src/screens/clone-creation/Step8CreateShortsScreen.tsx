

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import Button from "../../components/ui/Button";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = NativeStackScreenProps<CreateStackParamList, "Step8">;

export default function Step8CreateShortsScreen({ navigation }: Props) {
  const handleGoToDashboard = () => {
    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: "ClonesTab" }),
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <View style={styles.center}>
        <View style={styles.successCircle}>
          <Feather name="check" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.title}>클론이 완성되었습니다</Text>
        <Text style={styles.subtitle}>
          이제 클론과 대화하거나{"\n"}새 게시물을 올릴 수 있어요.
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <Button
          title="대시보드로"
          onPress={handleGoToDashboard}
          variant="accent"
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xlarge,
    gap: 14,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.zinc900, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 21,
  },
  bottomBar: {
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },

  _radiusRef: { borderRadius: RADIUS.md },
});
