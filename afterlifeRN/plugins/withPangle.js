

const path = require("path");
const fs = require("fs");

const {
  withAndroidManifest,
  withAppBuildGradle,
  withMainApplication,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");

const PANGLE_APP_ID_ANDROID = "8874759";
const PAG_SDK_VERSION = "7.8.5.8";

function withPangleManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      "com.bytedance.sdk.openadsdk.APP_ID",
      PANGLE_APP_ID_ANDROID,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      app,
      "com.bytedance.sdk.openadsdk.DEBUG",
      "false",
    );
    return cfg;
  });
}

function withPangleGradle(config) {
  return withAppBuildGradle(config, (cfg) => {
    const marker = "com.pangle.global:pag-sdk";
    if (cfg.modResults.contents.includes(marker)) return cfg;

    cfg.modResults.contents = cfg.modResults.contents.replace(
      /(dependencies\s*\{[\s\S]*?)(\n\})/m,
      `$1\n    // T-421 Pangle Rewarded Video SDK (통화 10분 인터럽트)\n    implementation 'com.pangle.global:pag-sdk:${PAG_SDK_VERSION}'\n$2`,
    );
    return cfg;
  });
}

function withPangleMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;

    if (!src.includes("PanglePackage")) {
      src = src.replace(
        /(package\s+[\w.]+\n)/,
        `$1\nimport ${cfg.modRequest.projectRoot ? "run.xrun.afterlifeRN.PanglePackage" : "run.xrun.afterlifeRN.PanglePackage"}\n`,
      );

      src = src.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)([^}]*)(\})/,
        `$1$2\n              add(PanglePackage())\n            $3`,
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

function withPangleKotlinFiles(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const pkg = cfg.android?.package ?? "run.xrun.afterlifeRN";
      const srcDir = path.join(
        cfg.modRequest.projectRoot,
        "plugins",
        "pangle-native",
        "android",
      );
      const destDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        ...pkg.split("."),
      );
      if (!fs.existsSync(srcDir)) {
        throw new Error(`[withPangle] source dir not found: ${srcDir}`);
      }
      fs.mkdirSync(destDir, { recursive: true });
      for (const name of ["PangleModule.kt", "PanglePackage.kt"]) {
        const src = fs.readFileSync(path.join(srcDir, name), "utf8");

        const patched = src.replace(
          /^package\s+[\w.]+/m,
          `package ${pkg}`,
        );
        fs.writeFileSync(path.join(destDir, name), patched, "utf8");
      }
      return cfg;
    },
  ]);
}

module.exports = function withPangle(config) {
  config = withPangleManifest(config);
  config = withPangleGradle(config);
  config = withPangleMainApplication(config);
  config = withPangleKotlinFiles(config);
  return config;
};
