

import v_a3453e, { v_df9f57, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_122070,
  v_4623af,
  v_79c4f2,
  v_472849,
  v_39a996,
  v_e767d1,
  v_326be8,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import {
  v_88e76b,
  v_9a25f1,
  v_422a59,
  v_d19f19,
} from "../../constants/callEntryCatalog";
import { v_bb226e } from "../../api/clones";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";

interface Props {
  visible: boolean;
  cloneId: number;
  name: string; 

  existingL1?: { attrs?: Record<string, string>; notes?: string } | null;
  onCancel: () => void;
  onCall: () => void;     
  onLearn: () => void;    
}

export default function v_601c02({
  visible: v_cf55be,
  cloneId: v_6e0fd3,
  name: v_1833e7,
  existingL1: v_ebdcfc,
  onCancel: v_c7001c,
  onCall: v_1bb83e,
  onLearn: v_6d2805,
}: Props) {
  const v_033e14 = v_e0068c();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_676b49 = v_ebdcfc?.attrs ?? {};

  const [v_35b883, v_8781ff] = v_5ab095<string>(v_676b49.relation_category ?? "");
  const [v_1c3009, v_bb1c6a] = v_5ab095<string>(v_676b49.relation_subtype ?? "");
  const [v_60bef6, v_b157ed] = v_5ab095<string>(v_676b49.speech_form ?? "");
  const [v_d5ec97, v_977c36] = v_5ab095<string>(v_676b49.job_category ?? "");
  const [v_cdce7c, v_eb1148] = v_5ab095<string>(v_676b49.job_detail ?? "");
  const [v_35bf26, v_04e389] = v_5ab095(false);
  const [v_d5f375, v_9b4aaf] = v_5ab095(false);

  const v_97969b = v_df9f57(
    () => v_88e76b.find((v_3f4e2e) => v_3f4e2e.label === v_35b883)?.subtypes ?? [],
    [v_35b883],
  );

  const v_fc0cf5 =
    v_35b883.trim().length > 0 &&
    v_1c3009.trim().length > 0 &&
    v_60bef6.trim().length > 0 &&
    v_d5ec97.trim().length > 0 &&
    v_cdce7c.trim().length > 0;

  const v_1e693b = async () => {
    if (!v_fc0cf5 || !v_2ca7e0) return;
    v_04e389(true);
    try {

      const v_1b4a05 = {
        ...v_676b49,
        relation_category: v_35b883,
        relation_subtype: v_1c3009,
        speech_form: v_60bef6,
        job_category: v_d5ec97,
        job_detail: v_cdce7c.trim(),
      };
      await v_bb226e(v_2ca7e0, v_6e0fd3, {
        l1_profile: {
          attrs: v_1b4a05,
          notes: v_ebdcfc?.notes ?? "",
        },
      });
      v_9b4aaf(true);
    } catch (v_49263d) {
      console.warn("[CallEntryQuestions] save 실패:", v_49263d);
      v_889fad("저장 실패", "네트워크 오류로 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      v_04e389(false);
    }
  };

  if (!v_cf55be) return null;

  return (
    <Modal visible={v_cf55be} animationType="slide" onRequestClose={v_c7001c}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: v_1bfbd0.white }}
        behavior={v_326be8.OS === "ios" ? "padding" : undefined}
      >
        <View style={[v_fd5f43.header, { paddingTop: Math.max(v_033e14.top, 12) + 8 }]}>
          <TouchableOpacity onPress={v_c7001c} style={v_fd5f43.headerBtn}>
            <Text style={v_fd5f43.headerBtnText}>취소</Text>
          </TouchableOpacity>
          <Text style={v_fd5f43.headerTitle}>{v_1833e7}님과 대화 준비</Text>
          <View style={v_fd5f43.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={v_fd5f43.content} keyboardShouldPersistTaps="handled">
          {}
          <Section title={`${v_1833e7}님과 어떤 관계였나요?`}>
            <View style={v_fd5f43.chipsWrap}>
              {v_88e76b.map((v_3f4e2e) => (
                <Chip
                  key={v_3f4e2e.id}
                  label={v_3f4e2e.label}
                  active={v_35b883 === v_3f4e2e.label}
                  onPress={() => {
                    v_8781ff(v_3f4e2e.label);
                    v_bb1c6a("");
                  }}
                />
              ))}
            </View>
            {v_97969b.length > 0 ? (
              <>
                <Text style={v_fd5f43.subLabel}>세부 관계</Text>
                <View style={v_fd5f43.chipsWrap}>
                  {v_97969b.map((v_1ae212) => (
                    <Chip
                      key={v_1ae212.id}
                      label={v_1ae212.label}
                      active={v_1c3009 === v_1ae212.label}
                      onPress={() => v_bb1c6a(v_1ae212.label)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </Section>

          {}
          <Section title={`${v_1833e7}님과 서로 어떤 말투를 사용하는 사이였나요?`}>
            <View style={v_fd5f43.chipsWrap}>
              {v_9a25f1.map((v_b6c474) => (
                <Chip
                  key={v_b6c474.id}
                  label={v_b6c474.label}
                  active={v_60bef6 === v_b6c474.label}
                  onPress={() => v_b157ed(v_b6c474.label)}
                />
              ))}
            </View>
          </Section>

          {}
          <Section title={`${v_1833e7}님의 직업은 무엇이었나요?`}>
            <View style={v_fd5f43.chipsWrap}>
              {v_422a59.map((v_b6c474) => (
                <Chip
                  key={v_b6c474.id}
                  label={v_b6c474.label}
                  active={v_d5ec97 === v_b6c474.label}
                  onPress={() => v_977c36(v_b6c474.label)}
                />
              ))}
            </View>
            <Text style={v_fd5f43.subLabel}>{`${v_1833e7}님이 정확하게 어떤 일을 했는지 적어주세요.`}</Text>
            <TextInput
              value={v_cdce7c}
              onChangeText={v_eb1148}
              placeholder="예: 응급의학과 의사, 초등학교 담임선생님, 게임 백엔드 개발자"
              placeholderTextColor={v_1bfbd0.zinc400}
              multiline
              style={v_fd5f43.textInput}
            />
          </Section>
        </ScrollView>

        {}
        <View style={[v_fd5f43.footer, { paddingBottom: 12 + v_033e14.bottom }]}>
          <TouchableOpacity
            style={[v_fd5f43.saveBtn, (!v_fc0cf5 || v_35bf26) && v_fd5f43.saveBtnDisabled]}
            onPress={v_1e693b}
            disabled={!v_fc0cf5 || v_35bf26}
          >
            {v_35bf26 ? (
              <ActivityIndicator color={v_1bfbd0.white} />
            ) : (
              <Text style={v_fd5f43.saveBtnText}>완료</Text>
            )}
          </TouchableOpacity>
        </View>

        {}
        <Modal visible={v_d5f375} transparent animationType="fade" onRequestClose={() => v_9b4aaf(false)}>
          <View style={v_fd5f43.modalBackdrop}>
            <View style={v_fd5f43.modalCard}>
              <Text style={v_fd5f43.modalTitle}>{`${v_1833e7}님과 대화할 준비가 완료되었어요!`}</Text>
              <View style={v_fd5f43.modalButtons}>
                <TouchableOpacity
                  style={[v_fd5f43.modalBtn, v_fd5f43.modalBtnGhost]}
                  onPress={() => {
                    v_9b4aaf(false);
                    v_6d2805();
                  }}
                >
                  <Text style={v_fd5f43.modalBtnGhostText}>더 학습하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_fd5f43.modalBtn, v_fd5f43.modalBtnPrimary]}
                  onPress={() => {
                    v_9b4aaf(false);
                    v_1bb83e();
                  }}
                >
                  <Text style={v_fd5f43.modalBtnPrimaryText}>{`${v_1833e7}님과 통화하기`}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function v_8c6e3a({ title: v_9f1622, children: v_21f619 }: { title: string; children: v_a3453e.ReactNode }) {
  return (
    <View style={v_fd5f43.section}>
      <Text style={v_fd5f43.sectionTitle}>{v_9f1622}</Text>
      {v_21f619}
    </View>
  );
}

function v_084de4({ label: v_2869c1, active: v_f8b770, onPress: v_719eed }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={v_719eed}
      style={[v_fd5f43.chip, v_f8b770 && v_fd5f43.chipActive]}
      activeOpacity={0.8}
    >
      <Text style={[v_fd5f43.chipText, v_f8b770 && v_fd5f43.chipTextActive]}>{v_2869c1}</Text>
    </TouchableOpacity>
  );
}

void v_d19f19;

const v_fd5f43 = v_472849.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc900 },
  headerBtn: { minWidth: 48, alignItems: "flex-start" },
  headerBtnText: { color: v_1bfbd0.zinc600, fontSize: 14 },
  content: { padding: 20, paddingBottom: 40, gap: 32 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 4 },
  subLabel: { fontSize: 13, color: v_1bfbd0.zinc600, marginTop: 12, marginBottom: 4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
  },
  chipActive: {
    backgroundColor: v_1bfbd0.violet700,
    borderColor: v_1bfbd0.violet700,
  },
  chipText: { fontSize: 13, color: v_1bfbd0.zinc700 },
  chipTextActive: { color: v_1bfbd0.white, fontWeight: "600" },
  textInput: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: v_8b0c90.md,
    padding: 14,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    minHeight: 96,
    textAlignVertical: "top",
    marginTop: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    padding: 20,
  },
  saveBtn: {
    backgroundColor: v_1bfbd0.violet700,
    padding: 16,
    borderRadius: v_8b0c90.md,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
  saveBtnText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: v_1bfbd0.zinc900, textAlign: "center" },
  modalButtons: { gap: 10 },
  modalBtn: { padding: 14, borderRadius: v_8b0c90.md, alignItems: "center" },
  modalBtnPrimary: { backgroundColor: v_1bfbd0.violet700 },
  modalBtnPrimaryText: { color: v_1bfbd0.white, fontSize: 15, fontWeight: "600" },
  modalBtnGhost: { backgroundColor: v_1bfbd0.zinc100 },
  modalBtnGhostText: { color: v_1bfbd0.zinc900, fontSize: 15, fontWeight: "500" },
});

void v_9b1a04;
