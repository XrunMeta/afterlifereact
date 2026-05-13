

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useCloneStore } from "../../stores/cloneStore";
import { deriveUsernameFromName } from "../../api/clones";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step6">;
};

type Phase =
  | "intro"
  | "name"
  | "firstMeeting"
  | "habit"
  | "personality"
  | "memory";

const QUESTION_PHASES: Phase[] = [
  "name",
  "firstMeeting",
  "habit",
  "personality",
  "memory",
];

const INTRO_PARAGRAPHS: readonly string[] = [
  "안녕!\n나는 네 소중한 기억 속에\n살고 있는 요정이야 ✨",
  "지금 네가 가장 보고 싶은\n'그 얼굴'을 한 번 떠올려봐...",
  "떠올랐어!?\n그럼, 네 머리속에 있는 그 소중한 존재를\n생각하며 답해줘!",
] as const;
const TYPE_SPEED_MS = 35;
const PARA_GAP_MS = 500;
const INTRO_START_DELAY_MS = 700;  

type QuestionMeta = {
  title: string;
  desc: string;
  placeholder: string;
  multiline: boolean;
};
const QUESTIONS: Record<
  "name" | "firstMeeting" | "habit" | "personality" | "memory",
  QuestionMeta
> = {
  name: {
    title: "그 존재의 이름이 뭐였어?",
    desc: "네가 부르던 이름이나 별명,\n어떤 호칭이든 좋아.",
    placeholder: "예: 별이, 할머니, 모리",
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

export default function Step6CreatingScreen({ navigation }: Props) {
  useTranslation();
  const draft = useCloneStore((s) => s.creationDraft);
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);

  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState<string>(draft.name ?? "");
  const [firstMeeting, setFirstMeeting] = useState<string>("");
  const [habit, setHabit] = useState<string>("");
  const [personality, setPersonality] = useState<string>("");
  const [memory, setMemory] = useState<string>("");

  const [typedParas, setTypedParas] = useState<string[]>(() =>
    INTRO_PARAGRAPHS.map(() => ""),
  );
  const [introDone, setIntroDone] = useState(false);

  const [typedQTitle, setTypedQTitle] = useState("");
  const [typedQDesc, setTypedQDesc] = useState("");
  const [qDone, setQDone] = useState(false);

  const [videoFailed, setVideoFailed] = useState(false);
  const fairyVideoPlayer = useVideoPlayer(
    require("../../../assets/fairy-intro.mp4"),
    (player) => {
      try {
        player.loop = true;
        player.muted = true;
        player.play();
      } catch (err) {
        console.warn("[Step6] fairy video setup failed:", err);
        setVideoFailed(true);
      }
    },
  );

  const emojiOpacity = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0.6)).current;

  const cursorOpacity = useRef(new Animated.Value(1)).current;

  const skipIntro = () => {
    Keyboard.dismiss();
    setTypedParas(INTRO_PARAGRAPHS.map((p) => p));
    setIntroDone(true);
  };
  const skipQuestion = () => {
    Keyboard.dismiss();
    if (phase === "intro") return;
    const q = QUESTIONS[phase as keyof typeof QUESTIONS];
    if (!q) return;
    setTypedQTitle(q.title);
    setTypedQDesc(q.desc);
    setQDone(true);
  };

  useEffect(() => {
    if (phase !== "intro") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    Animated.parallel([
      Animated.timing(emojiOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(emojiScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    cursorLoop.start();

    const run = async () => {
      await wait(INTRO_START_DELAY_MS);
      if (cancelled) return;

      const acc = INTRO_PARAGRAPHS.map(() => "");
      for (let pIdx = 0; pIdx < INTRO_PARAGRAPHS.length; pIdx++) {
        const full = INTRO_PARAGRAPHS[pIdx]!;
        for (let ci = 1; ci <= full.length; ci++) {
          if (cancelled) return;
          acc[pIdx] = full.slice(0, ci);
          setTypedParas([...acc]);
          await wait(TYPE_SPEED_MS);
        }
        if (cancelled) return;
        await wait(PARA_GAP_MS);
      }
      if (!cancelled) setIntroDone(true);
    };
    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cursorLoop.stop();
    };

  }, [phase]);

  useEffect(() => {
    if (phase === "intro") return;
    const q = QUESTIONS[phase as keyof typeof QUESTIONS];
    if (!q) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    setTypedQTitle("");
    setTypedQDesc("");
    setQDone(false);

    const run = async () => {
      await wait(200);

      for (let i = 1; i <= q.title.length; i++) {
        if (cancelled) return;
        setTypedQTitle(q.title.slice(0, i));
        await wait(TYPE_SPEED_MS);
      }
      if (cancelled) return;
      await wait(350);

      for (let i = 1; i <= q.desc.length; i++) {
        if (cancelled) return;
        setTypedQDesc(q.desc.slice(0, i));
        await wait(TYPE_SPEED_MS);
      }
      if (!cancelled) setQDone(true);
    };
    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };

  }, [phase]);

  const buildPersonaNotes = (): string => {
    const sections: string[] = [];
    if (firstMeeting.trim()) sections.push(`[첫 만남]\n${firstMeeting.trim()}`);
    if (habit.trim()) sections.push(`[습관/말투]\n${habit.trim()}`);
    if (personality.trim()) sections.push(`[성격]\n${personality.trim()}`);
    if (memory.trim()) sections.push(`[가장 선명한 추억]\n${memory.trim()}`);
    return sections.join("\n\n");
  };

  const MBTI_SET = new Set([
    "ISTJ","ISFJ","INFJ","INTJ",
    "ISTP","ISFP","INFP","INTP",
    "ESTP","ESFP","ENFP","ENTP",
    "ESTJ","ESFJ","ENFJ","ENTJ",
  ] as const);
  type PersonaMbtiCode = typeof MBTI_SET extends Set<infer T> ? T : never;
  const extractMbti = (text: string): PersonaMbtiCode | undefined => {
    const m = text.match(/\b([EI][NS][FT][JP])\b/i);
    if (!m) return undefined;
    const code = m[1]!.toUpperCase();
    return MBTI_SET.has(code as PersonaMbtiCode) ? (code as PersonaMbtiCode) : undefined;
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (phase === "intro") {
      setPhase("name");
      return;
    }
    if (phase === "name") {
      const trimmed = name.trim();
      if (!trimmed) return;
      setCreationDraft({
        name: trimmed,
        username: deriveUsernameFromName(trimmed),
      });
      setPhase("firstMeeting");
      return;
    }
    if (phase === "firstMeeting") {
      setPhase("habit");
      return;
    }
    if (phase === "habit") {
      setPhase("personality");
      return;
    }
    if (phase === "personality") {
      const mbti = extractMbti(personality);
      if (mbti) setCreationDraft({ personaMbti: mbti });
      setPhase("memory");
      return;
    }
    if (phase === "memory") {
      setCreationDraft({ personaNotes: buildPersonaNotes() });
      navigation.navigate("Step7");
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    const idx = QUESTION_PHASES.indexOf(phase as (typeof QUESTION_PHASES)[number]);
    if (phase === "intro") {
      navigation.goBack();
    } else if (idx === 0) {
      setPhase("intro");
    } else if (idx > 0) {
      setPhase(QUESTION_PHASES[idx - 1]!);
    }
  };

  const canProceed = (() => {

    if (phase === "intro") return introDone;
    if (phase === "name") return name.trim().length > 0;

    return true;
  })();

  const isIntro = phase === "intro";
  const q = !isIntro ? QUESTIONS[phase as keyof typeof QUESTIONS] : null;
  const valueForPhase = (() => {
    switch (phase) {
      case "name": return name;
      case "firstMeeting": return firstMeeting;
      case "habit": return habit;
      case "personality": return personality;
      case "memory": return memory;
      default: return "";
    }
  })();
  const onChangeForPhase = (() => {
    switch (phase) {
      case "name": return setName;
      case "firstMeeting": return setFirstMeeting;
      case "habit": return setHabit;
      case "personality": return setPersonality;
      case "memory": return setMemory;
      default: return () => {};
    }
  })();

  return (
    <SafeView backgroundColor="#000000">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {
}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.formWrap}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {
}
            <Animated.View
              style={[
                styles.videoWrap,
                isIntro
                  ? { opacity: emojiOpacity, transform: [{ scale: emojiScale }] }
                  : null,
              ]}
              pointerEvents="none"
            >
              {videoFailed ? (
                <Text style={styles.fallbackEmoji}>✨</Text>
              ) : (
                <VideoView
                  style={styles.video}
                  player={fairyVideoPlayer}
                  contentFit="contain"
                  nativeControls={false}
                />
              )}
            </Animated.View>

            {}
            {isIntro && (
              <TouchableOpacity
                onPress={skipIntro}
                activeOpacity={1}
                accessibilityLabel="도입부 건너뛰기"
                style={styles.introTextBox}
              >
                {typedParas.map((text, pIdx) => {
                  if (!text) return null;
                  const isTitlePara = pIdx === 0;
                  const fullLen = INTRO_PARAGRAPHS[pIdx]!.length;
                  const isTypingThis = !introDone && text.length < fullLen;
                  return (
                    <View key={pIdx} style={styles.paragraph}>
                      <Text style={isTitlePara ? styles.introTitle : styles.introBody}>
                        {text}
                        {isTypingThis && (
                          <Animated.Text
                            style={{ opacity: cursorOpacity, color: COLORS.white }}
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
            {q && (
              <TouchableOpacity
                onPress={skipQuestion}
                activeOpacity={1}
                style={styles.questionBox}
              >
                <Text style={styles.qTitle}>
                  {typedQTitle}
                  {typedQTitle.length > 0 && typedQTitle.length < q.title.length && (
                    <Animated.Text style={{ opacity: cursorOpacity, color: COLORS.white }}>
                      ▍
                    </Animated.Text>
                  )}
                </Text>
                {typedQDesc.length > 0 && (
                  <Text style={styles.qDesc}>
                    {typedQDesc}
                    {typedQDesc.length < q.desc.length && (
                      <Animated.Text
                        style={{ opacity: cursorOpacity, color: "rgba(255,255,255,0.7)" }}
                      >
                        ▍
                      </Animated.Text>
                    )}
                  </Text>
                )}
                {}
                {qDone && (
                  <TextInput

                    key={phase}
                    style={[styles.input, q.multiline && styles.textarea]}
                    value={valueForPhase}
                    onChangeText={onChangeForPhase}
                    placeholder={q.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoFocus
                    multiline={q.multiline}
                    textAlignVertical={q.multiline ? "top" : "center"}
                    returnKeyType={q.multiline ? "default" : "next"}
                    onSubmitEditing={q.multiline ? undefined : goNext}
                    maxLength={q.multiline ? 500 : 40}
                    selectionColor={COLORS.white}
                  />
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.btn, !canProceed && styles.btnDisabled]}
            onPress={goNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isIntro ? "시작하기" : "다음"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  formWrap: {
    flexGrow: 1,
    paddingHorizontal: SIZES.xlarge,
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
    color: COLORS.white,
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
    color: COLORS.white,
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
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.white,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  textarea: { minHeight: 140, paddingTop: 12 },

  bottomBar: {
    padding: SIZES.large,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
});
