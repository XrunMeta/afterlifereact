import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Keyboard,
  type KeyboardEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import TextField from "../../components/ui/TextField";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { seedSource } from "../../api/source";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { DomainMessage } from "../../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

const quickActions = ["더 구체적으로", "다른 주제로", "공감 세부 훈련"];

export default function ChatScreen({ route, navigation }: Props) {
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const currentUserId = useAuthStore((s) => s.user?.id) ?? 1;
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const initialMessages = useMemo<DomainMessage[]>(
    () =>
      seedSource.messages()
        .filter((m) => m.cloneId === cloneId && m.userId === currentUserId)
        .slice()
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [cloneId, currentUserId],
  );
  const [messages, setMessages] = useState<DomainMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const personaName = clone?.displayName ?? "페르소나";

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: KeyboardEvent) =>
      setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const inputAreaPaddingBottom =
    keyboardHeight > 0 ? 58 : Math.max(insets.bottom, 12);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: DomainMessage = {
      id: Date.now(),
      cloneId,
      userId: currentUserId,
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: DomainMessage = {
        id: Date.now() + 1,
        cloneId,
        userId: currentUserId,
        role: "clone",
        content: "네, 이해했습니다. 제가 도와드릴 수 있는 다른 것이 있나요?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = ({ item }: { item: DomainMessage }) => {
    const isUser = item.role === "user";

    return (
      <View style={s.msgContainer}>
        {!isUser && <Text style={s.trainerLabel}>AI TRAINER</Text>}
        {isUser && (
          <View style={s.userNameRow}>
            <Text style={s.userName}>{personaName}</Text>
          </View>
        )}
        <View style={[s.bubbleRow, isUser && s.bubbleRowUser]}>
          <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleClone]}>
            <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        s.container,
        keyboardHeight > 0 && { paddingBottom: keyboardHeight },
      ]}
    >
      {}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={COLORS.zinc900} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerName}>{personaName}</Text>
            <Text style={s.headerSub}>AI 페르소나</Text>
          </View>
          <TouchableOpacity style={{ padding: 4 }}>
            <Feather name="more-vertical" size={22} color={COLORS.zinc600} />
          </TouchableOpacity>
        </View>

        {}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <View style={s.progressLeft}>
              <Feather name="zap" size={16} color="#f97316" />
              <Text style={s.progressLabel}>페르소나 학습</Text>
            </View>
            <Text style={s.progressPercent}>65%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={s.progressFill} />
          </View>
          <Text style={s.progressHint}>대화를 통해 페르소나가 학습하고 있습니다</Text>
        </View>
      </View>

      {}
      <FlatList
        ref={flatListRef}
        style={s.messageListFlex}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={s.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {}
      <View style={[s.inputArea, { paddingBottom: inputAreaPaddingBottom }]}>
        {}
        <FlatList
          data={quickActions}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.quickRow}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.quickBtn}>
              <Text style={s.quickText}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {}
        <View style={s.inputRow}>
          <TouchableOpacity style={s.plusBtn}>
            <Feather name="plus" size={20} color={COLORS.zinc600} />
          </TouchableOpacity>

          <View style={s.inputWrap}>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요..."
              onSubmitEditing={handleSend}
              returnKeyType="send"
              rounded={RADIUS.full}
              rightIcon={
                <TouchableOpacity>
                  <Feather name="mic" size={18} color={COLORS.zinc400} />
                </TouchableOpacity>
              }
            />
          </View>

          <TouchableOpacity
            style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Feather name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  messageListFlex: { flex: 1 },

  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
    paddingHorizontal: SIZES.medium,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  headerSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 1 },

  progressCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.zinc50,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  progressPercent: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    width: "65%",
    height: "100%",
    borderRadius: RADIUS.full,
    backgroundColor: "#f97316",
  },
  progressHint: { fontSize: 12, color: COLORS.zinc600, marginTop: 8 },

  messageList: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: 16,
    gap: 20,
  },
  msgContainer: { marginBottom: 4 },
  trainerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.zinc400,
    letterSpacing: 1,
    marginBottom: 8,
  },
  userNameRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  userName: { fontSize: 12, color: COLORS.zinc500 },
  bubbleRow: { flexDirection: "row" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: "85%",
  },
  bubbleClone: {
    backgroundColor: COLORS.zinc50,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  bubbleUser: {
    backgroundColor: COLORS.zinc900,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.zinc900,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },

  inputArea: {
    paddingHorizontal: SIZES.medium,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  quickRow: { gap: 8, marginBottom: 12 },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.full,
  },
  quickText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc900 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  plusBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: { flex: 1 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.zinc300,
  },
});
