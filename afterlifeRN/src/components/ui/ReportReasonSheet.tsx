

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_472849,
  v_122070,
  v_e45a99,
  v_326be8,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0 } from "../constants";

interface Props {
  visible: boolean;
  targetKind?: "comment" | "clone" | "post";
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

const v_47f999 = [
  { key: "report.reason.dislike", defaultValue: "마음에 들지 않습니다" },
  { key: "report.reason.bullying", defaultValue: "따돌림 또는 원치 않는 연락" },
  { key: "report.reason.selfHarm", defaultValue: "자살, 자해 및 섭식 장애" },
  { key: "report.reason.nudity", defaultValue: "나체 이미지 또는 성적 행위" },
  { key: "report.reason.hate", defaultValue: "혐오 발언 또는 상징" },
  { key: "report.reason.violence", defaultValue: "폭력 또는 학대" },
  { key: "report.reason.regulated", defaultValue: "규제 품목의 판매 또는 홍보" },
  { key: "report.reason.spam", defaultValue: "스캠, 사기 또는 스팸" },
  { key: "report.reason.falseInfo", defaultValue: "거짓 정보" },
];

export default function v_409416({ visible: v_cf55be, targetKind: v_6a1be1 = "comment", onCancel: v_c7001c, onConfirm: v_e2be2d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { height: v_c86e33 } = v_e45a99();

  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);
  const v_5778d5 = v_6a1be1 === "comment"
    ? v_8d41d7("report.targetComment", { defaultValue: "댓글" })
    : v_6a1be1 === "post"
      ? v_8d41d7("report.targetPost", { defaultValue: "게시물" })
      : v_8d41d7("report.targetClone", { defaultValue: "클론" });
  return (
    <Modal visible={v_cf55be} transparent animationType="slide" onRequestClose={v_c7001c}>
      <Pressable style={v_d81136.backdrop} onPress={v_c7001c}>
        <Pressable
          style={[v_d81136.sheet, { maxHeight: v_c86e33 * 0.92 }]}
          onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}
        >
          {}
          <View style={v_d81136.header}>
            <View style={{ width: 40 }} />
            <Text style={v_d81136.headerTitle}>{v_8d41d7("report.title", { defaultValue: "신고하기" })}</Text>
            <Pressable onPress={v_c7001c} hitSlop={8}>
              <Feather name="x" size={26} color="#000000" />
            </Pressable>
          </View>

          <View style={v_d81136.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {}
            <View style={v_d81136.section}>
              <Text style={v_d81136.sectionTitle}>{v_8d41d7("report.sectionTitle", { target: v_5778d5, defaultValue: "이 {{target}}을 신고하는 이유" })}</Text>
              <Text style={v_d81136.sectionDesc}>
                {v_8d41d7("report.sectionDesc", { defaultValue: "회원님의 신고는 익명으로 처리됩니다. 누군가 위급한 상황에 있다고 생각된다면 즉시 현지 응급 서비스 기관에 연락하시기 바랍니다." })}
              </Text>
            </View>

            {}
            <View>
              {v_47f999.map(({ key: v_b24339, defaultValue: v_4ff54d }) => {
                const v_2869c1 = v_8d41d7(v_b24339, { defaultValue: v_4ff54d });
                return (
                  <Pressable
                    key={v_b24339}
                    style={({ pressed: v_aba1d2 }) => [v_d81136.row, v_aba1d2 && v_d81136.rowPressed]}
                    onPress={() => v_e2be2d(v_2869c1)}
                    android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                  >
                    <Text style={v_d81136.rowText}>{v_2869c1}</Text>
                    <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc400} />
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 32 + v_2b650d }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc200,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionDesc: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    lineHeight: 18,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: v_1bfbd0.zinc50 ?? "#f4f4f5",
  },
  rowText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "500",
  },
});
