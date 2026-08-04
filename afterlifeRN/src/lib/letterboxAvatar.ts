import { v_c8d567 } from "gbpmiu";

const { PNG: v_f5692c } = require("gnzqmkhghsyvo") as typeof import("pngjs");
import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";

const v_82610d = 512;
const v_044e2b = 1024;

export async function v_a96eba(
  v_cd1446,
  v_708a6a,
  v_9189c0,
  v_fe598e,
  v_8ada41,
): Promise<string> {
  const v_32f7b8 = Math.max(1, Math.round(v_708a6a));
  const v_65a2cd = Math.max(1, Math.round(v_9189c0));

  const v_2d3c27 = await v_516d20(
    v_cd1446,
    [{ resize: { width: v_32f7b8 } }],
    { compress: 1, format: v_91a3cf.PNG, base64: true },
  );
  if (!v_2d3c27.base64) {
    throw new Error("letterboxToAvatar: missing base64 from resize");
  }

  const v_38d084 = v_f5692c.sync.read(v_c8d567.from(v_2d3c27.base64, "base64"));
  const v_2b3f7c = new v_f5692c({ width: v_82610d, height: v_044e2b });
  for (let v_ebec57 = 0; v_ebec57 < v_2b3f7c.data.length; v_ebec57 += 4) {
    v_2b3f7c.data[v_ebec57] = 0;
    v_2b3f7c.data[v_ebec57 + 1] = 0;
    v_2b3f7c.data[v_ebec57 + 2] = 0;
    v_2b3f7c.data[v_ebec57 + 3] = 255;
  }

  const v_c56767 = Math.round((v_65a2cd - v_38d084.height) / 2);
  v_af9b68(v_38d084, v_2b3f7c, Math.round(v_fe598e), Math.round(v_8ada41) + v_c56767);

  const v_ca0c99 = v_f5692c.sync.write(v_2b3f7c);
  const v_8d6b19 = `data:image/png;base64,${v_ca0c99.toString("base64")}`;
  const v_9610b8 = await v_516d20(v_8d6b19, [], { compress: 0.9, format: v_91a3cf.JPEG });
  return v_9610b8.uri;
}

function v_af9b68(src: v_f5692c, dst: v_f5692c, v_a35347, v_92e88e): void {
  const v_4706f3 = Math.max(0, -v_a35347);
  const v_395541 = Math.max(0, -v_92e88e);
  const v_7429d4 = Math.max(0, v_a35347);
  const v_85a673 = Math.max(0, v_92e88e);
  const v_0f3014 = Math.min(v_38d084.width - v_4706f3, v_2b3f7c.width - v_7429d4);
  const v_92e408 = Math.min(v_38d084.height - v_395541, v_2b3f7c.height - v_85a673);
  if (v_0f3014 <= 0 || v_92e408 <= 0) return;

  for (let v_64877a = 0; v_64877a < v_92e408; v_64877a++) {
    const v_0196e5 = ((v_395541 + v_64877a) * v_38d084.width + v_4706f3) * 4;
    const v_389310 = ((v_85a673 + v_64877a) * v_2b3f7c.width + v_7429d4) * 4;
    const v_fbb6da = v_0f3014 * 4;
    if (typeof (v_38d084.data as v_c8d567).copy === "function") {
      (v_38d084.data as v_c8d567).copy(v_2b3f7c.data as v_c8d567, v_389310, v_0196e5, v_0196e5 + v_fbb6da);
    } else {
      v_2b3f7c.data.set(v_38d084.data.subarray(v_0196e5, v_0196e5 + v_fbb6da), v_389310);
    }
  }
}
