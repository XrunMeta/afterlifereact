import { v_c8d567 } from "gbpmiu";

const { PNG: v_f5692c } = require("gnzqmkhghsyvo") as typeof import("pngjs");
import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";

type PngImage = InstanceType<typeof v_f5692c>;

const v_82610d = 512;
const v_044e2b = 1024;

const v_d85e69 = 6;

const v_d1e3b2 = 40;

const v_b4d288 = 0.4;
const v_093162 = v_82610d * v_b4d288;

interface Rgb { r: number; g: number; b: number }

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

  const v_c56767 = Math.round((v_65a2cd - v_38d084.height) / 2);
  const v_a35347 = Math.round(v_fe598e);
  const v_92e88e = Math.round(v_8ada41) + v_c56767;

  const v_16cbb7 = await v_042412(v_cd1446);
  if (v_16cbb7) {
    v_31b50f(v_2b3f7c, v_82610d, v_044e2b, v_16cbb7, v_a35347, v_92e88e, v_38d084.width, v_38d084.height, v_093162);
  } else {

    v_a2a1a9(v_2b3f7c, { r: 0, g: 0, b: 0 });
  }

  v_5a487c(v_38d084, v_2b3f7c, v_a35347, v_92e88e);

  const v_ca0c99 = v_f5692c.sync.write(v_2b3f7c);
  const v_8d6b19 = `data:image/png;base64,${v_ca0c99.toString("base64")}`;
  const v_9610b8 = await v_516d20(v_8d6b19, [], { compress: 0.9, format: v_91a3cf.JPEG });
  return v_9610b8.uri;
}

export async function v_a73be8(v_cd1446): Promise<string | null> {
  const v_16cbb7 = await v_042412(v_cd1446);
  if (!v_16cbb7) return null;
  const { r: v_cb35cb, g: v_206b88, b: v_148ff6 } = v_16cbb7.avg;
  return `rgb(${v_cb35cb}, ${v_206b88}, ${v_148ff6})`;
}

export const v_1fbf17 = 2;

export async function v_43752b(
  v_cd1446,
  v_b6a07b,
  v_8cde4c,
  v_af05dc = 480,
): Promise<string | null> {
  const v_16cbb7 = await v_042412(v_cd1446);
  if (!v_16cbb7) return null;
  try {
    const v_b66f2c = Date.now();
    const v_e3bf0b = Math.max(1, Math.round((v_af05dc * v_8cde4c) / Math.max(1, v_b6a07b)));
    const v_6b4aa2 = v_af05dc, v_10a17d = v_e3bf0b;
    const v_956afe = v_6b4aa2 * v_1fbf17, v_65f6fa = v_10a17d * v_1fbf17;
    const v_4148d9 = Math.round((v_956afe - v_6b4aa2) / 2), v_85ddfd = Math.round((v_65f6fa - v_10a17d) / 2);
    const v_c43c95 = new v_f5692c({ width: v_956afe, height: v_65f6fa });
    const v_79c9ab = Date.now();
    v_31b50f(v_c43c95, v_956afe, v_65f6fa, v_16cbb7, v_4148d9, v_85ddfd, v_6b4aa2, v_10a17d, v_b4d288 * v_6b4aa2);
    const v_c1e570 = Date.now();
    const v_83ee53 = v_f5692c.sync.write(v_c43c95);
    const v_1de493 = `data:image/png;base64,${v_83ee53.toString("base64")}`;
    if (__DEV__) {
      console.log(
        `[T-244] padded bg ${v_956afe}x${v_65f6fa} (${((v_956afe * v_65f6fa) / 1e6).toFixed(2)}M px) · ` +
        `fill ${v_c1e570 - v_79c9ab}ms · encode ${Date.now() - v_c1e570}ms · total ${Date.now() - v_b66f2c}ms`,
      );
    }
    return v_1de493;
  } catch {
    return null;
  }
}

interface Tiny { data: v_c8d567 | Uint8Array; width: number; height: number; avg: Rgb }

async function v_042412(v_cd1446): Promise<Tiny | null> {
  try {
    const v_8f00b9 = await v_516d20(
      v_cd1446,
      [{ resize: { width: v_d85e69 } }],
      { compress: 1, format: v_91a3cf.PNG, base64: true },
    );
    if (!v_8f00b9.base64) return null;
    const v_c43c95 = v_f5692c.sync.read(v_c8d567.from(v_8f00b9.base64, "base64"));
    let v_b9b2bd = 0, v_af1e64 = 0, v_138fc0 = 0;
    const v_f4e98d = v_c43c95.width * v_c43c95.height;
    for (let v_ebec57 = 0; v_ebec57 < v_c43c95.data.length; v_ebec57 += 4) {
      v_b9b2bd += v_c43c95.data[v_ebec57]; v_af1e64 += v_c43c95.data[v_ebec57 + 1]; v_138fc0 += v_c43c95.data[v_ebec57 + 2];
    }
    return {
      data: v_c43c95.data,
      width: v_c43c95.width,
      height: v_c43c95.height,
      avg: { r: Math.round(v_b9b2bd / v_f4e98d), g: Math.round(v_af1e64 / v_f4e98d), b: Math.round(v_138fc0 / v_f4e98d) },
    };
  } catch {
    return null;
  }
}

