import "react-native-gesture-handler";
import { Buffer } from "buffer";
import { registerRootComponent } from "expo";

if (typeof (globalThis as { Buffer?: typeof Buffer }).Buffer === "undefined") {
  (globalThis as { Buffer: typeof Buffer }).Buffer = Buffer;
}

import App from './App';
import { registerCallForegroundService } from './src/lib/callForegroundService';

registerCallForegroundService();

registerRootComponent(App);
