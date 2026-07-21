

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const POD_INJECTS = [
  "pod 'GoogleUtilities', :modular_headers => true",
  "pod 'RecaptchaInterop', :modular_headers => true",
  "pod 'AppCheckCore', :modular_headers => true",
];

const withCustomPodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      const missing = POD_INJECTS.filter((line) => !podfile.includes(line));
      if (missing.length > 0) {

        podfile = podfile.replace(
          /(\n\s*)use_react_native!\(/,
          `$1${missing.join('$1')}$1use_react_native!(`
        );
        fs.writeFileSync(podfilePath, podfile);
      }
      return config;
    },
  ]);
};

module.exports = withCustomPodfile;
