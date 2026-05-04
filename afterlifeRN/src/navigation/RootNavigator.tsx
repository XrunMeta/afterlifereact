import v_a3453e from "bapkr";
import { v_709be7 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b, v_384e19 } from "./types";
import { v_1ed7d9 } from "../stores/authStore";

import v_f4f851 from "../screens/auth/LoginScreen";
import v_f40fc5 from "../screens/auth/SignupScreen";
import v_e1aa8b from "../screens/auth/EmailVerifyScreen";
import v_61d670 from "../screens/auth/XrunLoginScreen";
import v_e24882 from "../screens/auth/XrunOtpScreen";
import v_033f95 from "../screens/auth/XrunOnboardingScreen";

import v_19ba0e from "./MainTabNavigator";

import v_02d653 from "../screens/clone-interaction/ChatScreen";
import v_bfc6c1 from "../screens/clone-interaction/CallScreen";
import v_000f0a from "../screens/clones/InviteAcceptScreen";
import v_18ad36 from "../screens/notifications/NotificationsScreen";

const v_36a793 = v_709be7<v_8ad91b>();
const v_e8bc89 = v_709be7<v_384e19>();

function v_aebbaf() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={v_f4f851} />
      <AuthStack.Screen name="Signup" component={v_f40fc5} />
      <AuthStack.Screen name="EmailVerify" component={v_e1aa8b} />
      <AuthStack.Screen name="XrunLogin" component={v_61d670} />
      <AuthStack.Screen name="XrunOtp" component={v_e24882} />
      <AuthStack.Screen name="XrunOnboarding" component={v_033f95} />
    </AuthStack.Navigator>
  );
}

export default function v_3b950c() {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);

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
        </>
      )}
    </RootStack.Navigator>
  );
}
