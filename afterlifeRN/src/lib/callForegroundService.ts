

import v_2dc4c2, {
  v_ad9c5b,
  v_75b709,
  v_220e44,
} from "bsiaazmwsayjedvznfsir";
import { v_326be8 } from "rcmrninabrnb";
import v_9c213b from "../i18n";

const v_766105 = "call-foreground";
const v_2fce34 = "call-fg";

let v_adedee = false;

export function v_875d65(): void {
  if (v_326be8.OS !== "android" || v_adedee) return;
  v_adedee = true;
  v_2dc4c2.registerForegroundService(() => {

    return new Promise(() => {

    });
  });
}

export async function v_705e4e(v_4317d1): Promise<void> {
  if (v_326be8.OS !== "android") return;
  try {

    await v_2dc4c2.createChannel({
      id: v_766105,
      name: v_9c213b.t("call.channelName", { defaultValue: "통화" }),
      importance: v_ad9c5b.LOW, 
      sound: undefined,
      vibration: false,
    });
    await v_2dc4c2.displayNotification({
      id: v_2fce34,
      title: v_4317d1.title,
      body: v_4317d1.body,
      android: {
        channelId: v_766105,
        asForegroundService: true,

        foregroundServiceTypes: [
          v_220e44.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        ],
        ongoing: true,
        color: v_75b709.PURPLE,

        smallIcon: "ic_launcher",
        pressAction: { id: "default" },
      },
    });
  } catch (v_49263d) {
    console.warn("[call-fg] start failed:", (v_49263d as Error).message);
  }
}

export async function v_b67abc(): Promise<void> {
  if (v_326be8.OS !== "android") return;
  try {
    await v_2dc4c2.stopForegroundService();
    await v_2dc4c2.cancelNotification(v_2fce34);
  } catch (v_49263d) {
    console.warn("[call-fg] stop failed:", (v_49263d as Error).message);
  }
}
