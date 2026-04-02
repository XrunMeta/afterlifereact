import React, { createContext, useContext, useRef, useCallback } from "react";
import {
  ScrollView,
  TextInput,
  Keyboard,
  Platform,
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

    if (height > 0 && scrollViewRef.current && inputYRef.current > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, inputYRef.current - 120),
          animated: true,
        });
      }, 100);
    }
  }, []);

  const scrollToFocusedInput = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      if (!scrollViewRef.current || !enabled) return;

      const target = event.target;
      if (!target) return;

      setTimeout(() => {
        if (!scrollViewRef.current) return;

        (target as any).measureInWindow?.(
          (_x: number, pageY: number, _w: number, h: number) => {

            inputYRef.current = pageY;

            if (keyboardHeightRef.current > 0) {
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, pageY - 200),
                animated: true,
              });
            }
          }
        );

        if (!(target as any).measureInWindow) {

          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 300);
    },
    [enabled]
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
