

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
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

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

const AI_NAME = "페르소나 생성 도우미";

const AI_AVATAR_SRC = require("../../../assets/images/symbol.png");

const INTRO_MESSAGES: string[] = [
  "안녕하세요! 페르소나 만들기 도와드릴게요.",
  "마음에 두고 계신 분에 대해 몇 가지 물어볼게요.",
  "편하게 답해주시면 돼요!",
];

const QUESTIONS: Record<Phase, { prompt: string; placeholder: string; multiline: boolean; ack: string }> = {
  name: {
    prompt: "먼저 이름이 뭔가요?\n평소 부르던 이름이나 별명도 좋아요.",
    placeholder: "예: 별이, 할머니, 모리",
    multiline: false,
    ack: "좋아요, 잘 기억해뒀어요!",
  },
  username: {
    prompt: "@아이디는 어떻게 할까요?\n영문 소문자, 숫자, _ 만 가능해요. 비워두시면 자동으로 만들어드릴게요!",
    placeholder: "예: starry_kim, modi_v",
    multiline: false,
    ack: "확인! 다음 질문이에요.",
  },
  firstMeeting: {
    prompt: "처음 만난 이야기를 들려주실래요?\n특별했던 순간이나 첫인상이 궁금해요.",
    placeholder: "예: 학교에서 처음 봤을 때 차가워 보였는데, 말 걸어보니 정말 순진했어요.",
    multiline: true,
    ack: "정말 소중한 순간이네요!",
  },
  habit: {
    prompt: "자주 하던 말이나 인상적인 습관이 있었나요?\n사소한 것도 좋아요!",
    placeholder: "예: 기분 좋으면 '하자, 하자!' 하고 아이처럼 말을 반복했어요.",
    multiline: true,
    ack: "그런 모습까지 잘 기억해둘게요!",
  },
  personality: {
    prompt: "성격은 어땠어요?\nMBTI 가 떠오르면 같이 알려주셔도 좋고, 평소 모습을 말씀해주셔도 돼요.",
    placeholder: "예: MBTI 는 INFP 였고, 사람 만나는 건 좋아했지만 집에 오면 방전되곤 했어요.",
    multiline: true,
    ack: "성격까지 다 들었어요!",
  },
  memory: {
    prompt: "마지막으로, 눈 감으면 떠오르는 한 장면이 있으면 들려주실래요?\n가장 행복하게 웃던 순간이면 좋아요.",
    placeholder: "예: 놀이동산에서 불꽃 터질 때 고백했었는데, 해맑게 웃으면서 받아줬어요.",
    multiline: true,
    ack: "다 들었어요! 이제 페르소나 만들러 가볼게요.",
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
        pushUser(`(빈 칸 — ${derived} 로 자동 생성)`);
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
      await pushAi("이제 게시물 작성 화면으로 갈게요!", 700);
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
      {

}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.zinc900} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <Image source={AI_AVATAR_SRC} style={s.headerAvatarImg} resizeMode="contain" />
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
                    <Image source={AI_AVATAR_SRC} style={s.avatarImg} resizeMode="contain" />
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
                <Image source={AI_AVATAR_SRC} style={s.avatarImg} resizeMode="contain" />
              </View>
              <View style={[s.bubble, s.bubbleAi, s.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.zinc500} />
              </View>
            </View>
          )}
        </ScrollView>

        {}
        {
}
        <View style={s.inputBar}>
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarImg: { width: 22, height: 22 },
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
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    overflow: "hidden",
  },
  avatarImg: { width: 24, height: 24 },

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
    paddingBottom: 8, 
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
