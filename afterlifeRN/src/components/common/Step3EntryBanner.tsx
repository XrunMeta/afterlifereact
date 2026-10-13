import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from '../constants';

interface Props {
  onDismiss: () => void;
}

export default function v_d52542({ onDismiss: v_1b97a8 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={v_d81136.banner}>
      <Feather name="info" size={16} color={v_1bfbd0.amber700} />
      <Text style={v_d81136.text}>
        {v_8d41d7('banner.step3Entry', { defaultValue: '이후 단계부터는 타입·관계는 수정할 수 없어요. 다른 타입이면 이전 단계에서 고쳐주세요.' })}
      </Text>
      <TouchableOpacity accessibilityLabel={v_8d41d7('banner.closeA11y', { defaultValue: '배너 닫기' })} onPress={v_1b97a8}>
        <Feather name="x" size={16} color={v_1bfbd0.amber700} />
      </TouchableOpacity>
    </View>
  );
}

const v_d81136 = v_472849.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: v_1bfbd0.amber50,
    borderRadius: v_8b0c90.sm,
    padding: v_9b1a04.small,
    marginHorizontal: v_9b1a04.large,
    marginTop: v_9b1a04.small,
  },
  text: { flex: 1, fontSize: 12, color: v_1bfbd0.amber800 },
});
