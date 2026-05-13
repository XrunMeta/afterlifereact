

import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_326be8,
  v_e767d1,
  v_a944fa,
  v_0e1f26,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_194498 } from "../../stores/cloneStore";
import { v_b55477 } from "../../api/clones";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step6">;
};

type Phase = "name" | "username" | "personality";

export default function v_baac2f({ navigation: v_c65f5d }: Props) {
  v_772971();
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_ab4803, v_ae4844] = v_5ab095<Phase>("name");
  const [v_1833e7, v_318f24] = v_5ab095<string>(v_f04727.name ?? "");
  const [v_556427, v_e71a3b] = v_5ab095<string>(v_f04727.username ?? "");
  const [v_324a89, v_87462f] = v_5ab095<string>(v_f04727.personaNotes ?? "");

  const v_219251 = () => {
    if (v_ab4803 === "name") {
      const v_2f361a = v_1833e7.trim();
      if (!v_2f361a) return;
      v_5795de({ name: v_2f361a });
      v_ae4844("username");
    } else if (v_ab4803 === "username") {

      const v_479f05 = v_556427.trim();
      const v_1794cd = v_479f05.length >= 3
        ? v_479f05.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        : v_b55477(v_1833e7.trim());
      v_e71a3b(v_1794cd);
      v_5795de({ username: v_1794cd });
      v_ae4844("personality");
    } else if (v_ab4803 === "personality") {
      v_5795de({ personaNotes: v_324a89.trim() });

      v_c65f5d.navigate("Step7");
    }
  };

  const v_c7ac57 = () => {
    if (v_ab4803 === "username") v_ae4844("name");
    else if (v_ab4803 === "personality") v_ae4844("username");
    else v_c65f5d.goBack();
  };

  const v_fc0cf5 = v_ab4803 === "name" ? v_1833e7.trim().length > 0
    : v_ab4803 === "username" ? true 
    : v_ab4803 === "personality" ? true 
    : false;

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="페르소나 만들기"
        showBackButton
        onBackPress={v_c7ac57}
      />
      <StepIndicator currentStep={3} totalSteps={4} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={v_326be8.OS === "ios" ? "padding" : undefined}
      >
        {

}
        <TouchableWithoutFeedback onPress={v_0e1f26.dismiss} accessible={false}>
          <View style={v_d81136.formWrap}>
            {v_ab4803 === "name" && (
              <>
                <Text style={v_d81136.qLabel}>1 / 3</Text>
                <Text style={v_d81136.qTitle}>페르소나의 이름은 무엇인가요?</Text>
                <Text style={v_d81136.qDesc}>다른 사용자에게 표시될 이름입니다.</Text>
                <TextInput
                  style={v_d81136.input}
                  value={v_1833e7}
                  onChangeText={v_318f24}
                  placeholder="예: 김프로"
                  placeholderTextColor={v_1bfbd0.zinc400}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={v_219251}
                  maxLength={40}
                />
              </>
            )}

            {v_ab4803 === "username" && (
              <>
                <Text style={v_d81136.qLabel}>2 / 3</Text>
                <Text style={v_d81136.qTitle}>클론 아이디를 정해주세요</Text>
                <Text style={v_d81136.qDesc}>
                  영문 소문자/숫자/언더스코어. 비워두면 이름에서 자동 생성됩니다.
                </Text>
                <View style={v_d81136.handleRow}>
                  <Text style={v_d81136.handlePrefix}>@</Text>
                  <TextInput
                    style={[v_d81136.input, { flex: 1 }]}
                    value={v_556427}
                    onChangeText={(v_81e2ef) => v_e71a3b(v_81e2ef.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                    placeholder="kimpro123"
                    placeholderTextColor={v_1bfbd0.zinc400}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={v_219251}
                    maxLength={30}
                  />
                </View>
              </>
            )}

            {v_ab4803 === "personality" && (
              <>
                <Text style={v_d81136.qLabel}>3 / 3</Text>
                <Text style={v_d81136.qTitle}>어떤 성격인가요?</Text>
                <Text style={v_d81136.qDesc}>
                  말투, 좋아하는 것, 평소 분위기 등을 자유롭게 적어주세요.
                </Text>
                <TextInput
                  style={[v_d81136.input, v_d81136.textarea]}
                  value={v_324a89}
                  onChangeText={v_87462f}
                  placeholder="예: 차분하고 따뜻한 말투로 대화해요. 책 읽기와 산책을 좋아합니다."
                  placeholderTextColor={v_1bfbd0.zinc400}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
        <View style={v_d81136.bottomBar}>
          <TouchableOpacity
            style={[v_d81136.btn, !v_fc0cf5 && v_d81136.btnDisabled]}
            onPress={v_219251}
            disabled={!v_fc0cf5}
            activeOpacity={0.85}
          >
            <Text style={v_d81136.btnText}>다음</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({

  formWrap: { flex: 1, paddingHorizontal: v_9b1a04.xlarge, paddingTop: 32 },
  qLabel: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.violet600, marginBottom: 8 },
  qTitle: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 8 },
  qDesc: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 20, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50,
  },
  textarea: { minHeight: 140, paddingTop: 12 },
  handleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  handlePrefix: { fontSize: 18, color: v_1bfbd0.zinc500, fontWeight: "600" },

  bottomBar: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
  btn: {
    paddingVertical: 14,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
});
