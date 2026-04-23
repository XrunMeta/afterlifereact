import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Modal,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFloatingBallPosition } from './useFloatingBallPosition';
import { defaultDevActions } from './DevFloatingBall.actions';
import { useAuthStore } from '../../stores/authStore';
import { seedSource } from '../../api/source';
import { getCurrentRouteName } from '../../navigation/navigationRef';
import { getApisForRoute, type ScreenApiRef } from '../../api/screenApiMap';

const BALL = 52;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function DevFloatingBall() {
  if (!__DEV__) return null;

  const { pos, save } = useFloatingBallPosition();
  const pan = useRef(new Animated.ValueXY(pos)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [apiProbeOpen, setApiProbeOpen] = useState(false);
  const [probeData, setProbeData] = useState<{ route: string; apis: ScreenApiRef[] } | null>(null);
  const actions = defaultDevActions();
  const currentUser = useAuthStore((s) => s.user);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: async (_, g) => {
        pan.flattenOffset();
        const snapLeft = g.moveX < SCREEN_W / 2;
        const nextX = snapLeft ? 0 : SCREEN_W - BALL;
        const clampedY = Math.max(
          40,
          Math.min(SCREEN_H - BALL - 40, (pan.y as any)._value),
        );
        pan.setValue({ x: nextX, y: clampedY });
        await save({ x: nextX, y: clampedY });
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.ball, pan.getLayout()]}
      {...responder.panHandlers}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        accessibilityLabel="dev-ball-button"
        style={styles.bubble}
        onPress={() => setMenuOpen((o) => !o)}
      >
        <Feather name="tool" size={22} color="#fff" />
      </TouchableOpacity>

      {menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setMenuOpen(false);
              setSwitcherOpen(true);
            }}
          >
            <Feather name="user" size={16} color="#fff" />
            <Text style={styles.rowText}>
              유저 스위치{currentUser ? ` · ${currentUser.displayName}` : ''}
            </Text>
          </TouchableOpacity>
          {actions.slice(1).map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.row}
              onPress={() => {
                setMenuOpen(false);
                a.onPress();
              }}
            >
              <Feather name={a.icon as any} size={16} color="#fff" />
              <Text style={styles.rowText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.row}
            accessibilityLabel="dev-api-probe"
            onPress={() => {
              const route = getCurrentRouteName() ?? '(unknown)';
              setProbeData({ route, apis: getApisForRoute(route) });
              setMenuOpen(false);
              setApiProbeOpen(true);
            }}
          >
            <Feather name="activity" size={16} color="#fff" />
            <Text style={styles.rowText}>API Probe</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={switcherOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherOpen(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>유저 스위치</Text>
            <FlatList
              data={seedSource.users()}
              keyExtractor={(u) => String(u.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={async () => {
                    await useAuthStore.getState().switchUser(item.id);
                    setSwitcherOpen(false);
                  }}
                >
                  <Text style={styles.userRowText}>
                    {item.displayName} ({item.handle})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              onPress={() => setSwitcherOpen(false)}
              style={styles.closeBtn}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={apiProbeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setApiProbeOpen(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard} accessibilityLabel="dev-api-probe-card">
            <Text style={styles.modalTitle}>
              API Probe · {probeData?.route ?? '-'}
            </Text>
            {probeData && probeData.apis.length === 0 ? (
              <Text style={styles.apiEmpty}>이 화면에 매핑된 API 없음</Text>
            ) : (
              <FlatList
                data={probeData?.apis ?? []}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <View style={styles.apiRow}>
                    <Text style={[styles.apiMethod, methodStyle(item.method)]}>
                      {item.method}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apiPath}>{item.path}</Text>
                      {item.note ? (
                        <Text style={styles.apiNote}>{item.note}</Text>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            )}
            <TouchableOpacity
              onPress={() => setApiProbeOpen(false)}
              style={styles.closeBtn}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function methodStyle(m: string) {
  switch (m) {
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

const styles = StyleSheet.create({
  ball: { position: 'absolute', zIndex: 9999 },
  bubble: {
    width: BALL,
    height: BALL,
    borderRadius: BALL / 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  menu: {
    position: 'absolute',
    left: BALL + 8,
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
