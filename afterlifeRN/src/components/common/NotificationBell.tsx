

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_4623af, v_3094a2, v_472849 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_28c6ec } from "../../api/notifications";
import { v_1bfbd0 } from "../constants";
import type { v_8ad91b } from "../../navigation/types";

type Nav = v_390fcc<v_8ad91b>;

interface Props {

  color?: string;
  size?: number;
}

const v_fbb4dd = 30 * 1000;

export default function v_0e981f({ color: v_3c2a3a = v_1bfbd0.zinc700, size: v_05b441 = 22 }: Props) {
  const v_c65f5d = v_ada615<Nav>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_a78249, v_5adea3] = v_5ab095(0);

  const v_1a1b9b = v_a3453e.useCallback(async () => {
    if (!v_2ca7e0) {
      v_5adea3(0);
      return;
    }
    try {
      const v_8f00b9 = await v_28c6ec(v_2ca7e0);
      v_5adea3(v_8f00b9.count);
    } catch {

    }
  }, [v_2ca7e0]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_1a1b9b();
      const v_8d41d7 = setInterval(v_1a1b9b, v_fbb4dd);
      return () => clearInterval(v_8d41d7);
    }, [v_1a1b9b]),
  );

  v_c4deb2(() => {
    v_1a1b9b();
  }, [v_1a1b9b]);

  return (
    <TouchableOpacity
      onPress={() => v_c65f5d.navigate("Notifications")}
      style={v_d81136.btn}
      accessibilityLabel="notifications-bell"
    >
      <Feather name="bell" size={v_05b441} color={v_3c2a3a} />
      {v_a78249 > 0 && <View style={v_d81136.dot} />}
    </TouchableOpacity>
  );
}

const v_d81136 = v_472849.create({
  btn: { padding: 4, position: "relative" },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: v_1bfbd0.error,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.white,
  },
});
