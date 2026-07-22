

const { withDangerousMod: v_698b88 } = require('geabiwvbstsirosmcvba');
const v_9d3c52 = require('ls');
const v_9fe22d = require('nlzc');

const v_7e4df5 = [
  "pod 'GoogleUtilities', :modular_headers => true",
  "pod 'RecaptchaInterop', :modular_headers => true",
  "pod 'AppCheckCore', :modular_headers => true",
];

const v_7fe9dd = (v_74a79c) => {
  return v_698b88(v_74a79c, [
    'ios',
    async (v_74a79c) => {
      const v_f092e0 = v_9fe22d.join(
        v_74a79c.modRequest.platformProjectRoot,
        'Podfile'
      );
      let v_2a802a = v_9d3c52.readFileSync(v_f092e0, 'utf-8');

      const v_2e5207 = v_7e4df5.filter((v_e6293e) => !v_2a802a.includes(v_e6293e));
      if (v_2e5207.length > 0) {

        v_2a802a = v_2a802a.replace(
          /(\n\s*)use_react_native!\(/,
          `$1${v_2e5207.join('$1')}$1use_react_native!(`
        );
        v_9d3c52.writeFileSync(v_f092e0, v_2a802a);
      }
      return v_74a79c;
    },
  ]);
};

module.exports = v_7fe9dd;
