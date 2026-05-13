import './src/i18n';
import { useEffect, useState } from "react";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useFonts } from "expo-font";
import RootNavigator from "./src/navigation/RootNavigator";
import { useAuthStore } from "./src/stores/authStore";
import { useFollowStore } from "./src/stores/followStore";
import { useConfigStore } from "./src/stores/configStore";
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

  const [fontsLoaded, fontsError] = useFonts({
    feather: require("./assets/fonts/feather.ttf"),
    ionicons: require("./assets/fonts/ionicons.ttf"),
  });

  useEffect(() => {
    if (fontsError) {
      console.warn("[App] icon font load error (non-blocking):", fontsError);
    } else if (fontsLoaded) {
      console.log("[App] icon fonts loaded — feather/ionicons");
    }
  }, [fontsLoaded, fontsError]);

  useEffect(() => {
    Promise.all([
      useAuthStore.getState().hydrate(),
      useFollowStore.getState().hydrate(),
      useConfigStore.getState().hydrate(),
    ]).then(() => {
      setReady(true);

      const token = useAuthStore.getState().accessToken;
      if (token) registerPushTokenIfReady(token);
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
