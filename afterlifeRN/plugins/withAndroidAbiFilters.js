

const { withGradleProperties: v_70ece2 } = require("geabiwvbstsirosmcvba");

const v_d11dc1 = "armeabi-v7a,arm64-v8a";

module.exports = function v_dc537c(v_74a79c) {
  return v_70ece2(v_74a79c, (v_74a79c) => {
    const v_b1927c = v_74a79c.modResults;
    const v_b24339 = "reactNativeArchitectures";
    const v_2b8338 = { type: "property", key: v_b24339, value: v_d11dc1 };
    const v_e86ad8 = v_b1927c.findIndex((v_e2a85c) => v_e2a85c.type === "property" && v_e2a85c.key === v_b24339);
    if (v_e86ad8 >= 0) v_b1927c[v_e86ad8] = v_2b8338;
    else v_b1927c.push(v_2b8338);
    return v_74a79c;
  });
};
