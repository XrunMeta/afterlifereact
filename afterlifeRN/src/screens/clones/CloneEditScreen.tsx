

import { showAlert } from "../../stores/dialogStore";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
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
import { patchClone, listMyClones } from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import { adaptMyClone } from "../../lib/adaptMyClone";
import { TID } from "../../testIDs";
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
  const upsertClones = useCloneStore((s) => s.upsertClones);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [visibility, setVisibility] = useState<Visibility>("public");
  const [saving, setSaving] = useState(false);

  const [hydrating, setHydrating] = useState(false);

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

    setDescription((clone.description ?? "").slice(0, 100));
    setVisibility((clone.visibility as Visibility) ?? "public");
  }, [clone]);

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
          onChangeText={(v) => setDescription(v.slice(0, 100))}
          placeholder={t("edit.descPlaceholder")}
          multiline
          maxLength={100}
          containerStyle={{ marginTop: 16 }}
        />
        <Text testID={TID.cloneEdit.descCounter} style={s.descCounter}>
          {description.length}/100
        </Text>

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
    borderTopColor: COLORS.zinc100,
    backgroundColor: COLORS.white,
  },
  saveBtn: { width: "100%" },
});
