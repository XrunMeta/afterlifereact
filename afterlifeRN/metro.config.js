
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

config.resolver.assetExts.push('glb', 'gltf', 'bin', 'ktx', 'hdr', 'filamat');

config.resolver.assetExts.push('onnx');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const path = require('path');

const stub = (f) => path.resolve(__dirname, 'web-stubs', f);

const WEB_STUB_MAP = {

  'react-native-fast-tflite': stub('stub-fast-tflite.js'),

  'react-native-nitro-modules': stub('stub-nitro-modules.js'),
  'react-native-webrtc': stub('stub-webrtc.js'),

  'react-native-worklets-core': stub('stub-worklets-core.js'),
  '@react-native-google-signin/google-signin': stub('stub-google-signin.js'),

  'react-native-vision-camera': stub('vision-camera-stub.js'),
};

const origResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUB_MAP[moduleName]) {
    return { filePath: WEB_STUB_MAP[moduleName], type: 'sourceFile' };
  }
  return (origResolveRequest || context.resolveRequest)(context, moduleName, platform);
};

config.maxWorkers = 2;

module.exports = config;
