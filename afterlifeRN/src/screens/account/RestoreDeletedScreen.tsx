import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_03e392 } from "rcmrninabrnb";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_9b1a04 } from "../../components/constants";

export default function v_ecb3c9() {
  const [v_683210, v_34a50a] = v_5ab095(false);

  async function v_d2d3fb() {
    v_34a50a(true);
    try {

      await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 400));
      v_03e392.alert("복구 완료", "계정이 다시 활성화되었습니다.");
    } catch (v_9e86fd) {
      v_03e392.alert("복구 실패", "복구 기간(90일)이 만료되었거나 상태가 다릅니다.");
    } finally {
      v_34a50a(false);
    }
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="계정 복구" />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.title}>삭제 대기 중인 계정입니다</Text>
        <Text style={v_fd5f43.body}>
          귀하의 계정은 현재 소프트 삭제 상태입니다. 삭제 요청일로부터 90일 이내에 복구하실 수 있습니다.
          {"\n\n"}
          90일 경과 후에는 콜드 아카이브로 이동하며(추가 275일 보관), 이 기간에는 관리자 문의를 통해서만
          복구 가능합니다. 총 1년 경과 시 최종 삭제됩니다.
          {"\n\n"}
          귀하의 암호화 키(DEK)는 기본적으로 보존됩니다. 영구 폐기를 원하시면 "GDPR 삭제"를 사용하세요.
        </Text>
        <View style={{ height: 20 }} />
        <Button title={v_683210 ? "복구 중..." : "지금 복구하기"} onPress={v_d2d3fb} disabled={v_683210} />
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc600 },
});
