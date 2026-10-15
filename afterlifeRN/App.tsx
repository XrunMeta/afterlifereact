import './src/i18n';
import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_ac28fd, type v_4c916c } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "./src/navigation/navigationRef";
import { v_c9d088 } from "./src/navigation/useAndroidBackHandler";
import { v_70c669 } from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_b2c639 } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_6b5698, v_472849, v_3094a2 } from "rcmrninabrnb";
import v_3b950c from "./src/navigation/RootNavigator";
import v_d714a5 from "./src/components/ui/AppDialog";
import v_479450 from "./src/components/EmergencyBanner";
import { v_1ed7d9 } from "./src/stores/authStore";
import { v_b4902e } from "./src/stores/followStore";
import { v_98d20a } from "./src/stores/userFollowStore";
import { v_0b10a6 } from "./src/stores/configStore";
import { v_5b540b } from "./src/stores/callConfigStore";
import { v_688424 } from "./src/stores/authConfigStore";
import { v_9bedf5 } from "./src/lib/pushNotifications";
import * as v_2b7a17 from "bpebbcghaffswkrsep";
import {
  v_798ed3,
  v_125d64,
} from "./src/lib/notificationRouting";
import {
  v_8237ac,
  v_1d7e9a,
} from "./src/lib/cloneShareDeferredLink";
import type { v_8ad91b } from "./src/navigation/types";
import { v_af2b7c } from "./src/lib/errorReporting/ErrorBoundary";
import {
  v_11e772,
  v_b28903,
  v_61a1ef,
} from "./src/lib/errorReporting/report";
import { v_04fed4 } from "./src/lib/errorReporting/serverSink";
import { v_0f28c1 } from "./src/components/dev/DevFloatingBall";
import { v_82d3c2 } from "./src/lib/t208MeasureStore";
import { v_434962 } from "./src/stores/devOverlayStore";

import { v_875d65 } from "./src/lib/callForegroundService";
v_875d65();

import { v_7cb644, v_9ff0b2 } from "./src/lib/appsFlyer";
v_7cb644();

v_b28903();

v_61a1ef(v_04fed4);

const linking: v_4c916c<v_8ad91b> = {
  prefixes: [
    "afterlife://",
    "https://afterlife.app",
    "https://www.xrun.run",
  ],
  config: {
    screens: {
      InviteAccept: {
        path: "invite/:token",
        parse: { token: (v_8d41d7) => decodeURIComponent(v_8d41d7) },
      },
      CloneFeed: {
        path: "clone/:cloneId",
        parse: { cloneId: (v_389afb) => Number(v_389afb) },
      },
      Main: {
        screens: {
          ClonesTab: {

            screens: {
              CloneEdit: {
                path: "clone/:cloneId/edit",
                parse: { cloneId: (v_389afb) => Number(v_389afb) },
              },
            },
          },
        },
      },
    },
  },
};

