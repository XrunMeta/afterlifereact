

import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_79c4f2,
  v_472849,
  v_122070,
  v_39a996,
} from "rcmrninabrnb";
import type { v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";

import type { v_2d88fc } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_889fad } from "../../stores/dialogStore";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_003cf2,
  v_7b4be8,
  v_d7e0ab,
  v_085a16,
  type v_1d8a7b,
  type v_1a6ece,
} from "../../api/clones";

type Props = {
  navigation: v_390fcc<v_2d88fc, "CloneLearn">;
  route: v_ee3714<v_2d88fc, "CloneLearn">;
};

interface KnowledgePayload {
  key?: string;
  q?: string | null;
  a: string;
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

  const v_31c649 = v_df9f57(() => new Set(v_4622b9.map((v_ebec57) => v_ebec57.key)), [v_4622b9]);
  const v_e97ea1 = v_df9f57(
    () => v_c3519b.filter((v_ab6401) => !v_31c649.has(v_ab6401.key)),
    [v_c3519b, v_31c649],
  );
  const v_2a8f35 = v_df9f57(
    () => v_c3519b.find((v_ab6401) => v_ab6401.key === v_c84c22) ?? null,
    [v_c3519b, v_c84c22],
  );

  const v_35ad8d = (pool: v_1a6ece[]): string | null => {
    if (v_75fbef.length === 0) return null;
    const v_e86ad8 = Math.floor(Math.random() * v_75fbef.length);
    return v_75fbef[v_e86ad8].key;
  };

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

  const v_219251 = (fresh: v_1d8a7b[]) => {
    const v_ca2c14 = new Set(v_3871e2.map((v_ebec57) => v_ebec57.key));
    const v_75fbef = v_c3519b.filter((v_ab6401) => !v_ca2c14.has(v_ab6401.key));
    v_056f5c(v_35ad8d(v_75fbef));
    v_2f6757("");
  };

