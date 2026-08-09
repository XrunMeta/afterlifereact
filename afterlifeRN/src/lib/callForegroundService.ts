

import notifee, {
  AndroidImportance,
  AndroidColor,
  AndroidForegroundServiceType,
} from "@notifee/react-native";
import { Platform } from "react-native";

const CHANNEL_ID = "call-foreground";
const NOTIFICATION_ID = "call-fg";

let registered = false;

export function registerCallForegroundService(): void {
  if (Platform.OS !== "android" || registered) return;
  registered = true;
  notifee.registerForegroundService(() => {

    return new Promise(() => {

    });
  });
}

export async function startCallForegroundService(args: {
  title: string;
  body: string;
}): Promise<void> {
  if (Platform.OS !== "android") return;
  try {

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: "통화",
      importance: AndroidImportance.LOW, 
      sound: undefined,
      vibration: false,
    });
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: args.title,
      body: args.body,
      android: {
        channelId: CHANNEL_ID,
        asForegroundService: true,

        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
        ],
        ongoing: true,
        color: AndroidColor.PURPLE,

        smallIcon: "ic_launcher",
        pressAction: { id: "default" },
      },
    });
  } catch (err) {
    console.warn("[call-fg] start failed:", (err as Error).message);
  }
}

export async function stopCallForegroundService(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await notifee.stopForegroundService();
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch (err) {
    console.warn("[call-fg] stop failed:", (err as Error).message);
  }
}
