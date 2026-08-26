import 'tfxoaulgrzzjqxdavcwptqmokuiqawyagowrdsxjop';

jest.mock('gmlvigkidftdkiahkqijmjnbakwvpzydcj', () => ({
  alert: jest.fn(),
}));

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () => {
  const v_a73fa2 = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((v_b24339) => Promise.resolve(v_a73fa2.get(v_b24339) ?? null)),
      setItem: jest.fn((v_b24339, v_3b402b) => {
        v_a73fa2.set(v_b24339, v_3b402b);
        return Promise.resolve();
      }),
      removeItem: jest.fn((v_b24339) => {
        v_a73fa2.delete(v_b24339);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        v_a73fa2.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(v_a73fa2.keys()))),
      multiGet: jest.fn((v_fa53ec) =>
        Promise.resolve(v_fa53ec.map((v_0eb677) => [v_0eb677, v_a73fa2.get(v_0eb677) ?? null])),
      ),
      multiSet: jest.fn((v_015ea2) => {
        v_015ea2.forEach(([v_0eb677, v_81e2ef]) => v_a73fa2.set(v_0eb677, v_81e2ef));
        return Promise.resolve();
      }),
      multiRemove: jest.fn((v_fa53ec) => {
        v_fa53ec.forEach((v_0eb677) => v_a73fa2.delete(v_0eb677));
        return Promise.resolve();
      }),
    },
  };
});

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

jest.mock('rthlnescfffbyxfmhgq', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn().mockImplementation((v_d5dda0) => v_d5dda0),
  RTCIceCandidate: jest.fn().mockImplementation((v_d5dda0) => v_d5dda0),
  MediaStream: jest
    .fn()
    .mockImplementation((v_a5960f = []) => ({
      _tracks: v_a5960f,
      toURL: () => 'mock://stream',
      getTracks: () => v_a5960f,
      getAudioTracks: () => v_a5960f.filter((v_8d41d7) => v_8d41d7?.kind === 'audio'),
    })),
  RTCView: 'RTCView',
  mediaDevices: { getUserMedia: jest.fn() },

  RTCAudioSession: {
    audioSessionDidActivate: jest.fn(),
    audioSessionDidDeactivate: jest.fn(),
  },
}));

jest.mock('nmkthbfnlqcwgpmuzshknlbcbmh', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    setForceSpeakerphoneOn: jest.fn(),
    setSpeakerphoneOn: jest.fn(),
    requestAudioFocus: jest.fn(),
    abandonAudioFocus: jest.fn(),
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});
