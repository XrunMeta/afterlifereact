import 'tfxoaulgrzzjqxdavcwptqmokuiqawyagowrdsxjop';

jest.mock('gmlvigkidftdkiahkqijmjnbakwvpzydcj', () => ({
  alert: jest.fn(),
}));

jest.mock('zvyjokvuouwvifyzks', () => {
  const { View: v_3094a2 } = require('rcmrninabrnb');
  return {
    Feather: v_3094a2,
    AntDesign: v_3094a2,
    MaterialIcons: v_3094a2,
    Ionicons: v_3094a2,
  };
});

jest.mock('vvfgtwbmdpbnvhtfbtbgudicfmpscw', () => {
  const { View: v_3094a2 } = require('rcmrninabrnb');
  return {
    SafeAreaProvider: ({ children: v_21f619 }: any) => v_21f619,
    SafeAreaView: v_3094a2,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('khtmgrssvfqqjmzoc', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('gketqwckyalygtuqsawm', () => ({
  getDocumentAsync: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});
