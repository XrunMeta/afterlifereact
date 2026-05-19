

const { withAndroidColors, AndroidConfig } = require("@expo/config-plugins");

const CROP_COLORS = [

  { name: "expoCropToolbarColor", value: "#000000" },

  { name: "expoCropToolbarIconColor", value: "#FFFFFF" },

  { name: "expoCropToolbarActionTextColor", value: "#FFFFFF" },

  { name: "expoCropBackButtonIconColor", value: "#FFFFFF" },

  { name: "expoCropBackgroundColor", value: "#000000" },
];

module.exports = function withUCropColors(config) {
  return withAndroidColors(config, (cfg) => {
    CROP_COLORS.forEach((c) => {
      cfg.modResults = AndroidConfig.Colors.setColorItem(
        AndroidConfig.Resources.buildResourceItem({
          name: c.name,
          value: c.value,
        }),
        cfg.modResults,
      );
    });
    return cfg;
  });
};
