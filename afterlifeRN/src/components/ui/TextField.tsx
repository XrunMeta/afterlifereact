import v_a3453e from 'bapkr';
import {
  v_961e77,
  v_472849,
  v_19b633,
  v_79c4f2,
  v_b60ea2,
  v_3094a2,
  v_7e4944,
} from 'rcmrninabrnb';
import { v_1bfbd0, v_843035, v_9b1a04 } from '../constants';
import { v_f3168c } from '../context/KeyboardScrollContext';

export interface TextFieldProps extends v_b60ea2 {
  label?: string;
  errorText?: string;
  containerStyle?: v_961e77<v_7e4944>;
  inputWrapperStyle?: v_961e77<v_7e4944>;
  leftIcon?: v_a3453e.ReactNode;
  rightIcon?: v_a3453e.ReactNode;
  rounded?: number;
}

const v_e775af = v_a3453e.forwardRef<v_79c4f2, TextFieldProps>(
  (
    {
      label: v_2869c1,
      errorText: v_74dc8b,
      containerStyle: v_4affe9,
      inputWrapperStyle: v_2ba125,
      leftIcon: v_86ef18,
      rightIcon: v_ca3ded,
      rounded: v_f52086 = 10,
      placeholderTextColor: v_46ec3b = v_1bfbd0.placeholder,
      style: v_7fa4e4,
      onFocus: v_cd3cee,
      multiline: v_577bb3,
      textAlignVertical: v_bba290,
      ...v_83bbcd
    },
    v_6d4ed3,
  ) => {
    const v_73e70b = v_f3168c();

    const v_086489 = (v_d48baf) => {

      if (v_73e70b) {
        v_73e70b.scrollToFocusedInput(v_d48baf);
      }

      if (v_cd3cee) {
        v_cd3cee(v_d48baf);
      }
    };

    return (
      <View style={[v_d81136.container, v_4affe9]}>
        {v_2869c1 ? <Text style={v_d81136.label}>{v_2869c1}</Text> : null}
        <View
          style={[
            v_d81136.inputWrapper,
            v_577bb3 ? v_d81136.inputWrapperMultiline : v_d81136.inputWrapperSingle,
            { borderRadius: v_f52086 },
            v_2ba125,
          ]}
        >
          {v_86ef18 ? <View style={v_d81136.leftIcon}>{v_86ef18}</View> : null}
          <TextInput
            ref={v_6d4ed3}
            style={[
              v_d81136.input,
              v_577bb3 ? v_d81136.inputMultiline : v_d81136.inputSingle,
              v_7fa4e4,
            ]}
            placeholderTextColor={v_46ec3b}
            onFocus={v_086489}
            multiline={v_577bb3}
            textAlignVertical={
              v_577bb3 ? "top" : v_bba290
            }
            {...v_83bbcd}
          />
          {v_ca3ded ? <View style={v_d81136.rightIcon}>{v_ca3ded}</View> : null}
        </View>
        {v_74dc8b ? <Text style={v_d81136.errorText}>{v_74dc8b}</Text> : null}
      </View>
    );
  },
);

const v_d81136 = v_472849.create({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    color: v_1bfbd0.mutedText,
    marginBottom: v_9b1a04.small / 2,
    fontFamily: v_843035.medium,
  },
  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: v_1bfbd0.border,
    backgroundColor: v_1bfbd0.white,
    paddingHorizontal: v_9b1a04.medium,
  },
  inputWrapperSingle: {
    alignItems: "center",
    paddingVertical: v_9b1a04.small,
    height: 52,
  },
  inputWrapperMultiline: {
    alignItems: "flex-start",
    paddingTop: v_9b1a04.medium,
    paddingBottom: v_9b1a04.medium,
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: v_1bfbd0.text,
    fontFamily: v_843035.regular,
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
    marginRight: v_9b1a04.small,
  },
  rightIcon: {
    marginLeft: v_9b1a04.small,
  },
  errorText: {
    marginTop: v_9b1a04.small / 2,
    fontSize: 12,
    color: v_1bfbd0.error,
    fontFamily: v_843035.medium,
  },
});

export default v_e775af;