  const v_d1e1ea = async () => {
    if (!v_2ca7e0 || !v_2a8f35) return;
    const v_779914 = v_343c90.trim();
    if (!v_779914) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "안내" }),
        v_8d41d7("learn.emptyAnswer", { defaultValue: "답변을 입력해주세요." }),
      );
      return;
    }
    if (v_4622b9.length >= 30 && !v_31c649.has(v_2a8f35.key)) {
      v_889fad(
        v_8d41d7("common.notice", { defaultValue: "안내" }),
        v_8d41d7("learn.maxItems", { defaultValue: "지식 항목이 최대 30개까지에요." }),
      );
      return;
    }

    const v_931bf0 = [
      ...v_4622b9.map((v_23805a) => ({ key: v_23805a.key, q: v_23805a.q, a: v_23805a.a })),
      { key: v_2a8f35.key, q: v_2a8f35.label, a: v_779914 },
    ];
    v_04e389(true);
    try {
      const v_8f00b9 = await v_085a16(v_2ca7e0, v_6e0fd3, v_931bf0);
      if (v_8f00b9.error) {
        v_889fad(v_8d41d7("common.error"), v_8f00b9.error);
        return;
      }
      const v_3871e2 = v_8f00b9.items ?? [];
      v_fa923c(v_3871e2);
      v_219251(v_3871e2);
    } catch (v_49263d) {
      v_889fad(v_8d41d7("common.error"), (v_49263d as Error).message);
    } finally {
      v_04e389(false);
    }
  };

  const v_78ac9c = () => {

    const v_75fbef = v_e97ea1.filter((v_ab6401) => v_ab6401.key !== v_2a8f35?.key);
    v_056f5c(v_35ad8d(v_75fbef));
    v_2f6757("");
  };

  return (
    <SafeView>
      <PageHeader
        title={v_8d41d7("learn.title", { defaultValue: "학습하기" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <ScrollView contentContainerStyle={v_d81136.content}>
        {v_683210 ? (
          <ActivityIndicator color={v_1bfbd0.violet500} style={{ marginTop: 48 }} />
        ) : (
          <>
            {v_f2ff36 ? (
              <Text style={v_d81136.subtitle}>{v_f2ff36}</Text>
            ) : null}

            <Text style={v_d81136.progress}>
              {v_8d41d7("learn.progress", {
                defaultValue: `답변한 질문 ${v_4622b9.length}/${v_c3519b.length}`,
                answered: v_4622b9.length,
                total: v_c3519b.length,
              })}
            </Text>

            {v_c3519b.length === 0 ? (
              <View style={v_d81136.empty}>
                <Text style={v_d81136.emptyText}>
                  {v_8d41d7("learn.noQuestions", {
                    defaultValue: "아직 등록된 질문이 없어요. 관리자가 질문을 추가하면 나타나요.",
                  })}
                </Text>
              </View>
            ) : !v_2a8f35 ? (
              <View style={v_d81136.empty}>
                <Text style={v_d81136.emptyIcon}>🎉</Text>
                <Text style={v_d81136.emptyText}>
                  {v_8d41d7("learn.allDone", {
                    defaultValue: "모든 질문에 답했어요! 통화에서 클론이 이 정보를 활용합니다.",
                  })}
                </Text>
                <TouchableOpacity onPress={v_f6f5de} style={v_d81136.reloadBtn}>
                  <Text style={v_d81136.reloadBtnText}>
                    {v_8d41d7("learn.reload", { defaultValue: "새로고침" })}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={v_d81136.card}>
                  <Text style={v_d81136.questionLabel}>
                    {v_8d41d7("learn.questionLabel", { defaultValue: "질문" })}
                  </Text>
                  <Text style={v_d81136.questionText}>{v_2a8f35.label}</Text>

                  <TextInput
                    value={v_343c90}
                    onChangeText={(v_81e2ef) => v_2f6757(v_81e2ef.slice(0, 3000))}
                    placeholder={
                      v_2a8f35.hint ||
                      v_8d41d7("learn.answerPlaceholder", { defaultValue: "여기에 답변을 입력하세요" })
                    }
                    placeholderTextColor={v_1bfbd0.zinc400}
                    multiline
                    style={v_d81136.input}
                    editable={!v_35bf26}
                  />
                  <Text style={v_d81136.charCount}>{v_343c90.length} / 3000</Text>
                </View>

                <View style={v_d81136.actions}>
                  <TouchableOpacity
                    onPress={v_78ac9c}
                    disabled={v_35bf26 || v_e97ea1.length <= 1}
                    style={[
                      v_d81136.skipBtn,
                      (v_35bf26 || v_e97ea1.length <= 1) && v_d81136.btnDisabled,
                    ]}
                  >
                    <Text style={v_d81136.skipBtnText}>
                      {v_8d41d7("learn.skip", { defaultValue: "다른 질문" })}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Button
                      title={
                        v_35bf26
                          ? v_8d41d7("learn.saving", { defaultValue: "저장 중..." })
                          : v_8d41d7("learn.saveAndNext", { defaultValue: "저장 후 다음" })
                      }
                      onPress={v_d1e1ea}
                      disabled={v_35bf26}
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

const v_d81136 = v_472849.create({
  content: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.large,
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    marginBottom: v_9b1a04.large,
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
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 22,
  },
  reloadBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet500,
    borderRadius: v_8b0c90.md,
  },
  reloadBtnText: { color: v_1bfbd0.violet500, fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: v_9b1a04.large,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    marginBottom: v_9b1a04.large,
  },
  questionLabel: {
    fontSize: 11,
    color: v_1bfbd0.violet500,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    lineHeight: 26,
    marginBottom: v_9b1a04.large,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: v_1bfbd0.zinc400,
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
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
  },
  skipBtnText: { fontSize: 13, color: v_1bfbd0.zinc700, fontWeight: "600" },
  btnDisabled: { opacity: 0.4 },
});
