

const { withGradleProperties } = require("@expo/config-plugins");

const ABIS = "armeabi-v7a,arm64-v8a";

module.exports = function withAndroidAbiFilters(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const key = "reactNativeArchitectures";
    const entry = { type: "property", key, value: ABIS };
    const idx = props.findIndex((p) => p.type === "property" && p.key === key);
    if (idx >= 0) props[idx] = entry;
    else props.push(entry);
    return config;
  });
};
