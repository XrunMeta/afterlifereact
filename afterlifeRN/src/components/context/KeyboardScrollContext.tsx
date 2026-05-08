import React, { createContext, useContext, useRef, useCallback } from "react";
import {
  ScrollView,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";

interface KeyboardScrollContextType {
  registerScrollView: (scrollView: ScrollView) => void;
  scrollToFocusedInput: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  setKeyboardHeight: (height: number) => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextType | null>(null);

interface KeyboardScrollProviderProps {
  children: React.ReactNode;
  enabled: boolean;
}

export const KeyboardScrollProvider: React.FC<KeyboardScrollProviderProps> = ({
  children,
  enabled,
}) => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const keyboardHeightRef = useRef(0);
  const inputYRef = useRef(0);

  const registerScrollView = useCallback((scrollView: ScrollView) => {
    scrollViewRef.current = scrollView;
  }, []);

  const setKeyboardHeight = useCallback((height: number) => {

    keyboardHeightRef.current = height;
  }, []);

  const scrollToFocusedInput = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {

      void event;
      void scrollViewRef;
      void enabled;
    },
    [enabled],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <KeyboardScrollContext.Provider
      value={{ registerScrollView, scrollToFocusedInput, setKeyboardHeight }}
    >
      {children}
    </KeyboardScrollContext.Provider>
  );
};

export const useKeyboardScroll = () => useContext(KeyboardScrollContext);
