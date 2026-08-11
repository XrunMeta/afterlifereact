import "react-native-gesture-handler";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import { registerRootComponent } from "expo";

try {

  const _Logger = require("react-native-webrtc/lib/commonjs/Logger").default;
  if (_Logger && typeof _Logger.enable === "function") _Logger.enable("");
} catch {  }

if (typeof (globalThis as { Buffer?: typeof Buffer }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import App from './App';

if (Platform.OS === "android") {

  const { registerCallForegroundService } = require("./src/lib/callForegroundService");
  registerCallForegroundService();
}

registerRootComponent(App);
