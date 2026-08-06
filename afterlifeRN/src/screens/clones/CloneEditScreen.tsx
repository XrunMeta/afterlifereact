

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import type { DomainClone as Clone } from "../../types/domain";
import { COLORS, SIZES } from "../../components/constants";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

export default function CloneEditScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const updateLocalClone = useCloneStore((s) => s.updateLocalClone);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clone) return;
    setName(clone.displayName);

    setDescription((clone.description ?? "").slice(0, 100));
    setVisibility((clone.visibility as Visibility) ?? "public");
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
    const accessToken = useAuthStore.getState().accessToken;

    try {
      if (accessToken) {

        await patchClone(accessToken, clone.id, {
          name,
          description,
          visibility,
        });
      }
      updateLocalClone(clone.id, {
        displayName: name,
        description,
        visibility,
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
          onChangeText={(v) => setDescription(v.slice(0, 100))}
          placeholder={t("edit.descPlaceholder")}
          multiline
          maxLength={100}
          containerStyle={{ marginTop: 16 }}
        />
        <Text style={s.descCounter}>{description.length}/100</Text>

        {
}
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
    borderTopColor: COLORS.zinc100,
    backgroundColor: COLORS.white,
  },
  saveBtn: { width: "100%" },
});
