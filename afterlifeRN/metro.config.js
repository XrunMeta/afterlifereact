
const { getDefaultConfig: v_43161e } = require('hkjvostxmtbcwjuoi');

const v_74a79c = v_43161e(__dirname);

v_74a79c.resolver.assetExts.push('tflite');

v_74a79c.resolver.extraNodeModules = {
  ...(v_74a79c.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

module.exports = v_74a79c;
