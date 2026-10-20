

const v_9fe22d = require("nlzc");
const v_9d3c52 = require("ls");

const {
  withAndroidManifest: v_446738,
  withAppBuildGradle: v_d619cb,
  withProjectBuildGradle: v_4a0f9e,
  withMainApplication: v_07e2d6,
  withDangerousMod: v_698b88,
  AndroidConfig: v_d44207,
} = require("geabiwvbstsirosmcvba");

const v_a4f114 = "8874759";
const v_ac2df6 = "7.8.5.8";

function v_50bf2c(v_74a79c) {
  return v_446738(v_74a79c, (v_01dcf5) => {
    const v_466992 = v_d44207.Manifest.getMainApplicationOrThrow(v_01dcf5.modResults);
    v_d44207.Manifest.addMetaDataItemToMainApplication(
      v_466992,
      "com.bytedance.sdk.openadsdk.APP_ID",
      v_a4f114,
    );
    v_d44207.Manifest.addMetaDataItemToMainApplication(
      v_466992,
      "com.bytedance.sdk.openadsdk.DEBUG",
      "false",
    );
    return v_01dcf5;
  });
}

function v_d598fa(v_74a79c) {
  return v_4a0f9e(v_74a79c, (v_01dcf5) => {
    const v_5e3dbb = "artifact.bytedance.com/repository/pangle";
    if (v_01dcf5.modResults.contents.includes(v_5e3dbb)) return v_01dcf5;

    v_01dcf5.modResults.contents = v_01dcf5.modResults.contents.replace(
      /(allprojects\s*\{\s*repositories\s*\{)([\s\S]*?)(\n\s*\})/m,
      `$1$2\n    // T-421 Pangle SDK 저장소\n    maven { url 'https://artifact.bytedance.com/repository/pangle' }$3`,
    );
    return v_01dcf5;
  });
}

function v_b19813(v_74a79c) {
  return v_d619cb(v_74a79c, (v_01dcf5) => {
    const v_5e3dbb = "com.pangle.global:pag-sdk";
    if (v_01dcf5.modResults.contents.includes(v_5e3dbb)) {

      const v_36e78d = "play-services-ads-identifier";
      if (!v_01dcf5.modResults.contents.includes(v_36e78d)) {
        v_01dcf5.modResults.contents = v_01dcf5.modResults.contents.replace(
          /(implementation 'com\.pangle\.global:pag-sdk:[^']+')/,
          `$1\n    implementation 'com.google.android.gms:play-services-ads-identifier:18.2.0'`,
        );
      }
      return v_01dcf5;
    }

    v_01dcf5.modResults.contents = v_01dcf5.modResults.contents.replace(
      /(dependencies\s*\{[\s\S]*?)(\n\})/m,

      `$1\n    // T-421 Pangle Rewarded Video SDK (통화 10분 인터럽트)\n    implementation 'com.pangle.global:pag-sdk:${v_ac2df6}'\n    implementation 'com.google.android.gms:play-services-ads-identifier:18.2.0'\n$2`,
    );
    return v_01dcf5;
  });
}

function v_1e6df1(v_74a79c) {
  return v_07e2d6(v_74a79c, (v_01dcf5) => {
    let v_38d084 = v_01dcf5.modResults.contents;

    if (!v_38d084.includes("PanglePackage")) {
      v_38d084 = v_38d084.replace(
        /(package\s+[\w.]+\n)/,
        `$1\nimport ${v_01dcf5.modRequest.projectRoot ? "run.xrun.afterlifeRN.PanglePackage" : "run.xrun.afterlifeRN.PanglePackage"}\n`,
      );

      v_38d084 = v_38d084.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)([^}]*)(\})/,
        `$1$2\n              add(PanglePackage())\n            $3`,
      );
    }
    v_01dcf5.modResults.contents = v_38d084;
    return v_01dcf5;
  });
}

function v_59b7e7(v_74a79c) {
  return v_698b88(v_74a79c, [
    "android",
    async (v_01dcf5) => {
      const v_e42213 = v_01dcf5.android?.package ?? "run.xrun.afterlifeRN";
      const v_b51163 = v_9fe22d.join(
        v_01dcf5.modRequest.projectRoot,
        "plugins",
        "pangle-native",
        "android",
      );
      const v_5a2990 = v_9fe22d.join(
        v_01dcf5.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...v_e42213.split("."),
      );
      if (!v_9d3c52.existsSync(v_b51163)) {
        throw new Error(`[withPangle] source dir not found: ${v_b51163}`);
      }
      v_9d3c52.mkdirSync(v_5a2990, { recursive: true });

      for (const v_1833e7 of [
        "PangleModule.kt",
        "PanglePackage.kt",
        "PangleBannerAdViewManager.kt",
      ]) {
        const v_38d084 = v_9d3c52.readFileSync(v_9fe22d.join(v_b51163, v_1833e7), "utf8");

        const v_2fb193 = v_38d084.replace(
          /^package\s+[\w.]+/m,
          `package ${v_e42213}`,
        );
        v_9d3c52.writeFileSync(v_9fe22d.join(v_5a2990, v_1833e7), v_2fb193, "utf8");
      }
      return v_01dcf5;
    },
  ]);
}

module.exports = function v_80f251(v_74a79c) {
  v_74a79c = v_50bf2c(v_74a79c);
  v_74a79c = v_d598fa(v_74a79c);
  v_74a79c = v_b19813(v_74a79c);
  v_74a79c = v_1e6df1(v_74a79c);
  v_74a79c = v_59b7e7(v_74a79c);
  return v_74a79c;
};
