import React, { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList, AuthStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import { COLORS } from "../components/constants";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

import MainTabNavigator from "./MainTabNavigator";

import ChatScreen from "../screens/clone-interaction/ChatScreen";
import CallScreen from "../screens/clone-interaction/CallScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function BootstrapSplash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={COLORS.violet500} />
    </View>
  );
}

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (bootstrapping) {
    return <BootstrapSplash />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ presentation: "modal" }}
          />
          <RootStack.Screen
            name="Call"
            component={CallScreen}
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.zinc50,
  },
});
