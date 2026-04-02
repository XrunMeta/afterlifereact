import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidNavigationBarHeight } from 'react-native-navigation-bar-height';
import { COLORS, SAFE_AREA } from '../constants';

interface SafeViewProps {
    children: React.ReactNode;
    style?: ViewStyle;

    additionalBottomPadding?: number;

    showBottomBackground?: boolean;

    bottomBackgroundColor?: string;

    backgroundColor?: string;

    showStatusBarBackground?: boolean;

    statusBarBackgroundColor?: string;
}

const SafeView: React.FC<SafeViewProps> = ({
    children,
    style,
    additionalBottomPadding = 0,
    showBottomBackground = true,
    bottomBackgroundColor = SAFE_AREA.bottomBackground || "#fafafa",
    backgroundColor = SAFE_AREA.background || "#fafafa",
    showStatusBarBackground = false,
    statusBarBackgroundColor = '#FFFFFF',
}) => {
    const insets = useSafeAreaInsets();

    const navBarHeight = useAndroidNavigationBarHeight(0);

    const baseBottomPadding =
        Platform.OS === 'ios'
            ? insets.bottom
            : Math.max(navBarHeight, insets.bottom);

    const finalBottomPadding = baseBottomPadding + additionalBottomPadding;
    const screenHeight = Dimensions.get('window').height;

    return (
        <View style={[styles.wrapper, style]}>
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
            <View
                style={[
                    styles.container,
                    {
                        height: screenHeight,
                        backgroundColor,

                        paddingBottom: showBottomBackground ? finalBottomPadding : 0,
                    }
                ]}
            >
                {children}
            </View>
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
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
    },
    container: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
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

export default SafeView;

