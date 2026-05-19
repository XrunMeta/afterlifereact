

const { withAndroidColors, AndroidConfig } = require("@expo/config-plugins");

const UCROP_COLORS = [

  { name: "ucrop_color_toolbar", value: "#000000" },
  { name: "ucrop_color_statusbar", value: "#000000" },

  { name: "ucrop_color_toolbar_widget", value: "#FFFFFF" },

  { name: "ucrop_color_active_controls_widget", value: "#FFFFFF" },
  { name: "ucrop_color_widget_active", value: "#FFFFFF" },
  { name: "ucrop_color_progress_wheel_line", value: "#FFFFFF" },
];

module.exports = function withUCropColors(config) {
  return withAndroidColors(config, (cfg) => {
    UCROP_COLORS.forEach((c) => {
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
