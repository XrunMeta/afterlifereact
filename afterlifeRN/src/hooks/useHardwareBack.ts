

import { v_de06a3, v_e662ae } from "bapkr";
import { v_1ed974, v_326be8, v_405151 } from "rcmrninabrnb";
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";

export function v_8372de(v_689657): void {
  v_cf763b(
    v_de06a3(() => {
      if (v_326be8.OS !== "android") return;
      const v_1ae212 = v_1ed974.addEventListener("hardwareBackPress", v_689657);
      return () => v_1ae212.remove();

    }, [v_689657]),
  );
}

export function v_1a7803(v_a8cd21): void {
  const v_e09c78 = v_e662ae<number>(0);
  v_cf763b(
    v_de06a3(() => {
      if (v_326be8.OS !== "android") return;
      const v_64ccfb = () => {
        const v_5c2f9f = Date.now();
        if (v_5c2f9f - v_e09c78.current < 2000) {

          return false;
        }
        v_e09c78.current = v_5c2f9f;
        v_405151.show(v_a8cd21, v_405151.SHORT);
        return true;
      };
      const v_1ae212 = v_1ed974.addEventListener("hardwareBackPress", v_64ccfb);
      return () => v_1ae212.remove();
    }, [v_a8cd21]),
  );
}
