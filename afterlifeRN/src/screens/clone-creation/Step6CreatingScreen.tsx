

import { showAlert } from "../../stores/dialogStore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SafeView from "../../components/ui/SafeView";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { useCloneStore } from "../../stores/cloneStore";
import { checkCloneUsername, deriveUsernameFromName } from "../../api/clones";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step6">;
};

type Phase =
  | "name"
  | "username"
  | "firstMeeting"
  | "habit"
  | "personality"
  | "memory";

const PHASES: Phase[] = [
  "name",
  "username",
  "firstMeeting",
  "habit",
  "personality",
  "memory",
];

const AI_NAME = "기억의 요정";
const AI_AVATAR_EMOJI = "✨";

const INTRO_MESSAGES: string[] = [
  "안녕! 나는 네 소중한 기억 속에 살고 있는 요정이야 ✨",
  "지금 네가 가장 보고 싶은 '그 얼굴'을 한 번 떠올려봐...",
  "떠올랐어!? 그럼 몇 가지 물어볼게.",
];

const QUESTIONS: Record<Phase, { prompt: string; placeholder: string; multiline: boolean; ack: string }> = {
  name: {
    prompt: "그 존재의 이름은 뭐였어?\n네가 부르던 이름이나 별명, 어떤 호칭이든 좋아!",
    placeholder: "예: 별이, 할머니, 모리",
    multiline: false,
    ack: "예쁜 이름이네! 기억할게.",
  },
  username: {
    prompt: "@아이디는 어떻게 할까?\n영문 소문자/숫자/_ 만 가능해. 비워두면 이름으로 자동 만들어줄게.",
    placeholder: "예: starry_kim, modi_v",
    multiline: false,
    ack: "좋아, 다음으로 넘어갈게.",
  },
  firstMeeting: {
    prompt: "그 존재와는 어떻게 처음 만나게 되었어?\n우리 사이에 잊지 못할 특별한 첫 순간이나 추억이 있었는지 궁금해!",
    placeholder: "예: 학교에서 처음 봤을 때 분위기가 차가워 보였는데, 말 걸어보니 너무 순진해서 반전이 예뻤어.",
    multiline: true,
    ack: "그 순간이 떠올라.",
  },
  habit: {
    prompt: "자주 하던 말이나 눈길이 가던 습관이 있었니?\n사소한 거라도 좋아!",
    placeholder: "예: 기분 좋으면 '하자, 하자!' 하고 아이처럼 말을 반복했어.",
    multiline: true,
    ack: "귀엽다, 그런 거.",
  },
  personality: {
    prompt: "그 존재의 성격은 어땠어?\n혹시 MBTI가 생각나니? 기억이 안 난다면 평소 성격을 말해줘도 돼!",
    placeholder: "예: MBTI는 INFP인데 사람들 만나는 걸 좋아했어. 근데 집에 가면 방전 되곤 했지.",
    multiline: true,
    ack: "성격도 잘 기억하고 있을게.",
  },
  memory: {
    prompt: "눈 감으면 어제처럼 선명한 장면이 있을까?\n가장 행복하게 웃고 있던 순간을 나한테도 공유해줘.",
    placeholder: "예: 놀이동산에서 불꽃 터질 때 고백했었는데, 너가 해맑게 웃으면서 받아줬어.",
    multiline: true,
    ack: "잘 들었어! 이제 페르소나를 빚어볼 차례야.",
  },
};

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
}

let _msgIdSeq = 1;
function newMsgId(): string {
  return `m${_msgIdSeq++}_${Date.now()}`;
}

