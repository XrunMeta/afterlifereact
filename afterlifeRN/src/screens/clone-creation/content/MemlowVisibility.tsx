import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_79c4f2, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';

const v_57ffc4 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const [v_483de2, v_266e0d] = v_5ab095('');
  v_c4deb2(() => {
    if (v_f04727.visibility !== 'private') v_b187d9({ visibility: 'private' });
  }, []); 

  const v_c46df8 = v_f04727.coownerInvites ?? [];

  const v_815f5d = () => {
    const v_81e2ef = v_483de2.trim();
    if (!v_81e2ef) return;
    v_b187d9({ coownerInvites: [...v_c46df8, v_81e2ef] });
    v_266e0d('');
  };
  const v_40609f = (v_ebec57) =>
    v_b187d9({ coownerInvites: v_c46df8.filter((v_37eab7, v_b75e36) => v_b75e36 !== v_ebec57) });

  return (
    <View style={v_d81136.wrap}>
      <View style={v_d81136.lockedRow}>
        <Feather name="lock" size={16} color={v_1bfbd0.violet1000} />
        <Text style={v_d81136.lockedText}>
          멤로우 클론은 비공개로 고정돼요. 공동관리자만 볼 수 있어요.
        </Text>
      </View>

      <Text style={v_d81136.label}>공동관리자 초대 (이메일)</Text>
      <View style={v_d81136.inputRow}>
        <TextInput
          placeholder="email@example.com"
          value={v_483de2} onChangeText={v_266e0d}
          autoCapitalize="none" keyboardType="email-address"
          style={v_d81136.input} onSubmitEditing={v_815f5d}
        />
        <TouchableOpacity style={v_d81136.addBtn} onPress={v_815f5d}>
          <Feather name="plus" size={18} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

      {v_c46df8.map((v_9e86fd, v_ebec57) => {
        const v_0af197 = !v_57ffc4.test(v_9e86fd);
        return (
          <View key={`${v_9e86fd}-${v_ebec57}`} style={[v_d81136.inviteRow, v_0af197 && v_d81136.inviteRowBad]}>
            <Text style={v_d81136.inviteEmail}>{v_9e86fd}</Text>
            <TouchableOpacity onPress={() => v_40609f(v_ebec57)}>
              <Feather name="x" size={16} color={v_1bfbd0.zinc500} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => {
  const v_c46df8 = v_d5dda0.coownerInvites ?? [];
  return v_c46df8.every(v_9e86fd => v_57ffc4.test(v_9e86fd));
};

const v_25b857 = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_25b857;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: v_1bfbd0.violet100, padding: 12, borderRadius: v_8b0c90.sm },
  lockedText: { flex: 1, fontSize: 13, color: v_1bfbd0.violet800 },
  label: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.sm, paddingHorizontal: 12, paddingVertical: 10 },
  addBtn: { backgroundColor: v_1bfbd0.violet1000, width: 44,
    alignItems: 'center', justifyContent: 'center', borderRadius: v_8b0c90.sm },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, borderRadius: v_8b0c90.sm, borderWidth: 1, borderColor: v_1bfbd0.zinc200 },
  inviteRowBad: { borderColor: v_1bfbd0.rose500 },
  inviteEmail: { fontSize: 13, color: v_1bfbd0.zinc800 },
});
