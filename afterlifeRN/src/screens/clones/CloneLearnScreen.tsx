

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import type { ClonesStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { showAlert } from "../../stores/dialogStore";
import { useAuthStore } from "../../stores/authStore";
import {
  getCloneDetail,
  getCloneKnowledge,
  getKnowledgeQuestions,
  putCloneKnowledge,
  type KnowledgeItem,
  type KnowledgeQuestion,
} from "../../api/clones";

type Props = {
  navigation: NativeStackNavigationProp<ClonesStackParamList, "CloneLearn">;
  route: RouteProp<ClonesStackParamList, "CloneLearn">;
};

interface ChatMessage {
  role: "bot" | "user";
  key: string;
  text: string;
}

interface KnowledgePayload {
  key?: string;
  q?: string | null;
  a: string;
}

export default function CloneLearnScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const cloneId = route.params.cloneId;
  const accessToken = useAuthStore((s) => s.accessToken);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloneName, setCloneName] = useState<string>("");
  const [questions, setQuestions] = useState<KnowledgeQuestion[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const scrollRef = useRef<ScrollView>(null);

  const answeredKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);
  const unansweredPool = useMemo(
    () => questions.filter((q) => !answeredKeys.has(q.key)),
    [questions, answeredKeys],
  );
  const currentQuestion = useMemo(
    () => questions.find((q) => q.key === currentKey) ?? null,
    [questions, currentKey],
  );
  const progressPct = questions.length
    ? Math.round((items.length / questions.length) * 100)
    : 0;

  const pickRandom = (pool: KnowledgeQuestion[]): string | null => {
    if (pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx].key;
  };

  const chatHistory: ChatMessage[] = useMemo(() => {
    const out: ChatMessage[] = [];
    for (const it of items) {
      if (it.q) out.push({ role: "bot", key: `${it.key}-q`, text: it.q });
      out.push({ role: "user", key: `${it.key}-a`, text: it.a });
    }
    return out;
  }, [items]);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [qs, detail, kn] = await Promise.all([
        getKnowledgeQuestions(accessToken),
        getCloneDetail(cloneId, accessToken),
        getCloneKnowledge(accessToken, cloneId),
      ]);
      setQuestions(qs);
      setCloneName(detail.clone?.name ?? "");
      setItems(kn);
      const pool = qs.filter((q) => !new Set(kn.map((i) => i.key)).has(q.key));
      setCurrentKey(pickRandom(pool));
      setAnswer("");
    } catch (err) {
      showAlert(t("common.error"), (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

  }, [cloneId, accessToken]);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatHistory.length, currentKey, loading]);

  const goNext = (fresh: KnowledgeItem[], justAnsweredKey?: string) => {

    const answered = new Set(fresh.map((i) => i.key));
    if (justAnsweredKey) answered.add(justAnsweredKey);
    const pool = questions.filter((q) => !answered.has(q.key));
    setCurrentKey(pickRandom(pool));
    setAnswer("");
  };

  const handleSend = async () => {
    if (!accessToken || !currentQuestion) return;
    const a = answer.trim();
    if (!a) return;
    if (items.length >= 30 && !answeredKeys.has(currentQuestion.key)) {
      showAlert(
        t("common.notice", { defaultValue: "안내" }),
        t("learn.maxItems", { defaultValue: "지식 항목이 최대 30개까지에요." }),
      );
      return;
    }
    const payload: KnowledgePayload[] = [
      ...items.map((it) => ({ key: it.key, q: it.q, a: it.a })),
      { key: currentQuestion.key, q: currentQuestion.label, a },
    ];
    setSaving(true);
    try {
      const res = await putCloneKnowledge(accessToken, cloneId, payload);
      if (res.error === "blacklist_hit") {
        showAlert(
          t("learn.blacklistTitle", { defaultValue: "다른 질문 부탁드립니다" }),
          t("learn.blacklistDesc", {
            defaultValue:
              res.message ||
              "이 답변에는 등록할 수 없는 표현이 포함되어 있어요. 다른 질문으로 이동합니다.",
          }),
        );
        handleSkip();
        return;
      }
      if (res.error) {
        showAlert(t("common.error"), res.message || res.error);
        return;
      }
      const fresh = res.items ?? [];
      setItems(fresh);
      goNext(fresh, currentQuestion.key);
    } catch (err) {
      showAlert(t("common.error"), (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const pool = unansweredPool.filter((q) => q.key !== currentQuestion?.key);
    setCurrentKey(pickRandom(pool));
    setAnswer("");
  };

  return (
    <SafeView showBottomBackground={false}>
      <PageHeader
        title={cloneName || t("learn.title", { defaultValue: "학습하기" })}
        subtitle={t("learn.aiCloneSubtitle", { defaultValue: "AI 클론" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!loading && questions.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="zap" size={16} color={COLORS.violet500} />
                <Text style={styles.progressTitle}>
                  {t("learn.progressTitle", { defaultValue: "클론 학습" })}
                </Text>
              </View>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressDesc}>
              {t("learn.progressDesc", {
                defaultValue: "대화를 통해 클론이 학습하고 있습니다",
              })}
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.violet500} style={{ marginTop: 48 }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
          >
            {questions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {t("learn.noQuestions", {
                    defaultValue:
                      "아직 등록된 질문이 없어요. 관리자가 질문을 추가하면 나타나요.",
                  })}
                </Text>
              </View>
            ) : (
              <>
                {chatHistory.map((msg) => (
                  <View
                    key={msg.key}
                    style={[
                      styles.bubbleRow,
                      msg.role === "user" ? styles.bubbleRowRight : styles.bubbleRowLeft,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        msg.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          msg.role === "user" && { color: COLORS.white },
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))}

                {currentQuestion && (
                  <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
                    <View style={[styles.bubble, styles.bubbleBot]}>
                      <Text style={styles.bubbleText}>{currentQuestion.label}</Text>
                    </View>
                  </View>
                )}

                {!currentQuestion && chatHistory.length > 0 && (
                  <View style={styles.doneCard}>
                    <Text style={styles.doneIcon}>🎉</Text>
                    <Text style={styles.doneText}>
                      {t("learn.allDone", {
                        defaultValue: "모든 질문에 답했어요! 통화에서 반영됩니다.",
                      })}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {!loading && currentQuestion && (
          <View style={styles.footer}>
            <View style={styles.suggestionRow}>
              <TouchableOpacity
                onPress={handleSkip}
                disabled={saving || unansweredPool.length <= 1}
                style={[
                  styles.suggestionBtn,
                  (saving || unansweredPool.length <= 1) && styles.btnDisabled,
                ]}
              >
                <Text style={styles.suggestionText}>
                  {t("learn.skip", { defaultValue: "다른 질문" })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                value={answer}
                onChangeText={(v) => setAnswer(v.slice(0, 3000))}
                placeholder={
                  currentQuestion.hint ||
                  t("learn.answerPlaceholder", { defaultValue: "메시지를 입력하세요..." })
                }
                placeholderTextColor={COLORS.zinc400}
                multiline
                style={styles.input}
                editable={!saving}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={saving || !answer.trim()}
                style={[
                  styles.sendBtn,
                  (saving || !answer.trim()) && styles.sendBtnDisabled,
                ]}
              >
                <Feather
                  name="send"
                  size={18}
                  color={saving || !answer.trim() ? COLORS.zinc400 : COLORS.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    marginHorizontal: SIZES.large,
    marginTop: 8,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc50,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.zinc900,
    marginLeft: 6,
  },
  progressPct: { fontSize: 13, color: COLORS.zinc700, fontWeight: "600" },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.zinc200,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.violet500,
    borderRadius: 4,
  },
  progressDesc: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginTop: 6,
  },
  chatScroll: { flex: 1 },
  chatContent: {
    paddingHorizontal: SIZES.large,
    paddingVertical: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleBot: {
    backgroundColor: COLORS.zinc100,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.violet500,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.zinc900,
  },
  doneCard: {
    marginTop: 32,
    padding: 24,
    alignItems: "center",
  },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneText: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: SIZES.large,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    paddingHorizontal: SIZES.large,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  suggestionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  suggestionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.zinc700,
    fontWeight: "500",
  },
  btnDisabled: { opacity: 0.4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    fontSize: 14,
    color: COLORS.zinc900,
    backgroundColor: COLORS.white,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.violet500,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.zinc200,
  },
});
