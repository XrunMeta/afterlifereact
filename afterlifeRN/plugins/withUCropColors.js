

const { withAndroidColors, AndroidConfig } = require("@expo/config-plugins");

const UCROP_COLORS = [

  { name: "ucrop_color_toolbar", value: "#FFFFFF" },
  { name: "ucrop_color_statusbar", value: "#FFFFFF" },

  { name: "ucrop_color_toolbar_widget", value: "#0F172A" },

  { name: "ucrop_color_active_controls_widget", value: "#7C3AED" },
  { name: "ucrop_color_widget_active", value: "#7C3AED" },
  { name: "ucrop_color_progress_wheel_line", value: "#7C3AED" },
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
