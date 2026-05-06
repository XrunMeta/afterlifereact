

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import {
  acceptInvite,
  declineInvite,
  getInvitePreview,
  type InvitePreview,
} from "../../api/clones";
import { AuthApiError } from "../../api/auth";

type Route = RouteProp<RootStackParamList, "InviteAccept">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InviteAcceptScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { params } = useRoute<Route>();
  const token = params.token;
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getInvitePreview(token);
        if (cancelled) return;
        setPreview(res);
      } catch (err) {
        if (cancelled) return;
        let msg = t("inviteAccept.acceptFailed");
        if (err instanceof AuthApiError) {
          if (err.code === "NOT_FOUND") msg = t("inviteAccept.errorTitle");
          else if (err.code === "CONFLICT") {
            const m = err.message;
            if (/expired/i.test(m)) msg = t("inviteAccept.expired");
            else if (/cancelled/i.test(m)) msg = t("inviteAccept.alreadyCancelled");
            else if (/used/i.test(m)) msg = t("inviteAccept.alreadyUsed");
            else msg = err.message;
          } else {
            msg = err.message;
          }
        }
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!accessToken || !preview) {
      Alert.alert(t("common.notice"), t("inviteAccept.loginRequired"));
      return;
    }
    setAccepting(true);
    try {
      const res = await acceptInvite(accessToken, token);
      console.log("[InviteAccept] success:", res);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "Main",
              state: {
                routes: [
                  {
                    name: "ClonesTab",
                    state: {
                      routes: [
                        { name: "Dashboard" },
                        { name: "CloneDetail", params: { cloneId: res.cloneId } },
                      ],
                      index: 1,
                    },
                  },
                ],
              },
            },
          ],
        }),
      );
    } catch (err) {
      let msg = t("inviteAccept.acceptFailed");
      if (err instanceof AuthApiError) {
        msg = err.message;
      }
      Alert.alert(t("common.error"), msg);
      setAccepting(false);
    }
  };

  const handleDecline = async () => {

    if (!accessToken) {
      navigation.goBack();
      return;
    }
    try {
      const res = await declineInvite(accessToken, token);
      console.log("[InviteAccept] decline:", res);
      navigation.goBack();
    } catch (err) {
      console.warn("[InviteAccept] decline failed:", err);
      const msg = err instanceof AuthApiError ? err.message : t("inviteAccept.acceptFailed");
      Alert.alert(t("common.error"), msg);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title={t("inviteAccept.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={s.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.zinc500} style={{ marginTop: 64 }} />
        ) : error ? (
          <View style={s.errorBox}>
            <Feather name="alert-triangle" size={48} color={COLORS.error} />
            <Text style={s.errorTitle}>{t("inviteAccept.errorTitle")}</Text>
            <Text style={s.errorDesc}>{error}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={s.closeBtnText}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
        ) : preview ? (
          <View style={s.card}>
            <View style={s.previewHeader}>
              {preview.clone.avatarUrl ? (
                <Image source={{ uri: preview.clone.avatarUrl }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarPlaceholder]}>
                  <Feather name="user" size={32} color={COLORS.zinc400} />
                </View>
              )}
              <Text style={s.cloneName}>{preview.clone.name}</Text>
              <Text style={s.cloneUsername}>@{preview.clone.username}</Text>
            </View>
            <View style={s.divider} />
            <Text style={s.body}>
              {t("inviteAccept.body", { name: preview.clone.name })}
            </Text>
            <Text style={s.expires}>
              {formatExpires(preview.expiresAt, t)}
            </Text>

            {!isLoggedIn && (
              <Text style={s.loginHint}>{t("inviteAccept.loginRequired")}</Text>
            )}

            <View style={s.actions}>
              <Button
                title={accepting ? t("common.loading") : t("inviteAccept.accept")}
                onPress={handleAccept}
                disabled={accepting || !isLoggedIn}
                variant="accent"
              />
              <Button
                title={t("inviteAccept.decline")}
                onPress={handleDecline}
                disabled={accepting}
                variant="ghost"
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeView>
  );
}

function formatExpires(
  expiresAt: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  try {
    const exp = new Date(expiresAt.replace(" ", "T") + "Z").getTime();
    const ms = exp - Date.now();
    if (ms <= 0) return t("invite.expired");
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return t("invite.expiresInDays", { days, hours });
    return t("invite.expiresInHours", { hours });
  } catch {
    return "";
  }
}

const s = StyleSheet.create({
  content: { flex: 1, padding: SIZES.large },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SIZES.large,
    gap: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  previewHeader: { alignItems: "center", gap: 8, paddingTop: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  cloneName: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  cloneUsername: { fontSize: 13, color: COLORS.zinc500 },
  divider: { height: 1, backgroundColor: COLORS.zinc100 },
  body: { fontSize: 14, color: COLORS.zinc700, lineHeight: 22, textAlign: "center" },
  expires: { fontSize: 12, color: COLORS.zinc500, textAlign: "center" },
  loginHint: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: "center",
    marginTop: 4,
  },
  actions: { gap: 8, marginTop: 8 },

  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errorTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900, marginTop: 8 },
  errorDesc: { fontSize: 13, color: COLORS.zinc500, textAlign: "center" },
  closeBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc900,
  },
  closeBtnText: { fontSize: 14, color: COLORS.white, fontWeight: "600" },
});
