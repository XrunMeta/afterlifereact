import v_a3453e, { v_e662ae, v_5ab095 } from 'bapkr';
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_a2349e,
  v_f6c856,
  v_aa7413,
  v_472849,
  v_9cabcb,
  v_700696,
} from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_7ed42d } from './useFloatingBallPosition';
import { v_407cbf } from './DevFloatingBall.actions';
import { v_1ed7d9 } from '../../stores/authStore';
import { v_694b7f } from '../../api/source';

const v_88dc4d = 52;
const { width: v_437248, height: v_5a448f } = v_700696.get('window');

export function v_0f28c1() {
  if (!__DEV__) return null;

  const { pos: v_9e7a9d, save: v_1e693b } = v_7ed42d();
  const v_1dd864 = v_e662ae(new v_a2349e.ValueXY(v_9e7a9d)).current;
  const [v_83c574, v_b4a964] = v_5ab095(false);
  const [v_104667, v_e4706a] = v_5ab095(false);
  const v_dd943a = v_407cbf();
  const v_f73be6 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);

  const v_ae4231 = v_e662ae(
    v_f6c856.create({
      onMoveShouldSetPanResponder: (v_37eab7, v_206b88) =>
        Math.abs(v_206b88.dx) > 3 || Math.abs(v_206b88.dy) > 3,
      onPanResponderGrant: () => {
        v_1dd864.setOffset({
          x: (v_1dd864.x as any)._value,
          y: (v_1dd864.y as any)._value,
        });
        v_1dd864.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: v_a2349e.event(
        [null, { dx: v_1dd864.x, dy: v_1dd864.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: async (v_37eab7, v_206b88) => {
        v_1dd864.flattenOffset();
        const v_f4b555 = v_206b88.moveX < v_437248 / 2;
        const v_5cb90a = v_f4b555 ? 0 : v_437248 - v_88dc4d;
        const v_d3dc23 = Math.max(
          40,
          Math.min(v_5a448f - v_88dc4d - 40, (v_1dd864.y as any)._value),
        );
        v_1dd864.setValue({ x: v_5cb90a, y: v_d3dc23 });
        await v_1e693b({ x: v_5cb90a, y: v_d3dc23 });
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[v_d81136.ball, v_1dd864.getLayout()]}
      {...v_ae4231.panHandlers}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        accessibilityLabel="dev-ball-button"
        style={v_d81136.bubble}
        onPress={() => v_b4a964((v_b6c474) => !v_b6c474)}
      >
        <Feather name="tool" size={22} color="#fff" />
      </TouchableOpacity>

      {v_83c574 && (
        <View style={v_d81136.menu}>
          <TouchableOpacity
            style={v_d81136.row}
            onPress={() => {
              v_b4a964(false);
              v_e4706a(true);
            }}
          >
            <Feather name="user" size={16} color="#fff" />
            <Text style={v_d81136.rowText}>
              유저 스위치{v_f73be6 ? ` · ${v_f73be6.displayName}` : ''}
            </Text>
          </TouchableOpacity>
          {v_dd943a.slice(1).map((v_779914) => (
            <TouchableOpacity
              key={v_779914.label}
              style={v_d81136.row}
              onPress={() => {
                v_b4a964(false);
                v_779914.onPress();
              }}
            >
              <Feather name={v_779914.icon as any} size={16} color="#fff" />
              <Text style={v_d81136.rowText}>{v_779914.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal
        visible={v_104667}
        transparent
        animationType="fade"
        onRequestClose={() => v_e4706a(false)}
      >
        <View style={v_d81136.modalWrap}>
          <View style={v_d81136.modalCard}>
            <Text style={v_d81136.modalTitle}>유저 스위치</Text>
            <FlatList
              data={v_694b7f.users()}
              keyExtractor={(v_ceb55a) => String(v_ceb55a.id)}
              renderItem={({ item: v_8c0b26 }) => (
                <TouchableOpacity
                  style={v_d81136.userRow}
                  onPress={async () => {
                    await v_1ed7d9.getState().switchUser(v_8c0b26.id);
                    v_e4706a(false);
                  }}
                >
                  <Text style={v_d81136.userRowText}>
                    {v_8c0b26.displayName} ({v_8c0b26.handle})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => v_e4706a(false)}
              style={v_d81136.closeBtn}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const v_d81136 = v_472849.create({
  ball: { position: 'absolute', zIndex: 9999 },
  bubble: {
    width: v_88dc4d,
    height: v_88dc4d,
    borderRadius: v_88dc4d / 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  menu: {
    position: 'absolute',
    left: v_88dc4d + 8,
    top: 0,
    backgroundColor: '#111',
    padding: 10,
    borderRadius: 8,
    minWidth: 180,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  rowText: { color: '#fff' },
  modalWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  userRow: {
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  userRowText: { fontSize: 14, color: '#111' },
  closeBtn: { marginTop: 8, alignSelf: 'flex-end', padding: 8 },
});
