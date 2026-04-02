import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_03e392,
  v_cf9c33,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_d56c0a from "../../components/ui/SelectField";
import v_84e2fc from "../../components/ui/InterestChip";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_bf4124 } from "../../mocks/interestHelpers";

type Props = {
  navigation: v_390fcc<v_384e19, "Signup">;
};

const v_798085 = [
  { value: "male" as const, label: "남성" },
  { value: "female" as const, label: "여성" },
  { value: "other" as const, label: "기타" },
];

const v_bbe45f = v_bf4124;

export default function v_f40fc5({ navigation: v_c65f5d }: Props) {
  const v_35200c = v_1ed7d9((v_fd5f43) => v_fd5f43.signup);

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_0b3ebe, v_241a35] = v_5ab095("");
  const [v_d74a81, v_fcce73] = v_5ab095("");
  const [v_c3eac4, v_bdc43c] = v_5ab095<"male" | "female" | "other" | "">("");
  const [v_2694bd, v_6e5c76] = v_5ab095("");
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_0b85b1, v_3c4c2d] = v_5ab095(false);
  const [v_5c764d, v_c5baa3] = v_5ab095(false);
  const [v_8c98c4, v_e378a4] = v_5ab095(false);

  const v_d82a00 = (v_e4601c) => {
    v_770327((v_ba2215) =>
      v_ba2215.includes(v_e4601c)
        ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c)
        : [...v_ba2215, v_e4601c]
    );
  };

  const v_585b02 = () => {
    if (!v_1833e7 || !v_e0c7e8 || !v_adc076 || !v_d74a81 || !v_c3eac4 || !v_2694bd) {
      v_03e392.alert("알림", "필수 항목을 모두 입력해주세요.");
      return;
    }
    if (v_adc076 !== v_0b3ebe) {
      v_03e392.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!v_5c764d) {
      v_03e392.alert("알림", "이용약관에 동의해주세요.");
      return;
    }

    v_c65f5d.navigate("Login");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title="회원가입"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={v_d81136.container}>
          {}
          <View style={v_d81136.logoRow}>
            <Image source={require("../../../assets/images/symbol.png")} style={v_d81136.symbolImage} />
            <Image source={require("../../../assets/images/logo.png")} style={v_d81136.logoImage} resizeMode="contain" />
            <Text style={v_d81136.subtitle}>새로운 계정을 만들어보세요</Text>
          </View>

          {}
          <TextField
            placeholder="이름"
            value={v_1833e7}
            onChangeText={v_318f24}
            leftIcon={<Feather name="user" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <TextField
            placeholder="이메일"
            value={v_e0c7e8}
            onChangeText={v_fedf34}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <TextField
            placeholder="비밀번호"
            value={v_adc076}
            onChangeText={v_52b279}
            secureTextEntry={!v_b5ab16}
            leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => v_b7733b(!v_b5ab16)}>
                <Feather name={v_b5ab16 ? "eye-off" : "eye"} size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            }
          />

          {}
          <TextField
            placeholder="비밀번호 확인"
            value={v_0b3ebe}
            onChangeText={v_241a35}
            secureTextEntry={!v_0b85b1}
            leftIcon={<Feather name="lock" size={20} color={v_1bfbd0.zinc500} />}
            rightIcon={
              <TouchableOpacity onPress={() => v_3c4c2d(!v_0b85b1)}>
                <Feather name={v_0b85b1 ? "eye-off" : "eye"} size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            }
          />

          {}
          <TextField
            placeholder="전화번호"
            value={v_d74a81}
            onChangeText={v_fcce73}
            keyboardType="phone-pad"
            leftIcon={<Feather name="phone" size={20} color={v_1bfbd0.zinc500} />}
          />

          {}
          <View style={v_d81136.row}>
            <View style={{ flex: 1 }}>
              <SelectField<"male" | "female" | "other">
                options={v_798085}
                value={v_c3eac4}
                onChange={v_bdc43c}
                placeholder="성별"
              />
            </View>
            <View style={v_d81136.ageField}>
              <TextField
                placeholder="나이"
                value={v_2694bd}
                onChangeText={v_6e5c76}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {}
          <View style={v_d81136.section}>
            <Text style={v_d81136.sectionLabel}>관심사 선택 (선택사항)</Text>
            <View style={v_d81136.chipGrid}>
              {v_bbe45f.map((v_e4601c) => (
                <InterestChip
                  key={v_e4601c}
                  label={v_e4601c}
                  selected={v_976e06.includes(v_e4601c)}
                  onPress={() => v_d82a00(v_e4601c)}
                />
              ))}
            </View>
          </View>

          {}
          <View style={v_d81136.terms}>
            <TouchableOpacity
              onPress={() => v_c5baa3(!v_5c764d)}
              style={v_d81136.checkRow}
            >
              <View style={[v_d81136.checkbox, v_5c764d && v_d81136.checkboxChecked]}>
                {v_5c764d && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                <Text style={v_d81136.termBold}>(필수)</Text> 이용약관 및 개인정보 처리방침에 동의합니다
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => v_e378a4(!v_8c98c4)}
              style={v_d81136.checkRow}
            >
              <View style={[v_d81136.checkbox, v_8c98c4 && v_d81136.checkboxChecked]}>
                {v_8c98c4 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
              </View>
              <Text style={v_d81136.termText}>
                <Text style={v_d81136.termOptional}>(선택)</Text> 마케팅 정보 수신에 동의합니다
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <Button title="가입하기" onPress={v_585b02} />

          {}
          <View style={v_d81136.loginRow}>
            <Text style={v_d81136.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate("Login")}>
              <Text style={v_d81136.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeScrollView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.xxlarge,
  },
  container: {
    width: "100%",
    maxWidth: 780,
    gap: v_9b1a04.medium,
  },
  logoRow: {
    alignItems: "center",
    marginBottom: v_9b1a04.large,
  },
  symbolImage: {
    width: 100,
    height: 80,
    marginBottom: 12,
  },
  logoImage: {
    width: 160,
    height: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  ageField: {
    width: 100,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  terms: {
    gap: 12,
    paddingTop: v_9b1a04.medium,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
  },
  termBold: {
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  termOptional: {
    color: v_1bfbd0.zinc400,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: v_9b1a04.medium,
  },
  loginText: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
});
