

import { useEffect, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { CommonActions } from "@react-navigation/native";
import i18n from "../i18n";
import { navigationRef } from "./navigationRef";
import {
  decideAndroidBack,
  getActiveMainTabName,
  getRootRouteName,
} from "./androidBackPolicy";

const EXIT_ARM_MS = 2000;

export function useAndroidBackHandler(): void {
  const lastExitConfirmAt = useRef(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBackPress = (): boolean => {
      if (!navigationRef.isReady()) {
        return true;
      }

      const rootState = navigationRef.getRootState();
      const now = Date.now();
      const exitArmed = now - lastExitConfirmAt.current < EXIT_ARM_MS;

      const action = decideAndroidBack({
        canGoBack: navigationRef.canGoBack(),
        rootRouteName: getRootRouteName(rootState),
        activeTabName: getActiveMainTabName(rootState),
        exitArmed,
      });

      switch (action.type) {
        case "defer":
          lastExitConfirmAt.current = 0;

          return false;

        case "goHomeTab":
          lastExitConfirmAt.current = 0;
          navigationRef.dispatch(
            CommonActions.navigate({
              name: "Main",
              params: { screen: "HomeTab" },
            }),
          );
          return true;

        case "exitConfirm": {
          lastExitConfirmAt.current = now;
          const msg = i18n.t("common.pressBackToExit", {
            defaultValue: "한 번 더 누르면 종료됩니다",
          });
          ToastAndroid.show(msg, ToastAndroid.SHORT);
          return true;
        }

        case "exitNow":
          lastExitConfirmAt.current = 0;
          BackHandler.exitApp();
          return true;

        case "noop":
        default:
          return true;
      }
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
    return () => sub.remove();
  }, []);
}
