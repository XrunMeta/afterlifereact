import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapperStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rounded?: number;
}

const TextField = React.forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      errorText,
      containerStyle,
      inputWrapperStyle,
      leftIcon,
      rightIcon,
      rounded = 10,
      placeholderTextColor = COLORS.placeholder,
      style,
      onFocus,
      multiline,
      textAlignVertical,
      ...rest
    },
    ref,
  ) => {

    const handleFocus = (event: any) => {

      if (onFocus) {
        onFocus(event);
      }
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.inputWrapper,
            multiline ? styles.inputWrapperMultiline : styles.inputWrapperSingle,
            { borderRadius: rounded },
            inputWrapperStyle,
          ]}
        >
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              multiline ? styles.inputMultiline : styles.inputSingle,
              style,
            ]}
            placeholderTextColor={placeholderTextColor}
            onFocus={handleFocus}
            multiline={multiline}
            textAlignVertical={
              multiline ? "top" : textAlignVertical
            }
            {...rest}
          />
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    color: COLORS.mutedText,
    marginBottom: SIZES.small / 2,
    fontFamily: FONTS.medium,
  },
  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.medium,
  },
  inputWrapperSingle: {
    alignItems: "center",
    paddingVertical: SIZES.small,
    height: 52,
  },
  inputWrapperMultiline: {
    alignItems: "flex-start",
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.medium,
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  inputSingle: {
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 22,
  },
  leftIcon: {
    marginRight: SIZES.small,
  },
  rightIcon: {
    marginLeft: SIZES.small,
  },
  errorText: {
    marginTop: SIZES.small / 2,
    fontSize: 12,
    color: COLORS.error,
    fontFamily: FONTS.medium,
  },
});

export default TextField;

