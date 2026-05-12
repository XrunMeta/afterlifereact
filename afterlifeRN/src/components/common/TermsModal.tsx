

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS, RADIUS, SIZES } from "../constants";

export type AgreementType = 1 | 2 | 3;

type Props = {
  visible: boolean;
  type: AgreementType | null;
  onClose: () => void;
  onAgree: () => void;
};

const cache = new Map<string, string>();

async function fetchAgreement(
  type: AgreementType,
  language: string,
): Promise<string> {

  let langParam = (language || "ko").toLowerCase();
  if (langParam.startsWith("zh")) langParam = "zh";
  else langParam = langParam.split("-")[0]; 
  const key = `${type}_${langParam}`;
  if (cache.has(key)) return cache.get(key)!;
  const url = `https://oth-path-gw.example.invalid/agreements?type=${type}&language=${langParam}`;
  console.log("[TermsModal] fetch:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load agreement (${res.status})`);
  const json = (await res.json()) as { data?: { content?: string } };
  const content = json?.data?.content ?? "";
  console.log(
    `[TermsModal] response ok — content length=${content.length}`,
  );
  cache.set(key, content);
  return content;
}

const TITLE_KEYS: Record<AgreementType, string> = {
  1: "auth.signup.termsServiceTitle",
  2: "auth.signup.termsLocationTitle",
  3: "auth.signup.termsPrivacyTitle",
};

const TITLE_FALLBACK: Record<AgreementType, string> = {
  1: "서비스 약관",
  2: "위치정보 약관",
  3: "개인정보 약관",
};

export default function TermsModal({ visible, type, onClose, onAgree }: Props) {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !type) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent("");
    fetchAgreement(type, i18n.language)
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[TermsModal] fetch failed:", err);
          setError(
            t("auth.signup.termsLoadFailed", {
              defaultValue: "약관을 불러오지 못했어요.",
            }),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, type, i18n.language, t]);

  if (!type) return null;
  const title = t(TITLE_KEYS[type], { defaultValue: TITLE_FALLBACK[type] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          {}
          <View style={s.header}>
            <View style={s.headerBtn} />
            <Text style={s.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={s.headerBtn}>
              <Feather name="x" size={20} color={COLORS.zinc700} />
            </TouchableOpacity>
          </View>

          {}
          <ScrollView
            style={s.contentScroll}
            contentContainerStyle={s.contentInner}
            showsVerticalScrollIndicator
          >
            {loading ? (
              <ActivityIndicator
                color={COLORS.violet500}
                style={{ marginTop: 32 }}
              />
            ) : error ? (
              <Text style={s.errorText}>{error}</Text>
            ) : (
              <Text style={s.contentText}>{content}</Text>
            )}
          </ScrollView>

          {}
          <View style={s.footer}>
            <TouchableOpacity style={s.btnSecondary} onPress={onClose}>
              <Text style={s.btnSecondaryText}>
                {t("common.close", { defaultValue: "닫기" })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={onAgree}
              disabled={loading}
            >
              <Text style={s.btnPrimaryText}>
                {t("common.agree", { defaultValue: "동의" })}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "92%",
    maxWidth: 480,
    height: "80%",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
  contentScroll: { flex: 1 },
  contentInner: { padding: SIZES.large },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.zinc700,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: "center",
    marginTop: 32,
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    padding: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 14, color: COLORS.zinc700, fontWeight: "600" },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 14, color: COLORS.white, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});
