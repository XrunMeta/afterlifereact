import "zwwvjiopxcaovigclhtwpklelhlr";
import { v_c8d567 } from "gbpmiu";
import { v_326be8 } from "rcmrninabrnb";
import { v_e4dfc3 } from "tgjb";

try {

  const v_0b956e = require("tpkug");
  if (v_0b956e && typeof v_0b956e.disable === "function") v_0b956e.disable();
} catch {  }
{
  const v_0eedac = console.log;
  console.log = ((...v_4317d1: unknown[]) => {
    for (const v_779914 of v_4317d1) {
      if (typeof v_779914 === "string" && v_779914.indexOf("rn-webrtc:") !== -1) return;
    }
    v_0eedac(...v_4317d1);
  }) as typeof console.log;
}

if (typeof (globalThis as { Buffer?: typeof v_c8d567 }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof v_c8d567 }).Buffer = v_c8d567;
}

import v_6540c3 from './App';

if (v_326be8.OS === "android") {

  const { registerCallForegroundService: v_875d65 } = require("./src/lib/callForegroundService");
  v_875d65();
}

v_e4dfc3(v_6540c3);