function v_a2a1a9(v_2b3f7c, v_3f4e2e): void {
  for (let v_ebec57 = 0; v_ebec57 < v_2b3f7c.data.length; v_ebec57 += 4) {
    v_2b3f7c.data[v_ebec57] = v_3f4e2e.r;
    v_2b3f7c.data[v_ebec57 + 1] = v_3f4e2e.g;
    v_2b3f7c.data[v_ebec57 + 2] = v_3f4e2e.b;
    v_2b3f7c.data[v_ebec57 + 3] = 255;
  }
}

function v_31b50f(
  v_2b3f7c, v_e97fab, v_c577dc, v_16cbb7,
  v_4148d9, v_85ddfd, v_6b4aa2, v_10a17d, v_60b9f9,
): void {
  const { avg: v_b94caa } = v_16cbb7;
  const v_049c76 = v_16cbb7.width, v_3018ef = v_16cbb7.height;
  const v_6ec3fd = v_60b9f9 * v_60b9f9;

  for (let v_64877a = 0; v_64877a < v_c577dc; v_64877a++) {

    const v_c20139 = v_64877a < v_85ddfd ? v_85ddfd - v_64877a : (v_64877a >= v_85ddfd + v_10a17d ? v_64877a - (v_85ddfd + v_10a17d - 1) : 0);
    const v_459e8c = v_c20139 * v_c20139;

    const v_d1e044 = v_ffa902(((v_64877a - v_85ddfd) / Math.max(1, v_10a17d - 1)) * (v_3018ef - 1), 0, v_3018ef - 1);
    const v_33cd07 = Math.floor(v_d1e044), v_98efa0 = Math.min(v_33cd07 + 1, v_3018ef - 1), v_23962e = v_d1e044 - v_33cd07;

    for (let v_62c214 = 0; v_62c214 < v_e97fab; v_62c214++) {
      const v_b6c474 = (v_64877a * v_e97fab + v_62c214) * 4;
      v_2b3f7c.data[v_b6c474 + 3] = 255;

      const v_c40388 = v_62c214 < v_4148d9 ? v_4148d9 - v_62c214 : (v_62c214 >= v_4148d9 + v_6b4aa2 ? v_62c214 - (v_4148d9 + v_6b4aa2 - 1) : 0);
      const v_454b43 = v_c40388 * v_c40388 + v_459e8c;
      if (v_454b43 >= v_6ec3fd) {

        v_2b3f7c.data[v_b6c474] = v_b94caa.r; v_2b3f7c.data[v_b6c474 + 1] = v_b94caa.g; v_2b3f7c.data[v_b6c474 + 2] = v_b94caa.b;
        continue;
      }

      const v_8fbe32 = v_ffa902(((v_62c214 - v_4148d9) / Math.max(1, v_6b4aa2 - 1)) * (v_049c76 - 1), 0, v_049c76 - 1);
      const v_855751 = Math.floor(v_8fbe32), v_f0b70d = Math.min(v_855751 + 1, v_049c76 - 1), v_f83453 = v_8fbe32 - v_855751;
      const v_4e8708 = (v_33cd07 * v_049c76 + v_855751) * 4, v_4fda6f = (v_33cd07 * v_049c76 + v_f0b70d) * 4;
      const v_e48981 = (v_98efa0 * v_049c76 + v_855751) * 4, v_a2a7a3 = (v_98efa0 * v_049c76 + v_f0b70d) * 4;
      const v_8d41d7 = v_454b43 === 0 ? 0 : Math.sqrt(v_454b43) / v_60b9f9;

      for (let v_0eb677 = 0; v_0eb677 < 3; v_0eb677++) {
        const v_fbc0a4 = v_16cbb7.data[v_4e8708 + v_0eb677] * (1 - v_f83453) + v_16cbb7.data[v_4fda6f + v_0eb677] * v_f83453;
        const v_d446e6 = v_16cbb7.data[v_e48981 + v_0eb677] * (1 - v_f83453) + v_16cbb7.data[v_a2a7a3 + v_0eb677] * v_f83453;
        const v_147645 = v_fbc0a4 * (1 - v_23962e) + v_d446e6 * v_23962e;
        const v_779914 = v_0eb677 === 0 ? v_b94caa.r : v_0eb677 === 1 ? v_b94caa.g : v_b94caa.b;
        v_2b3f7c.data[v_b6c474 + v_0eb677] = (v_147645 * (1 - v_8d41d7) + v_779914 * v_8d41d7) | 0;
      }
    }
  }
}

