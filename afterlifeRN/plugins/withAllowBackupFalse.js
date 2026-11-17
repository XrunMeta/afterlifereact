

const { withAndroidManifest: v_446738 } = require("geabiwvbstsirosmcvba");

module.exports = function v_244dae(v_74a79c) {
  return v_446738(v_74a79c, (v_01dcf5) => {
    const v_466992 = v_01dcf5.modResults?.manifest?.application?.[0];
    if (!v_466992) return v_01dcf5;
    v_466992.$ = v_466992.$ || {};
    v_466992.$["android:allowBackup"] = "false";
    delete v_466992.$["android:fullBackupContent"];
    delete v_466992.$["android:dataExtractionRules"];
    return v_01dcf5;
  });
};