const MBTI_SET = new Set([
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const);
type PersonaMbtiCode = "ISTJ"|"ISFJ"|"INFJ"|"INTJ"|"ISTP"|"ISFP"|"INFP"|"INTP"|"ESTP"|"ESFP"|"ENFP"|"ENTP"|"ESTJ"|"ESFJ"|"ENFJ"|"ENTJ";
function extractMbti(text: string): PersonaMbtiCode | undefined {
  const m = text.match(/\b([EI][NS][FT][JP])\b/i);
  if (!m) return undefined;
  const code = m[1]!.toUpperCase() as PersonaMbtiCode;
  return MBTI_SET.has(code) ? code : undefined;
}

export default function Step6CreatingScreen({ navigation }: Props) {
  const draft = useCloneStore((s) => s.creationDraft);
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [phaseIdx, setPhaseIdx] = useState<number | null>(null);

  const [input, setInput] = useState<string>("");

  const [aiTyping, setAiTyping] = useState<boolean>(false);

  const answersRef = useRef<Partial<Record<Phase, string>>>({});

  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, aiTyping, scrollToBottom]);

  const pushAi = useCallback(async (text: string, typingMs = 600) => {
    setAiTyping(true);
    await new Promise<void>((r) => setTimeout(r, typingMs));
    setAiTyping(false);
    setMessages((prev) => [...prev, { id: newMsgId(), role: "ai", text }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: newMsgId(), role: "user", text }]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < INTRO_MESSAGES.length; i++) {
        if (cancelled) return;
        await pushAi(INTRO_MESSAGES[i]!, i === 0 ? 400 : 700);
      }
      if (cancelled) return;

      setPhaseIdx(0);
      await pushAi(QUESTIONS[PHASES[0]!].prompt, 500);
    })();
    return () => {
      cancelled = true;
    };

  }, []);

  const currentPhase = phaseIdx != null && phaseIdx < PHASES.length ? PHASES[phaseIdx]! : null;
  const inputHint = useMemo(() => {
    if (currentPhase) return QUESTIONS[currentPhase].placeholder;
    return "답변을 입력하세요...";
  }, [currentPhase]);
  const multiline = useMemo(() => {
    return currentPhase ? QUESTIONS[currentPhase].multiline : true;
  }, [currentPhase]);

  const buildNotes = (): string => {
    const a = answersRef.current;
    const sections: string[] = [];
    if (a.firstMeeting) sections.push(`[첫 만남]\n${a.firstMeeting.trim()}`);
    if (a.habit) sections.push(`[습관/말투]\n${a.habit.trim()}`);
    if (a.personality) sections.push(`[성격]\n${a.personality.trim()}`);
    if (a.memory) sections.push(`[가장 선명한 추억]\n${a.memory.trim()}`);
    return sections.join("\n\n");
  };

  const submit = async () => {
    if (currentPhase == null) return;
    const text = input.trim();
    if (!text && currentPhase !== "username") return; 

    if (currentPhase === "name") {

      if (text.length === 0) return;
      pushUser(text);
      answersRef.current.name = text;
      setCreationDraft({ name: text });
      setInput("");

      await pushAi(QUESTIONS[currentPhase].ack, 400);
      const next = phaseIdx! + 1;
      setPhaseIdx(next);
      if (next < PHASES.length) {
        await pushAi(QUESTIONS[PHASES[next]!].prompt, 500);
      }
      return;
    }

    if (currentPhase === "username") {

      if (text.length === 0) {
        const derived = deriveUsernameFromName(answersRef.current.name || "user");
        pushUser(`(빈 칸 → ${derived} 로 자동 생성)`);
        answersRef.current.username = derived;
        setCreationDraft({ username: derived });
        setInput("");
        await pushAi(QUESTIONS[currentPhase].ack, 400);
        const next = phaseIdx! + 1;
        setPhaseIdx(next);
        if (next < PHASES.length) {
          await pushAi(QUESTIONS[PHASES[next]!].prompt, 500);
        }
        return;
      }
      const raw = text.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(raw)) {
        showAlert("아이디 형식 오류", "영문 소문자, 숫자, _ 만 사용 가능해요.");
        return;
      }
      if (raw.length < 3) {
        showAlert("아이디 길이", "아이디는 3자 이상이어야 해요.");
        return;
      }
      if (raw.length > 30) {
        showAlert("아이디 길이", "아이디는 30자 이하여야 해요.");
        return;
      }

      if (checkingUsername) return;
      setCheckingUsername(true);
      try {
        const r = await checkCloneUsername(raw);
        if (!r.available) {
          let msg = "이미 사용중인 아이디예요. 다른 걸 입력해주세요.";
          if (r.reason === "reserved") msg = "예약된 아이디입니다. 다른 아이디를 입력해주세요.";
          else if (r.reason === "invalid") msg = "아이디 형식이 올바르지 않아요.";
          showAlert("사용할 수 없는 아이디", msg);
          return;
        }
      } catch (err) {
        console.warn("[Step6] checkCloneUsername failed:", err);

      } finally {
        setCheckingUsername(false);
      }
      pushUser(`@${raw}`);
      answersRef.current.username = raw;
      setCreationDraft({ username: raw });
      setInput("");
      await pushAi(QUESTIONS[currentPhase].ack, 400);
      const next = phaseIdx! + 1;
      setPhaseIdx(next);
      if (next < PHASES.length) {
        await pushAi(QUESTIONS[PHASES[next]!].prompt, 500);
      }
      return;
    }

    pushUser(text);
    answersRef.current[currentPhase] = text;
    setInput("");

    if (currentPhase === "personality") {
      const mbti = extractMbti(text);
      if (mbti) setCreationDraft({ personaMbti: mbti });
    }

    await pushAi(QUESTIONS[currentPhase].ack, 400);

    const next = phaseIdx! + 1;
    setPhaseIdx(next);
    if (next < PHASES.length) {
      await pushAi(QUESTIONS[PHASES[next]!].prompt, 500);
    } else {

      setCreationDraft({ personaNotes: buildNotes() });
      await pushAi("좋아, 이제 페르소나를 빚으러 가볼까? 곧 게시물 작성 화면으로 넘어가.", 700);
      setTimeout(() => {
        navigation.navigate("Step7");
      }, 1000);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const isDone = phaseIdx != null && phaseIdx >= PHASES.length;
  const canSend = (() => {
    if (currentPhase == null) return false; 
    if (currentPhase === "username") return !checkingUsername; 
    return input.trim().length > 0;
  })();

  return (
    <SafeView backgroundColor={COLORS.white}>
      {}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.zinc900} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <Text style={s.headerAvatarEmoji}>{AI_AVATAR_EMOJI}</Text>
          </View>
          <Text style={s.headerName}>{AI_NAME}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {}
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => {
            const isAi = m.role === "ai";

            const prev = messages[i - 1];
            const isContinuation = prev && prev.role === m.role;
            return (
              <View key={m.id} style={[s.row, isAi ? s.rowAi : s.rowUser]}>
                {isAi && (
                  <View style={[s.avatar, isContinuation && { opacity: 0 }]}>
                    <Text style={s.avatarEmoji}>{AI_AVATAR_EMOJI}</Text>
                  </View>
                )}
                <View
                  style={[
                    s.bubble,
                    isAi ? s.bubbleAi : s.bubbleUser,
                    isAi && isContinuation && { marginLeft: 0 },
                  ]}
                >
                  <Text style={isAi ? s.bubbleTextAi : s.bubbleTextUser}>{m.text}</Text>
                </View>
              </View>
            );
          })}
          {}
          {aiTyping && (
            <View style={[s.row, s.rowAi]}>
              <View style={s.avatar}>
                <Text style={s.avatarEmoji}>{AI_AVATAR_EMOJI}</Text>
              </View>
              <View style={[s.bubble, s.bubbleAi, s.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.zinc500} />
              </View>
            </View>
          )}
        </ScrollView>

        {}
        <View style={[s.inputBar, { paddingBottom: 8 + Math.max(insets.bottom, 0) }]}>
          <TextInput
            style={[s.input, multiline && s.inputMultiline]}
            value={input}
            onChangeText={(v) => {
              if (currentPhase === "username") {

                setInput(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              } else {
                setInput(v);
              }
            }}
            placeholder={inputHint}
            placeholderTextColor={COLORS.zinc400}
            multiline={multiline}
            maxLength={multiline ? 500 : 40}
            editable={!isDone && currentPhase != null}
            returnKeyType={multiline ? "default" : "send"}
            onSubmitEditing={multiline ? undefined : submit}
            blurOnSubmit={!multiline}
          />
          <TouchableOpacity
            style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
            onPress={submit}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            <Feather name="send" size={18} color={canSend ? COLORS.white : COLORS.zinc400} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const s = StyleSheet.create({

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 8, width: 38 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarEmoji: { fontSize: 16 },
  headerName: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },

  chatScroll: { flex: 1, backgroundColor: "#f1f5f9"  },
  chatContent: { paddingVertical: 16, paddingHorizontal: 12, gap: 8 },

  row: { flexDirection: "row", alignItems: "flex-end", gap: 6, maxWidth: "100%" },
  rowAi: { justifyContent: "flex-start" },
  rowUser: { justifyContent: "flex-end" },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarEmoji: { fontSize: 18 },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    maxWidth: "75%",
  },
  bubbleAi: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  bubbleUser: {
    backgroundColor: COLORS.violet600,
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  bubbleTextAi: { fontSize: 14, color: COLORS.zinc900, lineHeight: 20 },
  bubbleTextUser: { fontSize: 14, color: COLORS.white, lineHeight: 20 },

  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 20,
    backgroundColor: COLORS.zinc50,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  inputMultiline: { paddingTop: 10 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: COLORS.zinc200 },
});

void SIZES;
void RADIUS;
