import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_122070, v_09d0e5 } from 'rcmrninabrnb';
import v_78abf7 from '../../clone-creation/content/PersonaSection';
import {
  v_556c5b,
  v_f689cd,
  type v_078053,
} from '../../../lib/personaPrompt';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from '../../../components/constants';

interface Props {
  visible: boolean;
  initial?: { attrs?: Record<string, string>; notes?: string } | null;
  onCancel: () => void;
  onSave: (l1: v_078053) => void;
}

export default function v_61a695({ visible: v_cf55be, initial: v_fc6010, onCancel: v_c7001c, onSave: v_eb8dc2 }: Props) {
  const [v_f04727, v_a07441] = v_5ab095<v_c2a674>({});

  v_c4deb2(() => {
    if (v_cf55be) {
      v_a07441(v_f689cd(v_fc6010) as v_c2a674);
    }
  }, [v_cf55be, v_fc6010]);

  const v_1b8283 = () => {

    const v_931bf0 = v_556c5b(v_f04727) ?? { attrs: {}, notes: '' };
    v_eb8dc2(v_931bf0);
  };

  return (
    <Modal visible={v_cf55be} transparent animationType="slide" onRequestClose={v_c7001c}>
      <Pressable style={v_fd5f43.overlay} onPress={v_c7001c}>
        <Pressable style={v_fd5f43.box} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
          <View style={v_fd5f43.header}>
            <Text style={v_fd5f43.title}>페르소나 편집</Text>
            <TouchableOpacity onPress={v_c7001c}>
              <Text style={v_fd5f43.cancel}>취소</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: v_9b1a04.large }}>
            <PersonaSection
              draft={v_f04727}
              onChange={(v_17dc8a) => v_a07441((v_d5dda0) => ({ ...v_d5dda0, ...v_17dc8a }))}
            />
          </ScrollView>
          <View style={v_fd5f43.footer}>
            <TouchableOpacity style={v_fd5f43.saveBtn} onPress={v_1b8283}>
              <Text style={v_fd5f43.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: v_8b0c90.lg,
    borderTopRightRadius: v_8b0c90.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: v_9b1a04.large,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  title: { fontSize: 16, fontWeight: '700', color: v_1bfbd0.zinc900 },
  cancel: { fontSize: 14, color: v_1bfbd0.zinc500 },
  footer: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
  saveBtn: { padding: 14, backgroundColor: v_1bfbd0.violet600, borderRadius: v_8b0c90.md, alignItems: 'center' },
  saveText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: '600' },
});
