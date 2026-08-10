

const { withAndroidManifest: v_446738 } = require("geabiwvbstsirosmcvba");

const v_459717 = "app.notifee.core.ForegroundService";
const v_603090 = "http://schemas.android.com/tools";

module.exports = function v_7fa351(v_74a79c) {
  return v_446738(v_74a79c, (v_74a79c) => {
    const v_88e564 = v_74a79c.modResults.manifest;

    v_88e564.$ = v_88e564.$ || {};
    if (!v_88e564.$["xmlns:tools"]) {
      v_88e564.$["xmlns:tools"] = v_603090;
    }

    const v_466992 = v_88e564.application && v_88e564.application[0];
    if (!v_466992) {
      throw new Error("[withNotifeeCallFgsType] <application> 을 찾지 못했습니다.");
    }

    v_466992.service = v_466992.service || [];
    let v_f0ede9 = v_466992.service.find((v_fd5f43) => v_fd5f43.$ && v_fd5f43.$["android:name"] === v_459717);

    if (!v_f0ede9) {

      v_f0ede9 = { $: { "android:name": v_459717 } };
      v_466992.service.push(v_f0ede9);
    }

    v_f0ede9.$["android:foregroundServiceType"] = "microphone";
    v_f0ede9.$["tools:replace"] = "android:foregroundServiceType";

    return v_74a79c;
  });
};
