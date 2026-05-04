

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
  getInvitePreview,
  type InvitePreview,
} from "../../api/clones";
import { AuthApiError } from "../../api/auth";

type Route = RouteProp<RootStackParamList, "InviteAccept">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InviteAcceptScreen() {
  const navigation = useNavigation<Nav>();
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
        let msg = "초대 정보를 불러올 수 없습니다.";
        if (err instanceof AuthApiError) {
          if (err.code === "NOT_FOUND") msg = "유효하지 않은 초대 링크입니다.";
          else if (err.code === "CONFLICT") {
            const m = err.message;
            if (/expired/i.test(m)) msg = "초대가 만료됐어요.";
            else if (/cancelled/i.test(m)) msg = "초대가 취소됐어요.";
            else if (/used/i.test(m)) msg = "이미 수락한 초대예요.";
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
      Alert.alert("로그인 필요", "초대를 수락하려면 먼저 로그인해주세요.");
      return;
    }
    setAccepting(true);
    try {
      const res = await acceptInvite(accessToken, token);
      console.log("[InviteAccept] success:", res);
      Alert.alert("수락 완료", `"${preview.clone.name}" 페르소나에 합류했어요.`, [
        {
          text: "확인",
          onPress: () => {

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
          },
        },
      ]);
    } catch (err) {
      let msg = "수락 처리 중 오류가 발생했습니다.";
      if (err instanceof AuthApiError) {
        if (err.code === "CONFLICT") msg = err.message;
        else msg = err.message;
      }
      Alert.alert("수락 실패", msg);
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert("초대 거절", "초대를 거절하면 이 페르소나에 들어갈 수 없어요.", [
      { text: "닫기", style: "cancel" },
      {
        text: "거절",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <PageHeader
        title="공동관리자 초대"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <View style={s.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.zinc500} style={{ marginTop: 64 }} />
        ) : error ? (
          <View style={s.errorBox}>
            <Feather name="alert-triangle" size={48} color={COLORS.error} />
            <Text style={s.errorTitle}>초대를 사용할 수 없어요</Text>
            <Text style={s.errorDesc}>{error}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={s.closeBtnText}>닫기</Text>
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
              <Text style={{ fontWeight: "600" }}>{preview.clone.name}</Text>의{" "}
              <Text style={{ fontWeight: "600" }}>공동관리자</Text>로 초대됐어요.
              {"\n"}수락하면 함께 관리하고 채팅할 수 있어요.
            </Text>
            <Text style={s.expires}>
              {formatExpires(preview.expiresAt)}
            </Text>

            {!isLoggedIn && (
              <Text style={s.loginHint}>로그인이 필요해요.</Text>
            )}

            <View style={s.actions}>
              <Button
                title={accepting ? "처리 중..." : "초대 수락"}
                onPress={handleAccept}
                disabled={accepting || !isLoggedIn}
                variant="accent"
              />
              <Button
                title="거절"
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

function formatExpires(expiresAt: string): string {
  try {
    const exp = new Date(expiresAt.replace(" ", "T") + "Z").getTime();
    const ms = exp - Date.now();
    if (ms <= 0) return "만료됨";
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}일 ${hours}시간 후 만료돼요`;
    return `${hours}시간 후 만료돼요`;
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
