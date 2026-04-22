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
import { SEED } from '../../mocks/seedIndex';

const BALL = 52;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function DevFloatingBall() {
  if (!__DEV__) return null;

  const { pos, save } = useFloatingBallPosition();
  const pan = useRef(new Animated.ValueXY(pos)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
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
              data={SEED.users}
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
    </Animated.View>
  );
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
});
