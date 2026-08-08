
const { getDefaultConfig: v_43161e } = require('hkjvostxmtbcwjuoi');

const v_74a79c = v_43161e(__dirname);

v_74a79c.resolver.assetExts.push('tflite');

v_74a79c.resolver.extraNodeModules = {
  ...(v_74a79c.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const v_41974e = [
  'react-native-fast-tflite',              

  '@notifee/react-native',
  'react-native-vision-camera',
  'react-native-vision-camera-face-detector',
  'vision-camera-resize-plugin',
  'react-native-iap',
  'react-native-navigation-bar-height',

  'react-native-webrtc',
  '@react-native-google-signin/google-signin',
  'expo-speech-recognition',
];
const v_e86f5f = require.resolve('./web-stubs/native-unavailable.js');

const v_d3d646 = v_74a79c.resolver.resolveRequest;
v_74a79c.resolver.resolveRequest = (v_e3aeb3, v_1388b6, v_81a27a) => {
  if (v_81a27a === 'web' && v_41974e.some((v_35f85c) => v_1388b6 === v_35f85c || v_1388b6.startsWith(`${v_35f85c}/`))) {
    return { type: 'sourceFile', filePath: v_e86f5f };
  }
  return (v_d3d646 ?? v_e3aeb3.resolveRequest)(v_e3aeb3, v_1388b6, v_81a27a);
};

module.exports = v_74a79c;
