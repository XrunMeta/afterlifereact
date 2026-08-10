

const { withAndroidManifest } = require("@expo/config-plugins");

const SERVICE_NAME = "app.notifee.core.ForegroundService";
const TOOLS_NS = "http://schemas.android.com/tools";

module.exports = function withNotifeeCallFgsType(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    manifest.$ = manifest.$ || {};
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = TOOLS_NS;
    }

    const app = manifest.application && manifest.application[0];
    if (!app) {
      throw new Error("[withNotifeeCallFgsType] <application> 을 찾지 못했습니다.");
    }

    app.service = app.service || [];
    let svc = app.service.find((s) => s.$ && s.$["android:name"] === SERVICE_NAME);

    if (!svc) {

      svc = { $: { "android:name": SERVICE_NAME } };
      app.service.push(svc);
    }

    svc.$["android:foregroundServiceType"] = "microphone";
    svc.$["tools:replace"] = "android:foregroundServiceType";

    return config;
  });
};
