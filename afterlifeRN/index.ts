import "react-native-gesture-handler";
import { Buffer } from "buffer";
import { Platform } from "react-native";
import { registerRootComponent } from "expo";

if (typeof (globalThis as { Buffer?: typeof Buffer }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import App from './App';

if (Platform.OS === "android") {

  const { registerCallForegroundService } = require("./src/lib/callForegroundService");
  registerCallForegroundService();
}

registerRootComponent(App);
