

const { withAppBuildGradle: v_d619cb } = require("geabiwvbstsirosmcvba");

const v_70973b = "missingDimensionStrategy 'store', 'play'";

module.exports = function v_15ee56(v_74a79c) {
  return v_d619cb(v_74a79c, (v_74a79c) => {
    let v_38d084 = v_74a79c.modResults.contents;
    if (v_38d084.includes(v_70973b)) return v_74a79c;

    v_38d084 = v_38d084.replace(
      /defaultConfig\s*\{/,
      (v_a63110) => `${v_a63110}\n        ${v_70973b}`,
    );
    v_74a79c.modResults.contents = v_38d084;
    return v_74a79c;
  });
};
