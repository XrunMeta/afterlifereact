

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";
import { getMe, AuthApiError } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "SignupComplete">;

type ServiceKey = "afterlife" | "xrun";

export default function SignupCompleteScreen({ route }: Props) {
  const { t } = useTranslation();

  const accessToken = route.params?.accessToken;
  const persist = route.params?.persist ?? true;
  const setApiAuth = useAuthStore((s) => s.setApiAuth);
  const hydrate = useAuthStore((s) => s.hydrate);
  console.log("[SignupComplete] mounted, hasToken:", !!accessToken);

  const [selected, setSelected] = useState<Record<ServiceKey, boolean>>({
    afterlife: true,
    xrun: true,
  });
  const [proceeding, setProceeding] = useState(false);

  const toggle = (key: ServiceKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    if (!accessToken) {
      console.warn("[SignupComplete] no accessToken in route.params");
      return;
    }
    setProceeding(true);
    try {

      const meRes = await getMe(accessToken);
      await setApiAuth(accessToken, meRes.user, { persist });

      console.log("[SignupComplete] services selected:", selected);
      await hydrate();
    } catch (err) {
      console.warn("[SignupComplete] start failed:", err);
      const msg =
        err instanceof AuthApiError ? err.message : String(err);
      Alert.alert(t("common.error"), msg);

    } finally {
      setProceeding(false);
    }
  };

  return (
    <SafeView backgroundColor={COLORS.zinc50}>
      <SafeScrollView
        contentContainerStyle={s.scroll}
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.container}>
          {}
          <Text style={s.title}>
            {t("auth.signupComplete.title", { defaultValue: "가입 완료!" })}
          </Text>
          <Text style={s.subtitle}>
            {t("auth.signupComplete.subtitle", {
              defaultValue:
                "방금 만든 계정 그대로,\n연동된 다른 서비스도 로그인만 해서\n바로 이용해 보세요.",
            })}
          </Text>

          {}
          <View style={s.cards}>
            <ServiceCard
              icon={
                <Text style={s.iconText}>∞</Text>
              }
              title={t("auth.signupComplete.afterlifeTitle", {
                defaultValue: "애프터라이프",
              })}
              subtitle={t("auth.signupComplete.afterlifeDesc", {
                defaultValue: "다음 세상의 삶",
              })}
              selected={selected.afterlife}
              onPress={() => toggle("afterlife")}
            />
            <ServiceCard
              icon={<Text style={s.iconText}>X</Text>}
              title={t("auth.signupComplete.xrunTitle", {
                defaultValue: "XRUN",
              })}
              subtitle={t("auth.signupComplete.xrunDesc", {
                defaultValue: "Move to Earn",
              })}
              selected={selected.xrun}
              onPress={() => toggle("xrun")}
            />
          </View>
        </View>
      </SafeScrollView>

      {}
      <View style={s.footer}>
        <Button
          title={
            proceeding
              ? t("auth.signup.signingUp", { defaultValue: "진행 중..." })
              : t("auth.signupComplete.startBtn", { defaultValue: "시작하기" })
          }
          onPress={handleStart}
          disabled={proceeding}
        />
      </View>
    </SafeView>
  );
}

type ServiceCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

function ServiceCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: ServiceCardProps) {
  return (
    <TouchableOpacity
      style={[s.card, selected && s.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.iconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={[s.check, selected && s.checkActive]}>
        {selected && <Feather name="check" size={14} color={COLORS.white} />}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.xlarge,
    paddingTop: 80,
    paddingBottom: 24,
  },
  container: {
    alignItems: "center",
    gap: SIZES.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.zinc900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  cards: {
    width: "100%",
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardSelected: {
    borderColor: COLORS.violet500,
    borderWidth: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.zinc900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.zinc500,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.zinc300,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: {
    backgroundColor: COLORS.violet500,
    borderColor: COLORS.violet500,
  },
  footer: {
    paddingHorizontal: SIZES.xlarge,
    paddingTop: SIZES.medium,
    paddingBottom: SIZES.large,
    backgroundColor: COLORS.zinc50,
  },
});
