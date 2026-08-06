

import { v_c4deb2, v_e662ae } from "bapkr";
import { v_1ed974, v_326be8, v_405151 } from "rcmrninabrnb";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import v_9c213b from "../i18n";
import { v_94c936 } from "./navigationRef";
import {
  v_46aa6f,
  v_a7fe23,
  v_9469dc,
} from "./androidBackPolicy";

const v_c32d4a = 2000;

export function v_c9d088(): void {
  const v_39b8bb = v_e662ae(0);

  v_c4deb2(() => {
    if (v_326be8.OS !== "android") return;

    const v_9a7330 = (): boolean => {
      if (!v_94c936.isReady()) {
        return true;
      }

      const v_793a30 = v_94c936.getRootState();
      const v_5c2f9f = Date.now();
      const v_7d9167 = v_5c2f9f - v_39b8bb.current < v_c32d4a;

      const v_9b064f = v_46aa6f({
        canGoBack: v_94c936.canGoBack(),
        rootRouteName: v_9469dc(v_793a30),
        activeTabName: v_a7fe23(v_793a30),
        exitArmed: v_7d9167,
      });

      switch (v_9b064f.type) {
        case "defer":
          v_39b8bb.current = 0;

          return false;

        case "goHomeTab":
          v_39b8bb.current = 0;
          v_94c936.dispatch(
            v_650cfa.navigate({
              name: "Main",
              params: { screen: "HomeTab" },
            }),
          );
          return true;

        case "exitConfirm": {
          v_39b8bb.current = v_5c2f9f;
          const v_badeaf = v_9c213b.t("common.pressBackToExit", {
            defaultValue: "한 번 더 누르면 종료됩니다",
          });
          v_405151.show(v_badeaf, v_405151.SHORT);
          return true;
        }

        case "exitNow":
          v_39b8bb.current = 0;
          v_1ed974.exitApp();
          return true;

        case "noop":
        default:
          return true;
      }
    };

    const v_1ae212 = v_1ed974.addEventListener("hardwareBackPress", v_9a7330);
    return () => v_1ae212.remove();
  }, []);
}
