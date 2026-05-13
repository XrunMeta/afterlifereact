

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
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
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
const TOTAL_QUESTIONS = QUESTION_PHASES.length;

const INTRO_LINES = [
  "안녕! 나는 네 소중한 기억 속에 살고 있는 요정이야.",
  "지금 네가 가장 보고 싶은 '그 얼굴'을 한 번 떠올려봐...",
  "떠올랐어?! 그럼, 네 머릿속에 있는 그 소중한 존재를 생각하며 답해줘!",
] as const;
const TYPE_SPEED_MS = 35;   
const LINE_PAUSE_MS = 450;  

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

  const [typedLines, setTypedLines] = useState<string[]>(() => INTRO_LINES.map(() => ""));
  const [introDone, setIntroDone] = useState(false);

  const fairyVideoPlayer = useVideoPlayer(
    require("../../../assets/fairy-intro.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    },
  );
  const skipIntro = () => {
    setTypedLines(INTRO_LINES.map((l) => l));
    setIntroDone(true);
  };

  const emojiOpacity = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0.6)).current;

  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== "intro") return;
    let cancelled = false;

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

      await new Promise((r) => setTimeout(r, 400));
      const accumulated = INTRO_LINES.map(() => "");
      for (let li = 0; li < INTRO_LINES.length; li++) {
        const line = INTRO_LINES[li]!;
        for (let ci = 1; ci <= line.length; ci++) {
          if (cancelled) return;
          accumulated[li] = line.slice(0, ci);
          setTypedLines([...accumulated]);
          await new Promise((r) => setTimeout(r, TYPE_SPEED_MS));
        }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, LINE_PAUSE_MS));
      }
      if (!cancelled) setIntroDone(true);
    };
    run();

    return () => {
      cancelled = true;
      cursorLoop.stop();
    };
  }, [phase, emojiOpacity, emojiScale, cursorOpacity]);

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

  const currentQuestionNum = QUESTION_PHASES.indexOf(
    phase as (typeof QUESTION_PHASES)[number],
  ) + 1;

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="페르소나 만들기"
        showBackButton
        onBackPress={goBack}
      />
      <StepIndicator currentStep={3} totalSteps={4} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.formWrap}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {phase === "intro" && (
              <TouchableOpacity
                style={styles.introBox}
                onPress={skipIntro}
                activeOpacity={1}
                accessibilityLabel="도입부 건너뛰기"
              >
                {}
                <Animated.View
                  style={[
                    styles.videoWrap,
                    {
                      opacity: emojiOpacity,
                      transform: [{ scale: emojiScale }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <VideoView
                    style={styles.video}
                    player={fairyVideoPlayer}
                    contentFit="contain"
                    nativeControls={false}
                  />
                </Animated.View>

                {
}
                {INTRO_LINES.map((line, i) => {
                  if (typedLines[i].length === 0) return null;

                  const isTypingThis = !introDone && typedLines[i].length < line.length;
                  const isTitle = i === 0;
                  const textStyle = isTitle ? styles.introTitle : styles.introBody;
                  return (
                    <Text key={i} style={textStyle}>
                      {typedLines[i]}
                      {isTypingThis && (
                        <Animated.Text style={{ opacity: cursorOpacity, color: COLORS.violet600 }}>
                          ▍
                        </Animated.Text>
                      )}
                    </Text>
                  );
                })}
              </TouchableOpacity>
            )}

            {phase === "name" && (
              <>
                <Text style={styles.qLabel}>{currentQuestionNum} / {TOTAL_QUESTIONS}</Text>
                <Text style={styles.qTitle}>그 존재의 이름이 뭐였어?</Text>
                <Text style={styles.qDesc}>
                  네가 부르던 이름이나 별명, 어떤 호칭이든 좋아.
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="예: 별이, 할머니, 모리"
                  placeholderTextColor={COLORS.zinc400}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={goNext}
                  maxLength={40}
                />
              </>
            )}

            {phase === "firstMeeting" && (
              <>
                <Text style={styles.qLabel}>{currentQuestionNum} / {TOTAL_QUESTIONS}</Text>
                <Text style={styles.qTitle}>
                  그 존재와는 어떻게 처음 만나게 되었어?
                </Text>
                <Text style={styles.qDesc}>
                  우리 사이에 잊지 못할 특별한 첫 순간이나 추억이 있었는지 궁금해!
                </Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={firstMeeting}
                  onChangeText={setFirstMeeting}
                  placeholder="떠오르는 그 첫 장면을 자유롭게 적어줘."
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {phase === "habit" && (
              <>
                <Text style={styles.qLabel}>{currentQuestionNum} / {TOTAL_QUESTIONS}</Text>
                <Text style={styles.qTitle}>
                  자주 하던 말이나 눈길이 가던 습관이 있었니?
                </Text>
                <Text style={styles.qDesc}>
                  꼬리를 살랑이거나, 특유의 말투 같은 사소한 거라도 좋아!
                </Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={habit}
                  onChangeText={setHabit}
                  placeholder="입버릇, 작은 습관, 좋아하던 자리 — 사소할수록 좋아."
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {phase === "personality" && (
              <>
                <Text style={styles.qLabel}>{currentQuestionNum} / {TOTAL_QUESTIONS}</Text>
                <Text style={styles.qTitle}>
                  그 존재의 성격은 어땠어?
                </Text>
                <Text style={styles.qDesc}>
                  혹시 MBTI가 생각나니? 기억이 안 난다면 평소 성격을 살짝 귀띔해 줄래?
                </Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={personality}
                  onChangeText={setPersonality}
                  placeholder="예: 조용하고 다정한 INFP. 잘 웃고 잘 우는 사람이었어."
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
            )}

            {phase === "memory" && (
              <>
                <Text style={styles.qLabel}>{currentQuestionNum} / {TOTAL_QUESTIONS}</Text>
                <Text style={styles.qTitle}>
                  눈 감으면 어제처럼 선명한 그 장면이 있을까?
                </Text>
                <Text style={styles.qDesc}>
                  가장 행복하게 웃고(혹은 뛰놀고) 있던 그 순간을 나에게도 공유해 줘! ✨
                </Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={memory}
                  onChangeText={setMemory}
                  placeholder="그 순간의 풍경, 표정, 소리 — 떠오르는 대로."
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </>
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
              {phase === "intro" ? "시작하기" : "다음"}
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
    paddingTop: 32,
    paddingBottom: 32,
  },

  introBox: { gap: 14, paddingTop: 12, alignItems: "center" },
  introEmoji: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  videoWrap: {
    width: 180,
    height: 180,
    marginBottom: 8,
    alignSelf: "center",
  },
  video: { width: "100%", height: "100%" },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
    lineHeight: 30,
  },
  introBody: {
    fontSize: 15,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 24,
  },

  qLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.violet600,
    marginBottom: 8,
  },
  qTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginBottom: 8,
    lineHeight: 30,
  },
  qDesc: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50,
  },
  textarea: { minHeight: 140, paddingTop: 12 },

  bottomBar: {
    padding: SIZES.large,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});
