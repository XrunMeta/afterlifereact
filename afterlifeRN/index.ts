import "react-native-gesture-handler";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import { registerRootComponent } from "expo";

{
  const _origLog = console.log;
  console.log = ((...args: unknown[]) => {
    if (args.length > 0 && typeof args[0] === "string" && args[0].startsWith("rn-webrtc:")) return;
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
