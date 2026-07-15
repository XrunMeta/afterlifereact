

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import type { ClonesStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
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

  const answeredKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);
  const unansweredPool = useMemo(
    () => questions.filter((q) => !answeredKeys.has(q.key)),
    [questions, answeredKeys],
  );
  const currentQuestion = useMemo(
    () => questions.find((q) => q.key === currentKey) ?? null,
    [questions, currentKey],
  );

  const pickRandom = (pool: KnowledgeQuestion[]): string | null => {
    if (pool.length === 0) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx].key;
  };

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

  const goNext = (fresh: KnowledgeItem[]) => {
    const answered = new Set(fresh.map((i) => i.key));
    const pool = questions.filter((q) => !answered.has(q.key));
    setCurrentKey(pickRandom(pool));
    setAnswer("");
  };

  const handleSaveAndNext = async () => {
    if (!accessToken || !currentQuestion) return;
    const a = answer.trim();
    if (!a) {
      showAlert(
        t("common.notice", { defaultValue: "안내" }),
        t("learn.emptyAnswer", { defaultValue: "답변을 입력해주세요." }),
      );
      return;
    }
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
      if (res.error) {
        showAlert(t("common.error"), res.error);
        return;
      }
      const fresh = res.items ?? [];
      setItems(fresh);
      goNext(fresh);
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
    <SafeView>
      <PageHeader
        title={t("learn.title", { defaultValue: "학습하기" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.violet500} style={{ marginTop: 48 }} />
        ) : (
          <>
            {cloneName ? (
              <Text style={styles.subtitle}>{cloneName}</Text>
            ) : null}

            <Text style={styles.progress}>
              {t("learn.progress", {
                defaultValue: `답변한 질문 ${items.length}/${questions.length}`,
                answered: items.length,
                total: questions.length,
              })}
            </Text>

            {questions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {t("learn.noQuestions", {
                    defaultValue: "아직 등록된 질문이 없어요. 관리자가 질문을 추가하면 나타나요.",
                  })}
                </Text>
              </View>
            ) : !currentQuestion ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyText}>
                  {t("learn.allDone", {
                    defaultValue: "모든 질문에 답했어요! 통화에서 클론이 이 정보를 활용합니다.",
                  })}
                </Text>
                <TouchableOpacity onPress={load} style={styles.reloadBtn}>
                  <Text style={styles.reloadBtnText}>
                    {t("learn.reload", { defaultValue: "새로고침" })}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.questionLabel}>
                    {t("learn.questionLabel", { defaultValue: "질문" })}
                  </Text>
                  <Text style={styles.questionText}>{currentQuestion.label}</Text>

                  <TextInput
                    value={answer}
                    onChangeText={(v) => setAnswer(v.slice(0, 3000))}
                    placeholder={
                      currentQuestion.hint ||
                      t("learn.answerPlaceholder", { defaultValue: "여기에 답변을 입력하세요" })
                    }
                    placeholderTextColor={COLORS.zinc400}
                    multiline
                    style={styles.input}
                    editable={!saving}
                  />
                  <Text style={styles.charCount}>{answer.length} / 3000</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={handleSkip}
                    disabled={saving || unansweredPool.length <= 1}
                    style={[
                      styles.skipBtn,
                      (saving || unansweredPool.length <= 1) && styles.btnDisabled,
                    ]}
                  >
                    <Text style={styles.skipBtnText}>
                      {t("learn.skip", { defaultValue: "다른 질문" })}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={
                        saving
                          ? t("learn.saving", { defaultValue: "저장 중..." })
                          : t("learn.saveAndNext", { defaultValue: "저장 후 다음" })
                      }
                      onPress={handleSaveAndNext}
                      disabled={saving}
                    />
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.large,
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc700,
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginBottom: SIZES.large,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  reloadBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.violet500,
    borderRadius: RADIUS.md,
  },
  reloadBtnText: { color: COLORS.violet500, fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SIZES.large,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    marginBottom: SIZES.large,
  },
  questionLabel: {
    fontSize: 11,
    color: COLORS.violet500,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    lineHeight: 26,
    marginBottom: SIZES.large,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.zinc900,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: COLORS.zinc400,
    marginTop: 6,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  skipBtn: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
  },
  skipBtnText: { fontSize: 13, color: COLORS.zinc700, fontWeight: "600" },
  btnDisabled: { opacity: 0.4 },
});
