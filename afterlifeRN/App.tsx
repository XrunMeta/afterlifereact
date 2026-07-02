import './src/i18n';
import { useEffect, useState } from "react";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import AppDialog from "./src/components/ui/AppDialog";
import { useAuthStore } from "./src/stores/authStore";
import { useFollowStore } from "./src/stores/followStore";
import { useUserFollowStore } from "./src/stores/userFollowStore";
import { useConfigStore } from "./src/stores/configStore";
import { useCallConfigStore } from "./src/stores/callConfigStore";
import { registerPushTokenIfReady } from "./src/lib/pushNotifications";
import type { RootStackParamList } from "./src/navigation/types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["afterlife://", "https://afterlife.app"],
  config: {
    screens: {
      InviteAccept: {
        path: "invite/:token",
        parse: { token: (t: string) => decodeURIComponent(t) },
      },
      Main: {
        screens: {
          ClonesTab: {
            screens: {
              CloneDetail: {
                path: "clone/:cloneId",
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

  useEffect(() => {
    Promise.all([
      useAuthStore.getState().hydrate(),
      useFollowStore.getState().hydrate(),
      useConfigStore.getState().hydrate(),
      useCallConfigStore.getState().hydrate(),
    ]).then(() => {
      setReady(true);

      const token = useAuthStore.getState().accessToken;
      if (token) {
        registerPushTokenIfReady(token);

        useUserFollowStore.getState().hydrate();
      }

      void useCallConfigStore.getState().refresh();
    });
  }, []);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
        {}
        <AppDialog />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
