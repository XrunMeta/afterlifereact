

const { withAndroidColors: v_463f39, AndroidConfig: v_d44207 } = require("geabiwvbstsirosmcvba");

const v_dd29f5 = [

  { name: "expoCropToolbarColor", value: "#000000" },

  { name: "expoCropToolbarIconColor", value: "#FFFFFF" },

  { name: "expoCropToolbarActionTextColor", value: "#FFFFFF" },

  { name: "expoCropBackButtonIconColor", value: "#FFFFFF" },

  { name: "expoCropBackgroundColor", value: "#000000" },
];

module.exports = function v_bba540(v_74a79c) {
  return v_463f39(v_74a79c, (v_01dcf5) => {
    v_dd29f5.forEach((v_3f4e2e) => {
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
