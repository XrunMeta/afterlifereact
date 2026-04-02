import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { useCloneStore } from "../../stores/cloneStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step3">;
};

const GUIDELINES = [
  "정면을 바라보는 사진을 사용해주세요",
  "얼굴이 선명하게 보이는 사진이 좋아요",
  "배경이 단순할수록 좋은 결과를 얻을 수 있어요",
];

export default function Step3ImageUploadScreen({ navigation }: Props) {
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    setCreationDraft({ imageUri: imageUri ?? undefined });
    navigation.navigate("Step4");
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="이미지 업로드"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 3, total: 7 }}
      />
      <StepIndicator currentStep={3} totalSteps={7} />

      <SafeScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={styles.container}>
          {}
          <TouchableOpacity onPress={pickImage} style={styles.imageBox} activeOpacity={0.7}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Feather name="camera" size={40} color={COLORS.zinc400} />
                <Text style={styles.placeholderText}>사진을 선택해주세요</Text>
                <Text style={styles.placeholderSub}>3:4 비율 권장</Text>
              </View>
            )}
          </TouchableOpacity>

          {}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={pickImage} style={styles.galleryButton} activeOpacity={0.7}>
              <Feather name="image" size={20} color={COLORS.zinc900} />
              <Text style={styles.galleryText}>갤러리 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert("알림", "3D 이미지 기능은 준비 중입니다.")}
              style={styles.comingSoonButton}
              activeOpacity={0.7}
            >
              <Feather name="box" size={20} color={COLORS.zinc500} />
              <Text style={styles.comingSoonText}>3D 이미지</Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.guideBox}>
            <Text style={styles.guideTitle}>촬영 가이드</Text>
            {GUIDELINES.map((g, i) => (
              <View key={i} style={styles.guideRow}>
                <Feather name="check-circle" size={16} color={COLORS.success} />
                <Text style={styles.guideText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeScrollView>

      <View style={styles.bottomBar}>
        <Button title="업로드 진행하기" onPress={handleNext} disabled={!imageUri} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xlarge, alignItems: "center" },
  container: { width: "100%", maxWidth: 780, gap: SIZES.xlarge },
  imageBox: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.zinc200,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: COLORS.zinc50,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { fontSize: 15, fontWeight: "600", color: COLORS.zinc500 },
  placeholderSub: { fontSize: 12, color: COLORS.zinc400 },
  buttonRow: { flexDirection: "row", gap: 12 },
  galleryButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  galleryText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  comingSoonButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
  },
  comingSoonText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc500 },
  guideBox: {
    padding: SIZES.medium,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    gap: 10,
  },
  guideTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  guideRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  guideText: { fontSize: 13, color: COLORS.zinc600, flex: 1 },
  bottomBar: { paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.medium, borderTopWidth: 1, borderTopColor: COLORS.zinc200 },
});
