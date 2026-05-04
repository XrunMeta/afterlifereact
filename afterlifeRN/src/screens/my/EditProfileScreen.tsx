import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import InterestChip from "../../components/ui/InterestChip";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import {
  getMe,
  patchMe,
  patchInterests,
  deleteMe,
  AuthApiError,
  type PatchMePayload,
} from "../../api/auth";
import { ALL_INTERESTS } from "../../mocks/interestHelpers";

type Gender = "male" | "female" | "other";

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const patchApiUser = useAuthStore((s) => s.patchApiUser);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(apiUser?.name ?? "");
  const [phone, setPhone] = useState(apiUser?.phone ?? "");
  const [gender, setGender] = useState<Gender | null>((apiUser?.gender as Gender) ?? null);
  const [ageStr, setAgeStr] = useState(apiUser?.age != null ? String(apiUser.age) : "");

  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestsModalVisible, setInterestsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOptionsVisible, setDeleteOptionsVisible] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe(accessToken);
        if (cancelled) return;
        const initial = me.interests ?? [];
        setOriginalInterests(initial);
        setSelectedInterests(initial);
      } catch (err) {
        console.warn("[EditProfile] getMe failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const interestsDirty = useMemo(() => {
    if (selectedInterests.length !== originalInterests.length) return true;
    const orig = new Set(originalInterests);
    return selectedInterests.some((it) => !orig.has(it));
  }, [selectedInterests, originalInterests]);

  const dirty = useMemo(() => {
    const ageNum = ageStr.trim() === "" ? null : Number(ageStr.trim());
    return (
      name.trim() !== (apiUser?.name ?? "") ||
      phone.trim() !== (apiUser?.phone ?? "") ||
      gender !== (apiUser?.gender ?? null) ||
      ageNum !== (apiUser?.age ?? null) ||
      interestsDirty
    );
  }, [name, phone, gender, ageStr, apiUser, interestsDirty]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleSave = async () => {
    if (!accessToken || !apiUser || saving || !dirty) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const ageRaw = ageStr.trim();
    const ageNum = ageRaw === "" ? null : Number(ageRaw);

    if (trimmedName.length === 0) {
      Alert.alert("알림", "이름은 비워둘 수 없습니다.");
      return;
    }
    if (ageRaw !== "" && (!Number.isInteger(ageNum) || ageNum! < 13 || ageNum! > 120)) {
      Alert.alert("알림", "나이는 13~120 사이의 숫자여야 합니다.");
      return;
    }
    if (trimmedPhone !== "" && trimmedPhone.length < 4) {
      Alert.alert("알림", "전화번호는 4자 이상 입력하거나 비워두세요.");
      return;
    }

    const patch: PatchMePayload = {};
    if (trimmedName !== (apiUser.name ?? "")) patch.name = trimmedName;
    if (trimmedPhone !== (apiUser.phone ?? "")) patch.phone = trimmedPhone || null;
    if (gender !== (apiUser.gender ?? null)) patch.gender = gender;
    if (ageNum !== (apiUser.age ?? null)) patch.age = ageNum;

    setSaving(true);
    try {
      const calls: Array<Promise<unknown>> = [];
      if (Object.keys(patch).length > 0) {
        calls.push(patchMe(accessToken, patch));
      }
      if (interestsDirty) {
        const origSet = new Set(originalInterests);
        const newSet = new Set(selectedInterests);
        const add = selectedInterests.filter((it) => !origSet.has(it));
        const remove = originalInterests.filter((it) => !newSet.has(it));
        calls.push(patchInterests(accessToken, { add, remove }));
      }
      await Promise.all(calls);
      console.log("[EditProfile] saved", { patch, interestsDirty });

      if (Object.keys(patch).length > 0) patchApiUser(patch);
      if (interestsDirty) setOriginalInterests(selectedInterests);

      Alert.alert("저장됨", "프로필이 저장되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.warn("[EditProfile] save failed:", err);
      let msg = "저장 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) {
        msg = err.message;

        if (err.code === "VALIDATION_FAILED" && Array.isArray(err.details)) {
          const issues = err.details as Array<{ path?: unknown[]; message?: string }>;
          const first = issues[0];
          const fieldPath = Array.isArray(first?.path) ? first.path.join(".") : "";
          if (fieldPath) msg = `${msg}\n(필드: ${fieldPath} — ${first?.message ?? ""})`;
        }
      }
      Alert.alert("저장 실패", msg);
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async (withXrun: boolean) => {
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요합니다.");
      return;
    }
    setDeleting(true);
    try {
      const res = await deleteMe(accessToken, { withXrun });
      console.log("[EditProfile] deleteMe ok:", res);
      if (withXrun && res.xrunClose && !res.xrunClose.closed) {

        console.warn("[EditProfile] xrun close failed:", res.xrunClose.reason);
      }
      await logout();
    } catch (err) {
      console.warn("[EditProfile] deleteMe failed:", err);
      let msg = "탈퇴 처리 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) msg = err.message;
      Alert.alert("탈퇴 실패", msg);
      setDeleting(false);
    }
  };

  const handleDeleteAfterlifeOnly = () => {
    if (deleting) return;
    setDeleteOptionsVisible(false);
    Alert.alert(
      "에프터라이프 계정 탈퇴",
      "에프터라이프 계정만 영구 삭제됩니다.\nxrun 회원 정보와 지갑은 그대로 유지됩니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "탈퇴", style: "destructive", onPress: () => performDelete(false) },
      ],
    );
  };

  const handleDeleteWithXrun = () => {
    if (deleting) return;
    setDeleteOptionsVisible(false);
    Alert.alert(
      "에프터라이프 + xrun 함께 탈퇴",
      "에프터라이프와 xrun 계정이 모두 영구 삭제됩니다.\nxrun 지갑·결제 비밀번호 등 모든 데이터가 사라집니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "모두 탈퇴", style: "destructive", onPress: () => performDelete(true) },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.editProfile.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.card}>
          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.name")}</Text>
            <TextInput
              style={s.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              maxLength={30}
            />
          </View>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.phone")}</Text>
            <TextInput
              style={s.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.gender")}</Text>
            <View style={s.genderChips}>
              {GENDER_OPTIONS.map((opt) => {
                const selected = gender === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.chip, selected && s.chipSelected]}
                    onPress={() => setGender(selected ? null : opt.value)}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.divider} />

          {}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={s.fieldInput}
              value={ageStr}
              onChangeText={(v) => setAgeStr(v.replace(/[^\d]/g, ""))}
              placeholder="—"
              placeholderTextColor={COLORS.zinc400}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={s.divider} />

          {}
          <TouchableOpacity
            style={s.fieldRow}
            onPress={() => setInterestsModalVisible(true)}
          >
            <Text style={s.fieldLabel}>{t("settings.editProfile.fields.interests")}</Text>
            <Text
              style={[s.fieldValue, selectedInterests.length > 0 && s.fieldValueFilled]}
              numberOfLines={1}
            >
              {selectedInterests.length > 0 ? selectedInterests.join(", ") : "—"}
            </Text>
            <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, (!dirty || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={s.saveBtnText}>저장</Text>
          )}
        </TouchableOpacity>

        {}
        <TouchableOpacity
          style={s.deleteTriggerBtn}
          onPress={() => setDeleteOptionsVisible(true)}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={COLORS.error} />
          ) : (
            <Text style={s.deleteTriggerText}>회원 탈퇴</Text>
          )}
        </TouchableOpacity>
      </View>

      {}
      <Modal
        visible={interestsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInterestsModalVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setInterestsModalVisible(false)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>관심사 선택</Text>
              <TouchableOpacity onPress={() => setInterestsModalVisible(false)}>
                <Feather name="x" size={24} color={COLORS.zinc700} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSubtitle}>
              관심 있는 항목을 자유롭게 선택하세요 ({selectedInterests.length}개 선택됨)
            </Text>
            <ScrollView contentContainerStyle={s.chipGrid}>
              {ALL_INTERESTS.map((interest) => (
                <InterestChip
                  key={interest}
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onPress={() => toggleInterest(interest)}
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              style={s.modalDoneBtn}
              onPress={() => setInterestsModalVisible(false)}
            >
              <Text style={s.modalDoneBtnText}>완료</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal
        visible={deleteOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteOptionsVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setDeleteOptionsVisible(false)}>
          <Pressable style={s.deleteSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.deleteSheetTitle}>회원 탈퇴</Text>
            <Text style={s.deleteSheetSubtitle}>
              어느 범위로 탈퇴하시겠어요?
            </Text>

            <TouchableOpacity
              style={s.deleteOnlyBtn}
              onPress={handleDeleteAfterlifeOnly}
              disabled={deleting}
            >
              <Text style={s.deleteOnlyBtnText}>에프터라이프 계정 탈퇴</Text>
              <Text style={s.deleteOptionHint}>xrun 회원·지갑은 유지</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteAllBtn}
              onPress={handleDeleteWithXrun}
              disabled={deleting}
            >
              <Text style={s.deleteAllBtnText}>xrun도 함께 탈퇴</Text>
              <Text style={s.deleteAllHint}>지갑·결제 비밀번호도 모두 삭제</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteCancelBtn}
              onPress={() => setDeleteOptionsVisible(false)}
              disabled={deleting}
            >
              <Text style={s.deleteCancelText}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    minHeight: 56,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc900,
    textAlign: "right",
    padding: 0,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.zinc400,
    textAlign: "right",
  },
  fieldValueFilled: {
    color: COLORS.zinc900,
  },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },
  genderChips: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full ?? 999,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    backgroundColor: COLORS.zinc900,
    borderColor: COLORS.zinc900,
  },
  chipText: { fontSize: 13, color: COLORS.zinc600, fontWeight: "500" },
  chipTextSelected: { color: COLORS.white },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.zinc300,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },

  deleteTriggerBtn: {
    marginTop: 32,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.error,
    textDecorationLine: "underline",
  },

  deleteSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  deleteSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
    marginTop: 8,
  },
  deleteSheetSubtitle: {
    fontSize: 13,
    color: COLORS.zinc500,
    textAlign: "center",
    marginBottom: 8,
  },
  deleteOnlyBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    alignItems: "center",
  },
  deleteOnlyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  deleteOptionHint: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginTop: 2,
  },
  deleteAllBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    alignItems: "center",
  },
  deleteAllBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  deleteAllHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  deleteCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  deleteCancelText: {
    fontSize: 14,
    color: COLORS.zinc500,
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.zinc300,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.zinc500,
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  modalDoneBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  modalDoneBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});
