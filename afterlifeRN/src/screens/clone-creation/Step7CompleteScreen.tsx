import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { Clone } from "../../types/clone";
import { getCloneTypeMeta } from "../../mocks/cloneTypeCatalog";
import { createClone, deriveUsernameFromName, createCloneFeed } from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import { uploadFile } from "../../api/files";
import { Image } from "react-native";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step7">;
};

const FEATURES = [
  {
    icon: "refresh-cw",
    title: "자동 학습",
    desc: "대화를 나눌수록 페르소나가 더 똑똑해져요",
  },
  {
    icon: "shield",
    title: "데이터 보안",
    desc: "모든 데이터는 안전하게 암호화되어 보호됩니다",
  },
];

const COPY: Record<'memlow' | 'friend' | 'mentor' | 'celeb', { title: string; sub: string }> = {
  memlow: { title: '추억을 이어가요',     sub: '편지가 도착했을 때 함께 읽어봐요.' },
  friend: { title: '친구가 준비됐어요',   sub: '첫 대화를 시작해 볼까요?' },
  mentor: { title: '멘토가 준비됐어요',   sub: '분야별 질문을 남겨 보세요.' },
  celeb:  { title: '팬클럽이 시작됐어요', sub: '첫 메시지를 남겨 보세요.' },
};

