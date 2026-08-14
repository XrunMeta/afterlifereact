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
  v_122070,
} from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_7ed42d } from './useFloatingBallPosition';
import { v_407cbf } from './DevFloatingBall.actions';
import { v_1ed7d9 } from '../../stores/authStore';
import { v_0b10a6 } from '../../stores/configStore';
import { v_aaabb4 } from '../../config/testModeWhitelist';
import { v_694b7f } from '../../api/source';
import { v_f387db } from '../../navigation/navigationRef';
import { v_0e82e9, type v_86d4b9 } from '../../api/screenApiMap';
import {
  v_a1183f,
  v_434962,
} from '../../stores/devOverlayStore';

const v_88dc4d = 52;
const { width: v_437248, height: v_5a448f } = v_700696.get('window');

export function v_0f28c1() {
  if (!__DEV__) return null;

  const { pos: v_9e7a9d, save: v_1e693b } = v_7ed42d();
  const v_1dd864 = v_e662ae(new v_a2349e.ValueXY(v_9e7a9d)).current;
  const [v_83c574, v_b4a964] = v_5ab095(false);
  const [v_104667, v_e4706a] = v_5ab095(false);
  const [v_36904f, v_8729ef] = v_5ab095(false);
  const [v_9ba518, v_11ece2] = v_5ab095<{ route: string; apis: v_86d4b9[] } | null>(null);
  const v_dd943a = v_407cbf();
  const v_f73be6 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_53fadb = v_0b10a6((v_fd5f43) => v_fd5f43.testMode);
  const v_44015f = v_0b10a6((v_fd5f43) => v_fd5f43.setTestMode);
  const v_42f82e =
    !!v_f73be6?.handle && v_aaabb4.has(v_f73be6.handle);

  const v_5c2f05 = v_434962((v_fd5f43) => v_fd5f43.callDevUiVisible);
  const v_181306 = v_434962((v_fd5f43) => v_fd5f43.hudVisible);
  const v_84e8fb = v_434962((v_fd5f43) => v_fd5f43.toggleHudVisible);

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

        <ScrollView
          style={v_d81136.menu}
          contentContainerStyle={v_d81136.menuContent}
          showsVerticalScrollIndicator
        >
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
          {}
          {v_dd943a
            .filter((v_779914) => v_779914.label !== '유저 스위치')
            .map((v_779914) => (
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
          <TouchableOpacity
            style={v_d81136.row}
            accessibilityLabel="dev-api-probe"
            onPress={() => {
              const v_c7daf6 = v_f387db() ?? '(unknown)';
              v_11ece2({ route: v_c7daf6, apis: v_0e82e9(v_c7daf6) });
              v_b4a964(false);
              v_8729ef(true);
            }}
          >
            <Feather name="activity" size={16} color="#fff" />
            <Text style={v_d81136.rowText}>API Probe</Text>
          </TouchableOpacity>
          {v_42f82e && (
            <TouchableOpacity
              accessibilityLabel="dev-test-mode-toggle"
              style={v_d81136.row}
              onPress={() => {
                v_44015f(!v_53fadb);
                v_b4a964(false);
              }}
            >
              <Feather name="zap" size={16} color="#fff" />
              <Text style={v_d81136.rowText}>테스트 모드 {v_53fadb ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          )}

          {
}
          <View style={v_d81136.sectionSep} />
          <Text style={v_d81136.sectionTitle}>
            통화 HUD {v_5c2f05 ? '' : '(마스터 OFF)'}
          </Text>
          {v_a1183f.map((v_8c0b26) => {
            const v_abacaa = v_181306[v_8c0b26.key] === true;
            return (
              <TouchableOpacity
                key={v_8c0b26.key}
                accessibilityLabel={`dev-hud-toggle-${v_8c0b26.key}`}
                style={v_d81136.row}
                onPress={() => v_84e8fb(v_8c0b26.key)}
              >
                <Feather
                  name={v_abacaa ? 'check-square' : 'square'}
                  size={16}
                  color={v_abacaa ? '#7CFC00' : '#6b7280'}
                />
                <Text
                  style={[
                    v_d81136.rowText,

                    !v_5c2f05 && v_d81136.rowTextMuted,
                    v_abacaa && v_5c2f05 && v_d81136.rowTextOn,
                  ]}
                >
                  {v_8c0b26.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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

      <Modal
        visible={v_36904f}
        transparent
        animationType="fade"
        onRequestClose={() => v_8729ef(false)}
      >
        <View style={v_d81136.modalWrap}>
          <View style={v_d81136.modalCard} accessibilityLabel="dev-api-probe-card">
            <Text style={v_d81136.modalTitle}>
              API Probe · {v_9ba518?.route ?? '-'}
            </Text>
            {v_9ba518 && v_9ba518.apis.length === 0 ? (
              <Text style={v_d81136.apiEmpty}>이 화면에 매핑된 API 없음</Text>
            ) : (
              <FlatList
                data={v_9ba518?.apis ?? []}
                keyExtractor={(v_37eab7, v_ebec57) => String(v_ebec57)}
                renderItem={({ item: v_8c0b26 }) => (
                  <View style={v_d81136.apiRow}>
                    <Text style={[v_d81136.apiMethod, v_80dd7f(v_8c0b26.method)]}>
                      {v_8c0b26.method}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={v_d81136.apiPath}>{v_8c0b26.path}</Text>
                      {v_8c0b26.note ? (
                        <Text style={v_d81136.apiNote}>{v_8c0b26.note}</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              onPress={() => v_8729ef(false)}
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

function v_80dd7f(v_35f85c) {
  switch (v_35f85c) {
    case 'GET':
      return { backgroundColor: '#d1fae5', color: '#065f46' };
    case 'POST':
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    case 'PUT':
    case 'PATCH':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'DELETE':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#e5e7eb', color: '#111827' };
  }
}

const v_d81136 = v_472849.create({
  ball: {
    position: 'absolute',
    zIndex: 99999,
    elevation: 99999,
  },
  bubble: {
    width: v_88dc4d,
    height: v_88dc4d,
    borderRadius: v_88dc4d / 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
    elevation: 24,
  },
  menu: {
    position: 'absolute',
    left: v_88dc4d + 8,
    top: 0,
    backgroundColor: '#111',
    borderRadius: 8,
    minWidth: 180,
    zIndex: 100000,
    elevation: 25,

    maxHeight: v_5a448f * 0.6,
  },
  menuContent: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  rowText: { color: '#fff' },
  rowTextOn: { color: '#7CFC00' },
  rowTextMuted: { color: '#6b7280' },
  sectionSep: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 6,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
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
  apiEmpty: { color: '#6b7280', paddingVertical: 12, textAlign: 'center' },
  apiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  apiMethod: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
    minWidth: 48,
    textAlign: 'center',
  },
  apiPath: { fontSize: 13, color: '#111827', fontFamily: 'Courier' },
  apiNote: { fontSize: 11, color: '#6b7280', marginTop: 2 },
});
