import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_0b10a6 } from '../../stores/configStore';

export function v_d0625e() {
  const v_53fadb = v_0b10a6((v_fd5f43) => v_fd5f43.testMode);
  if (!v_53fadb) return null;
  return (
    <View style={v_d81136.root} pointerEvents="none">
      <Text style={v_d81136.text}>PREVIEW</Text>
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 9999,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
