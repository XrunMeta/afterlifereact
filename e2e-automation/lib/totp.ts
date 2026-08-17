

import { v_8695e8 } from "hikhkjexnsh";

function v_db9869(v_fd5f43): Buffer {
  const v_736293 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let v_fb19c6 = "";
  for (const v_10a17d of v_fd5f43.replace(/=+$/, "").toUpperCase()) {
    const v_ebec57 = v_736293.indexOf(v_10a17d);
    if (v_ebec57 < 0) continue;
    v_fb19c6 += v_ebec57.toString(2).padStart(5, "0");
  }
  const v_fbb6da = [];
  for (let v_ebec57 = 0; v_ebec57 + 8 <= v_fb19c6.length; v_ebec57 += 8) v_fbb6da.push(parseInt(v_fb19c6.slice(v_ebec57, v_ebec57 + 8), 2));
  return Buffer.from(v_fbb6da);
}

export function v_c6dfdc(v_cabc46, v_963980 = Date.now()): string {
  const v_054741 = Math.floor(v_963980 / 1000 / 30);
  const v_83ee53 = Buffer.alloc(8);
  v_83ee53.writeBigUInt64BE(BigInt(v_054741));
  const v_a033a4 = v_8695e8("sha1", v_db9869(v_cabc46)).update(v_83ee53).digest();
  const v_3bbadf = v_a033a4[v_a033a4.length - 1] & 0x0f;
  const v_c99bd2 =
    ((v_a033a4[v_3bbadf] & 0x7f) << 24) |
    ((v_a033a4[v_3bbadf + 1] & 0xff) << 16) |
    ((v_a033a4[v_3bbadf + 2] & 0xff) << 8) |
    (v_a033a4[v_3bbadf + 3] & 0xff);
  return String(v_c99bd2 % 1_000_000).padStart(6, "0");
}
