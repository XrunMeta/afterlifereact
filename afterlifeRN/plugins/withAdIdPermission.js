

const { withAndroidManifest: v_446738 } = require("geabiwvbstsirosmcvba");

const v_323be8 = "com.google.android.gms.permission.AD_ID";

module.exports = function v_7b3f56(v_74a79c) {
  return v_446738(v_74a79c, async (v_74a79c) => {
    const v_88e564 = v_74a79c.modResults.manifest;
    const v_a7b265 = v_88e564["uses-permission"] ?? [];
    const v_5b4e12 = v_a7b265.some(
      (v_e2a85c) => v_e2a85c && v_e2a85c.$ && v_e2a85c.$["android:name"] === v_323be8,
    );
    if (!v_5b4e12) {
      v_a7b265.push({ $: { "android:name": v_323be8 } });
      v_88e564["uses-permission"] = v_a7b265;
    }
    return v_74a79c;
  });
};
