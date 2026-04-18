import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_79c4f2, v_03e392 } from "rcmrninabrnb";
import { v_2d8264 } from "ixigazcpvfldbecwtbvavtbi";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

export default function v_f1fe67() {
  const v_c7daf6 = v_2d8264();
  const v_a000bd = (v_c7daf6.params as { token?: string } | undefined)?.token ?? "";
  const [v_21cc31, v_49c54d] = v_5ab095(v_a000bd);

  async function v_311e15(v_403b73) {
    if (v_21cc31.length < 32) {
      v_03e392.alert("유효한 초대 토큰이 필요합니다.");
      return;
    }
    v_03e392.alert(
      v_403b73 === "accept" ? "수락 완료" : "거절 완료",
      v_403b73 === "accept"
        ? "상속 지정이 수락되었습니다. 실제 이관은 관리자 검증 후 집행됩니다."
        : "초대를 거절했습니다.",
    );
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="상속 초대 응답" />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.intro}>
          다른 사용자로부터 비상연락처/상속 지정 초대를 받으셨습니다. 초대 토큰을 확인한 후 수락
          또는 거절을 선택해주세요. 수락 시 상속 이관 조건이 충족되면 관리자 승인 하에 일부
          권한이 이관될 수 있습니다.
        </Text>

        <Text style={v_fd5f43.label}>초대 토큰</Text>
        <TextInput
          value={v_21cc31}
          onChangeText={v_49c54d}
          placeholder="이메일에 포함된 토큰을 입력하세요"
          style={v_fd5f43.input}
          autoCapitalize="none"
        />

        <View style={v_fd5f43.btnRow}>
          <Button title="수락" onPress={() => v_311e15("accept")} />
          <View style={{ height: 12 }} />
          <Button title="거절" variant="ghost" onPress={() => v_311e15("decline")} />
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium, gap: 12 },
  intro: { color: v_1bfbd0.zinc600, fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 15,
  },
  btnRow: { marginTop: 24 },
});
