import '@testing-library/jest-native/extend-expect';

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Feather: View,
    AntDesign: View,
    MaterialIcons: View,
    Ionicons: View,
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
}));

afterEach(() => {
  jest.clearAllMocks();
});
