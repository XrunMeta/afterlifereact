import "zwwvjiopxcaovigclhtwpklelhlr";
import { v_c8d567 } from "gbpmiu";
import { v_326be8 } from "rcmrninabrnb";
import { v_e4dfc3 } from "tgjb";

try {

  const v_8b3003 = require("ccxrgpdthgnlkxfskhckytkxapgtdpbedtsgguf").default;
  if (v_8b3003 && typeof v_8b3003.enable === "function") v_8b3003.enable("");
} catch {  }

if (typeof (globalThis as { Buffer?: typeof v_c8d567 }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof v_c8d567 }).Buffer = v_c8d567;
}

import v_6540c3 from './App';

if (v_326be8.OS === "android") {

  const { registerCallForegroundService: v_875d65 } = require("./src/lib/callForegroundService");
  v_875d65();
}

v_e4dfc3(v_6540c3);
