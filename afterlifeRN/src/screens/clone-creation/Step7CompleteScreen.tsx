import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { Clone } from "../../types/clone";
import { getCloneTypeMeta } from "../../mocks/cloneTypeCatalog";
import { createClone, deriveUsernameFromName } from "../../api/clones";
import { AuthApiError } from "../../api/auth";
import { uploadFile } from "../../api/files";

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
  const resetCreationDraft = useCloneStore((s) => s.resetCreationDraft);
  const draft = useCloneStore((s) => s.creationDraft);
  const addClone = useCloneStore((s) => s.addClone);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? 1;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [createdCloneId, setCreatedCloneId] = useState<number | null>(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.cloneType) return;
    let cancelled = false;
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
        if (!cancelled) {
          setCreatedCloneId(localId);
          setCreating(false);
        }
        return;
      }

      try {

        const USERNAME_RE = /^[a-z0-9_]+$/;
        const typed = draft.username?.trim() ?? '';
        const isValid = typed.length >= 3 && typed.length <= 30 && USERNAME_RE.test(typed);
        const username = isValid ? typed : deriveUsernameFromName(typed || draft.name || 'user');

        const l1Attrs: Record<string, string> = {
          ...(draft.personaAge ? { age: draft.personaAge } : {}),
          ...(draft.personaGender ? { gender: draft.personaGender } : {}),
          ...(draft.personaTypes && draft.personaTypes.length > 0
            ? { personalities: draft.personaTypes.join(',') }
            : {}),
          ...(draft.personaMbti ? { mbti: draft.personaMbti } : {}),
        };
        const l1Profile = { attrs: l1Attrs, notes: draft.personaNotes ?? '' };

        let avatarUrl: string | undefined;
        if (draft.imageFile) {
          try {

            const ext = draft.imageFile.split('.').pop()?.toLowerCase() ?? '';
            const mime =
              ext === 'png' ? 'image/png'
              : ext === 'webp' ? 'image/webp'
              : ext === 'gif' ? 'image/gif'
              : 'image/jpeg';
            const uploaded = await uploadFile(accessToken, draft.imageFile, {
              purpose: 'clone_avatar',
              mimeType: mime,
              fileName: `avatar.${ext || 'jpg'}`,
            });
            avatarUrl = uploaded.url;
            console.log('[CLONE-CREATE] avatar uploaded:', avatarUrl);
          } catch (uploadErr) {
            console.warn('[CLONE-CREATE] avatar upload failed:', uploadErr);

          }
        }

        const res = await createClone(accessToken, {
          clone_type: draft.cloneType!,
          name: draft.name ?? 'Untitled',
          username,
          description: draft.description || undefined,
          visibility,
          interests: draft.interests && draft.interests.length > 0 ? draft.interests : undefined,
          l1_profile: l1Profile,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        });
        console.log('[CLONE-CREATE] success:', res);
        const createdClone = res.clone;

        const clone: Clone = {
          id: createdClone.id,
          cloneType: createdClone.cloneType,
          ownerId: currentUserId,
          displayName: createdClone.name,
          description: draft.description ?? '',
          interests: draft.interests ?? [],
          imageUrl: avatarUrl ?? draft.imageFile ?? undefined,
          visibility: createdClone.visibility,
          status: hasImage && hasVoice ? 'active' : 'pending_assets',
          createdAt: createdClone.createdAt,
          l1Profile,
        };
        addClone(clone);
        if (!cancelled) {
          setCreatedCloneId(createdClone.id);
          setCreating(false);
        }
      } catch (err) {

        if (err instanceof AuthApiError) {
          console.warn(
            '[CLONE-CREATE] failed:',
            err.code,
            err.message,
            'details=',
            JSON.stringify(err.details),
          );
        } else {
          console.warn('[CLONE-CREATE] failed:', err);
        }
        if (cancelled) return;
        let msg = '페르소나 생성 중 오류가 발생했습니다.';
        if (err instanceof AuthApiError) {
          if (err.code === 'QUOTA_EXCEEDED') {
            msg = '같은 타입의 페르소나는 1개까지만 생성할 수 있어요.';
          } else if (err.code === 'CONFLICT') {
            msg = '이미 사용 중인 username 이에요. 다시 시도해주세요.';
          } else {
            msg = err.message;
          }
        }
        setError(msg);
        setCreating(false);
        Alert.alert('생성 실패', msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); 

  const copy = COPY[draft.cloneType ?? 'friend'];

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

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="생성 완료" />
      <StepIndicator currentStep={7} totalSteps={7} />

      <SafeScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showBottomBackground={false}>
        <View style={styles.container}>
          {}
          <View style={[styles.successCircle, error && { backgroundColor: COLORS.error }]}>
            {creating ? (
              <ActivityIndicator size="large" color={COLORS.white} />
            ) : error ? (
              <Feather name="alert-triangle" size={48} color={COLORS.white} />
            ) : (
              <Feather name="check" size={48} color={COLORS.white} />
            )}
          </View>

          <Text style={styles.title}>
            {creating ? '페르소나를 만들고 있어요...' : error ? '생성 실패' : copy.title}
          </Text>
          <Text style={styles.subtitle}>{error ?? copy.sub}</Text>

          {}
          {!creating && !error && FEATURES.map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconBox}>
                <Feather name={feat.icon as any} size={22} color={COLORS.violet500} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </SafeScrollView>

      {}
      <View style={styles.bottomBar}>
        <Button
          title="소개 영상 만들기"
          onPress={handleStartChat}
          variant="accent"
          disabled={creating || !!error || createdCloneId == null}
          leftIcon={<Feather name="message-circle" size={20} color={COLORS.white} />}
        />
        <Button
          title="나의 페르소나로 돌아가기"
          onPress={handleGoToDashboard}
          variant="ghost"
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
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
