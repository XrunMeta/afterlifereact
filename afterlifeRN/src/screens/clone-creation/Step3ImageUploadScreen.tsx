import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_cf9c33,
  v_03e392,
  v_472849,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step3">;
};

const v_9e26a9 = [
  "정면을 바라보는 사진을 사용해주세요",
  "얼굴이 선명하게 보이는 사진이 좋아요",
  "배경이 단순할수록 좋은 결과를 얻을 수 있어요",
];

export default function v_3d9025({ navigation: v_c65f5d }: Props) {
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const [v_ee89db, v_3456cd] = v_5ab095<string | null>(null);

  const v_2e22e6 = async () => {
    const v_43c42e = await v_d05ab5.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!v_43c42e.canceled && v_43c42e.assets[0]) {
      v_3456cd(v_43c42e.assets[0].uri);
    }
  };

  const v_420661 = () => {
    v_5795de({ imageFile: v_ee89db ?? undefined });
    v_c65f5d.navigate("Step4");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="이미지 업로드"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        stepInfo={{ current: 3, total: 7 }}
      />
      <StepIndicator currentStep={3} totalSteps={7} />

      <SafeScrollView contentContainerStyle={v_d81136.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={v_d81136.container}>
          {}
          <TouchableOpacity onPress={v_2e22e6} style={v_d81136.imageBox} activeOpacity={0.7}>
            {v_ee89db ? (
              <Image source={{ uri: v_ee89db }} style={v_d81136.image} />
            ) : (
              <View style={v_d81136.placeholder}>
                <Feather name="camera" size={40} color={v_1bfbd0.zinc400} />
                <Text style={v_d81136.placeholderText}>사진을 선택해주세요</Text>
                <Text style={v_d81136.placeholderSub}>3:4 비율 권장</Text>
              </View>
            )}
          </TouchableOpacity>

          {}
          <View style={v_d81136.buttonRow}>
            <TouchableOpacity onPress={v_2e22e6} style={v_d81136.galleryButton} activeOpacity={0.7}>
              <Feather name="image" size={20} color={v_1bfbd0.zinc900} />
              <Text style={v_d81136.galleryText}>갤러리 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => v_03e392.alert("알림", "3D 이미지 기능은 준비 중입니다.")}
              style={v_d81136.comingSoonButton}
              activeOpacity={0.7}
            >
              <Feather name="box" size={20} color={v_1bfbd0.zinc500} />
              <Text style={v_d81136.comingSoonText}>3D 이미지</Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={v_d81136.guideBox}>
            <Text style={v_d81136.guideTitle}>촬영 가이드</Text>
            {v_9e26a9.map((v_206b88, v_ebec57) => (
              <View key={v_ebec57} style={v_d81136.guideRow}>
                <Feather name="check-circle" size={16} color={v_1bfbd0.success} />
                <Text style={v_d81136.guideText}>{v_206b88}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeScrollView>

      <View style={v_d81136.bottomBar}>
        <Button title="업로드 진행하기" onPress={v_420661} disabled={!v_ee89db} />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { flexGrow: 1, paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.xlarge, alignItems: "center" },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.xlarge },
  imageBox: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: v_8b0c90.xl,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc200,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: v_1bfbd0.zinc50,
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc500 },
  placeholderSub: { fontSize: 12, color: v_1bfbd0.zinc400 },
  buttonRow: { flexDirection: "row", gap: 12 },
  galleryButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  galleryText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  comingSoonButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
  },
  comingSoonText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc500 },
  guideBox: {
    padding: v_9b1a04.medium,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    gap: 10,
  },
  guideTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  guideRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  guideText: { fontSize: 13, color: v_1bfbd0.zinc600, flex: 1 },
  bottomBar: { paddingHorizontal: v_9b1a04.xlarge, paddingVertical: v_9b1a04.medium, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200 },
});
