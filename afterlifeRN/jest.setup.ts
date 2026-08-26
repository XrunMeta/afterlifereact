import '@testing-library/jest-native/extend-expect';

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store.get(k) ?? null])),
      ),
      multiSet: jest.fn((pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => store.set(k, v));
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((k) => store.delete(k));
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Feather: View,
    AntDesign: View,
    MaterialIcons: View,
    Ionicons: View,
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: jest.fn((cb) => {

      const React = require('react');
      React.useEffect(() => {
        const c = cb();
        return typeof c === 'function' ? c : undefined;
      }, []);
    }),
    useIsFocused: jest.fn(() => true),
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => false),
      addListener: jest.fn(() => () => {}),
      removeListener: jest.fn(),
      setOptions: jest.fn(),
      reset: jest.fn(),
    })),
    useRoute: jest.fn(() => ({ params: {}, name: 'MockRoute', key: 'mock' })),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('react-native-webrtc', () => ({
  RTCPeerConnection: jest.fn(),
  RTCSessionDescription: jest.fn().mockImplementation((d) => d),
  RTCIceCandidate: jest.fn().mockImplementation((d) => d),
  MediaStream: jest
    .fn()
    .mockImplementation((tracks = []) => ({
      _tracks: tracks,
      toURL: () => 'mock://stream',
      getTracks: () => tracks,
      getAudioTracks: () => tracks.filter((t: { kind?: string }) => t?.kind === 'audio'),
    })),
  RTCView: 'RTCView',
  mediaDevices: { getUserMedia: jest.fn() },

  RTCAudioSession: {
    audioSessionDidActivate: jest.fn(),
    audioSessionDidDeactivate: jest.fn(),
  },
}));

jest.mock('react-native-incall-manager', () => ({
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
