import './src/i18n';
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { DevFloatingBall } from "./src/components/dev/DevFloatingBall";
import { BaseUrlBadge } from "./src/components/dev/BaseUrlBadge";
import { useAuthStore } from "./src/stores/authStore";
import { useFollowStore } from "./src/stores/followStore";
import { useConfigStore } from "./src/stores/configStore";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      useAuthStore.getState().hydrate(),
      useFollowStore.getState().hydrate(),
      useConfigStore.getState().hydrate(),
    ]).then(() => setReady(true));
  }, []);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
        <BaseUrlBadge />
        {__DEV__ && <DevFloatingBall />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
