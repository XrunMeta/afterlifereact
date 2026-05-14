

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClonesStackParamList } from "../../navigation/types";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { patchClone } from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import type { L1Profile, DomainClone as Clone } from "../../types/domain";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

const SECTIONS = [
  { key: "firstMeeting", label: "첫 만남" },
  { key: "habit", label: "습관/말투" },
  { key: "personality", label: "성격" },
  { key: "memory", label: "가장 선명한 추억" },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

function parsePersonaNotes(notes: string): Record<SectionKey, string> {
  const out: Record<SectionKey, string> = {
    firstMeeting: "",
    habit: "",
    personality: "",
    memory: "",
  };
  if (!notes) return out;

  const labelToKey = new Map<string, SectionKey>();
  for (const s of SECTIONS) labelToKey.set(s.label, s.key);

  const lines = notes.split("\n");
  let currentKey: SectionKey | null = null;
  const buffer: Record<SectionKey, string[]> = {
    firstMeeting: [],
    habit: [],
    personality: [],
    memory: [],
  };
  for (const line of lines) {
    const m = line.match(/^\[(.+)\]\s*$/);
    if (m) {
      const key = labelToKey.get(m[1]!);
      currentKey = key ?? null;
      continue;
    }
    if (currentKey) buffer[currentKey].push(line);
  }
  for (const s of SECTIONS) {
    out[s.key] = buffer[s.key].join("\n").trim();
  }
  return out;
}

function buildPersonaNotes(values: Record<SectionKey, string>): string {
  const parts: string[] = [];
  for (const s of SECTIONS) {
    const v = values[s.key].trim();
    if (v) parts.push(`[${s.label}]\n${v}`);
  }
  return parts.join("\n\n");
}

export default function CloneEditScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const updateLocalClone = useCloneStore((s) => s.updateLocalClone);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [firstMeeting, setFirstMeeting] = useState("");
  const [habit, setHabit] = useState("");
  const [personality, setPersonality] = useState("");
  const [memory, setMemory] = useState("");

  const [l1Attrs, setL1Attrs] = useState<Record<string, string>>({});

  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clone) return;
    setName(clone.displayName);
    setDescription(clone.description ?? "");
    setVisibility((clone.visibility as Visibility) ?? "public");
    const parsed = parsePersonaNotes(clone.l1Profile?.notes ?? "");
    setFirstMeeting(parsed.firstMeeting);
    setHabit(parsed.habit);
    setPersonality(parsed.personality);
    setMemory(parsed.memory);
    setL1Attrs(clone.l1Profile?.attrs ?? {});
  }, [clone]);

  if (!clone) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>{t("edit.notFound")}</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const notes = buildPersonaNotes({ firstMeeting, habit, personality, memory });
    const l1Payload: L1Profile = { attrs: l1Attrs, notes };
    const accessToken = useAuthStore.getState().accessToken;

    try {
      if (accessToken) {
        await patchClone(accessToken, clone.id, {
          name,
          description,
          visibility,
          l1_profile: l1Payload,
        });
      }
      updateLocalClone(clone.id, {
        displayName: name,
        description,
        visibility,
        l1Profile: l1Payload,
      } as Partial<Clone>);
      navigation.goBack();
    } catch (err) {
      console.warn("[CloneEdit] save failed:", err);
      const msg = err instanceof AuthApiError ? err.message : t("edit.saveFailed");
      showAlert(t("common.error"), msg);
    } finally {
      setSaving(false);
    }
  };

  void setVisibility;

  return (
    <SafeScrollView
      backgroundColor={COLORS.white}
      autoAdjustKeyboardPadding
      additionalBottomPadding={80}
      showBottomBackground={false}
    >
      {}
      <PageHeader
        title={t("edit.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {}
        <TextField
          label={t("edit.nameLabel")}
          value={name}
          onChangeText={setName}
          placeholder={t("edit.namePlaceholder")}
        />

        {}
        <TextField
          label={t("edit.descLabel")}
          value={description}
          onChangeText={setDescription}
          placeholder={t("edit.descPlaceholder")}
          multiline
          containerStyle={{ marginTop: 16 }}
        />

        {}
        <Text style={s.sectionHeader}>페르소나 설명</Text>
        <TextField
          label="첫 만남"
          value={firstMeeting}
          onChangeText={setFirstMeeting}
          placeholder="처음 만났을 때의 장면, 인상, 분위기..."
          multiline
          containerStyle={{ marginTop: 8 }}
        />
        <TextField
          label="습관/말투"
          value={habit}
          onChangeText={setHabit}
          placeholder="자주 하던 말, 작은 습관, 좋아하던 자리..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
        <TextField
          label="성격"
          value={personality}
          onChangeText={setPersonality}
          placeholder="MBTI, 성격, 평소 분위기..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
        <TextField
          label="가장 선명한 추억"
          value={memory}
          onChangeText={setMemory}
          placeholder="가장 행복하게 웃고 있던 그 순간..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
      </View>

      {}
      <View style={[s.bottomBar, { paddingBottom: 16 + Math.max(insets.bottom, 0) }]}>
        <Button
          title={saving ? t("common.loading") : t("edit.save")}
          variant="primary"
          onPress={handleSave}
          disabled={!name || saving}
          style={s.saveBtn}
        />
      </View>

      {}
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 15, color: COLORS.zinc500 },
  content: {
    paddingHorizontal: SIZES.large,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  bottomBar: {
    paddingHorizontal: SIZES.large,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
    backgroundColor: COLORS.white,
  },
  saveBtn: { width: "100%" },
  dropdown: {
    position: "absolute",
    right: 12,
    top: 56,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    paddingVertical: 4,
    zIndex: 50,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: { fontSize: 14, color: COLORS.zinc900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  modalDesc: { fontSize: 13, color: COLORS.zinc500, marginBottom: 16 },
  visibilityOptions: { gap: 8 },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  visibilityOptionSelected: {
    borderColor: COLORS.violet600,
    backgroundColor: COLORS.violet600,
  },
  visibilityOptionText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
});
