

import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
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
  v_122070,
  v_a2349e,
  v_cdbae1,
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

type Phase =
  | "intro"
  | "name"
  | "firstMeeting"
  | "habit"
  | "personality"
  | "memory";

const v_1613bd = [
  "name",
  "firstMeeting",
  "habit",
  "personality",
  "memory",
];
const v_1c0e96 = v_1613bd.length;

const v_d52b26 = [
  "안녕! 나는 네 소중한 기억 속에 살고 있는 요정이야.",
  "지금 네가 가장 보고 싶은 '그 얼굴'을 한 번 떠올려봐...",
  "떠올랐어?! 그럼, 네 머릿속에 있는 그 소중한 존재를 생각하며 답해줘!",
] as const;
const v_0d2e40 = 35;   
const v_cf0e03 = 450;  

export default function v_baac2f({ navigation: v_c65f5d }: Props) {
  v_772971();
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_ab4803, v_ae4844] = v_5ab095<Phase>("intro");
  const [v_1833e7, v_318f24] = v_5ab095<string>(v_f04727.name ?? "");
  const [v_9d451c, v_087901] = v_5ab095<string>("");
  const [v_7fae74, v_e2f100] = v_5ab095<string>("");
  const [v_324a89, v_87462f] = v_5ab095<string>("");
  const [v_773b4c, v_f714d9] = v_5ab095<string>("");

  const [v_5e91e6, v_ad78c2] = v_5ab095<string[]>(() => v_d52b26.map(() => ""));
  const [v_b49aa2, v_b7772b] = v_5ab095(false);
  const v_f7adb5 = () => {
    v_ad78c2(v_d52b26.map((v_1614db) => v_1614db));
    v_b7772b(true);
  };

  const v_be1ebe = v_e662ae(new v_a2349e.Value(0)).current;
  const v_63f408 = v_e662ae(new v_a2349e.Value(0.6)).current;

  const v_6821b6 = v_e662ae(new v_a2349e.Value(1)).current;

  v_c4deb2(() => {
    if (v_ab4803 !== "intro") return;
    let v_2008a4 = false;

    v_a2349e.parallel([
      v_a2349e.timing(v_be1ebe, {
        toValue: 1,
        duration: 500,
        easing: v_cdbae1.out(v_cdbae1.cubic),
        useNativeDriver: true,
      }),
      v_a2349e.spring(v_63f408, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const v_d083b4 = v_a2349e.loop(
      v_a2349e.sequence([
        v_a2349e.timing(v_6821b6, { toValue: 0, duration: 500, useNativeDriver: true }),
        v_a2349e.timing(v_6821b6, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    v_d083b4.start();

    const v_d9b231 = async () => {

      await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 400));
      const v_5e40b9 = v_d52b26.map(() => "");
      for (let v_ea26ea = 0; v_ea26ea < v_d52b26.length; v_ea26ea++) {
        const v_e6293e = v_d52b26[v_ea26ea]!;
        for (let v_9f8c39 = 1; v_9f8c39 <= v_e6293e.length; v_9f8c39++) {
          if (v_2008a4) return;
          v_5e40b9[v_ea26ea] = v_e6293e.slice(0, v_9f8c39);
          v_ad78c2([...v_5e40b9]);
          await new Promise((v_cb35cb) => setTimeout(v_cb35cb, v_0d2e40));
        }
        if (v_2008a4) return;
        await new Promise((v_cb35cb) => setTimeout(v_cb35cb, v_cf0e03));
      }
      if (!v_2008a4) v_b7772b(true);
    };
    v_d9b231();

    return () => {
      v_2008a4 = true;
      v_d083b4.stop();
    };
  }, [v_ab4803, v_be1ebe, v_63f408, v_6821b6]);

  const v_6c06d1 = (): string => {
    const v_946c09 = [];
    if (v_9d451c.trim()) v_946c09.push(`[첫 만남]\n${v_9d451c.trim()}`);
    if (v_7fae74.trim()) v_946c09.push(`[습관/말투]\n${v_7fae74.trim()}`);
    if (v_324a89.trim()) v_946c09.push(`[성격]\n${v_324a89.trim()}`);
    if (v_773b4c.trim()) v_946c09.push(`[가장 선명한 추억]\n${v_773b4c.trim()}`);
    return v_946c09.join("\n\n");
  };

  const v_aabc29 = new Set([
    "ISTJ","ISFJ","INFJ","INTJ",
    "ISTP","ISFP","INFP","INTP",
    "ESTP","ESFP","ENFP","ENTP",
    "ESTJ","ESFJ","ENFJ","ENTJ",
  ] as const);
  type PersonaMbtiCode = typeof v_aabc29 extends Set<infer T> ? T : never;
  const v_ab7d46 = (v_9b6134): PersonaMbtiCode | undefined => {
    const v_35f85c = v_9b6134.match(/\b([EI][NS][FT][JP])\b/i);
    if (!v_35f85c) return undefined;
    const v_c99bd2 = v_35f85c[1]!.toUpperCase();
    return v_aabc29.has(v_c99bd2 as PersonaMbtiCode) ? (v_c99bd2 as PersonaMbtiCode) : undefined;
  };

  const v_219251 = () => {
    if (v_ab4803 === "intro") {
      v_ae4844("name");
      return;
    }
    if (v_ab4803 === "name") {
      const v_2f361a = v_1833e7.trim();
      if (!v_2f361a) return;
      v_5795de({
        name: v_2f361a,
        username: v_b55477(v_2f361a),
      });
      v_ae4844("firstMeeting");
      return;
    }
    if (v_ab4803 === "firstMeeting") {
      v_ae4844("habit");
      return;
    }
    if (v_ab4803 === "habit") {
      v_ae4844("personality");
      return;
    }
    if (v_ab4803 === "personality") {
      const v_42f66e = v_ab7d46(v_324a89);
      if (v_42f66e) v_5795de({ personaMbti: v_42f66e });
      v_ae4844("memory");
      return;
    }
    if (v_ab4803 === "memory") {
      v_5795de({ personaNotes: v_6c06d1() });
      v_c65f5d.navigate("Step7");
    }
  };

  const v_c7ac57 = () => {
    const v_e86ad8 = v_1613bd.indexOf(v_ab4803 as (typeof v_1613bd)[number]);
    if (v_ab4803 === "intro") {
      v_c65f5d.goBack();
    } else if (v_e86ad8 === 0) {
      v_ae4844("intro");
    } else if (v_e86ad8 > 0) {
      v_ae4844(v_1613bd[v_e86ad8 - 1]!);
    }
  };

  const v_fc0cf5 = (() => {

    if (v_ab4803 === "intro") return v_b49aa2;
    if (v_ab4803 === "name") return v_1833e7.trim().length > 0;

    return true;
  })();

  const v_34b72e = v_1613bd.indexOf(
    v_ab4803 as (typeof v_1613bd)[number],
  ) + 1;

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
        <TouchableWithoutFeedback onPress={v_0e1f26.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={v_d81136.formWrap}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {v_ab4803 === "intro" && (
              <TouchableOpacity
                style={v_d81136.introBox}
                onPress={v_f7adb5}
                activeOpacity={1}
                accessibilityLabel="도입부 건너뛰기"
              >
                {}
                <Animated.Text
                  style={[
                    v_d81136.introEmoji,
                    {
                      opacity: v_be1ebe,
                      transform: [{ scale: v_63f408 }],
                    },
                  ]}
                >
                  ✨
                </Animated.Text>

                {
}
                {v_d52b26.map((v_e6293e, v_ebec57) => {
                  if (v_5e91e6[v_ebec57].length === 0) return null;

                  const v_359bf6 = !v_b49aa2 && v_5e91e6[v_ebec57].length < v_e6293e.length;
                  const v_809f45 = v_ebec57 === 0;
                  const v_197d6e = v_809f45 ? v_d81136.introTitle : v_d81136.introBody;
                  return (
                    <Text key={v_ebec57} style={v_197d6e}>
                      {v_5e91e6[v_ebec57]}
                      {v_359bf6 && (
                        <Animated.Text style={{ opacity: v_6821b6, color: v_1bfbd0.violet600 }}>
                          ▍
                        </Animated.Text>
                      )}
                    </Text>
                  );
                })}
              </TouchableOpacity>
            )}

            {v_ab4803 === "name" && (
              <>
                <Text style={v_d81136.qLabel}>{v_34b72e} / {v_1c0e96}</Text>
                <Text style={v_d81136.qTitle}>그 존재의 이름이 뭐였어?</Text>
                <Text style={v_d81136.qDesc}>
                  네가 부르던 이름이나 별명, 어떤 호칭이든 좋아.
                </Text>
                <TextInput
                  style={v_d81136.input}
                  value={v_1833e7}
                  onChangeText={v_318f24}
                  placeholder="예: 별이, 할머니, 모리"
                  placeholderTextColor={v_1bfbd0.zinc400}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={v_219251}
                  maxLength={40}
                />
              </>
            )}

            {v_ab4803 === "firstMeeting" && (
              <>
                <Text style={v_d81136.qLabel}>{v_34b72e} / {v_1c0e96}</Text>
                <Text style={v_d81136.qTitle}>
                  그 존재와는 어떻게 처음 만나게 되었어?
                </Text>
                <Text style={v_d81136.qDesc}>
                  우리 사이에 잊지 못할 특별한 첫 순간이나 추억이 있었는지 궁금해!
                </Text>
                <TextInput
                  style={[v_d81136.input, v_d81136.textarea]}
                  value={v_9d451c}
                  onChangeText={v_087901}
                  placeholder="떠오르는 그 첫 장면을 자유롭게 적어줘."
                  placeholderTextColor={v_1bfbd0.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {v_ab4803 === "habit" && (
              <>
                <Text style={v_d81136.qLabel}>{v_34b72e} / {v_1c0e96}</Text>
                <Text style={v_d81136.qTitle}>
                  자주 하던 말이나 눈길이 가던 습관이 있었니?
                </Text>
                <Text style={v_d81136.qDesc}>
                  꼬리를 살랑이거나, 특유의 말투 같은 사소한 거라도 좋아!
                </Text>
                <TextInput
                  style={[v_d81136.input, v_d81136.textarea]}
                  value={v_7fae74}
                  onChangeText={v_e2f100}
                  placeholder="입버릇, 작은 습관, 좋아하던 자리 — 사소할수록 좋아."
                  placeholderTextColor={v_1bfbd0.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {v_ab4803 === "personality" && (
              <>
                <Text style={v_d81136.qLabel}>{v_34b72e} / {v_1c0e96}</Text>
                <Text style={v_d81136.qTitle}>
                  그 존재의 성격은 어땠어?
                </Text>
                <Text style={v_d81136.qDesc}>
                  혹시 MBTI가 생각나니? 기억이 안 난다면 평소 성격을 살짝 귀띔해 줄래?
                </Text>
                <TextInput
                  style={[v_d81136.input, v_d81136.textarea]}
                  value={v_324a89}
                  onChangeText={v_87462f}
                  placeholder="예: 조용하고 다정한 INFP. 잘 웃고 잘 우는 사람이었어."
                  placeholderTextColor={v_1bfbd0.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {v_ab4803 === "memory" && (
              <>
                <Text style={v_d81136.qLabel}>{v_34b72e} / {v_1c0e96}</Text>
                <Text style={v_d81136.qTitle}>
                  눈 감으면 어제처럼 선명한 그 장면이 있을까?
                </Text>
                <Text style={v_d81136.qDesc}>
                  가장 행복하게 웃고(혹은 뛰놀고) 있던 그 순간을 나에게도 공유해 줘! ✨
                </Text>
                <TextInput
                  style={[v_d81136.input, v_d81136.textarea]}
                  value={v_773b4c}
                  onChangeText={v_f714d9}
                  placeholder="그 순간의 풍경, 표정, 소리 — 떠오르는 대로."
                  placeholderTextColor={v_1bfbd0.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
        <View style={v_d81136.bottomBar}>
          <TouchableOpacity
            style={[v_d81136.btn, !v_fc0cf5 && v_d81136.btnDisabled]}
            onPress={v_219251}
            disabled={!v_fc0cf5}
            activeOpacity={0.85}
          >
            <Text style={v_d81136.btnText}>
              {v_ab4803 === "intro" ? "시작하기" : "다음"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  formWrap: {
    flexGrow: 1,
    paddingHorizontal: v_9b1a04.xlarge,
    paddingTop: 32,
    paddingBottom: 32,
  },

  introBox: { gap: 14, paddingTop: 12 },
  introEmoji: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    lineHeight: 30,
  },
  introBody: {
    fontSize: 15,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 24,
  },

  qLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: v_1bfbd0.violet600,
    marginBottom: 8,
  },
  qTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 8,
    lineHeight: 30,
  },
  qDesc: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    marginBottom: 20,
    lineHeight: 20,
  },
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

  bottomBar: {
    padding: v_9b1a04.large,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
});
