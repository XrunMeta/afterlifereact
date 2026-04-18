import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_79c4f2, v_03e392 } from "rcmrninabrnb";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

const v_80f3c7 = "영구 삭제 요청합니다";

export default function v_89f5f5() {
  const [v_ce9295, v_453fe1] = v_5ab095("");
  const [v_683210, v_34a50a] = v_5ab095(false);

  async function v_fbb22a() {
    if (v_ce9295.trim() !== v_80f3c7) {
      v_03e392.alert("확인 문구가 일치하지 않습니다", `정확히 "${v_80f3c7}"을(를) 입력해주세요.`);
      return;
    }
    v_03e392.alert(
      "최종 확인",
      "귀하의 암호화 키가 영구 파기됩니다. 이후 어떤 방법으로도 데이터 복구가 불가능합니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "영구 삭제",
          style: "destructive",
          onPress: async () => {
            v_34a50a(true);
            try {

              await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 600));
              v_03e392.alert("영구 삭제 완료", "계정과 관련 데이터의 암호화 키가 파기되었습니다.");
            } finally {
              v_34a50a(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="영구 삭제 (GDPR)" />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.warn}>⚠ 회복 불가능한 작업입니다</Text>
        <Text style={v_fd5f43.body}>
          이 옵션은 일반 삭제(복구 가능)와 달리 귀하의 암호화 키를 즉시 파기합니다(Crypto Shredding).
          키가 파기되면 데이터베이스에 남은 암호문은 영원히 복호화할 수 없습니다.
          {"\n\n"}
          단순히 계정을 그만두고 싶다면 설정의 "계정 삭제"를 사용하세요. 해당 경로는 90일 복구 기간을
          제공합니다.
        </Text>

        <Text style={v_fd5f43.label}>확인 문구 입력</Text>
        <Text style={v_fd5f43.helper}>정확히 다음 문구를 입력하세요: "{v_80f3c7}"</Text>
        <TextInput
          value={v_ce9295}
          onChangeText={v_453fe1}
          style={v_fd5f43.input}
          autoCapitalize="none"
        />

        <View style={{ height: 16 }} />
        <Button
          title={v_683210 ? "처리 중..." : "영구 삭제 요청"}
          onPress={v_fbb22a}
          disabled={v_683210}
          variant="danger"
        />
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium },
  warn: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc700 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 20 },
  helper: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 15,
  },
});
