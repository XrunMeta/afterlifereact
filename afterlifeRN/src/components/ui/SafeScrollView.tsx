import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { ScrollView, Platform, StyleSheet, ScrollViewProps, ViewStyle, View, Keyboard, findNodeHandle, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidNavigationBarHeight } from 'react-native-navigation-bar-height';
import { COLORS, SAFE_AREA } from '../constants';
import { KeyboardScrollProvider, useKeyboardScroll } from '../context/KeyboardScrollContext';

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;

  additionalBottomPadding?: number;

  showBottomBackground?: boolean;

  bottomBackgroundColor?: string;

  backgroundColor?: string;

  autoAdjustKeyboardPadding?: boolean;

  disableBottomPadding?: boolean;

  showStatusBarBackground?: boolean;

  statusBarBackgroundColor?: string;
}

const SafeScrollViewInner = forwardRef<ScrollView, SafeScrollViewProps>(({
  children,
  style,
  contentContainerStyle,
  additionalBottomPadding = 0,
  showBottomBackground = true,
  bottomBackgroundColor = SAFE_AREA.bottomBackground || "#fafafa",
  backgroundColor = SAFE_AREA.background || "#fafafa",
  autoAdjustKeyboardPadding = false,
  disableBottomPadding = false,
  showStatusBarBackground = false,
  statusBarBackgroundColor = '#FFFFFF',
  ...props
}, ref) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const internalScrollViewRef = useRef<ScrollView>(null);
  const keyboardScroll = useKeyboardScroll();

  const navBarHeight = useAndroidNavigationBarHeight(0);

  useImperativeHandle(ref, () => internalScrollViewRef.current as ScrollView, []);

  useEffect(() => {
    if (keyboardScroll && autoAdjustKeyboardPadding && internalScrollViewRef.current) {
      keyboardScroll.registerScrollView(internalScrollViewRef.current);
    }
  }, [keyboardScroll, autoAdjustKeyboardPadding]);

  useEffect(() => {
    if (keyboardScroll && autoAdjustKeyboardPadding) {
      keyboardScroll.setKeyboardHeight(keyboardHeight);
    }
  }, [keyboardScroll, autoAdjustKeyboardPadding, keyboardHeight]);

  useEffect(() => {
    if (!autoAdjustKeyboardPadding) {
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates.height;
      setKeyboardHeight(height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [autoAdjustKeyboardPadding]);

  const baseBottomPadding =
    Platform.OS === 'ios'
      ? insets.bottom
      : Math.max(navBarHeight, insets.bottom);

  const keyboardPadding =
    autoAdjustKeyboardPadding && Platform.OS === 'android' ? keyboardHeight : 0;

  const finalBottomPadding = disableBottomPadding
    ? additionalBottomPadding + keyboardPadding
    : baseBottomPadding + additionalBottomPadding + keyboardPadding;

  return (
    <View style={[styles.wrapper, { backgroundColor }]}>
      {showStatusBarBackground && (
        <View
          style={[
            styles.statusBarBackground,
            {
              height: insets.top,
              backgroundColor: statusBarBackgroundColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
      <ScrollView
        ref={internalScrollViewRef}
        style={[styles.container, style]}
        automaticallyAdjustKeyboardInsets={autoAdjustKeyboardPadding}
        keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? "handled"}
        contentContainerStyle={(() => {

          if (!contentContainerStyle) {
            return {
              paddingBottom: finalBottomPadding,
            };
          }

          const styleArray = Array.isArray(contentContainerStyle)
            ? contentContainerStyle
            : [contentContainerStyle];
          const mergedStyle = Object.assign({}, ...styleArray.filter(Boolean));

          const { paddingVertical, paddingTop: originalPaddingTop, paddingBottom: originalPaddingBottom, ...restStyle } = mergedStyle;

          return {
            ...restStyle,
            paddingTop: paddingVertical ?? originalPaddingTop,

            paddingBottom: finalBottomPadding,
          };
        })()}
        {...props}
      >
        {children}
      </ScrollView>
      {showBottomBackground && (
        <View
          style={[
            styles.bottomBackground,
            {
              height: Math.max(finalBottomPadding, 1),
              backgroundColor: bottomBackgroundColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
});

SafeScrollViewInner.displayName = 'SafeScrollViewInner';

const SafeScrollView = forwardRef<ScrollView, SafeScrollViewProps>(({
  autoAdjustKeyboardPadding = false,
  ...props
}, ref) => {

  if (autoAdjustKeyboardPadding) {
    return (
      <KeyboardScrollProvider enabled={true}>
        <SafeScrollViewInner ref={ref} autoAdjustKeyboardPadding={autoAdjustKeyboardPadding} {...props} />
      </KeyboardScrollProvider>
    );
  }

  return <SafeScrollViewInner ref={ref} autoAdjustKeyboardPadding={false} {...props} />;
});

SafeScrollView.displayName = 'SafeScrollView';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 10,
  },
});

export default SafeScrollView;
export type { SafeScrollViewProps };

