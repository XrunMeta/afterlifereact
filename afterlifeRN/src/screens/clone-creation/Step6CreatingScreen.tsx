

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

import { v_03e392 } from "rcmrninabrnb";
import v_556baf from "../../components/ui/SafeView";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_194498 } from "../../stores/cloneStore";
import { v_6c3f29, v_b55477 } from "../../api/clones";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step6">;
};

type Phase =
  | "intro"
  | "name"
  | "username"
  | "firstMeeting"
  | "habit"
  | "personality"
  | "memory";

const v_1613bd = [
  "name",
  "username",
  "firstMeeting",
  "habit",
  "personality",
  "memory",
];

const v_398571 = [
  "안녕!\n나는 네 소중한 기억 속에\n살고 있는 요정이야 ✨",
  "지금 네가 가장 보고 싶은\n'그 얼굴'을 한 번 떠올려봐...",
  "떠올랐어!?\n그럼, 네 머리속에 있는 그 소중한 존재를\n생각하며 답해줘!",
] as const;
const v_0d2e40 = 35;
const v_864f4c = 500;
const v_cd5517 = 700;  

type QuestionMeta = {
  title: string;
  desc: string;
  placeholder: string;
  multiline: boolean;
};
const v_d57121 = {
  name: {
    title: "그 존재의 이름이 뭐였어?",
    desc: "네가 부르던 이름이나 별명,\n어떤 호칭이든 좋아.",
    placeholder: "예: 별이, 할머니, 모리",
    multiline: false,
  },
  username: {
    title: "@아이디는 어떻게 할까?",
    desc: "영문 소문자/숫자/_ 만 가능해. 비워두면\n이름으로 자동 만들어줄게.",
    placeholder: "예: starry_kim, modi_v",
    multiline: false,
  },
  firstMeeting: {
    title: "그 존재와는 어떻게\n처음 만나게 되었어?",
    desc: "우리 사이에 잊지 못할 특별한 첫 순간이나\n추억이 있었는지 궁금해!",
    placeholder:
      "학교에서 처음 봤을 때, 유난히 하얀 피부에 긴 생머리를 늘어뜨린 모습이 멀리서도 눈에 띄었거든. 사실 처음엔 분위기가 좀 차가워 보여서 말 한마디 붙이기가 진짜 어려웠어. 용기내서 말을 걸어보니까 사람이 생각보다 너무 순진한 거야. 그 반전이 참 예뻐 보였지. 게다가 좋아하는 게임이나 옷 취미까지 어쩜 그렇게 나랑 비슷하던지... 공통점이 많아서 같이 있으면 시간 가는 줄 모르고 참 즐거웠던 기억이 나.",
    multiline: true,
  },
  habit: {
    title: "자주 하던 말이나\n눈길이 가던 습관이 있었니?",
    desc: "꼬리를 살랑이거나\n특유의 말투 같은 사소한 거라도 좋아!",
    placeholder:
      "되게 솔직하고 밝은 스타일이에요. 기분 좋으면 '하자, 하자!' 하고 아이처럼 말을 반복하는 귀여운 습관이 있거든요. 부끄러울 때마다 머리에 손이 가는 버릇도 있어서 감정이 투명하게 다 보여요.",
    multiline: true,
  },
  personality: {
    title: "그 존재의 성격은 어땠어?",
    desc: "혹시 MBTI가 생각나니?\n기억이 안 난다면 평소 성격을 말해줘도 돼!",
    placeholder:
      "MBTI는 INFP인데 사람들 만나는 걸 좋아하던 아이였어. 근데 맨날 방전 돼서 집에 가면 연락두절 되기도 했지.",
    multiline: true,
  },
  memory: {
    title: "눈 감으면 어제처럼\n선명한 장면이 있을까?",
    desc: "가장 행복하게 웃고(혹은 뛰놀고)\n있던 순간을 나한테도 공유해줘",
    placeholder:
      "첫 고백했던 날이 생각나. 그때 놀이동산에서 불꽃 터질 때 내가 그때 고백했었는데 너가 해맑게 웃으면서 받아줬던 그때가 생각나.",
    multiline: true,
  },
};

