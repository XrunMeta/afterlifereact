
const { getDefaultConfig: v_43161e } = require('hkjvostxmtbcwjuoi');

const v_74a79c = v_43161e(__dirname);

v_74a79c.resolver.assetExts.push('tflite');

v_74a79c.resolver.extraNodeModules = {
  ...(v_74a79c.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const v_9fe22d = require('nlzc');

const v_2deca0 = [

  'react-native-fast-tflite',

  'react-native-nitro-modules',
  'react-native-webrtc',

  'react-native-worklets-core',
  '@react-native-google-signin/google-signin',
];

const v_a70c97 = {
  'react-native-vision-camera': v_9fe22d.resolve(__dirname, 'web-stubs/vision-camera-stub.js'),
};

const v_319940 = v_9fe22d.resolve(__dirname, 'web-stubs/throwing-stub.js');
const v_abcfe4 = v_74a79c.resolver.resolveRequest;

v_74a79c.resolver.resolveRequest = (v_e3aeb3, v_1388b6, v_81a27a) => {
  if (v_81a27a === 'web' && v_a70c97[v_1388b6]) {
    return { filePath: v_a70c97[v_1388b6], type: 'sourceFile' };
  }
  if (v_81a27a === 'web' && v_2deca0.includes(v_1388b6)) {
    return { filePath: v_319940, type: 'sourceFile' };
  }
  return (v_abcfe4 || v_e3aeb3.resolveRequest)(v_e3aeb3, v_1388b6, v_81a27a);
};

module.exports = v_74a79c;
