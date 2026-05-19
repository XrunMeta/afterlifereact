

const { withAndroidColors: v_463f39, AndroidConfig: v_d44207 } = require("geabiwvbstsirosmcvba");

const v_540cdc = [

  { name: "ucrop_color_toolbar", value: "#000000" },
  { name: "ucrop_color_statusbar", value: "#000000" },

  { name: "ucrop_color_toolbar_widget", value: "#FFFFFF" },

  { name: "ucrop_color_active_controls_widget", value: "#FFFFFF" },
  { name: "ucrop_color_widget_active", value: "#FFFFFF" },
  { name: "ucrop_color_progress_wheel_line", value: "#FFFFFF" },
];

module.exports = function v_bba540(v_74a79c) {
  return v_463f39(v_74a79c, (v_01dcf5) => {
    v_540cdc.forEach((v_3f4e2e) => {
      v_01dcf5.modResults = v_d44207.Colors.setColorItem(
        v_d44207.Resources.buildResourceItem({
          name: v_3f4e2e.name,
          value: v_3f4e2e.value,
        }),
        v_01dcf5.modResults,
      );
    });
    return v_01dcf5;
  });
};