export default function v_baac2f({ navigation: v_c65f5d }: Props) {
  v_772971();
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_ab4803, v_ae4844] = v_5ab095<Phase>("intro");
  const [v_1833e7, v_318f24] = v_5ab095<string>(v_f04727.name ?? "");
  const [v_556427, v_e71a3b] = v_5ab095<string>(v_f04727.username ?? "");
  const [v_9d451c, v_087901] = v_5ab095<string>("");
  const [v_7fae74, v_e2f100] = v_5ab095<string>("");
  const [v_324a89, v_87462f] = v_5ab095<string>("");
  const [v_773b4c, v_f714d9] = v_5ab095<string>("");

  const [v_1b9b76, v_d74fbd] = v_5ab095<string[]>(() =>
    v_398571.map(() => ""),
  );
  const [v_b49aa2, v_b7772b] = v_5ab095(false);

  const [v_08a9d4, v_11a5be] = v_5ab095("");
  const [v_53f978, v_1050e9] = v_5ab095("");
  const [v_8d03ad, v_f2920a] = v_5ab095(false);

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

  const v_6821b6 = v_e662ae(new v_a2349e.Value(1)).current;

  const v_f7adb5 = () => {
    v_0e1f26.dismiss();
    v_d74fbd(v_398571.map((v_e2a85c) => v_e2a85c));
    v_b7772b(true);
  };
  const v_3289ba = () => {
    v_0e1f26.dismiss();
    if (v_ab4803 === "intro") return;
    const v_ab6401 = v_d57121[v_ab4803 as keyof typeof v_d57121];
    if (!v_ab6401) return;
    v_11a5be(v_ab6401.title);
    v_1050e9(v_ab6401.desc);
    v_f2920a(true);
  };

  v_c4deb2(() => {
    if (v_ab4803 !== "intro") return;
    let v_2008a4 = false;
    let v_cb36b1 = null;
    const v_aa4609 = (v_d799e2) =>
      new Promise<void>((v_6f7712) => {
        v_cb36b1 = setTimeout(v_6f7712, v_d799e2);
      });

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
      await v_aa4609(v_cd5517);
      if (v_2008a4) return;

      const v_9f1d92 = v_398571.map(() => "");
      for (let v_ccbc5e = 0; v_ccbc5e < v_398571.length; v_ccbc5e++) {
        const v_e13cd0 = v_398571[v_ccbc5e]!;
        for (let v_9f8c39 = 1; v_9f8c39 <= v_e13cd0.length; v_9f8c39++) {
          if (v_2008a4) return;
          v_9f1d92[v_ccbc5e] = v_e13cd0.slice(0, v_9f8c39);
          v_d74fbd([...v_9f1d92]);
          await v_aa4609(v_0d2e40);
        }
        if (v_2008a4) return;
        await v_aa4609(v_864f4c);
      }
      if (!v_2008a4) v_b7772b(true);
    };
    v_d9b231();

    return () => {
      v_2008a4 = true;
      if (v_cb36b1) clearTimeout(v_cb36b1);
      v_d083b4.stop();
    };

  }, [v_ab4803]);

  v_c4deb2(() => {
    if (v_ab4803 === "intro") return;
    const v_ab6401 = v_d57121[v_ab4803 as keyof typeof v_d57121];
    if (!v_ab6401) return;
    let v_2008a4 = false;
    let v_cb36b1 = null;
    const v_aa4609 = (v_d799e2) =>
      new Promise<void>((v_6f7712) => {
        v_cb36b1 = setTimeout(v_6f7712, v_d799e2);
      });

    v_11a5be("");
    v_1050e9("");
    v_f2920a(false);

    const v_d9b231 = async () => {
      await v_aa4609(200);

      for (let v_ebec57 = 1; v_ebec57 <= v_ab6401.title.length; v_ebec57++) {
        if (v_2008a4) return;
        v_11a5be(v_ab6401.title.slice(0, v_ebec57));
        await v_aa4609(v_0d2e40);
      }
      if (v_2008a4) return;
      await v_aa4609(350);

      for (let v_ebec57 = 1; v_ebec57 <= v_ab6401.desc.length; v_ebec57++) {
        if (v_2008a4) return;
        v_1050e9(v_ab6401.desc.slice(0, v_ebec57));
        await v_aa4609(v_0d2e40);
      }
      if (!v_2008a4) v_f2920a(true);
    };
    v_d9b231();

    return () => {
      v_2008a4 = true;
      if (v_cb36b1) clearTimeout(v_cb36b1);
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

  const [v_dff7ca, v_08d488] = v_5ab095(false);

  const v_219251 = async () => {
    v_0e1f26.dismiss();
    if (v_ab4803 === "intro") {
      v_ae4844("name");
      return;
    }
    if (v_ab4803 === "name") {
      const v_2f361a = v_1833e7.trim();
      if (!v_2f361a) return;
      v_5795de({ name: v_2f361a });

      v_ae4844("username");
      return;
    }
    if (v_ab4803 === "username") {

      const v_479f05 = v_556427.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const v_94812a =
        v_479f05.length >= 3 && v_479f05.length <= 30
          ? v_479f05
          : v_b55477(v_1833e7.trim() || "user");

      if (v_dff7ca) return;
      v_08d488(true);
      try {
        const v_cb35cb = await v_6c3f29(v_94812a);
        if (!v_cb35cb.available) {
          if (v_cb35cb.reason === "reserved") {
            v_03e392.alert(
              "사용할 수 없는 아이디",
              "예약된 아이디입니다. 다른 아이디를 입력해주세요.",
            );
          } else if (v_cb35cb.reason === "invalid") {
            v_03e392.alert(
              "아이디 형식 오류",
              "영문 소문자/숫자/_ 만 사용 가능하고 3-30자여야 해요.",
            );
          } else {
            v_03e392.alert(
              "이미 사용중인 아이디",
              "이미 사용중인 아이디가 있습니다. 다른 아이디를 입력해주세요.",
            );
          }
          return;
        }
      } catch (v_49263d) {
        console.warn("[Step6] checkCloneUsername failed:", v_49263d);

      } finally {
        v_08d488(false);
      }
      v_e71a3b(v_94812a);
      v_5795de({ username: v_94812a });
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
    v_0e1f26.dismiss();
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
  const v_ab6401 = !v_e2f265 ? v_d57121[v_ab4803 as keyof typeof v_d57121] : null;
  const v_a9cd32 = (() => {
    switch (v_ab4803) {
      case "name": return v_1833e7;
      case "username": return v_556427;
      case "firstMeeting": return v_9d451c;
      case "habit": return v_7fae74;
      case "personality": return v_324a89;
      case "memory": return v_773b4c;
      default: return "";
    }
  })();
  const v_87e703 = (() => {
    switch (v_ab4803) {
      case "name": return v_318f24;
      case "username": return (v_81e2ef) =>

        v_e71a3b(v_81e2ef.toLowerCase().replace(/[^a-z0-9_]/g, ""));
      case "firstMeeting": return v_087901;
      case "habit": return v_e2f100;
      case "personality": return v_87462f;
      case "memory": return v_f714d9;
      default: return () => {};
    }
  })();

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
                {v_1b9b76.map((v_9b6134, v_ccbc5e) => {
                  if (!v_9b6134) return null;
                  const v_664b8c = v_ccbc5e === 0;
                  const v_aaee4e = v_398571[v_ccbc5e]!.length;
                  const v_359bf6 = !v_b49aa2 && v_9b6134.length < v_aaee4e;
                  return (
                    <View key={v_ccbc5e} style={v_d81136.paragraph}>
                      <Text style={v_664b8c ? v_d81136.introTitle : v_d81136.introBody}>
                        {v_9b6134}
                        {v_359bf6 && (
                          <Animated.Text
                            style={{ opacity: v_6821b6, color: v_1bfbd0.white }}
                          >
                            ▍
                          </Animated.Text>
                        )}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>
            )}

            {}
            {v_ab6401 && (
              <TouchableOpacity
                onPress={v_3289ba}
                activeOpacity={1}
                style={v_d81136.questionBox}
              >
                <Text style={v_d81136.qTitle}>
                  {v_08a9d4}
                  {v_08a9d4.length > 0 && v_08a9d4.length < v_ab6401.title.length && (
                    <Animated.Text style={{ opacity: v_6821b6, color: v_1bfbd0.white }}>
                      ▍
                    </Animated.Text>
                  )}
                </Text>
                {v_53f978.length > 0 && (
                  <Text style={v_d81136.qDesc}>
                    {v_53f978}
                    {v_53f978.length < v_ab6401.desc.length && (
                      <Animated.Text
                        style={{ opacity: v_6821b6, color: "rgba(255,255,255,0.7)" }}
                      >
                        ▍
                      </Animated.Text>
                    )}
                  </Text>
                )}
                {}
                {v_8d03ad && (
                  <TextInput

                    key={v_ab4803}
                    style={[v_d81136.input, v_ab6401.multiline && v_d81136.textarea]}
                    value={v_a9cd32}
                    onChangeText={v_87e703}
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
                )}
              </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 24,
  },

  topBar: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  backBtn: { padding: 8, alignSelf: "flex-start" },

  videoWrap: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 8,
  },
  video: { width: "100%", height: "100%" },
  fallbackEmoji: { fontSize: 80, textAlign: "center", lineHeight: 140 },

  introTextBox: { gap: 16, alignItems: "center", width: "100%" },
  paragraph: { alignItems: "center", paddingHorizontal: 8 },

  introTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: v_1bfbd0.white,
    textAlign: "center",
    lineHeight: 34,
  },
  introBody: {
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 27,
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
