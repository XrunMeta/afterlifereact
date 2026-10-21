

import { v_c4deb2, v_e662ae } from "bapkr";
import { v_1ed974, v_326be8, v_405151 } from "rcmrninabrnb";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import v_9c213b from "../i18n";
import { v_94c936 } from "./navigationRef";
import {
  v_66c23e,
  v_46aa6f,
  v_a7fe23,
  v_9469dc,
} from "./androidBackPolicy";

const v_c32d4a = 2000;

function v_815654(v_666f69): { screen: string; params?: object } {
  if (v_666f69 === "ClonesTab") {
    return { screen: "ClonesTab", params: { screen: "Dashboard" } };
  }
  if (v_666f69 === "MyTab") {
    return { screen: "MyTab", params: { screen: "MyHome" } };
  }
  return { screen: v_666f69 };
}

export function v_c9d088(): void {
  const v_39b8bb = v_e662ae(0);
  const v_84ba1e = v_e662ae<string | undefined>(undefined);
  const v_b2c58c = v_e662ae<string | undefined>(undefined);

  v_c4deb2(() => {
    if (v_326be8.OS !== "android") return;

    const v_477122 = () => {
      if (!v_94c936.isReady()) return;
      const v_11083e = v_a7fe23(v_94c936.getRootState());
      if (!v_11083e) return;
      if (v_11083e !== v_84ba1e.current) {

        if (v_84ba1e.current && v_84ba1e.current !== "MyTab") {
          v_b2c58c.current = v_84ba1e.current;
        }
        v_84ba1e.current = v_11083e;
      }
    };

    v_477122();
    const v_69c966 = v_94c936.addListener("state", v_477122);

    const v_9a7330 = (): boolean => {
      if (!v_94c936.isReady()) {
        return true;
      }

      const v_793a30 = v_94c936.getRootState();
      v_477122();
      const v_5c2f9f = Date.now();
      const v_7d9167 = v_5c2f9f - v_39b8bb.current < v_c32d4a;
      const v_be18c1 = v_94c936.getCurrentRoute()?.name;
      const v_5fe56f = v_a7fe23(v_793a30);
      const v_00082d = v_66c23e(v_793a30);

      if (v_be18c1 === "MyHome") {
        v_39b8bb.current = 0;
        v_94c936.dispatch(
          v_650cfa.navigate({
            name: "Main",
            params: v_815654("ClonesTab"),
          }),
        );
        return true;
      }

      const v_9b064f = v_46aa6f({
        canGoBack: v_00082d,
        rootRouteName: v_9469dc(v_793a30),
        activeTabName: v_5fe56f,
        previousTabName: v_b2c58c.current,
        exitArmed: v_7d9167,
      });

      switch (v_9b064f.type) {
        case "defer":
          v_39b8bb.current = 0;

          return false;

        case "goTab": {
          v_39b8bb.current = 0;
          v_94c936.dispatch(
            v_650cfa.navigate({
              name: "Main",
              params: v_815654(v_9b064f.tabName),
            }),
          );
          return true;
        }

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
    return () => {
      v_69c966();
      v_1ae212.remove();
    };
  }, []);
}
