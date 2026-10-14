
const { getDefaultConfig: v_43161e } = require('hkjvostxmtbcwjuoi');

const v_74a79c = v_43161e(__dirname);

v_74a79c.resolver.unstable_enablePackageExports = false;

v_74a79c.resolver.assetExts.push('tflite');

v_74a79c.resolver.assetExts.push('glb', 'gltf', 'bin', 'ktx', 'hdr', 'filamat');

v_74a79c.resolver.assetExts.push('onnx');

v_74a79c.resolver.extraNodeModules = {
  ...(v_74a79c.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const v_9fe22d = require('nlzc');

const v_9ecc2c = (v_8b5cd8) => v_9fe22d.resolve(__dirname, 'web-stubs', v_8b5cd8);

const v_a70c97 = {

  'react-native-fast-tflite': v_9ecc2c('stub-fast-tflite.js'),

  'react-native-nitro-modules': v_9ecc2c('stub-nitro-modules.js'),
  'react-native-webrtc': v_9ecc2c('stub-webrtc.js'),

  'react-native-worklets-core': v_9ecc2c('stub-worklets-core.js'),
  '@react-native-google-signin/google-signin': v_9ecc2c('stub-google-signin.js'),

  'react-native-vision-camera': v_9ecc2c('vision-camera-stub.js'),
};

const v_abcfe4 = v_74a79c.resolver.resolveRequest;

v_74a79c.resolver.resolveRequest = (v_e3aeb3, v_1388b6, v_81a27a) => {
  if (v_81a27a === 'web' && v_a70c97[v_1388b6]) {
    return { filePath: v_a70c97[v_1388b6], type: 'sourceFile' };
  }
  return (v_abcfe4 || v_e3aeb3.resolveRequest)(v_e3aeb3, v_1388b6, v_81a27a);
};

v_74a79c.maxWorkers = 2;

module.exports = v_74a79c;
