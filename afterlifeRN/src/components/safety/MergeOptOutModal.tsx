import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_aa7413, v_09d0e5 } from "rcmrninabrnb";
import v_1a40c4 from "../ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";

interface Props {
  visible: boolean;
  sourceCloneName: string;
  targetCloneName: string;
  deadlineAt: string; 
  onDecision: (decision: "agree" | "decline") => void;
  onDismiss: () => void;
}

export default function v_b48567({
  visible: v_cf55be,
  sourceCloneName: v_f0054b,
  targetCloneName: v_c98119,
  deadlineAt: v_90e131,
  onDecision: v_fa47a7,
  onDismiss: v_1b97a8,
}: Props) {
  return (
    <Modal visible={v_cf55be} animationType="fade" transparent onRequestClose={v_1b97a8}>
      <Pressable style={v_fd5f43.backdrop} onPress={v_1b97a8}>
        <Pressable style={v_fd5f43.card} onPress={() => {}}>
          <Text style={v_fd5f43.title}>클론 병합 확인 필요</Text>
          <Text style={v_fd5f43.body}>
            <Text style={v_fd5f43.highlight}>{v_f0054b}</Text>이(가)
            <Text style={v_fd5f43.highlight}> {v_c98119}</Text>와 병합될 예정입니다.
            {"\n\n"}
            병합 결과 원본 클론은 아카이브(archived_merged)되고 새로운 통합 클론이 생성됩니다.
            공유자 전원의 응답이 필요하며, 기한({new Date(v_90e131).toLocaleString("ko-KR")})까지
            응답이 없으면 <Text style={v_fd5f43.highlight}>기본값(비동의)</Text>으로 처리됩니다.
            {"\n\n"}
            원본 클론은 복구 가능한 상태로 보존되므로, 추후 이의를 제기할 수 있습니다.
          </Text>

          <View style={v_fd5f43.btnRow}>
            <Button title="동의" onPress={() => v_fa47a7("agree")} />
            <View style={{ height: 10 }} />
            <Button title="거절" variant="ghost" onPress={() => v_fa47a7("decline")} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: v_9b1a04.large,
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.xl,
    padding: v_9b1a04.large,
    width: "100%",
    maxWidth: 440,
  },
  title: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: v_1bfbd0.zinc700 },
  highlight: { fontWeight: "700", color: v_1bfbd0.zinc900 },
  btnRow: { marginTop: 20 },
});
