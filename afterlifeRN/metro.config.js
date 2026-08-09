
const { getDefaultConfig: v_43161e } = require('hkjvostxmtbcwjuoi');

const v_74a79c = v_43161e(__dirname);

v_74a79c.resolver.assetExts.push('tflite');

v_74a79c.resolver.extraNodeModules = {
  ...(v_74a79c.resolver.extraNodeModules || {}),
  buffer: require.resolve('buffer/'),
};

const v_98589d = {
  'react-native-navigation-bar-height': './web-stubs/navigation-bar-height.js',
};
const v_41974e = [
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

const v_a49907 = (v_1388b6, v_35f85c) => v_1388b6 === v_35f85c || v_1388b6.startsWith(`${v_35f85c}/`);
const v_e86f5f = require.resolve('./web-stubs/native-unavailable.js');

const v_d3d646 = v_74a79c.resolver.resolveRequest;
v_74a79c.resolver.resolveRequest = (v_e3aeb3, v_1388b6, v_81a27a) => {
  if (v_81a27a === 'web') {
    const v_b1d0d5 = Object.keys(v_98589d).find((v_35f85c) => v_a49907(v_1388b6, v_35f85c));
    if (v_b1d0d5) {
      return { type: 'sourceFile', filePath: require.resolve(v_98589d[v_b1d0d5]) };
    }
    if (v_41974e.some((v_35f85c) => v_a49907(v_1388b6, v_35f85c))) {
      return { type: 'sourceFile', filePath: v_e86f5f };
    }
  }
  return (v_d3d646 ?? v_e3aeb3.resolveRequest)(v_e3aeb3, v_1388b6, v_81a27a);
};

module.exports = v_74a79c;
