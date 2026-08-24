import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList, AuthStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import { usePermissionGate } from "../permissions/usePermissionGate";
import PermissionGateScreen from "../permissions/PermissionGateScreen";

import { registerPurchaseListeners } from "../lib/iap";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import EmailVerifyScreen from "../screens/auth/EmailVerifyScreen";

import EmailOtpLoginScreen from "../screens/auth/EmailOtpLoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

import MainTabNavigator from "./MainTabNavigator";

import ChatScreen from "../screens/clone-interaction/ChatScreen";
import CallScreen from "../screens/clone-interaction/CallScreen";

import PreCallFaceEnrollScreen from "../screens/face-enroll/PreCallFaceEnrollScreen";
import InviteAcceptScreen from "../screens/clones/InviteAcceptScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import UserProfileScreen from "../screens/user/UserProfileScreen";
import UserFollowListScreen from "../screens/user/UserFollowListScreen";
import CloneFeedScreen from "../screens/clones/CloneFeedScreen";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="EmailVerify" component={EmailVerifyScreen} />
      {}
      <AuthStack.Screen name="EmailOtpLogin" component={EmailOtpLoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;
    const unregister = registerPurchaseListeners();
    return () => unregister();
  }, [isLoggedIn]);

  const { decision, loading: permLoading } = usePermissionGate();

  const permGateBlocking = isLoggedIn && (permLoading || !decision.pass);

  if (permGateBlocking) {

    return <PermissionGateScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <RootStack.Screen name="Auth" component={AuthNavigator} />
          {}
          <RootStack.Screen name="InviteAccept" component={InviteAcceptScreen} />
        </>
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

              animation: "none",
            }}
          />
          {}
          <RootStack.Screen
            name="PreCallFaceEnroll"
            component={PreCallFaceEnrollScreen}
            options={{ presentation: "fullScreenModal", animation: "fade" }}
          />
          <RootStack.Screen name="InviteAccept" component={InviteAcceptScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
          <RootStack.Screen name="UserFollowList" component={UserFollowListScreen} />
          <RootStack.Screen
            name="CloneFeed"
            component={CloneFeedScreen}
            options={{ animation: "slide_from_right" }}
          />
          {

}
          <RootStack.Screen
            name="ResetPassword"
            component={ForgotPasswordScreen}
            options={{ animation: "slide_from_right" }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
