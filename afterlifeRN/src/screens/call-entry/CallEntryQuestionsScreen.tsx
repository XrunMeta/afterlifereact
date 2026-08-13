

import React, { useMemo, useRef, useState } from "react";
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
  Keyboard,
  Platform,
  findNodeHandle,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import {
  RELATION_CATALOG,
  SPEECH_FORM_OPTIONS,
  JOB_CATEGORY_OPTIONS,
  findRelationSubtypeLabel,
} from "../../constants/callEntryCatalog";
import { getCloneL2, patchCloneL2 } from "../../api/clones";
import { useAuthStore } from "../../stores/authStore";
import { showAlert } from "../../stores/dialogStore";

interface Props {
  visible: boolean;
  cloneId: number;
  name: string; 

  onCancel: () => void;
  onCall: () => void;     
  onLearn: () => void;    
}

export default function CallEntryQuestionsScreen({
  visible,
  cloneId,
  name,
  onCancel,
  onCall,
  onLearn,
}: Props) {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [relCat, setRelCat] = useState<string>("");
  const [relSub, setRelSub] = useState<string>("");

  const [relSubOther, setRelSubOther] = useState<string>("");

  const [relEpisode, setRelEpisode] = useState<string>("");
  const [addressForm, setAddressForm] = useState<string>("");
  const [speech, setSpeech] = useState<string>("");
  const [job, setJob] = useState<string>("");
  const [jobOther, setJobOther] = useState<string>("");
  const [jobDetail, setJobDetail] = useState<string>("");

  React.useEffect(() => {
    if (!visible || !accessToken || !cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const { l2_profile } = await getCloneL2(accessToken, cloneId);
        if (cancelled) return;
        if (l2_profile.relation_category) setRelCat(l2_profile.relation_category);
        if (l2_profile.relation_subtype) setRelSub(l2_profile.relation_subtype);
        if (l2_profile.relation_episode) setRelEpisode(l2_profile.relation_episode);
        if (l2_profile.address_form) setAddressForm(l2_profile.address_form);
        if (l2_profile.speech_form) setSpeech(l2_profile.speech_form);
        if (l2_profile.job_category) setJob(l2_profile.job_category);
        if (l2_profile.job_detail) setJobDetail(l2_profile.job_detail);
      } catch (err) {

        console.warn("[CallEntry] L2 pre-fill 실패:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [visible, accessToken, cloneId]);
  const scrollRef = useRef<ScrollView>(null);

  const [kbVisible, setKbVisible] = useState(false);
  React.useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const scrollInputIntoView = (nodeHandle: number | null) => {
    if (nodeHandle == null || !scrollRef.current) return;
    setTimeout(() => {
      UIManager.measureLayout(
        nodeHandle,
        findNodeHandle(scrollRef.current) as number,
        () => {},
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: true }),
      );
    }, 250);
  };
  const [saving, setSaving] = useState(false);
  const [doneModal, setDoneModal] = useState(false);

  const subtypes = useMemo(
    () => RELATION_CATALOG.find((c) => c.label === relCat)?.subtypes ?? [],
    [relCat],
  );

  const relSubOk = relSub === "기타" ? relSubOther.trim().length > 0 : relSub.trim().length > 0;
  const jobOk = job === "기타" ? jobOther.trim().length > 0 : job.trim().length > 0;
  const canProceed =
    relCat.trim().length > 0 &&
    relSubOk &&
    relEpisode.trim().length > 0 &&
    addressForm.trim().length > 0 &&
    speech.trim().length > 0 &&
    jobOk &&
    jobDetail.trim().length > 0;

  console.log("[CallEntry] canProceed", {
    canProceed,
    relCat: relCat.length,
    relSub,
    relSubOther: relSubOther.length,
    relSubOk,
    relEpisode: relEpisode.length,
    addressForm: addressForm.length,
    speech: speech.length,
    job,
    jobOther: jobOther.length,
    jobOk,
    jobDetail: jobDetail.length,
  });

  const save = async () => {
    if (!canProceed || !accessToken) return;
    Keyboard.dismiss(); 
    setSaving(true);
    try {

      const finalRelSub = relSub === "기타" ? relSubOther.trim() : relSub;
      const finalJob = job === "기타" ? jobOther.trim() : job;
      await patchCloneL2(accessToken, cloneId, {
        relation_category: relCat,
        relation_subtype: finalRelSub,
        relation_episode: relEpisode.trim(),
        address_form: addressForm.trim(),
        speech_form: speech,
        job_category: finalJob,
        job_detail: jobDetail.trim(),
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
    <Modal visible={visible} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.white }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={[s.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <TouchableOpacity onPress={onCancel} style={s.headerBtn}>
            <Text style={s.headerBtnText}>취소</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{name}님과 대화 준비</Text>
          <View style={s.headerBtn} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[s.content, { paddingBottom: kbVisible ? 360 : 24 }]}
          keyboardShouldPersistTaps="handled"
        >
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
                {relSub === "기타" ? (
                  <TextInput
                    value={relSubOther}
                    onChangeText={setRelSubOther}
                    placeholder="예: 스승님, 이웃, 은인"
                    placeholderTextColor={COLORS.zinc400}
                    style={s.textInputShort}
                    onFocus={(e) => scrollInputIntoView(findNodeHandle(e.target as unknown as number))}
                  />
                ) : null}

                {}
                <Text style={s.subLabel}>{`${name}님과 어떤 사이였는지 간단한 일화를 적어주세요.`}</Text>
                <TextInput
                  value={relEpisode}
                  onChangeText={setRelEpisode}
                  placeholder="예: 매주 주말마다 등산 다니던 친구, 힘든 시기에 같이 야근한 사수"
                  placeholderTextColor={COLORS.zinc400}
                  multiline
                  style={s.textInput}
                  onFocus={(e) => scrollInputIntoView(findNodeHandle(e.target as unknown as number))}
                />

                <Text style={s.subLabel}>{`${name}님이 당신을 어떻게 불렀나요?`}</Text>
                <TextInput
                  value={addressForm}
                  onChangeText={setAddressForm}
                  placeholder="예: 은지야, 아들, 야, 지호 씨"
                  placeholderTextColor={COLORS.zinc400}
                  style={s.textInputShort}
                  onFocus={(e) => scrollInputIntoView(findNodeHandle(e.target as unknown as number))}
                />
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
            {job === "기타" ? (
              <TextInput
                value={jobOther}
                onChangeText={setJobOther}
                placeholder="예: 우주비행사, 통번역가, 프리랜서 작가"
                placeholderTextColor={COLORS.zinc400}
                style={s.textInputShort}
                onFocus={(e) => scrollInputIntoView(findNodeHandle(e.target as unknown as number))}
              />
            ) : null}
            <Text style={s.subLabel}>{`${name}님이 정확하게 어떤 일을 했는지 적어주세요.`}</Text>
            <TextInput
              value={jobDetail}
              onChangeText={setJobDetail}
              placeholder="예: 응급의학과 의사, 초등학교 담임선생님, 게임 백엔드 개발자"
              placeholderTextColor={COLORS.zinc400}
              multiline
              style={s.textInput}
              onFocus={(e) => scrollInputIntoView(findNodeHandle(e.target as unknown as number))}
            />
          </Section>
        </ScrollView>

        {}
        <View style={[s.footer, { paddingBottom: 0 }]}>
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
                    setTimeout(onCall, 250);
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

  content: { padding: 20, paddingBottom: 24, gap: 32 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: COLORS.zinc900, marginBottom: 4 },
  subLabel: { fontSize: 13, color: COLORS.zinc600, marginTop: 12, marginBottom: 4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    padding: 14,
    fontSize: 14,
    color: COLORS.zinc900,
    minHeight: 96,
    textAlignVertical: "top",
    marginTop: 4,
  },
  textInputShort: {
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.zinc900,
    marginTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
    paddingHorizontal: 20,
    paddingTop: 12,

  },
  saveBtn: {
    backgroundColor: COLORS.violet700,
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: COLORS.zinc300 },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
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