export default function Step7CompleteScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const resetCreationDraft = useCloneStore((s) => s.resetCreationDraft);
  const draft = useCloneStore((s) => s.creationDraft);
  const addClone = useCloneStore((s) => s.addClone);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? 1;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [createdCloneId, setCreatedCloneId] = useState<number | null>(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentModal, setPaymentModal] = useState(false);
  const [payPrice, setPayPrice] = useState<number>(100);
  const [pinInput, setPinInput] = useState("");
  const [paying, setPaying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const avatarUrlRef = useRef<string | undefined>(undefined);

  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  const attemptCreate = useCallback(
    async (pin?: string) => {
      if (!draft.cloneType || !accessToken) return;
      const hasImage = Boolean(draft.imageFile);
      const hasVoice = Boolean(
        draft.voiceFile || draft.voiceSampleId || (draft.recordDuration ?? 0) >= 30,
      );
      const visibility = draft.visibility ?? getCloneTypeMeta(draft.cloneType).defaultVisibility;

      const USERNAME_RE = /^[a-z0-9_]+$/;
      const typed = draft.username?.trim() ?? "";
      const isValid = typed.length >= 3 && typed.length <= 30 && USERNAME_RE.test(typed);
      const username = isValid ? typed : deriveUsernameFromName(typed || draft.name || "user");

      const l1Attrs: Record<string, string> = {
        ...(draft.personaAge ? { age: draft.personaAge } : {}),
        ...(draft.personaGender ? { gender: draft.personaGender } : {}),
        ...(draft.personaTypes && draft.personaTypes.length > 0
          ? { personalities: draft.personaTypes.join(",") }
          : {}),
        ...(draft.personaMbti ? { mbti: draft.personaMbti } : {}),
      };
      const l1Profile = { attrs: l1Attrs, notes: draft.personaNotes ?? "" };

      let avatarUrl: string | undefined = avatarUrlRef.current;
      if (!avatarUrl && draft.imageFile) {
        try {
          const ext = draft.imageFile.split(".").pop()?.toLowerCase() ?? "";
          const mime =
            ext === "png" ? "image/png"
            : ext === "webp" ? "image/webp"
            : ext === "gif" ? "image/gif"
            : "image/jpeg";
          const uploaded = await uploadFile(accessToken, draft.imageFile, {
            purpose: "clone_avatar",
            mimeType: mime,
            fileName: `avatar.${ext || "jpg"}`,
          });
          avatarUrl = uploaded.url;
          avatarUrlRef.current = avatarUrl;
          console.log("[CLONE-CREATE] avatar uploaded:", avatarUrl);
        } catch (uploadErr) {
          console.warn("[CLONE-CREATE] avatar upload failed:", uploadErr);
        }
      }

      const res = await createClone(accessToken, {
        clone_type: draft.cloneType,
        name: draft.name ?? "Untitled",
        username,
        description: draft.description || undefined,
        category: draft.category || undefined,
        visibility,
        interests: draft.interests && draft.interests.length > 0 ? draft.interests : undefined,
        l1_profile: l1Profile,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...(pin ? { pin } : {}),
      });
      console.log("[CLONE-CREATE] success:", res);
      const createdClone = res.clone;

      const clone: Clone = {
        id: createdClone.id,
        cloneType: createdClone.cloneType,
        ownerId: currentUserId,
        displayName: createdClone.name,
        description: draft.description ?? "",
        interests: draft.interests ?? [],
        imageUrl: avatarUrl ?? draft.imageFile ?? undefined,
        visibility: createdClone.visibility,
        status: hasImage && hasVoice ? "active" : "pending_assets",
        createdAt: createdClone.createdAt,
        l1Profile,
      };
      addClone(clone);
      if (!cancelledRef.current) {
        setCreatedCloneId(createdClone.id);
        setCreating(false);
      }
    },
    [draft, accessToken, currentUserId, addClone],
  );

  useEffect(() => {
    if (!draft.cloneType) return;
    cancelledRef.current = false;
    (async () => {
      setCreating(true);
      setError(null);

      const hasImage = Boolean(draft.imageFile);
      const hasVoice = Boolean(draft.voiceFile || draft.voiceSampleId
        || (draft.recordDuration ?? 0) >= 30);
      const visibility = draft.visibility ?? getCloneTypeMeta(draft.cloneType!).defaultVisibility;

      if (!accessToken) {
        const localId = Date.now();
        const localAttrs: Record<string, string> = {
          ...(draft.personaAge ? { age: draft.personaAge } : {}),
          ...(draft.personaGender ? { gender: draft.personaGender } : {}),
          ...(draft.personaTypes && draft.personaTypes.length > 0
            ? { personalities: draft.personaTypes.join(',') }
            : {}),
          ...(draft.personaMbti ? { mbti: draft.personaMbti } : {}),
        };
        const clone: Clone = {
          id: localId,
          cloneType: draft.cloneType!,
          ownerId: currentUserId,
          displayName: draft.name ?? '',
          description: draft.description ?? '',
          interests: draft.interests ?? [],
          imageUrl: draft.imageFile ?? undefined,
          visibility,
          status: hasImage && hasVoice ? 'active' : 'pending_assets',
          createdAt: new Date().toISOString(),
          l1Profile: { attrs: localAttrs, notes: draft.personaNotes ?? '' },
        };
        addClone(clone);
        if (!cancelledRef.current) {
          setCreatedCloneId(localId);
          setCreating(false);
        }
        return;
      }

      try {
        await attemptCreate();
      } catch (err) {
        if (cancelledRef.current) return;
        if (err instanceof AuthApiError) {
          console.warn(
            '[CLONE-CREATE] failed:',
            err.code,
            err.message,
            'details=',
            JSON.stringify(err.details),
          );
          if (err.code === 'PAYMENT_REQUIRED') {

            const details = (err.details ?? {}) as { priceXrun?: number };
            if (typeof details.priceXrun === 'number') setPayPrice(details.priceXrun);
            setPaymentModal(true);
            setCreating(false);
            return;
          }
          let msg = t('create.errors.createFailed');
          if (err.code === 'QUOTA_EXCEEDED') {
            msg = t('create.errors.quotaExceeded');
          } else if (err.code === 'CONFLICT') {
            msg = err.message || t('create.errors.usernameConflict');
          } else {
            msg = err.message;
          }
          setError(msg);
          setCreating(false);
          Alert.alert(t('create.complete.createFailed'), msg);
        } else {
          console.warn('[CLONE-CREATE] failed:', err);
          setError(t('create.errors.createFailed'));
          setCreating(false);
        }
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, [attemptCreate, draft.cloneType]); 

  const cloneType = draft.cloneType ?? 'friend';
  const copy = {
    title: t(`create.complete.${cloneType}Title` as
      | 'create.complete.memlowTitle'
      | 'create.complete.friendTitle'
      | 'create.complete.mentorTitle'
      | 'create.complete.celebTitle'),
    sub: t(`create.complete.${cloneType}Sub` as
      | 'create.complete.memlowSub'
      | 'create.complete.friendSub'
      | 'create.complete.mentorSub'
      | 'create.complete.celebSub'),
  };
  const FEATURES_I18N = [
    { icon: 'refresh-cw' as const, title: t('create.complete.featAutoLearn'), desc: t('create.complete.featAutoLearnDesc') },
    { icon: 'shield' as const, title: t('create.complete.featSecurity'), desc: t('create.complete.featSecurityDesc') },
  ];

  const handleStartChat = () => {
    if (createdCloneId == null) return;
    resetCreationDraft();
    navigation.replace('Step8', { cloneId: createdCloneId });
  };

  const handleGoToDashboard = () => {
    resetCreationDraft();
    navigation.getParent()?.dispatch(
      CommonActions.navigate({ name: "ClonesTab" })
    );
  };

  const handleSharePost = async () => {
    if (createdCloneId == null) return;
    const hasCaption = caption.trim().length > 0;
    setPosting(true);
    try {
      if (hasCaption && accessToken) {
        const mediaUrl = avatarUrlRef.current ?? null;
        await createCloneFeed(accessToken, createdCloneId, {
          content: caption.trim(),
          ...(mediaUrl ? { mediaUrl, mediaType: "image" } : {}),
        });
      }
    } catch (err) {
      console.warn("[CLONE-CREATE] post first feed failed:", err);

    } finally {
      setPosting(false);
      resetCreationDraft();
      navigation.replace("Step8", { cloneId: createdCloneId });
    }
  };

  const handleConfirmPayment = async () => {
    if (!/^\d{6}$/.test(pinInput)) {
      setPinError("PIN 6자리를 입력해 주세요");
      return;
    }
    setPaying(true);
    setPinError(null);
    try {
      setCreating(true);
      await attemptCreate(pinInput);
      setPaymentModal(false);
    } catch (err) {
      let msg = "결제에 실패했어요.";
      if (err instanceof AuthApiError) {
        if (err.code === "UNAUTHENTICATED") msg = "결제 비밀번호가 일치하지 않아요";
        else if (err.code === "INSUFFICIENT_FUNDS") msg = "XRUN 잔액이 부족해요";
        else if (err.code === "CONFLICT") msg = err.message;
        else if (err.code === "UPSTREAM_NOT_IMPLEMENTED")
          msg = "xrun 송금 기능이 아직 준비 중입니다";
        else msg = err.message;
      }
      setPinError(msg);
      setCreating(false);
    } finally {
      setPaying(false);
    }
  };

  const displayName = draft.name ?? "사용자 이름";
  const displayHandle = draft.username ?? "아이디";
  const imageUri = draft.imageFile;

  return (
    <SafeView backgroundColor={COLORS.white}>
      {}
      <PageHeader
        title="게시물 작성"
        showBackButton
        onBackPress={handleGoToDashboard}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}

        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeScrollView
          contentContainerStyle={styles.composerContent}
          showBottomBackground={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {}
          <View style={styles.authorRow}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatar, styles.authorAvatarPh]}>
                <Feather name="user" size={16} color={COLORS.zinc400} />
              </View>
            )}
            <View style={styles.authorTextCol}>
              <Text style={styles.authorName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.authorHandle} numberOfLines={1}>@{displayHandle}</Text>
            </View>
          </View>

          {
}
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>움직이는 페르소나로 보일 예정</Text>
          </View>

          {}
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="소개글 작성 (예: #일상 #infp 케이팝 노래 좋아해요)"
            placeholderTextColor={COLORS.zinc400}
            multiline
            maxLength={2000}
          />

          {}
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </SafeScrollView>

        {}
        <View style={styles.bottomBar}>
          <Button
            title={
              posting
                ? "잠시만요..."
                : creating
                ? "잠시만요..."
                : "다음"
            }
            onPress={handleSharePost}
            variant="accent"
            disabled={posting || creating || !!error}
          />
        </View>
      </KeyboardAvoidingView>

      {}
      <Modal visible={paymentModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={payStyles.overlay}
            onPress={() => !paying && setPaymentModal(false)}
          >
            <Pressable style={payStyles.box} onPress={(e) => e.stopPropagation()}>
              <View style={payStyles.iconWrap}>
                <Feather name="credit-card" size={26} color={COLORS.violet600} />
              </View>
              <Text style={payStyles.title}>페르소나 생성 결제</Text>
              <Text style={payStyles.desc}>
                두 번째 페르소나부터 {payPrice} XRUN 이 부과돼요{"\n"}
                결제 비밀번호 6자리를 입력해 주세요
              </Text>
              <TextInput
                style={payStyles.input}
                value={pinInput}
                onChangeText={(v) => setPinInput(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN 6자리"
                placeholderTextColor={COLORS.zinc400}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus
                editable={!paying}
              />
              {pinError && <Text style={payStyles.error}>{pinError}</Text>}
              <View style={payStyles.btns}>
                <TouchableOpacity
                  style={payStyles.cancel}
                  onPress={() => setPaymentModal(false)}
                  disabled={paying}
                >
                  <Text style={payStyles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[payStyles.confirm, (pinInput.length !== 6 || paying) && payStyles.disabled]}
                  onPress={handleConfirmPayment}
                  disabled={pinInput.length !== 6 || paying}
                >
                  <Text style={payStyles.confirmText}>
                    {paying ? "결제 중..." : `${payPrice} XRUN 결제`}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeView>
  );
}

const payStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  box: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.zinc900, marginBottom: 10 },
  desc: { fontSize: 13, color: COLORS.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4,
    color: COLORS.zinc900,
    backgroundColor: COLORS.zinc50,
    marginBottom: 12,
  },
  error: { fontSize: 12, color: "#ef4444", marginBottom: 12, textAlign: "center" },
  btns: { flexDirection: "row", gap: 8, width: "100%" },
  cancel: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.zinc200, alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: COLORS.zinc600 },
  confirm: {
    flex: 1.5, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.violet600, alignItems: "center",
  },
  confirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  disabled: { backgroundColor: COLORS.zinc300 },
});

const styles = StyleSheet.create({

  composerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  headerBack: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: { fontSize: 15, fontWeight: "700", color: COLORS.zinc900 },
  headerHandle: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  composerContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.zinc100,
  },
  authorAvatarPh: { alignItems: "center", justifyContent: "center" },
  authorTextCol: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  authorHandle: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  previewBox: {
    width: "80%",
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
  },

  captionInput: {
    minHeight: 100,
    fontSize: 14,
    color: COLORS.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc50,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error, lineHeight: 18 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: SIZES.xlarge,
  },
  creatingText: { fontSize: 14, color: COLORS.zinc600 },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.zinc900,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: COLORS.white },

  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.xxxlarge,
  },
  container: { width: "100%", maxWidth: 780, alignItems: "center", gap: SIZES.large },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.zinc900 },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
  featureCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.violet100,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  featureDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
  },
});
