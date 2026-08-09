
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const path = require('path');

const WEB_STUBS = [

  'react-native-fast-tflite',

  'react-native-nitro-modules',
  'react-native-webrtc',

  'react-native-worklets-core',
  '@react-native-google-signin/google-signin',
];

const WEB_STUB_MAP = {
  'react-native-vision-camera': path.resolve(__dirname, 'web-stubs/vision-camera-stub.js'),
};

const STUB_PATH = path.resolve(__dirname, 'web-stubs/throwing-stub.js');
const origResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUB_MAP[moduleName]) {
    return { filePath: WEB_STUB_MAP[moduleName], type: 'sourceFile' };
  }
  if (platform === 'web' && WEB_STUBS.includes(moduleName)) {
    return { filePath: STUB_PATH, type: 'sourceFile' };
  }
  return (origResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
