import './src/i18n';
import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_ac28fd, type v_4c916c } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "./src/navigation/navigationRef";
import { v_70c669 } from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_b2c639 } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_472849, v_3094a2 } from "rcmrninabrnb";
import { v_c06f2c } from "kjiqsgell";
import v_3b950c from "./src/navigation/RootNavigator";
import { v_1ed7d9 } from "./src/stores/authStore";
import { v_b4902e } from "./src/stores/followStore";
import { v_0b10a6 } from "./src/stores/configStore";
import { v_9bedf5 } from "./src/lib/pushNotifications";
import type { v_8ad91b } from "./src/navigation/types";

const linking: v_4c916c<v_8ad91b> = {
  prefixes: ["afterlife://", "https://afterlife.app"],
  config: {
    screens: {
      InviteAccept: {
        path: "invite/:token",
        parse: { token: (v_8d41d7) => decodeURIComponent(v_8d41d7) },
      },
      Main: {
        screens: {
          ClonesTab: {
            screens: {
              CloneDetail: {
                path: "clone/:cloneId",
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

  const [v_43f571, v_72be40] = v_c06f2c({
    feather: require("./assets/fonts/feather.ttf"),
    ionicons: require("./assets/fonts/ionicons.ttf"),
  });

  v_c4deb2(() => {
    if (v_72be40) {
      console.warn("[App] icon font load error (non-blocking):", v_72be40);
    } else if (v_43f571) {
      console.log("[App] icon fonts loaded — feather/ionicons");
    }
  }, [v_43f571, v_72be40]);

  v_c4deb2(() => {
    Promise.all([
      v_1ed7d9.getState().hydrate(),
      v_b4902e.getState().hydrate(),
      v_0b10a6.getState().hydrate(),
    ]).then(() => {
      v_0189ac(true);

      const v_21cc31 = v_1ed7d9.getState().accessToken;
      if (v_21cc31) v_9bedf5(v_21cc31);
    });
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1 },
});
