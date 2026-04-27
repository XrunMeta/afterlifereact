import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList, AuthStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import EmailVerifyScreen from "../screens/auth/EmailVerifyScreen";

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
      <AuthStack.Screen name="EmailVerify" component={EmailVerifyScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

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
