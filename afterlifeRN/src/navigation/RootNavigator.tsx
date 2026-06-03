import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList, AuthStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import EmailVerifyScreen from "../screens/auth/EmailVerifyScreen";
import XrunLoginScreen from "../screens/auth/XrunLoginScreen";
import XrunOtpScreen from "../screens/auth/XrunOtpScreen";
import XrunOnboardingScreen from "../screens/auth/XrunOnboardingScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import SignupCompleteScreen from "../screens/auth/SignupCompleteScreen";

import MainTabNavigator from "./MainTabNavigator";

import ChatScreen from "../screens/clone-interaction/ChatScreen";
import CallScreen from "../screens/clone-interaction/CallScreen";
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
      <AuthStack.Screen name="XrunLogin" component={XrunLoginScreen} />
      <AuthStack.Screen name="XrunOtp" component={XrunOtpScreen} />
      <AuthStack.Screen name="XrunOnboarding" component={XrunOnboardingScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="SignupComplete" component={SignupCompleteScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

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
              animation: "slide_from_bottom",
            }}
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
