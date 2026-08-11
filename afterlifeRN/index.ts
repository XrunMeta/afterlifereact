import "react-native-gesture-handler";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import { registerRootComponent } from "expo";

try {

  const _dbg = require("debug");
  if (_dbg && typeof _dbg.disable === "function") _dbg.disable();
} catch {  }
{
  const _origLog = console.log;
  console.log = ((...args: unknown[]) => {
    for (const a of args) {
      if (typeof a === "string" && a.indexOf("rn-webrtc:") !== -1) return;
    }
    _origLog(...args);
  }) as typeof console.log;
}

if (typeof (globalThis as { Buffer?: typeof Buffer }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import App from './App';

if (Platform.OS === "android") {

  const { registerCallForegroundService } = require("./src/lib/callForegroundService");
  registerCallForegroundService();
}

registerRootComponent(App);
