import v_a3453e from "bapkr";
import { v_709be7 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b, v_384e19 } from "./types";
import { v_1ed7d9 } from "../stores/authStore";
import { v_b5d684 } from "../permissions/usePermissionGate";
import v_6d377c from "../permissions/PermissionGateScreen";

import v_f4f851 from "../screens/auth/LoginScreen";
import v_f40fc5 from "../screens/auth/SignupScreen";
import v_e1aa8b from "../screens/auth/EmailVerifyScreen";

import v_415807 from "../screens/auth/EmailOtpLoginScreen";
import v_040c8f from "../screens/auth/ForgotPasswordScreen";
import v_933130 from "../screens/auth/SignupCompleteScreen";

import v_19ba0e from "./MainTabNavigator";

import v_02d653 from "../screens/clone-interaction/ChatScreen";
import v_bfc6c1 from "../screens/clone-interaction/CallScreen";
import v_000f0a from "../screens/clones/InviteAcceptScreen";
import v_18ad36 from "../screens/notifications/NotificationsScreen";
import v_c501aa from "../screens/user/UserProfileScreen";
import v_7d236a from "../screens/user/UserFollowListScreen";
import v_9887a2 from "../screens/clones/CloneFeedScreen";

const v_36a793 = v_709be7<v_8ad91b>();
const v_e8bc89 = v_709be7<v_384e19>();

function v_aebbaf() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={v_f4f851} />
      <AuthStack.Screen name="Signup" component={v_f40fc5} />
      <AuthStack.Screen name="EmailVerify" component={v_e1aa8b} />
      {}
      <AuthStack.Screen name="EmailOtpLogin" component={v_415807} />
      <AuthStack.Screen name="ForgotPassword" component={v_040c8f} />
      <AuthStack.Screen name="SignupComplete" component={v_933130} />
    </AuthStack.Navigator>
  );
}

export default function v_3b950c() {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);

  const { decision: v_403b73, loading: v_decd98 } = v_b5d684();

  const v_8a15d2 = v_042a8b && (v_decd98 || !v_403b73.pass);

  if (v_8a15d2) {

    return <PermissionGateScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!v_042a8b ? (
        <>
          <RootStack.Screen name="Auth" component={v_aebbaf} />
          {}
          <RootStack.Screen name="InviteAccept" component={v_000f0a} />
        </>
      ) : (
        <>
          <RootStack.Screen name="Main" component={v_19ba0e} />
          <RootStack.Screen
            name="Chat"
            component={v_02d653}
            options={{ presentation: "modal" }}
          />
          <RootStack.Screen
            name="Call"
            component={v_bfc6c1}
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <RootStack.Screen name="InviteAccept" component={v_000f0a} />
          <RootStack.Screen name="Notifications" component={v_18ad36} />
          <RootStack.Screen name="UserProfile" component={v_c501aa} />
          <RootStack.Screen name="UserFollowList" component={v_7d236a} />
          <RootStack.Screen
            name="CloneFeed"
            component={v_9887a2}
            options={{ animation: "slide_from_right" }}
          />
          {

}
          <RootStack.Screen
            name="ResetPassword"
            component={v_040c8f}
            options={{ animation: "slide_from_right" }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
