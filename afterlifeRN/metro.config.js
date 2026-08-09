
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const WEB_IMPL = {
  'react-native-navigation-bar-height': './web-stubs/navigation-bar-height.js',
};
const WEB_STUBBED = [
  'react-native-fast-tflite',                    
  '@notifee/react-native',                       
  'react-native-vision-camera',                  
  'react-native-vision-camera-face-detector',    
  'vision-camera-resize-plugin',
  'react-native-iap',                            
  'react-native-webrtc',                         
  '@react-native-google-signin/google-signin',   
  'expo-speech-recognition',                     
];

const matches = (moduleName, m) => moduleName === m || moduleName.startsWith(`${m}/`);
const nativeStub = require.resolve('./web-stubs/native-unavailable.js');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const implKey = Object.keys(WEB_IMPL).find((m) => matches(moduleName, m));
    if (implKey) {
      return { type: 'sourceFile', filePath: require.resolve(WEB_IMPL[implKey]) };
    }
    if (WEB_STUBBED.some((m) => matches(moduleName, m))) {
      return { type: 'sourceFile', filePath: nativeStub };
    }
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
