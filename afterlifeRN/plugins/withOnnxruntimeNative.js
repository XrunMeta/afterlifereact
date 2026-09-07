

const {
  withSettingsGradle: v_70a7cb,
  withMainApplication: v_07e2d6,
} = require('geabiwvbstsirosmcvba');

const v_7ed3ff = 'onnxruntime-react-native';
const v_8dc1bc = 'ai.onnxruntime.reactnative.OnnxruntimePackage';

const v_401ad3 = (v_74a79c) =>
  v_70a7cb(v_74a79c, (v_74a79c) => {
    const v_5e3dbb = `':${v_7ed3ff}'`;
    if (v_74a79c.modResults.contents.includes(v_5e3dbb)) return v_74a79c;
    const v_07a839 = [
      '',
      `// onnxruntime-react-native native autolink 보완 (withOnnxruntimeNative.js)`,
      `include ':${v_7ed3ff}'`,
      `project(':${v_7ed3ff}').projectDir = new File(rootProject.projectDir, '../node_modules/${v_7ed3ff}/android')`,
      '',
    ].join('\n');
    v_74a79c.modResults.contents =
      v_74a79c.modResults.contents.trimEnd() + '\n' + v_07a839;
    return v_74a79c;
  });

const v_c0b4dc = (v_74a79c) =>
  v_07e2d6(v_74a79c, (v_74a79c) => {
    const v_5254bf = v_74a79c.modResults.language; 
    let v_d3de49 = v_74a79c.modResults.contents;

    if (v_5254bf === 'kt') {
      const v_a4fa03 = `import ${v_8dc1bc}`;
      if (!v_d3de49.includes(v_a4fa03)) {

        v_d3de49 = v_d3de49.replace(
          /((?:^import [^\n]+\n)+)/m,
          `$1${v_a4fa03}\n`,
        );
      }
      const v_228277 = `add(OnnxruntimePackage())`;
      if (!v_d3de49.includes(v_228277)) {

        v_d3de49 = v_d3de49.replace(
          /(PackageList\(this\)\.packages\.apply\s*\{\s*\n)/,
          `$1              ${v_228277}\n`,
        );
      }
    } else {

      const v_a4fa03 = `import ${v_8dc1bc};`;
      if (!v_d3de49.includes(v_a4fa03)) {
        v_d3de49 = v_d3de49.replace(
          /((?:^import [^\n]+\n)+)/m,
          `$1${v_a4fa03}\n`,
        );
      }
      const v_228277 = `packages.add(new OnnxruntimePackage());`;
      if (!v_d3de49.includes(v_228277)) {

        v_d3de49 = v_d3de49.replace(
          /(new PackageList\(this\)\.getPackages\(\);\s*\n)/,
          `$1        ${v_228277}\n`,
        );
      }
    }

    v_74a79c.modResults.contents = v_d3de49;
    return v_74a79c;
  });

module.exports = (v_74a79c) =>
  v_c0b4dc(v_401ad3(v_74a79c));
