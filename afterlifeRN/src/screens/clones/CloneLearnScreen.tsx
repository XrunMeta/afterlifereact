

import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_79c4f2,
  v_472849,
  v_122070,
  v_39a996,
  v_e767d1,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";

import type { v_2d88fc } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_889fad } from "../../stores/dialogStore";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_003cf2,
  v_7b4be8,
  v_d7e0ab,
  v_c2fd24,
  v_085a16,
  type v_1d8a7b,
  type v_1a6ece,
} from "../../api/clones";
import { v_c50f83 } from "../../utils/nameParticle";

type Props = {
  navigation: v_390fcc<v_2d88fc, "CloneLearn">;
  route: v_ee3714<v_2d88fc, "CloneLearn">;
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

interface PendingConfirm {
  questionKey: string;
  slots: v_1d8a7b[]; 
  reply: string;          
  userAnswer: string;     
}

export default function v_78da96({ navigation: v_c65f5d, route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_6e0fd3 = v_c7daf6.params.cloneId;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_f2ff36, v_caa192] = v_5ab095<string>("");
  const [v_c3519b, v_54a43f] = v_5ab095<v_1a6ece[]>([]);
  const [v_4622b9, v_fa923c] = v_5ab095<v_1d8a7b[]>([]);
  const [v_c84c22, v_056f5c] = v_5ab095<string | null>(null);
  const [v_343c90, v_2f6757] = v_5ab095<string>("");
  const [v_365b18, v_323ec3] = v_5ab095<PendingConfirm | null>(null);
  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const v_31c649 = v_df9f57(() => new Set(v_4622b9.map((v_ebec57) => v_ebec57.key)), [v_4622b9]);
  const v_e97ea1 = v_df9f57(
    () => v_c3519b.filter((v_ab6401) => !v_31c649.has(v_ab6401.key)),
    [v_c3519b, v_31c649],
  );
  const v_2a8f35 = v_df9f57(
    () => v_c3519b.find((v_ab6401) => v_ab6401.key === v_c84c22) ?? null,
    [v_c3519b, v_c84c22],
  );
  const v_dc2799 = v_c3519b.length
    ? Math.round((v_4622b9.length / v_c3519b.length) * 100)
    : 0;

  const v_35ad8d = (pool: v_1a6ece[]): string | null => {
    if (v_75fbef.length === 0) return null;
    const v_e86ad8 = Math.floor(Math.random() * v_75fbef.length);
    return v_75fbef[v_e86ad8].key;
  };

  const v_fa0e39 = v_df9f57(() => {
    const v_8d4337 = [];
    for (const v_23805a of v_4622b9) {
      if (v_23805a.q)
        v_8d4337.push({ role: "bot", key: `${v_23805a.key}-q`, text: v_c50f83(v_23805a.q, v_f2ff36) });
      v_8d4337.push({ role: "user", key: `${v_23805a.key}-a`, text: v_23805a.a });
    }
    return v_8d4337;
  }, [v_4622b9, v_f2ff36]);

  const v_f6f5de = async () => {
    if (!v_2ca7e0) return;
    v_34a50a(true);
    try {
      const [v_212049, v_3cfdfc, v_e5ce38] = await Promise.all([
        v_d7e0ab(v_2ca7e0),
        v_003cf2(v_6e0fd3, v_2ca7e0),
        v_7b4be8(v_2ca7e0, v_6e0fd3),
      ]);
      v_54a43f(v_212049);
      v_caa192(v_3cfdfc.clone?.name ?? "");
      v_fa923c(v_e5ce38);
      const v_75fbef = v_212049.filter((v_ab6401) => !new Set(v_e5ce38.map((v_ebec57) => v_ebec57.key)).has(v_ab6401.key));
      v_056f5c(v_35ad8d(v_75fbef));
      v_2f6757("");
    } catch (v_49263d) {
      v_889fad(v_8d41d7("common.error"), (v_49263d as Error).message);
    } finally {
      v_34a50a(false);
    }
  };

  v_c4deb2(() => {
    v_f6f5de();

  }, [v_6e0fd3, v_2ca7e0]);

  v_c4deb2(() => {
    if (!v_683210 && v_5ca6b8.current) {
      setTimeout(() => v_5ca6b8.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [v_fa0e39.length, v_c84c22, v_683210, v_365b18]);

  const v_219251 = (fresh: v_1d8a7b[], v_566831) => {

    const v_ca2c14 = new Set(v_3871e2.map((v_ebec57) => v_ebec57.key));
    if (v_566831) v_ca2c14.add(v_566831);
    const v_75fbef = v_c3519b.filter((v_ab6401) => !v_ca2c14.has(v_ab6401.key));
    v_056f5c(v_35ad8d(v_75fbef));
    v_2f6757("");
  };

  const v_465869 = async () => {
    if (!v_2ca7e0 || !v_2a8f35) return;
    const v_779914 = v_343c90.trim();
    if (!v_779914) return;
    if (v_4622b9.length >= 200 && !v_31c649.has(v_2a8f35.key)) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "안내" }),
        v_8d41d7("learn.maxItems", { defaultValue: "지식 항목이 최대 200개까지에요." }),
      );
      return;
    }
    v_04e389(true);
    try {
      const v_8f00b9 = await v_c2fd24(
        v_2ca7e0,
        v_6e0fd3,
        v_2a8f35.key,
        v_779914,
      );
      if (v_8f00b9.error === "blacklist_hit") {
        v_889fad(
          v_8d41d7("learn.blacklistTitle", { defaultValue: "다른 질문 부탁드립니다" }),
          v_8d41d7("learn.blacklistDesc", {
            defaultValue:
              v_8f00b9.message ||
              "이 답변에는 등록할 수 없는 표현이 포함되어 있어요. 다른 질문으로 이동합니다.",
          }),
        );
        v_78ac9c();
        return;
      }
      if (v_8f00b9.error) {
        v_889fad(v_8d41d7("common.error"), v_8f00b9.message || v_8f00b9.error);
        return;
      }
      const v_966a46 = v_8f00b9.slots ?? [];
      const v_677216 =
        v_8f00b9.reply?.trim() ||
        v_8d41d7("learn.defaultConfirm", { defaultValue: "이렇게 정리하면 맞을까?" });
      v_323ec3({
        questionKey: v_2a8f35.key,
        slots: v_966a46,
        reply: v_677216,
        userAnswer: v_779914,
      });
      v_2f6757("");
    } catch (v_49263d) {
      v_889fad(v_8d41d7("common.error"), (v_49263d as Error).message);
    } finally {
      v_04e389(false);
    }
  };

  const v_6d687a = async () => {
    if (!v_2ca7e0 || !v_365b18) return;
    const v_934ae5 = v_365b18.slots.filter((v_fd5f43) => v_fd5f43.a && v_fd5f43.a.trim());
    if (v_934ae5.length === 0) {

      const v_ca2c14 = new Set(v_4622b9.map((v_ebec57) => v_ebec57.key));
      v_ca2c14.add(v_365b18.questionKey);
      const v_75fbef = v_c3519b.filter((v_ab6401) => !v_ca2c14.has(v_ab6401.key));
      v_056f5c(v_35ad8d(v_75fbef));
      v_323ec3(null);
      return;
    }
    const v_931bf0 = [
      ...v_4622b9.map((v_23805a) => ({ key: v_23805a.key, q: v_23805a.q, a: v_23805a.a })),
      ...v_934ae5.map((v_fd5f43) => ({ key: v_fd5f43.key, q: v_fd5f43.q, a: v_fd5f43.a })),
    ];
    v_04e389(true);
    try {
      const v_8f00b9 = await v_085a16(v_2ca7e0, v_6e0fd3, v_931bf0);
      if (v_8f00b9.error) {
        v_889fad(v_8d41d7("common.error"), v_8f00b9.message || v_8f00b9.error);
        return;
      }
      const v_3871e2 = v_8f00b9.items ?? [];
      v_fa923c(v_3871e2);

      const v_ca2c14 = new Set(v_3871e2.map((v_ebec57) => v_ebec57.key));
      v_ca2c14.add(v_365b18.questionKey);
      for (const v_fd5f43 of v_934ae5) v_ca2c14.add(v_fd5f43.key);
      const v_75fbef = v_c3519b.filter((v_ab6401) => !v_ca2c14.has(v_ab6401.key));
      v_056f5c(v_35ad8d(v_75fbef));
      v_323ec3(null);
    } catch (v_49263d) {
      v_889fad(v_8d41d7("common.error"), (v_49263d as Error).message);
    } finally {
      v_04e389(false);
    }
  };

  const v_5730e9 = () => {
    if (!v_365b18) return;
    v_2f6757(v_365b18.userAnswer);
    v_323ec3(null);
  };

  const v_78ac9c = () => {
    const v_75fbef = v_e97ea1.filter((v_ab6401) => v_ab6401.key !== v_2a8f35?.key);
    v_056f5c(v_35ad8d(v_75fbef));
    v_2f6757("");
    v_323ec3(null);
  };

  return (
    <SafeView showBottomBackground={false}>
      <PageHeader
        title={v_f2ff36 || v_8d41d7("learn.title", { defaultValue: "학습하기" })}
        subtitle={v_8d41d7("learn.aiCloneSubtitle", { defaultValue: "AI 클론" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={v_326be8.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!v_683210 && v_c3519b.length > 0 && (
          <View style={v_d81136.progressCard}>
            <View style={v_d81136.progressHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="zap" size={16} color={v_1bfbd0.violet500} />
                <Text style={v_d81136.progressTitle}>
                  {v_8d41d7("learn.progressTitle", { defaultValue: "클론 학습" })}
                </Text>
              </View>
              <Text style={v_d81136.progressPct}>{v_dc2799}%</Text>
            </View>
            <View style={v_d81136.progressBarBg}>
              <View style={[v_d81136.progressBarFill, { width: `${v_dc2799}%` }]} />
            </View>
            <Text style={v_d81136.progressDesc}>
              {v_8d41d7("learn.progressDesc", {
                defaultValue: "대화를 통해 클론이 학습하고 있습니다",
              })}
            </Text>
          </View>
        )}

        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.violet500} style={{ marginTop: 48 }} />
        ) : (
          <ScrollView
            ref={v_5ca6b8}
            style={v_d81136.chatScroll}
            contentContainerStyle={v_d81136.chatContent}
          >
            {v_c3519b.length === 0 ? (
              <View style={v_d81136.empty}>
                <Text style={v_d81136.emptyText}>
                  {v_8d41d7("learn.noQuestions", {
                    defaultValue:
                      "아직 등록된 질문이 없어요. 관리자가 질문을 추가하면 나타나요.",
                  })}
                </Text>
              </View>
            ) : (
              <>
                {v_fa0e39.map((v_badeaf) => (
                  <View
                    key={v_badeaf.key}
                    style={[
                      v_d81136.bubbleRow,
                      v_badeaf.role === "user" ? v_d81136.bubbleRowRight : v_d81136.bubbleRowLeft,
                    ]}
                  >
                    <View
                      style={[
                        v_d81136.bubble,
                        v_badeaf.role === "user" ? v_d81136.bubbleUser : v_d81136.bubbleBot,
                      ]}
                    >
                      <Text
                        style={[
                          v_d81136.bubbleText,
                          v_badeaf.role === "user" && { color: v_1bfbd0.white },
                        ]}
                      >
                        {v_badeaf.text}
                      </Text>
                    </View>
                  </View>
                ))}

                {v_2a8f35 && (
                  <View style={[v_d81136.bubbleRow, v_d81136.bubbleRowLeft]}>
                    <View style={[v_d81136.bubble, v_d81136.bubbleBot]}>
                      <Text style={v_d81136.bubbleText}>
                        {v_c50f83(v_2a8f35.label, v_f2ff36)}
                      </Text>
                    </View>
                  </View>
                )}

                {v_365b18 && (
                  <>
                    <View style={[v_d81136.bubbleRow, v_d81136.bubbleRowRight]}>
                      <View style={[v_d81136.bubble, v_d81136.bubbleUser]}>
                        <Text style={[v_d81136.bubbleText, { color: v_1bfbd0.white }]}>
                          {v_365b18.userAnswer}
                        </Text>
                      </View>
                    </View>
                    <View style={[v_d81136.bubbleRow, v_d81136.bubbleRowLeft]}>
                      <View style={[v_d81136.bubble, v_d81136.bubbleBot]}>
                        <Text style={v_d81136.bubbleText}>{v_365b18.reply}</Text>
                      </View>
                    </View>
                  </>
                )}

                {!v_2a8f35 && v_fa0e39.length > 0 && (
                  <View style={v_d81136.doneCard}>
                    <Text style={v_d81136.doneIcon}>🎉</Text>
                    <Text style={v_d81136.doneText}>
                      {v_8d41d7("learn.allDone", {
                        defaultValue: "모든 질문에 답했어요! 통화에서 반영됩니다.",
                      })}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {!v_683210 && v_2a8f35 && (
          <View style={v_d81136.footer}>
            {v_365b18 ? (
              <View style={v_d81136.confirmRow}>
                <TouchableOpacity
                  onPress={v_5730e9}
                  disabled={v_35bf26}
                  style={[
                    v_d81136.confirmBtn,
                    v_d81136.confirmBtnNo,
                    v_35bf26 && v_d81136.btnDisabled,
                  ]}
                >
                  <Text style={v_d81136.confirmBtnNoText}>
                    {v_8d41d7("learn.confirmNo", { defaultValue: "아니요" })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={v_6d687a}
                  disabled={v_35bf26}
                  style={[
                    v_d81136.confirmBtn,
                    v_d81136.confirmBtnYes,
                    v_35bf26 && v_d81136.btnDisabled,
                  ]}
                >
                  <Text style={v_d81136.confirmBtnYesText}>
                    {v_35bf26
                      ? v_8d41d7("learn.saving", { defaultValue: "저장 중..." })
                      : v_8d41d7("learn.confirmYes", { defaultValue: "예" })}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={v_d81136.suggestionRow}>
                  <TouchableOpacity
                    onPress={v_78ac9c}
                    disabled={v_35bf26 || v_e97ea1.length <= 1}
                    style={[
                      v_d81136.suggestionBtn,
                      (v_35bf26 || v_e97ea1.length <= 1) && v_d81136.btnDisabled,
                    ]}
                  >
                    <Text style={v_d81136.suggestionText}>
                      {v_8d41d7("learn.skip", { defaultValue: "다른 질문" })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={v_d81136.inputRow}>
                  <TextInput
                    value={v_343c90}
                    onChangeText={(v_81e2ef) => v_2f6757(v_81e2ef.slice(0, 3000))}
                    placeholder={
                      v_2a8f35.hint ||
                      v_8d41d7("learn.answerPlaceholder", {
                        defaultValue: "메시지를 입력하세요...",
                      })
                    }
                    placeholderTextColor={v_1bfbd0.zinc400}
                    multiline
                    style={v_d81136.input}
                    editable={!v_35bf26}
                  />
                  <TouchableOpacity
                    onPress={v_465869}
                    disabled={v_35bf26 || !v_343c90.trim()}
                    style={[
                      v_d81136.sendBtn,
                      (v_35bf26 || !v_343c90.trim()) && v_d81136.sendBtnDisabled,
                    ]}
                  >
                    <Feather
                      name="send"
                      size={18}
                      color={v_35bf26 || !v_343c90.trim() ? v_1bfbd0.zinc400 : v_1bfbd0.white}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  progressCard: {
    marginHorizontal: v_9b1a04.large,
    marginTop: 8,
    padding: 14,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
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
    color: v_1bfbd0.zinc900,
    marginLeft: 6,
  },
  progressPct: { fontSize: 13, color: v_1bfbd0.zinc700, fontWeight: "600" },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: v_1bfbd0.zinc200,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: v_1bfbd0.violet500,
    borderRadius: 4,
  },
  progressDesc: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    marginTop: 6,
  },
  chatScroll: { flex: 1 },
  chatContent: {
    paddingHorizontal: v_9b1a04.large,
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
    backgroundColor: v_1bfbd0.zinc100,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: v_1bfbd0.violet500,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: v_1bfbd0.zinc900,
  },
  doneCard: {
    marginTop: 32,
    padding: 24,
    alignItems: "center",
  },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneText: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
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
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: v_9b1a04.large,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: v_1bfbd0.white,
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
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
  },
  suggestionText: {
    fontSize: 12,
    color: v_1bfbd0.zinc700,
    fontWeight: "500",
  },
  btnDisabled: { opacity: 0.4 },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnYes: {
    backgroundColor: v_1bfbd0.violet500,
  },
  confirmBtnYesText: {
    color: v_1bfbd0.white,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmBtnNo: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
  },
  confirmBtnNoText: {
    color: v_1bfbd0.zinc700,
    fontSize: 15,
    fontWeight: "600",
  },
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
    borderColor: v_1bfbd0.zinc300,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.white,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.violet500,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: v_1bfbd0.zinc200,
  },
});
