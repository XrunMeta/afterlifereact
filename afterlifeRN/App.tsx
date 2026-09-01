import './src/i18n';
import { useEffect, useRef, useState } from "react";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAndroidBackHandler } from "./src/navigation/useAndroidBackHandler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppState, StyleSheet, View } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import AppDialog from "./src/components/ui/AppDialog";
import EmergencyBanner from "./src/components/EmergencyBanner";
import { useAuthStore } from "./src/stores/authStore";
import { useFollowStore } from "./src/stores/followStore";
import { useUserFollowStore } from "./src/stores/userFollowStore";
import { useConfigStore } from "./src/stores/configStore";
import { useCallConfigStore } from "./src/stores/callConfigStore";
import { useAuthConfigStore } from "./src/stores/authConfigStore";
import { registerPushTokenIfReady } from "./src/lib/pushNotifications";
import * as Notifications from "expo-notifications";
import {
  routeFromNotificationData,
  flushPendingNotificationRoute,
} from "./src/lib/notificationRouting";
import {
  initCloneShareDeferredLink,
  consumePendingCloneShare,
} from "./src/lib/cloneShareDeferredLink";
import type { RootStackParamList } from "./src/navigation/types";
import { AppErrorBoundary } from "./src/lib/errorReporting/ErrorBoundary";
import {
  addBreadcrumb,
  installGlobalErrorHandlers,
  setErrorReportingSink,
} from "./src/lib/errorReporting/report";
import { serverSink } from "./src/lib/errorReporting/serverSink";
import { DevFloatingBall } from "./src/components/dev/DevFloatingBall";
import { hydrateT208Crops } from "./src/lib/t208MeasureStore";
import { useDevOverlayStore } from "./src/stores/devOverlayStore";

import { registerCallForegroundService } from "./src/lib/callForegroundService";
registerCallForegroundService();

installGlobalErrorHandlers();

setErrorReportingSink(serverSink);

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "afterlife://",
    "https://afterlife.app",
    "https://www.xrun.run",
  ],
  config: {
    screens: {
      InviteAccept: {
        path: "invite/:token",
        parse: { token: (t: string) => decodeURIComponent(t) },
      },
      CloneFeed: {
        path: "clone/:cloneId",
        parse: { cloneId: (id: string) => Number(id) },
      },
      Main: {
        screens: {
          ClonesTab: {

            screens: {
              CloneEdit: {
                path: "clone/:cloneId/edit",
                parse: { cloneId: (id: string) => Number(id) },
              },
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const [ready, setReady] = useState(false);

  useAndroidBackHandler();

  useEffect(() => {
    if (__DEV__) return;
    let cancelled = false;
    let checking = false;
    let lastCheckAt = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const INTERVAL_LOGGED_IN_MS = 5 * 60 * 1000; 
    const INTERVAL_LOGGED_OUT_MS = 500;          

    const runCheck = async (label: string) => {
      if (cancelled || checking) return;
      checking = true;
      try {
        const Updates = require("expo-updates");
        const check = await Updates.checkForUpdateAsync();
        if (cancelled || !check?.isAvailable) return;
        console.log(`[OTA] (${label}) 새 업데이트 감지 → fetch`);
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        console.log(`[OTA] (${label}) fetch 완료 → reload`);
        await Updates.reloadAsync();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[OTA] (${label}) check/apply 실패:`, msg);
      } finally {
        checking = false;
        lastCheckAt = Date.now();
      }
    };

    const bootTimer = setTimeout(() => runCheck("boot"), 1500);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runCheck("foreground");
    });

    intervalId = setInterval(() => {
      if (cancelled || checking) return;
      const isLoggedOut = !useAuthStore.getState().accessToken;
      const minInterval = isLoggedOut ? INTERVAL_LOGGED_OUT_MS : INTERVAL_LOGGED_IN_MS;
      if (Date.now() - lastCheckAt < minInterval) return;
      void runCheck(isLoggedOut ? "interval-loggedout" : "interval-loggedin");
    }, INTERVAL_LOGGED_OUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(bootTimer);
      if (intervalId) clearInterval(intervalId);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    Promise.all([
      useAuthStore.getState().hydrate(),
      useFollowStore.getState().hydrate(),
      useConfigStore.getState().hydrate(),
      useCallConfigStore.getState().hydrate(),
      useAuthConfigStore.getState().hydrate(),
      __DEV__ ? hydrateT208Crops() : Promise.resolve(),
      __DEV__ ? useDevOverlayStore.getState().hydrate() : Promise.resolve(),
    ]).then(() => {
      setReady(true);

      const token = useAuthStore.getState().accessToken;
      if (token) {
        registerPushTokenIfReady(token);

        useUserFollowStore.getState().hydrate();
      }

      void useCallConfigStore.getState().refresh();

      void useAuthConfigStore.getState().refresh();

      initCloneShareDeferredLink();
    });
  }, []);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        const data = r?.notification?.request?.content?.data as
          | Record<string, unknown>
          | undefined;
        if (data) routeFromNotificationData(data);
      })
      .catch((err) => console.warn("[push-tap] cold-start check failed:", (err as Error).message));

    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const data = r?.notification?.request?.content?.data as
        | Record<string, unknown>
        | undefined;
      if (data) routeFromNotificationData(data);
    });
    return () => sub.remove();
  }, []);

  const prevTokenRef = useRef<string | null>(useAuthStore.getState().accessToken);
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      const prev = prevTokenRef.current;
      const curr = state.accessToken;
      if (curr && !prev) {
        setTimeout(() => { void consumePendingCloneShare(); }, 800);
      }
      prevTokenRef.current = curr;
    });
    return unsub;
  }, []);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {
}
        <View style={styles.root}>
          <EmergencyBanner />
          <View style={styles.root}>
            <AppErrorBoundary>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => {

                  flushPendingNotificationRoute();
                }}
                onStateChange={() => {
                  const name = navigationRef.getCurrentRoute()?.name;
                  if (name) {
                    addBreadcrumb({
                      category: "navigation",
                      message: name,
                    });
                  }
                }}
              >
                <RootNavigator />
                <StatusBar style="dark" />
              </NavigationContainer>
            </AppErrorBoundary>
          </View>
          {}
          <View style={styles.devOverlay} pointerEvents="box-none">
            <DevFloatingBall />
          </View>
        </View>
        {}
        <AppDialog />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  devOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
});
