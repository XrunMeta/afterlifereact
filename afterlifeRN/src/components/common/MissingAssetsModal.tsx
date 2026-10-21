import v_a3453e from 'bapkr';
import { v_aa7413, v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import v_1a40c4 from '../ui/Button';
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from '../constants';

interface Props {
  visible: boolean;
  onAddNow: () => void;
  onLater: () => void;
}

export default function v_f81454({ visible: v_cf55be, onAddNow: v_4a7b62, onLater: v_c77d15 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <Modal
      transparent
      animationType="fade"
      visible={v_cf55be}
      onRequestClose={v_c77d15}
    >
      <View style={v_d81136.backdrop}>
        <View style={v_d81136.card}>
          <Text style={v_d81136.title}>{v_8d41d7('assetsHint.title')}</Text>
          <Text style={v_d81136.body}>{v_8d41d7('assetsHint.body')}</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Button title={v_8d41d7('assetsHint.addNow')} onPress={v_4a7b62} />
            <Button title={v_8d41d7('assetsHint.later')} variant="ghost" onPress={v_c77d15} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: v_9b1a04.large,
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: v_9b1a04.large,
    width: '100%',
    maxWidth: 360,
  },
  title: { fontSize: 16, fontWeight: '700', color: v_1bfbd0.zinc900, marginBottom: 8 },
  body: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20 },
  bold: { fontWeight: '700' },
});
