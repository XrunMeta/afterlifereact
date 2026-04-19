import v_a3453e, { v_c4deb2 } from "bapkr";
import { v_39a996, v_3094a2, v_472849 } from "rcmrninabrnb";
import { v_709be7 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b, v_384e19 } from "./types";
import { v_1ed7d9 } from "../stores/authStore";
import { v_1bfbd0 } from "../components/constants";

import v_f4f851 from "../screens/auth/LoginScreen";
import v_f40fc5 from "../screens/auth/SignupScreen";

import v_19ba0e from "./MainTabNavigator";

import v_02d653 from "../screens/clone-interaction/ChatScreen";
import v_bfc6c1 from "../screens/clone-interaction/CallScreen";

const v_36a793 = v_709be7<v_8ad91b>();
const v_e8bc89 = v_709be7<v_384e19>();

function v_aebbaf() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={v_f4f851} />
      <AuthStack.Screen name="Signup" component={v_f40fc5} />
    </AuthStack.Navigator>
  );
}

function v_fc35d6() {
  return (
    <View style={v_d81136.splash}>
      <ActivityIndicator size="large" color={v_1bfbd0.violet500} />
    </View>
  );
}

export default function v_3b950c() {
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);
  const v_6726fa = v_1ed7d9((v_fd5f43) => v_fd5f43.bootstrapping);
  const v_fec8f7 = v_1ed7d9((v_fd5f43) => v_fd5f43.bootstrap);

  v_c4deb2(() => {
    v_fec8f7();
  }, [v_fec8f7]);

  if (v_6726fa) {
    return <BootstrapSplash />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!v_042a8b ? (
        <RootStack.Screen name="Auth" component={v_aebbaf} />
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
        </>
      )}
    </RootStack.Navigator>
  );
}

const v_d81136 = v_472849.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.zinc50,
  },
});
