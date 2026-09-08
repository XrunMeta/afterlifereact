

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
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
import {
  patchClone,
  listMyClones,
  getVoices,
  type CatalogVoice,
} from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import { adaptMyClone } from "../../lib/adaptMyClone";
import { TID } from "../../testIDs";
import type { DomainClone as Clone } from "../../types/domain";
import { COLORS, SIZES } from "../../components/constants";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

export default function CloneEditScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const updateLocalClone = useCloneStore((s) => s.updateLocalClone);
  const upsertClones = useCloneStore((s) => s.upsertClones);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  const [hydrating, setHydrating] = useState(false);

  const [voicePresetId, setVoicePresetId] = useState<number | null>(null);
  const [voices, setVoices] = useState<CatalogVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const previewPlayerRef = useRef<AudioPlayer | null>(null);

  const hydrateAttempted = useRef(false);
  useEffect(() => {
    if (clone || hydrateAttempted.current) return;
    hydrateAttempted.current = true;
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return; 
    setHydrating(true);
    listMyClones(accessToken)
      .then((res) => upsertClones(res.items.map(adaptMyClone)))
      .catch((err) => {
        console.warn("[CloneEdit] hydrate failed:", err);
      })
      .finally(() => setHydrating(false));
  }, [clone, upsertClones]);

  useEffect(() => {
    if (!clone) return;
    setName(clone.displayName);

    setDescription((clone.description ?? "").slice(0, 500));
    setVisibility((clone.visibility as Visibility) ?? "public");
    setVoicePresetId(clone.voicePresetId ?? null);
  }, [clone]);

  useEffect(() => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;
    setVoicesLoading(true);
    getVoices(accessToken)
      .then(setVoices)
      .catch((err) => console.warn("[CloneEdit] getVoices failed:", err))
      .finally(() => setVoicesLoading(false));
    return () => {
      previewPlayerRef.current?.remove();
    };
  }, []);

  const togglePreview = (v: CatalogVoice) => {

    previewPlayerRef.current?.remove();
    previewPlayerRef.current = null;
    if (previewingId === v.id) {
      setPreviewingId(null);
      return;
    }
    if (!v.sampleUrl) return;
    try {
      const player = createAudioPlayer(v.sampleUrl);
      previewPlayerRef.current = player;
      setPreviewingId(v.id);
      player.play();
    } catch (err) {
      console.warn("[CloneEdit] preview failed:", err);
    }
  };

  if (!clone) {
    return (
      <View style={s.notFound}>
        {hydrating ? (
          <ActivityIndicator testID={TID.cloneEdit.loading} color={COLORS.zinc400} />
        ) : (
          <Text testID={TID.cloneEdit.notFound} style={s.notFoundText}>
            {t("edit.notFound")}
          </Text>
        )}
      </View>
    );
  }

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const accessToken = useAuthStore.getState().accessToken;

    try {
      if (accessToken) {

        const payload: {
          name: string;
          description: string;
          visibility: Visibility;
          voice_preset_id?: number | null;
        } = { name, description, visibility };
        if (voicePresetId !== (clone.voicePresetId ?? null)) {
          payload.voice_preset_id = voicePresetId;
        }
        await patchClone(accessToken, clone.id, payload);
      }
      updateLocalClone(clone.id, {
        displayName: name,
        description,
        visibility,
        voicePresetId,
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
          testID={TID.cloneEdit.nameInput}
          label={t("edit.nameLabel")}
          value={name}
          onChangeText={setName}
          placeholder={t("edit.namePlaceholder")}
        />

        {}
        <TextField
          testID={TID.cloneEdit.descInput}
          label={t("edit.descLabel")}
          value={description}
          onChangeText={(v) => setDescription(v.slice(0, 500))}
          placeholder={t("edit.descPlaceholder")}
          multiline
          maxLength={500}
          containerStyle={{ marginTop: 16 }}
        />
        <Text testID={TID.cloneEdit.descCounter} style={s.descCounter}>
          {description.length}/500
        </Text>

        {}
        <View style={s.voiceSection}>
          <Text style={s.sectionLabel}>{t("edit.voiceLabel", { defaultValue: "목소리" })}</Text>

          {}
          <View style={s.currentVoiceCard}>
            <Text style={s.currentVoiceLabel}>현재 목소리</Text>
            <Text style={s.currentVoiceValue}>
              {voicePresetId == null
                ? "🎙 직접 녹음한 목소리 (페르소나 생성 시 설정)"
                : voices.find((v) => v.id === voicePresetId)?.name
                  ? `🎵 ${voices.find((v) => v.id === voicePresetId)!.name}`
                  : "🎵 카탈로그 목소리"}
            </Text>
            <Text style={s.currentVoiceHint}>
              아래 목록에서 다른 목소리를 선택하면 통화 시 그 목소리로 재생됩니다.
            </Text>
          </View>

          {voicesLoading ? (
            <ActivityIndicator color={COLORS.zinc400} style={{ marginTop: 12 }} />
          ) : voices.length === 0 ? (
            <Text style={s.emptyVoice}>{t("edit.voiceEmpty", { defaultValue: "등록된 목소리가 없습니다." })}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.voiceRow}
            >
              {voices.map((v) => {
                const isSelected = v.id === voicePresetId;
                const isPlaying = v.id === previewingId;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[s.voiceCard, isSelected && s.voiceCardSelected]}
                    onPress={() => setVoicePresetId(v.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.voiceName, isSelected && s.voiceNameSelected]}>
                      {v.name}
                    </Text>
                    {(v.gender || v.ageRange) && (
                      <Text style={s.voiceMeta}>
                        {[v.gender, v.ageRange].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={s.previewBtn}
                      onPress={() => togglePreview(v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={s.previewBtnText}>{isPlaying ? "■ 정지" : "▶ 미리듣기"}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {
}
      </View>

      {}
      <View style={[s.bottomBar, { paddingBottom: 16 + Math.max(insets.bottom, 0) }]}>
        <Button
          testID={TID.cloneEdit.save}
          title={saving ? t("common.loading") : t("edit.save")}
          variant="primary"
          onPress={handleSave}
          disabled={!name || saving}
          style={s.saveBtn}
        />
      </View>
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

  descCounter: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    color: COLORS.zinc400,
  },
  bottomBar: {
    paddingHorizontal: SIZES.large,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc500,
    backgroundColor: COLORS.white,
  },
  saveBtn: { width: "500%" },

  voiceSection: {
    marginTop: 24,
  },
  currentVoiceCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.zinc100,
    marginBottom: 12,
  },
  currentVoiceLabel: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginBottom: 4,
  },
  currentVoiceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  currentVoiceHint: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginTop: 6,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc700,
    marginBottom: 10,
  },
  emptyVoice: {
    fontSize: 13,
    color: COLORS.zinc400,
    paddingVertical: 12,
  },
  voiceRow: {
    gap: 10,
    paddingRight: SIZES.large,
  },
  voiceCard: {
    width: 130,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    backgroundColor: COLORS.white,
  },
  voiceCardSelected: {
    borderColor: COLORS.violet500,
    borderWidth: 2,
    backgroundColor: "#f5f3ff",
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.zinc900,
  },
  voiceNameSelected: {
    color: COLORS.violet500,
  },
  voiceMeta: {
    fontSize: 11,
    color: COLORS.zinc500,
    marginTop: 4,
  },
  previewBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.zinc100,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  previewBtnText: {
    fontSize: 11,
    color: COLORS.zinc700,
  },
});
