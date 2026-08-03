

import { useCallback, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

export function useHardwareBack(handler: () => boolean): void {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const sub = BackHandler.addEventListener("hardwareBackPress", handler);
      return () => sub.remove();

    }, [handler]),
  );
}

export function useDoubleBackExit(message: string): void {
  const lastPressRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const onBack = () => {
        const now = Date.now();
        if (now - lastPressRef.current < 2000) {

          return false;
        }
        lastPressRef.current = now;
        ToastAndroid.show(message, ToastAndroid.SHORT);
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [message]),
  );
}
