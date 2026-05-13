

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
import { v_52ec3e, v_110960 } from "euzpkmxzoe";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
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

const v_398571 = [
  ["안녕!", "나는 네 소중한 기억 속에", "살고 있는 요정이야"],
  ["지금 네가 가장 보고 싶은", "'그 얼굴'을 한 번 떠올려봐..."],
  ["떠올랐어!?", "그럼, 네 머리속에 있는 그 소중한 존재를", "생각하며 답해줘!"],
] as const;
const v_578b11 = 700;   
const v_864f4c = 800;    
const v_4c4012 = 400;  

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

  const [v_b49aa2, v_b7772b] = v_5ab095(false);

  const [v_e85448, v_afa9b8] = v_5ab095(false);
  const v_2954b6 = v_110960(
    require("../../../assets/fairy-intro.mp4"),
    (v_86394a) => {
      try {
        v_86394a.loop = true;
        v_86394a.muted = true;
        v_86394a.play();
      } catch (v_49263d) {
        console.warn("[Step6] fairy video setup failed:", v_49263d);
        v_afa9b8(true);
      }
    },
  );

  const v_be1ebe = v_e662ae(new v_a2349e.Value(0)).current;
  const v_63f408 = v_e662ae(new v_a2349e.Value(0.6)).current;

  const v_8e9bbd = v_e662ae(
    v_398571.map(() => new v_a2349e.Value(0)),
  ).current;

  const v_f7adb5 = () => {

    v_8e9bbd.forEach((v_f96a98) => v_f96a98.setValue(1));
    v_b7772b(true);
  };

  v_c4deb2(() => {
    if (v_ab4803 !== "intro") return;
    let v_2008a4 = false;
    const v_e90120 = [];

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

    v_398571.forEach((v_37eab7, v_e86ad8) => {
      const v_4b24d2 = v_4c4012 + v_e86ad8 * (v_578b11 + v_864f4c);
      const v_8d41d7 = setTimeout(() => {
        if (v_2008a4) return;
        v_a2349e.timing(v_8e9bbd[v_e86ad8]!, {
          toValue: 1,
          duration: v_578b11,
          easing: v_cdbae1.out(v_cdbae1.cubic),
          useNativeDriver: true,
        }).start();
      }, v_4b24d2);
      v_e90120.push(v_8d41d7);
    });

    const v_57324b =
      v_4c4012 +
      v_398571.length * (v_578b11 + v_864f4c) -
      v_864f4c;
    const v_217439 = setTimeout(() => {
      if (!v_2008a4) v_b7772b(true);
    }, v_57324b);
    v_e90120.push(v_217439);

    return () => {
      v_2008a4 = true;
      v_e90120.forEach(clearTimeout);
    };

  }, [v_ab4803]);

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

  const v_e2f265 = v_ab4803 === "intro";

  const v_969fe9 = v_e662ae(new v_a2349e.Value(0)).current;
  v_c4deb2(() => {
    if (v_ab4803 === "intro") return;
    v_969fe9.setValue(0);
    v_a2349e.timing(v_969fe9, {
      toValue: 1,
      duration: 450,
      easing: v_cdbae1.out(v_cdbae1.cubic),
      useNativeDriver: true,
    }).start();
  }, [v_ab4803, v_969fe9]);

  const v_d57121 = {
    name: {
      title: "그 존재의 이름이 뭐였어?",
      desc: "네가 부르던 이름이나 별명, 어떤 호칭이든 좋아.",
      placeholder: "예: 별이, 할머니, 모리",
      value: v_1833e7,
      onChange: v_318f24,
      multiline: false,
    },
    firstMeeting: {
      title: "그 존재와는 어떻게 처음 만나게 되었어?",
      desc: "우리 사이에 잊지 못할 특별한 첫 순간이나 추억이 있었는지 궁금해!",
      placeholder: "떠오르는 그 첫 장면을 자유롭게 적어줘.",
      value: v_9d451c,
      onChange: v_087901,
      multiline: true,
    },
    habit: {
      title: "자주 하던 말이나 눈길이 가던 습관이 있었니?",
      desc: "꼬리를 살랑이거나, 특유의 말투 같은 사소한 거라도 좋아!",
      placeholder: "입버릇, 작은 습관, 좋아하던 자리 — 사소할수록 좋아.",
      value: v_7fae74,
      onChange: v_e2f100,
      multiline: true,
    },
    personality: {
      title: "그 존재의 성격은 어땠어?",
      desc: "혹시 MBTI가 생각나니? 기억이 안 난다면 평소 성격을 살짝 귀띔해 줄래?",
      placeholder: "예: 조용하고 다정한 INFP. 잘 웃고 잘 우는 사람이었어.",
      value: v_324a89,
      onChange: v_87462f,
      multiline: true,
    },
    memory: {
      title: "눈 감으면 어제처럼 선명한 그 장면이 있을까?",
      desc: "가장 행복하게 웃고(혹은 뛰놀고) 있던 그 순간을 나에게도 공유해 줘! ✨",
      placeholder: "그 순간의 풍경, 표정, 소리 — 떠오르는 대로.",
      value: v_773b4c,
      onChange: v_f714d9,
      multiline: true,
    },
  } as const;
  const v_ab6401 = !v_e2f265 ? v_d57121[v_ab4803 as keyof typeof v_d57121] : null;

  return (
    <SafeView backgroundColor="#000000">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={v_326be8.OS === "ios" ? "padding" : undefined}
      >
        {
}
        <View style={v_d81136.topBar}>
          <TouchableOpacity onPress={v_c7ac57} hitSlop={12} style={v_d81136.backBtn}>
            <Feather name="arrow-left" size={24} color={v_1bfbd0.white} />
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={v_0e1f26.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={v_d81136.formWrap}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {
}
            <Animated.View
              style={[
                v_d81136.videoWrap,
                v_e2f265
                  ? { opacity: v_be1ebe, transform: [{ scale: v_63f408 }] }
                  : null,
              ]}
              pointerEvents="none"
            >
              {v_e85448 ? (
                <Text style={v_d81136.fallbackEmoji}>✨</Text>
              ) : (
                <VideoView
                  style={v_d81136.video}
                  player={v_2954b6}
                  contentFit="contain"
                  nativeControls={false}
                />
              )}
            </Animated.View>

            {}
            {v_e2f265 && (
              <TouchableOpacity
                onPress={v_f7adb5}
                activeOpacity={1}
                accessibilityLabel="도입부 건너뛰기"
                style={v_d81136.introTextBox}
              >
                {v_398571.map((v_43dc75, v_ccbc5e) => {
                  const v_664b8c = v_ccbc5e === 0;
                  return (
                    <Animated.View
                      key={v_ccbc5e}
                      style={[
                        v_d81136.paragraph,
                        { opacity: v_8e9bbd[v_ccbc5e]! },
                      ]}
                    >
                      {v_43dc75.map((v_e6293e, v_939ac9) => (
                        <Text
                          key={v_939ac9}
                          style={v_664b8c ? v_d81136.introTitle : v_d81136.introBody}
                        >
                          {v_e6293e}
                        </Text>
                      ))}
                    </Animated.View>
                  );
                })}
              </TouchableOpacity>
            )}

            {
}
            {v_ab6401 && (
              <Animated.View style={[v_d81136.questionBox, { opacity: v_969fe9 }]}>
                <Text style={v_d81136.qTitle}>{v_ab6401.title}</Text>
                <Text style={v_d81136.qDesc}>{v_ab6401.desc}</Text>
                <TextInput

                  key={v_ab4803}
                  style={[v_d81136.input, v_ab6401.multiline && v_d81136.textarea]}
                  value={v_ab6401.value}
                  onChangeText={v_ab6401.onChange}
                  placeholder={v_ab6401.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoFocus
                  multiline={v_ab6401.multiline}
                  textAlignVertical={v_ab6401.multiline ? "top" : "center"}
                  returnKeyType={v_ab6401.multiline ? "default" : "next"}
                  onSubmitEditing={v_ab6401.multiline ? undefined : v_219251}
                  maxLength={v_ab6401.multiline ? 500 : 40}
                  selectionColor={v_1bfbd0.white}
                />
              </Animated.View>
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
              {v_e2f265 ? "시작하기" : "다음"}
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

  topBar: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  backBtn: { padding: 8, alignSelf: "flex-start" },

  videoWrap: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginBottom: 12,
  },
  video: { width: "100%", height: "100%" },
  fallbackEmoji: { fontSize: 100, textAlign: "center", lineHeight: 180 },

  introTextBox: { gap: 20, alignItems: "center", width: "100%" },
  paragraph: { gap: 4, alignItems: "center", paddingHorizontal: 8 },
  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: v_1bfbd0.white,
    textAlign: "center",
    lineHeight: 32,
  },
  introBody: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 26,
  },

  questionBox: { width: "100%", gap: 10 },
  qTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: v_1bfbd0.white,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 4,
  },
  qDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: v_8b0c90.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: v_1bfbd0.white,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  textarea: { minHeight: 140, paddingTop: 12 },

  bottomBar: {
    padding: v_9b1a04.large,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
});
