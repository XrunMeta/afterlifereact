

import React, { useRef } from "react";
import { Animated, PanResponder, StyleSheet, View, type ViewStyle } from "react-native";

interface Props {
  onClose: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;

  handleZoneHeight?: number;

  closeThreshold?: number;
}

export default function SwipeDownSheet({
  onClose,
  style,
  children,
  handleZoneHeight = 48,
  closeThreshold = 60,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({

      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > closeThreshold || g.vy > 0.5) {

          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        Array.isArray(style) ? style : style ? [style] : [],
        { transform: [{ translateY }] },
      ]}

      onStartShouldSetResponder={() => true}
    >
      {}
      <View
        {...panResponder.panHandlers}
        style={[styles.handleZone, { height: handleZoneHeight }]}
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({

  handleZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
