

import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import {
  RELATION_CATALOG,
  SPEECH_FORM_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  findRelationSubtypeLabel,
} from "../../constants/callEntryCatalog";
import { patchClone } from "../../api/clones";
import { useAuthStore } from "../../stores/authStore";
import { showAlert } from "../../stores/dialogStore";

interface Props {
  visible: boolean;
  cloneId: number;
  name: string; 

  existingL1?: { attrs?: Record<string, string>; notes?: string } | null;
  onCancel: () => void;
  onCall: () => void;     
  onLearn: () => void;    
}

export default function CallEntryQuestionsScreen({
  visible,
  cloneId,
  name,
  existingL1,
  onCancel,
  onCall,
  onLearn,
}: Props) {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const existingAttrs = existingL1?.attrs ?? {};

  const [relCat, setRelCat] = useState<string>(existingAttrs.relation_category ?? "");
  const [relSub, setRelSub] = useState<string>(existingAttrs.relation_subtype ?? "");
  const [speech, setSpeech] = useState<string>(existingAttrs.speech_form ?? "");
  const [job, setJob] = useState<string>(existingAttrs.job_category ?? "");
  const [jobDetail, setJobDetail] = useState<string>(existingAttrs.job_detail ?? "");
  const [saving, setSaving] = useState(false);
  const [doneModal, setDoneModal] = useState(false);

  const subtypes = useMemo(
    () => RELATION_CATALOG.find((c) => c.label === relCat)?.subtypes ?? [],
    [relCat],
  );

  const canProceed =
    relCat.trim().length > 0 &&
    relSub.trim().length > 0 &&
    speech.trim().length > 0 &&
    job.trim().length > 0 &&
    jobDetail.trim().length > 0;

  const save = async () => {
    if (!canProceed || !accessToken) return;
    setSaving(true);
    try {

      const mergedAttrs: Record<string, string> = {
        ...existingAttrs,
        relation_category: relCat,
        relation_subtype: relSub,
        speech_form: speech,
        job_category: job,
        job_detail: jobDetail.trim(),
      };
      await patchClone(accessToken, cloneId, {
        l1_profile: {
          attrs: mergedAttrs,
          notes: existingL1?.notes ?? "",
        },
      });
      setDoneModal(true);
    } catch (err) {
      console.warn("[CallEntryQuestions] save 실패:", err);
      showAlert("저장 실패", "네트워크 오류로 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.white }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[s.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <TouchableOpacity onPress={onCancel} style={s.headerBtn}>
            <Text style={s.headerBtnText}>취소</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{name}님과 대화 준비</Text>
          <View style={s.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {}
          <Section title={`${name}님과 어떤 관계였나요?`}>
            <View style={s.chipsWrap}>
              {RELATION_CATALOG.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  active={relCat === c.label}
                  onPress={() => {
                    setRelCat(c.label);
                    setRelSub("");
                  }}
                />
              ))}
            </View>
            {subtypes.length > 0 ? (
              <>
                <Text style={s.subLabel}>세부 관계</Text>
                <View style={s.chipsWrap}>
                  {subtypes.map((sub) => (
                    <Chip
                      key={sub.id}
                      label={sub.label}
                      active={relSub === sub.label}
                      onPress={() => setRelSub(sub.label)}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </Section>

          {}
          <Section title={`${name}님과 서로 어떤 말투를 사용하는 사이였나요?`}>
            <View style={s.chipsWrap}>
              {SPEECH_FORM_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={speech === o.label}
                  onPress={() => setSpeech(o.label)}
                />
              ))}
            </View>
          </Section>

          {}
          <Section title={`${name}님의 직업은 무엇이었나요?`}>
            <View style={s.chipsWrap}>
              {JOB_CATEGORY_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  active={job === o.label}
                  onPress={() => setJob(o.label)}
                />
              ))}
            </View>
            <Text style={s.subLabel}>{`${name}님이 정확하게 어떤 일을 했는지 적어주세요.`}</Text>
            <TextInput
              value={jobDetail}
              onChangeText={setJobDetail}
              placeholder="예: 응급의학과 의사, 초등학교 담임선생님, 게임 백엔드 개발자"
              placeholderTextColor={COLORS.zinc400}
              multiline
              style={s.textInput}
            />
          </Section>
        </ScrollView>

        {}
        <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity
            style={[s.saveBtn, (!canProceed || saving) && s.saveBtnDisabled]}
            onPress={save}
            disabled={!canProceed || saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={s.saveBtnText}>완료</Text>
            )}
          </TouchableOpacity>
        </View>

        {}
        <Modal visible={doneModal} transparent animationType="fade" onRequestClose={() => setDoneModal(false)}>
          <View style={s.modalBackdrop}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>{`${name}님과 대화할 준비가 완료되었어요!`}</Text>
              <View style={s.modalButtons}>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnGhost]}
                  onPress={() => {
                    setDoneModal(false);
                    onLearn();
                  }}
                >
                  <Text style={s.modalBtnGhostText}>더 학습하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnPrimary]}
                  onPress={() => {
                    setDoneModal(false);
                    onCall();
                  }}
                >
                  <Text style={s.modalBtnPrimaryText}>{`${name}님과 통화하기`}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
      activeOpacity={0.8}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

void findRelationSubtypeLabel;

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: COLORS.zinc900 },
  headerBtn: { minWidth: 48, alignItems: "flex-start" },
  headerBtnText: { color: COLORS.zinc600, fontSize: 14 },
  content: { padding: 16, paddingBottom: 24, gap: 20 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  subLabel: { fontSize: 13, color: COLORS.zinc600, marginTop: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.violet700,
    borderColor: COLORS.violet700,
  },
  chipText: { fontSize: 13, color: COLORS.zinc700 },
  chipTextActive: { color: COLORS.white, fontWeight: "600" },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.zinc900,
    minHeight: 80,
    textAlignVertical: "top",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    padding: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.violet700,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: COLORS.zinc300 },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: COLORS.zinc900, textAlign: "center" },
  modalButtons: { gap: 10 },
  modalBtn: { padding: 14, borderRadius: RADIUS.md, alignItems: "center" },
  modalBtnPrimary: { backgroundColor: COLORS.violet700 },
  modalBtnPrimaryText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  modalBtnGhost: { backgroundColor: COLORS.zinc100 },
  modalBtnGhostText: { color: COLORS.zinc900, fontSize: 15, fontWeight: "500" },
});

void SIZES;
