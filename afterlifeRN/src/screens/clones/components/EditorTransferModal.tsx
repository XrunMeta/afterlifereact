import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_9cabcb } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';

interface Coowner { userId: number; displayName: string; }
interface Props {
  visible: boolean;
  coowners: Coowner[];
  onClose: () => void;
  onSubmit: (toUserId: number) => void;
}

export function v_9b783f({ visible: v_cf55be, coowners: v_62c8fb, onClose: v_0890f8, onSubmit: v_3bfe4c }: Props) {
  const [v_587413, v_2122dd] = v_5ab095<number | null>(null);
  const { t: v_8d41d7 } = v_772971();
  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8}>
      <View style={v_d81136.wrap}>
        <View style={v_d81136.card}>
          <Text style={v_d81136.title}>{v_8d41d7('edit.transferEditor', { defaultValue: '편집 권한 이전' })}</Text>
          <FlatList
            data={v_62c8fb}
            keyExtractor={(v_3f4e2e) => String(v_3f4e2e.userId)}
            renderItem={({ item: v_8c0b26 }) => (
              <TouchableOpacity
                accessibilityLabel={`transfer-target-${v_8c0b26.userId}`}
                style={[v_d81136.row, v_587413 === v_8c0b26.userId && v_d81136.rowSelected]}
                onPress={() => v_2122dd(v_8c0b26.userId)}
              >
                <Text>{v_8c0b26.displayName}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={v_d81136.actions}>
            <TouchableOpacity onPress={v_0890f8}><Text>{v_8d41d7('common.cancel', { defaultValue: '취소' })}</Text></TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="transfer-submit"
              disabled={v_587413 == null}
              onPress={() => v_587413 != null && v_3bfe4c(v_587413)}
            >
              <Text style={v_587413 == null ? v_d81136.disabled : v_d81136.cta}>{v_8d41d7('edit.transferSubmit', { defaultValue: '요청 보내기' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '80%', maxHeight: '70%' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowSelected: { backgroundColor: '#eef2ff' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cta: { color: '#1e40af', fontWeight: '700' },
  disabled: { color: '#9ca3af' },
});