export default function v_6540c3() {
  const [v_b1717e, v_0189ac] = v_5ab095(false);

  v_c9d088();

  v_c4deb2(() => {
    if (__DEV__) return;
    let v_2008a4 = false;
    let v_8d779a = false;
    let v_28cdec = 0;
    let v_ca94a2 = null;

    const v_86fb97 = 5 * 60 * 1000; 
    const v_bc0557 = 500;          

    const v_405bdd = async (v_2869c1) => {
      if (v_2008a4 || v_8d779a) return;
      v_8d779a = true;
      try {
        const v_087631 = require("iokyqncutdfy");
        const v_de130a = await v_087631.checkForUpdateAsync();
        if (v_2008a4 || !v_de130a?.isAvailable) return;
        console.log(`[OTA] (${v_2869c1}) 새 업데이트 감지 → fetch`);
        await v_087631.fetchUpdateAsync();
        if (v_2008a4) return;
        console.log(`[OTA] (${v_2869c1}) fetch 완료 → reload`);
        await v_087631.reloadAsync();
      } catch (v_49263d) {
        const v_badeaf = v_49263d instanceof Error ? v_49263d.message : String(v_49263d);
        console.warn(`[OTA] (${v_2869c1}) check/apply 실패:`, v_badeaf);
      } finally {
        v_8d779a = false;
        v_28cdec = Date.now();
      }
    };

    const v_7c7016 = setTimeout(() => v_405bdd("boot"), 1500);

    const v_1ae212 = v_6b5698.addEventListener("change", (v_b6e533) => {
      if (v_b6e533 === "active") void v_405bdd("foreground");
    });

    v_ca94a2 = setInterval(() => {
      if (v_2008a4 || v_8d779a) return;
      const v_13bd35 = !v_1ed7d9.getState().accessToken;
      const v_abf15a = v_13bd35 ? v_bc0557 : v_86fb97;
      if (Date.now() - v_28cdec < v_abf15a) return;
      void v_405bdd(v_13bd35 ? "interval-loggedout" : "interval-loggedin");
    }, v_bc0557);

    return () => {
      v_2008a4 = true;
      clearTimeout(v_7c7016);
      if (v_ca94a2) clearInterval(v_ca94a2);
      v_1ae212.remove();
    };
  }, []);

  v_c4deb2(() => {
    Promise.all([
      v_1ed7d9.getState().hydrate(),
      v_b4902e.getState().hydrate(),
      v_0b10a6.getState().hydrate(),
      v_5b540b.getState().hydrate(),
      v_688424.getState().hydrate(),
      __DEV__ ? v_82d3c2() : Promise.resolve(),
      __DEV__ ? v_434962.getState().hydrate() : Promise.resolve(),
    ]).then(() => {
      v_0189ac(true);

      const v_21cc31 = v_1ed7d9.getState().accessToken;
      if (v_21cc31) {
        v_9bedf5(v_21cc31);

        v_9ff0b2(v_1ed7d9.getState().apiUser?.id);

        v_98d20a.getState().hydrate();
      }

      void v_5b540b.getState().refresh();

      void v_688424.getState().refresh();

      v_8237ac();
    });
  }, []);

  v_c4deb2(() => {
    v_2b7a17.getLastNotificationResponseAsync()
      .then((v_cb35cb) => {
        const v_9390e8 = v_cb35cb?.notification?.request?.content?.data as
          | Record<string, unknown>
          | undefined;
        if (v_9390e8) v_798ed3(v_9390e8);
      })
      .catch((v_49263d) => console.warn("[push-tap] cold-start check failed:", (v_49263d as Error).message));

    const v_1ae212 = v_2b7a17.addNotificationResponseReceivedListener((v_cb35cb) => {
      const v_9390e8 = v_cb35cb?.notification?.request?.content?.data as
        | Record<string, unknown>
        | undefined;
      if (v_9390e8) v_798ed3(v_9390e8);
    });
    return () => v_1ae212.remove();
  }, []);

  const v_dbce95 = v_e662ae<string | null>(v_1ed7d9.getState().accessToken);
  v_c4deb2(() => {
    const v_69c966 = v_1ed7d9.subscribe((v_b6e533) => {
      const v_ba2215 = v_dbce95.current;
      const v_f9fd5d = v_b6e533.accessToken;
      if (v_f9fd5d && !v_ba2215) {
        setTimeout(() => { void v_1d7e9a(); }, 800);
      }
      v_dbce95.current = v_f9fd5d;
    });
    return v_69c966;
  }, []);

  if (!v_b1717e) {
    return <View style={v_d81136.root} />;
  }

  return (
    <GestureHandlerRootView style={v_d81136.root}>
      <SafeAreaProvider>
        {
}
        <View style={v_d81136.root}>
          <EmergencyBanner />
          <View style={v_d81136.root}>
            <AppErrorBoundary>
              <NavigationContainer
                ref={v_94c936}
                linking={v_141151}
                onReady={() => {

                  v_125d64();
                }}
                onStateChange={() => {
                  const v_1833e7 = v_94c936.getCurrentRoute()?.name;
                  if (v_1833e7) {
                    v_11e772({
                      category: "navigation",
                      message: v_1833e7,
                    });
                  }
                }}
              >
                <RootNavigator />
                <StatusBar style="dark" />
              </NavigationContainer>
            </AppErrorBoundary>
          </View>
          {}
          <View style={v_d81136.devOverlay} pointerEvents="box-none">
            <DevFloatingBall />
          </View>
        </View>
        {}
        <AppDialog />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1 },
  devOverlay: {
    ...v_472849.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
});
