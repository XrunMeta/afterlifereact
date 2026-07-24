

import v_a3453e from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_326be8 } from "rcmrninabrnb";
import v_c9be60 from "qfrscldecidiqs";
import { v_8cbe29 } from "iokyqncutdfy";
import { v_1bfbd0 } from "../constants";
import { v_3752e7, v_8f6de1 } from "./appVersionInfo";

export default function v_0e3f52() {
  const { currentlyRunning: v_c558ca } = v_8cbe29();

  const v_807c28 =
    v_326be8.OS === "ios"
      ? v_c9be60.expoConfig?.ios?.buildNumber
      : v_c9be60.expoConfig?.android?.versionCode;
  const v_b2ed1f = v_8f6de1(v_c9be60.expoConfig?.version, v_807c28);
  const v_08f111 = v_3752e7(v_c558ca);
  const v_8e9fad = v_c558ca.channel;

  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.line}>{v_b2ed1f}</Text>
      <Text style={v_d81136.line}>{v_08f111}</Text>
      {v_8e9fad ? <Text style={v_d81136.dim}>ch: {v_8e9fad}</Text> : null}
    </View>
  );
}

const v_d81136 = v_472849.create({
  wrap: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
    gap: 2,
  },
  line: {
    fontSize: 11,
    color: v_1bfbd0.zinc400,
  },
  dim: {
    fontSize: 10,
    color: v_1bfbd0.zinc300,
  },
});
