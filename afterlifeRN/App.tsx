import './src/i18n';
import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_ac28fd, type v_4c916c } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "./src/navigation/navigationRef";
import { v_70c669 } from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_b2c639 } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_472849, v_3094a2 } from "rcmrninabrnb";
import v_3b950c from "./src/navigation/RootNavigator";
import v_d714a5 from "./src/components/ui/AppDialog";
import { v_1ed7d9 } from "./src/stores/authStore";
import { v_b4902e } from "./src/stores/followStore";
import { v_98d20a } from "./src/stores/userFollowStore";
import { v_0b10a6 } from "./src/stores/configStore";
import { v_5b540b } from "./src/stores/callConfigStore";
import { v_688424 } from "./src/stores/authConfigStore";
import { v_9bedf5 } from "./src/lib/pushNotifications";
import {
  v_8237ac,
  v_1d7e9a,
} from "./src/lib/cloneShareDeferredLink";
import type { v_8ad91b } from "./src/navigation/types";

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
    },
  },
};

export default function v_6540c3() {
  const [v_b1717e, v_0189ac] = v_5ab095(false);

  v_c4deb2(() => {
    Promise.all([
      v_1ed7d9.getState().hydrate(),
      v_b4902e.getState().hydrate(),
      v_0b10a6.getState().hydrate(),
      v_5b540b.getState().hydrate(),
      v_688424.getState().hydrate(),
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
        <NavigationContainer ref={v_94c936} linking={v_141151}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
        {}
        <AppDialog />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1 },
});