function v_5a487c(v_38d084, v_2b3f7c, v_a35347, v_92e88e): void {
  const v_4706f3 = Math.max(0, -v_a35347);
  const v_395541 = Math.max(0, -v_92e88e);
  const v_7429d4 = Math.max(0, v_a35347);
  const v_85a673 = Math.max(0, v_92e88e);
  const v_0f3014 = Math.min(v_38d084.width - v_4706f3, v_2b3f7c.width - v_7429d4);
  const v_92e408 = Math.min(v_38d084.height - v_395541, v_2b3f7c.height - v_85a673);
  if (v_0f3014 <= 0 || v_92e408 <= 0) return;

  const v_768a5c = v_92e88e > 0;
  const v_03cb82 = v_92e88e + v_38d084.height < v_044e2b;
  const v_09a5e1 = v_a35347 > 0;
  const v_168f3e = v_a35347 + v_38d084.width < v_82610d;
  const v_1c7e8d = v_09a5e1 || v_168f3e;

  for (let v_64877a = 0; v_64877a < v_92e408; v_64877a++) {
    const v_e37af0 = v_395541 + v_64877a;
    const v_0196e5 = (v_e37af0 * v_38d084.width + v_4706f3) * 4;
    const v_389310 = ((v_85a673 + v_64877a) * v_2b3f7c.width + v_7429d4) * 4;

    let v_3ee8f1 = 1;
    if (v_768a5c) v_3ee8f1 = Math.min(v_3ee8f1, (v_e37af0 + 1) / v_d1e3b2);
    if (v_03cb82) v_3ee8f1 = Math.min(v_3ee8f1, (v_38d084.height - v_e37af0) / v_d1e3b2);
    if (v_3ee8f1 > 1) v_3ee8f1 = 1;

    if (v_3ee8f1 >= 1 && !v_1c7e8d) {

      const v_fbb6da = v_0f3014 * 4;
      if (typeof (v_38d084.data as v_c8d567).copy === "function") {
        (v_38d084.data as v_c8d567).copy(v_2b3f7c.data as v_c8d567, v_389310, v_0196e5, v_0196e5 + v_fbb6da);
      } else {
        v_2b3f7c.data.set(v_38d084.data.subarray(v_0196e5, v_0196e5 + v_fbb6da), v_389310);
      }
      continue;
    }

    for (let v_62c214 = 0; v_62c214 < v_0f3014; v_62c214++) {
      const v_e5f36b = v_4706f3 + v_62c214;
      let v_779914 = v_3ee8f1;
      if (v_09a5e1) v_779914 = Math.min(v_779914, (v_e5f36b + 1) / v_d1e3b2);
      if (v_168f3e) v_779914 = Math.min(v_779914, (v_38d084.width - v_e5f36b) / v_d1e3b2);
      if (v_779914 > 1) v_779914 = 1;
      const v_fd5f43 = v_0196e5 + v_62c214 * 4;
      const v_b6c474 = v_389310 + v_62c214 * 4;
      if (v_779914 >= 1) {
        v_2b3f7c.data[v_b6c474] = v_38d084.data[v_fd5f43];
        v_2b3f7c.data[v_b6c474 + 1] = v_38d084.data[v_fd5f43 + 1];
        v_2b3f7c.data[v_b6c474 + 2] = v_38d084.data[v_fd5f43 + 2];
      } else {
        v_2b3f7c.data[v_b6c474] = (v_2b3f7c.data[v_b6c474] * (1 - v_779914) + v_38d084.data[v_fd5f43] * v_779914) | 0;
        v_2b3f7c.data[v_b6c474 + 1] = (v_2b3f7c.data[v_b6c474 + 1] * (1 - v_779914) + v_38d084.data[v_fd5f43 + 1] * v_779914) | 0;
        v_2b3f7c.data[v_b6c474 + 2] = (v_2b3f7c.data[v_b6c474 + 2] * (1 - v_779914) + v_38d084.data[v_fd5f43 + 2] * v_779914) | 0;
      }
      v_2b3f7c.data[v_b6c474 + 3] = 255;
    }
  }
}

function v_ffa902(v_81e2ef, v_bc6da1, v_d54b9c): number {
  return v_81e2ef < v_bc6da1 ? v_bc6da1 : v_81e2ef > v_d54b9c ? v_d54b9c : v_81e2ef;
}
