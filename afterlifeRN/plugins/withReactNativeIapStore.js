

const { withAppBuildGradle } = require("@expo/config-plugins");

const MARKER = "missingDimensionStrategy 'store', 'play'";

module.exports = function withReactNativeIapStore(config) {
  return withAppBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes(MARKER)) return config;

    src = src.replace(
      /defaultConfig\s*\{/,
      (match) => `${match}\n        ${MARKER}`,
    );
    config.modResults.contents = src;
    return config;
  });
};
