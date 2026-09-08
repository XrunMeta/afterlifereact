

const {
  withSettingsGradle,
  withMainApplication,
} = require('@expo/config-plugins');

const PROJECT_NAME = 'onnxruntime-react-native';
const PACKAGE_CLASS = 'ai.onnxruntime.reactnative.OnnxruntimePackage';

const withOnnxSettings = (config) =>
  withSettingsGradle(config, (config) => {
    const marker = `':${PROJECT_NAME}'`;
    if (config.modResults.contents.includes(marker)) return config;
    const insertion = [
      '',
      `// onnxruntime-react-native native autolink 보완 (withOnnxruntimeNative.js)`,
      `include ':${PROJECT_NAME}'`,
      `project(':${PROJECT_NAME}').projectDir = new File(rootProject.projectDir, '../node_modules/${PROJECT_NAME}/android')`,
      '',
    ].join('\n');
    config.modResults.contents =
      config.modResults.contents.trimEnd() + '\n' + insertion;
    return config;
  });

const withOnnxMainApplication = (config) =>
  withMainApplication(config, (config) => {
    const lang = config.modResults.language; 
    let contents = config.modResults.contents;

    if (lang === 'kt') {
      const importLine = `import ${PACKAGE_CLASS}`;
      if (!contents.includes(importLine)) {

        contents = contents.replace(
          /((?:^import [^\n]+\n)+)/m,
          `$1${importLine}\n`,
        );
      }
      const addExpr = `add(OnnxruntimePackage())`;
      if (!contents.includes(addExpr)) {

        contents = contents.replace(
          /(PackageList\(this\)\.packages\.apply\s*\{\s*\n)/,
          `$1              ${addExpr}\n`,
        );
      }
    } else {

      const importLine = `import ${PACKAGE_CLASS};`;
      if (!contents.includes(importLine)) {
        contents = contents.replace(
          /((?:^import [^\n]+\n)+)/m,
          `$1${importLine}\n`,
        );
      }
      const addExpr = `packages.add(new OnnxruntimePackage());`;
      if (!contents.includes(addExpr)) {

        contents = contents.replace(
          /(new PackageList\(this\)\.getPackages\(\);\s*\n)/,
          `$1        ${addExpr}\n`,
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });

module.exports = (config) =>
  withOnnxMainApplication(withOnnxSettings(config));
