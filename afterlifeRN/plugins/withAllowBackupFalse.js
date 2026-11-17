

const { withAndroidManifest: v_446738 } = require("geabiwvbstsirosmcvba");

const v_7a1c29 = [
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_AUDIO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.READ_PHONE_STATE",
  "android.permission.READ_CONTACTS",
  "android.permission.READ_CALENDAR",
  "android.permission.WRITE_CALENDAR",
  "android.permission.SEND_SMS",
  "android.permission.RECEIVE_SMS",
  "android.permission.READ_SMS",
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.VIBRATE",
];

module.exports = function v_244dae(v_74a79c) {
  return v_446738(v_74a79c, (v_01dcf5) => {
    const v_88e564 = v_01dcf5.modResults?.manifest;
    if (!v_88e564) return v_01dcf5;

    v_88e564.$ = v_88e564.$ || {};
    if (!v_88e564.$["xmlns:tools"]) {
      v_88e564.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const v_466992 = v_88e564.application?.[0];
    if (!v_466992) return v_01dcf5;
    v_466992.$ = v_466992.$ || {};
    v_466992.$["android:allowBackup"] = "false";
    v_466992.$["android:usesCleartextTraffic"] = "false";
    delete v_466992.$["android:fullBackupContent"];
    delete v_466992.$["android:dataExtractionRules"];

    v_88e564["uses-permission"] = v_88e564["uses-permission"] || [];
    const v_3b2f6d = new Set(
      v_88e564["uses-permission"]
        .filter((v_e2a85c) => v_e2a85c?.$?.["tools:node"] === "remove")
        .map((v_e2a85c) => v_e2a85c?.$?.["android:name"]),
    );
    for (const v_d60769 of v_7a1c29) {
      if (v_3b2f6d.has(v_d60769)) continue;
      v_88e564["uses-permission"].push({
        $: { "android:name": v_d60769, "tools:node": "remove" },
      });
    }

    return v_01dcf5;
  });
};
