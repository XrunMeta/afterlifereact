import './src/i18n';
import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_ac28fd, type v_4c916c } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "./src/navigation/navigationRef";
import { v_c9d088 } from "./src/navigation/useAndroidBackHandler";
import { v_70c669 } from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_b2c639 } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_472849, v_3094a2 } from "rcmrninabrnb";
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
          {

}
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
