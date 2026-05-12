import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import type { MyStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import {
  deleteMe,
  AuthApiError,
  requestPasswordReset,
  resetPassword,
} from "../../api/auth";

function countryLabel(code: string | null | undefined, t: ReturnType<typeof useTranslation>["t"]): string {
  if (!code) return "—";
  return t(`countries:${code}`, { defaultValue: code });
}

function regionLabel(
  country: string | null | undefined,
  region: string | null | undefined,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (!region) return "—";
  if (country) return t(`regions:${country}_${region}`, { defaultValue: region });
  return region;
}

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MyStackParamList>>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);
  const logout = useAuthStore((s) => s.logout);
  const [deleting, setDeleting] = useState(false);

  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [pwStep, setPwStep] = useState<"request" | "verify">("request");
  const [pwSending, setPwSending] = useState(false);
  const [pwVerifying, setPwVerifying] = useState(false);
  const [pwCode, setPwCode] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNewConfirm, setPwNewConfirm] = useState("");

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "정말 탈퇴하시겠어요?\n계정과 페르소나가 영구적으로 사라집니다.\n(90일 내 복구 가능)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            setDeleting(true);
            try {
              await deleteMe(accessToken, { withXrun: false });
              await logout();
            } catch (err) {
              const msg = err instanceof AuthApiError ? err.message : "탈퇴에 실패했어요.";
              Alert.alert("오류", msg);
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleSendOtp = async () => {
    if (!apiUser?.email) {
      Alert.alert("오류", "이메일 정보가 없어요.");
      return;
    }
    setPwSending(true);
    try {
      await requestPasswordReset(apiUser.email);
      setPwStep("verify");
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "OTP 발송에 실패했어요.";
      Alert.alert("오류", msg);
    } finally {
      setPwSending(false);
    }
  };

  const handleVerifyAndChange = async () => {
    if (!apiUser?.email) return;
    if (pwCode.trim().length < 4) {
      Alert.alert("오류", "인증번호를 확인해주세요.");
      return;
    }
    if (pwNew.length < 8) {
      Alert.alert("오류", "비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (pwNew !== pwNewConfirm) {
      Alert.alert("오류", "비밀번호 확인이 일치하지 않아요.");
      return;
    }
    setPwVerifying(true);
    try {
      await resetPassword({
        email: apiUser.email,
        verificationCode: pwCode.trim(),
        newPassword: pwNew,
      });

      setPwModalVisible(false);
      setPwStep("request");
      setPwCode("");
      setPwNew("");
      setPwNewConfirm("");
      Alert.alert("완료", "비밀번호가 변경됐어요.");
    } catch (err) {
      const msg = err instanceof AuthApiError ? err.message : "비밀번호 변경에 실패했어요.";
      Alert.alert("오류", msg);
    } finally {
      setPwVerifying(false);
    }
  };

  const closePwModal = () => {
    setPwModalVisible(false);
    setPwStep("request");
    setPwCode("");
    setPwNew("");
    setPwNewConfirm("");
  };
  const { t } = useTranslation();

  const items = [
    { key: "blockList", labelKey: "settings.privacy.blockList", icon: "slash" as const },
    { key: "dataDownload", labelKey: "settings.privacy.dataDownload", icon: "download" as const },
    { key: "deleteAccount", labelKey: "settings.privacy.deleteAccount", icon: "trash-2" as const, danger: true },
  ];

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title={t("settings.privacy.title")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={s.content}>
        {}
        <View style={s.card}>
          {}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>이메일</Text>
            <Text style={s.infoValue} numberOfLines={1}>
              {apiUser?.email ?? "—"}
            </Text>
          </View>
          <View style={s.divider} />

          {}
          <TouchableOpacity style={s.infoRow} onPress={() => setPwModalVisible(true)}>
            <Text style={s.infoLabel}>비밀번호</Text>
            <View style={s.infoRight}>
              <Text style={s.infoValueDim}>●●●●●●●●</Text>
              <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
            </View>
          </TouchableOpacity>
          <View style={s.divider} />

          {}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>국가</Text>
            <Text style={s.infoValue}>{countryLabel(apiUser?.country, t)}</Text>
          </View>
          <View style={s.divider} />

          {}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>지역</Text>
            <Text style={s.infoValue}>
              {regionLabel(apiUser?.country, apiUser?.region, t)}
            </Text>
          </View>
        </View>

        {}
        <View style={[s.card, { marginTop: 16 }]}>
          {items.map((item, i) => (
            <View key={item.key}>
              <TouchableOpacity
                style={s.row}
                disabled={deleting && item.key === "deleteAccount"}
                onPress={() => {
                  if (item.key === "blockList") navigation.navigate("BlockedList");
                  else if (item.key === "deleteAccount") handleDeleteAccount();
                }}
              >
                <Feather
                  name={item.icon}
                  size={20}
                  color={item.danger ? COLORS.error : COLORS.zinc700}
                  style={s.rowIcon}
                />
                <Text style={[s.rowLabel, item.danger && s.rowLabelDanger]}>
                  {t(item.labelKey)}
                </Text>
                {deleting && item.key === "deleteAccount" ? (
                  <ActivityIndicator color={COLORS.error} />
                ) : (
                  <Feather name="chevron-right" size={18} color={COLORS.zinc400} />
                )}
              </TouchableOpacity>
              {i < items.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>
      </View>

      {}
      <Modal visible={pwModalVisible} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={closePwModal}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>비밀번호 변경</Text>
              <TouchableOpacity onPress={closePwModal} hitSlop={8}>
                <Feather name="x" size={22} color={COLORS.zinc500} />
              </TouchableOpacity>
            </View>

            {pwStep === "request" ? (
              <>
                <Text style={s.modalDesc}>
                  가입하신 이메일{"\n"}
                  <Text style={s.modalEmail}>{apiUser?.email ?? "—"}</Text>{"\n"}
                  으로 인증번호를 보내드릴게요.
                </Text>
                <TouchableOpacity
                  style={[s.primaryBtn, pwSending && s.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={pwSending}
                >
                  {pwSending ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={s.primaryBtnText}>인증번호 받기</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.modalDesc}>
                  이메일로 받은 인증번호와 새 비밀번호를 입력해주세요.
                </Text>
                <Text style={s.fieldLabel}>인증번호</Text>
                <TextInput
                  style={s.input}
                  value={pwCode}
                  onChangeText={setPwCode}
                  keyboardType="number-pad"
                  placeholder="6자리"
                  placeholderTextColor={COLORS.zinc400}
                />
                <Text style={s.fieldLabel}>새 비밀번호</Text>
                <TextInput
                  style={s.input}
                  value={pwNew}
                  onChangeText={setPwNew}
                  secureTextEntry
                  placeholder="8자 이상"
                  placeholderTextColor={COLORS.zinc400}
                />
                <Text style={s.fieldLabel}>새 비밀번호 확인</Text>
                <TextInput
                  style={s.input}
                  value={pwNewConfirm}
                  onChangeText={setPwNewConfirm}
                  secureTextEntry
                  placeholder="다시 한 번 입력"
                  placeholderTextColor={COLORS.zinc400}
                />
                <TouchableOpacity
                  style={[s.primaryBtn, pwVerifying && s.btnDisabled]}
                  onPress={handleVerifyAndChange}
                  disabled={pwVerifying}
                >
                  {pwVerifying ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={s.primaryBtnText}>비밀번호 변경</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPwStep("request")}
                  style={s.linkBtn}
                  disabled={pwVerifying}
                >
                  <Text style={s.linkBtnText}>인증번호 다시 받기</Text>
                </TouchableOpacity>
              </>
            )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  rowIcon: { width: 24, textAlign: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.zinc900 },
  rowLabelDanger: { color: COLORS.error },
  divider: { height: 1, backgroundColor: COLORS.zinc100, marginLeft: 20 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  infoLabel: { fontSize: 14, color: COLORS.zinc500, minWidth: 64 },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.zinc900,
  },
  infoValueDim: { fontSize: 15, color: COLORS.zinc500, letterSpacing: 2 },
  infoRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    width: "100%",
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900 },
  modalDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    lineHeight: 21,
    marginBottom: 18,
  },
  modalEmail: { color: COLORS.zinc900, fontWeight: "700" },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.zinc700,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.zinc900,
    marginBottom: 10,
    backgroundColor: COLORS.zinc50,
  },
  primaryBtn: {
    backgroundColor: COLORS.violet600,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  linkBtn: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  linkBtnText: { fontSize: 13, color: COLORS.violet600, fontWeight: "500" },
});
