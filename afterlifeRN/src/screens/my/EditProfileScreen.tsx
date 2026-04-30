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

  const [name, setName] = useState(apiUser?.name ?? "");
  const [phone, setPhone] = useState(apiUser?.phone ?? "");
  const [gender, setGender] = useState<Gender | null>((apiUser?.gender as Gender) ?? null);
  const [ageStr, setAgeStr] = useState(apiUser?.age != null ? String(apiUser.age) : "");

  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interestsModalVisible, setInterestsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (ageRaw !== "" && (!Number.isInteger(ageNum) || ageNum! < 0 || ageNum! > 150)) {
      Alert.alert("알림", "나이는 0~150 사이의 숫자여야 합니다.");
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
      if (err instanceof AuthApiError) msg = err.message;
      Alert.alert("저장 실패", msg);
    } finally {
      setSaving(false);
    }
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
