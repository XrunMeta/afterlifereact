import { showAlert } from "../../stores/dialogStore";
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
import { createClone, deriveUsernameFromName, validateCloneUsername, checkCloneUsername, createCloneFeed, updateClone, getAssetJob, createAssetJob, type AssetJob } from "../../api/clones";
import { popNextPipeline } from "../../lib/experimentalPipelineFlag";
import { AuthApiError } from "../../api/auth";
import { uploadFile } from "../../api/files";
import { Image } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { pickAndCropImage } from "../../lib/imagePicker";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step7">;
};

const FEATURES = [
  {
    icon: "refresh-cw",
    title: "자동 학습",
    desc: "대화를 나눌수록 클론이 더 똑똑해져요",
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

function buildFallbackCaption(name?: string, relation?: string): string {
  const n = (name ?? "").trim();
  const nick = n ? `${n}이에요.` : "만나서 반가워요.";
  const relCopy: Record<string, string> = {
    memlow: "함께한 추억을 이어가고 싶어요.",
    friend: "편하게 이야기 나눠봐요!",
    mentor: "궁금한 게 있으면 뭐든 물어봐요.",
    celeb: "팬 여러분, 만나서 정말 반가워요.",
  };
  const rel = relCopy[(relation ?? "") as string] ?? "오늘 하루도 잘 지내봐요.";
  return `${nick} ${rel}`;
}

function IdleVideoPreview({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={styles.previewBox}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.videoBadge}>
        <Text style={styles.videoBadgeText}>
          {t("create.step7.videoReady", { defaultValue: "영상 준비 완료" })}
        </Text>
      </View>
    </View>
  );
}

export default function Step7CompleteScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const resetCreationDraft = useCloneStore((s) => s.resetCreationDraft);
  const draft = useCloneStore((s) => s.creationDraft);
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);
  const addClone = useCloneStore((s) => s.addClone);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? 1;
  const accessToken = useAuthStore((s) => s.accessToken);

  const [createdCloneId, setCreatedCloneId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const avatarUrlRef = useRef<string | undefined>(undefined);

  const [idleJob, setIdleJob] = useState<AssetJob | null>(null);
  const idleJobIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFallbackRef = useRef(false);
  const [caption, setCaption] = useState(() => {
    const desc = (draft.description ?? "").slice(0, 500);
    if (desc) return desc;
    isFallbackRef.current = true;
    return buildFallbackCaption(draft.name, draft.relation);
  });

  const captionTouchedRef = useRef(false);

  useEffect(() => {
    if (
      draft.description &&
      !captionTouchedRef.current &&
      (caption.trim().length === 0 || isFallbackRef.current)
    ) {
      setCaption(draft.description.slice(0, 500));
      isFallbackRef.current = false;
    }

  }, [draft.description]);

  useEffect(() => {
    const jobId = draft.idleVideoJobId;
    if (!jobId || !accessToken) return;
    let alive = true;
    const poll = async () => {
      try {
        const job = await getAssetJob(accessToken, jobId);
        if (!alive) return;
        setIdleJob(job);
        if (job.status === 'done' || job.status === 'failed') {
          if (idleJobIntervalRef.current) {
            clearInterval(idleJobIntervalRef.current);
            idleJobIntervalRef.current = null;
          }
        }
      } catch (e) {
        console.warn('[Step7] idle job poll error:', e);
      }
    };
    void poll();
    idleJobIntervalRef.current = setInterval(poll, 4000);
    return () => {
      alive = false;
      if (idleJobIntervalRef.current) {
        clearInterval(idleJobIntervalRef.current);
        idleJobIntervalRef.current = null;
      }
    };

  }, [draft.idleVideoJobId, accessToken]);

  const [reuploadLoading, setReuploadLoading] = useState(false);

  const idleBlocking = draft.idleVideoJobId ? idleJob?.status !== 'done' : true;

  const handleReuploadPhoto = useCallback(async () => {
    if (reuploadLoading) return;

    if (!accessToken) {
      showAlert(t('create.step7.loginNeeded', { defaultValue: '로그인 정보가 없어요. 다시 로그인해주세요.' }));
      return;
    }
    try {
      const result = await pickAndCropImage({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      setReuploadLoading(true);
      const ext = uri.split('.').pop()?.toLowerCase() ?? '';
      const mime =
        ext === 'png' ? 'image/png'
        : ext === 'webp' ? 'image/webp'
        : ext === 'gif' ? 'image/gif'
        : 'image/jpeg';
      const uploaded = await uploadFile(accessToken, uri, {
        purpose: 'clone_avatar',
        mimeType: mime,
        fileName: `avatar.${ext || 'jpg'}`,
      });

      const jobRes = await createAssetJob(accessToken, {
        kind: 'idle_video',
        src_file_id: uploaded.id,
      });

      setIdleJob(null);

      setCreationDraft({
        imageFile: uri,
        avatarFileId: uploaded.id,
        avatarUrl: uploaded.url,
        idleVideoJobId: jobRes.job_id,
      });
      avatarUrlRef.current = uploaded.url;
    } catch (err) {
      console.warn('[Step7] 재업로드 실패:', err);

      showAlert(
        t('create.step7.uploadFailedTitle', { defaultValue: '업로드 실패' }),
        t('create.step7.uploadFailedMsg', { defaultValue: '영상 생성 요청에 실패했어요. 다시 시도해주세요.' }),
      );
    } finally {
      setReuploadLoading(false);
    }
  }, [reuploadLoading, accessToken, setCreationDraft, t]);

  const [posting, setPosting] = useState(false);

  const attemptCreate = useCallback(
    async (): Promise<number> => {
      const draft = useCloneStore.getState().creationDraft;
      console.log("[CLONE-CREATE] attemptCreate start. draft snapshot:", {
        cloneType: draft.cloneType,
        name: draft.name,
        username: draft.username,
        hasImage: !!draft.imageFile,
        hasVoice: !!(draft.voiceFile || draft.voiceSampleId),
        descriptionLen: draft.description?.length ?? 0,
        notesLen: draft.personaNotes?.length ?? 0,
      });
      if (!accessToken) {
        throw new Error("로그인 정보가 없어요. 다시 로그인해주세요.");
      }

      const hasImage = Boolean(draft.imageFile);
      const hasVoice = Boolean(
        draft.voiceFile || draft.voiceSampleId || (draft.recordDuration ?? 0) >= 30,
      );

      const visibility = draft.visibility ?? "public";

      const typed = draft.username?.trim() ?? "";
      const usernameError = validateCloneUsername(typed);
      if (typed.length > 0 && usernameError) {
        throw new Error(usernameError);
      }
      const username = typed.length > 0 ? typed : deriveUsernameFromName(draft.name || "user");

      const l1Attrs: Record<string, string> = {
        ...(draft.personaAge ? { age: draft.personaAge } : {}),
        ...(draft.personaGender ? { gender: draft.personaGender } : {}),
        ...(draft.personaTypes && draft.personaTypes.length > 0
          ? { personalities: draft.personaTypes.join(",") }
          : {}),
        ...(draft.personaMbti ? { mbti: draft.personaMbti } : {}),
      };
      const l1Profile = { attrs: l1Attrs, notes: draft.personaNotes ?? "" };

      const personaAnswers = draft.personaAnswers ?? {};

      let avatarUrl: string | undefined = avatarUrlRef.current ?? draft.avatarUrl;
      if (!avatarUrl && draft.imageFile) {
        try {
          const ext = draft.imageFile.split(".").pop()?.toLowerCase() ?? "";
          const mime =
            ext === "png" ? "image/png"
            : ext === "webp" ? "image/webp"
            : ext === "gif" ? "image/gif"
            : "image/jpeg";
          console.log("[CLONE-CREATE] avatar uploading...", { mime, path: draft.imageFile });
          const uploaded = await uploadFile(accessToken, draft.imageFile, {
            purpose: "clone_avatar",
            mimeType: mime,
            fileName: `avatar.${ext || "jpg"}`,
          });
          avatarUrl = uploaded.url;
          avatarUrlRef.current = avatarUrl;

          useCloneStore.getState().setCreationDraft({ avatarUrl: uploaded.url });
          console.log("[CLONE-CREATE] avatar uploaded:", avatarUrl);
        } catch (uploadErr) {
          console.warn("[CLONE-CREATE] avatar upload failed:", uploadErr);

          throw new Error(
            `이미지 업로드에 실패했어요. 네트워크 상태를 확인해주세요. (${uploadErr instanceof Error ? uploadErr.message : "unknown"})`,
          );
        }
      }

      const cloneTypeForApi = "friend" as const;
      console.log("[CLONE-CREATE] createClone request →", {
        clone_type: cloneTypeForApi,
        name: draft.name ?? "Untitled",
        username,
        visibility,
        hasAvatar: !!avatarUrl,
      });

      const voicePayload = draft.voiceCloneJobId
        ? { voice_clone_job_id: draft.voiceCloneJobId }
        : draft.voicePresetId
        ? { voice_preset_id: draft.voicePresetId }
        : {};

      const res = await createClone(accessToken, {
        clone_type: cloneTypeForApi,
        name: draft.name ?? "Untitled",
        username,
        description: draft.description || undefined,
        category: draft.category || undefined,
        visibility,
        interests: draft.interests && draft.interests.length > 0 ? draft.interests : undefined,
        l1_profile: l1Profile,

        ...(Object.keys(personaAnswers).length > 0 ? { personaAnswers } : {}),

        ...(draft.relation ? { relation: draft.relation } : {}),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...voicePayload,

        ...(draft.idleVideoJobId ? { idle_video_job_id: draft.idleVideoJobId } : {}),

        ...(() => {
          const flagged = popNextPipeline();
          if (flagged) return { pipeline: flagged };
          return {};
        })(),

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
      return createdClone.id;
    },
    [draft, accessToken, currentUserId, addClone],
  );

  useEffect(() => {
    if (!draft.cloneType) {
      setError(t("create.step7.missingCloneInfo", { defaultValue: "클론 정보가 없어요. 처음부터 다시 만들어주세요." }));
    }
  }, [draft.cloneType, t]);

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
    if (creating || posting) return;

    if (idleBlocking) {
      showAlert(
        t('create.step7.waitTitle', { defaultValue: '잠깐요' }),
        t('create.step7.waitVideoBuilding', { defaultValue: '영상 생성이 완료되면 게시할 수 있어요.' }),
      );
      return;
    }
    const trimmed = caption.trim();

    const draftDump = {
      cloneType: draft.cloneType,
      name: draft.name,
      nameLen: draft.name?.length ?? 0,
      username: draft.username,
      description: draft.description,
      hasImageFile: !!draft.imageFile,
      imageFile: draft.imageFile,
      visibility: draft.visibility,
      category: draft.category,
      interests: draft.interests,
      personaAge: draft.personaAge,
      personaGender: draft.personaGender,
      personaMbti: draft.personaMbti,
      personaTypes: draft.personaTypes,
      personaNotesLen: draft.personaNotes?.length ?? 0,
    };
    console.log(
      "[CLONE-CREATE] handleSharePost tap. captionLen=",
      trimmed.length,
      "createdCloneId=",
      createdCloneId,
      "hasAccessToken=",
      !!accessToken,
    );
    console.log("[CLONE-CREATE] DRAFT DUMP:", JSON.stringify(draftDump, null, 2));

    if (trimmed.length === 0) {
      console.log("[CLONE-CREATE] BLOCKED: caption empty");
      showAlert(
        t("create.step7.captionRequiredTitle", { defaultValue: "소개글" }),
        t("create.step7.captionRequiredMsg", { defaultValue: "한 줄 소개를 입력해주세요." }),
      );
      return;
    }

    if (!accessToken) {
      console.log("[CLONE-CREATE] BLOCKED: no accessToken");
      showAlert(
        t("create.step7.loginRequiredTitle", { defaultValue: "로그인 필요" }),
        t("create.step7.loginNeeded", { defaultValue: "로그인 정보가 없어요. 다시 로그인해주세요." }),
      );
      return;
    }

    if (!draft.name || draft.name.trim().length === 0) {
      console.log("[CLONE-CREATE] BLOCKED: name missing");
      showAlert(
        t("create.step7.nameMissingTitle", { defaultValue: "이름 누락" }),
        t("create.step7.nameMissingMsg", { defaultValue: "클론 이름이 없어요. 이전 단계로 돌아가서 입력해주세요." }),
      );
      return;
    }

    const typedUsername = draft.username?.trim() ?? "";
    if (typedUsername.length > 0) {
      const formatError = validateCloneUsername(typedUsername);
      if (formatError) {
        console.log("[CLONE-CREATE] BLOCKED: username invalid ―", typedUsername);
        showAlert(
          t("create.step7.usernameInvalidTitle", { defaultValue: "아이디 형식 오류" }),
          formatError,
        );
        return;
      }

      try {
        const availability = await checkCloneUsername(typedUsername);
        if (!availability.available) {
          console.log("[CLONE-CREATE] BLOCKED: username unavailable ―", availability.reason);
          showAlert(
            t("create.step7.usernameConflictTitle", { defaultValue: "아이디 중복" }),
            availability.reason === "reserved"
              ? "예약된 아이디입니다. 다른 아이디를 입력해주세요."
              : "이미 사용중인 아이디예요. 이전 단계에서 다른 아이디로 바꿔주세요.",
          );
          return;
        }
      } catch {

      }
    }
    console.log("[CLONE-CREATE] sanity check passed → proceed to attemptCreate");

    setPosting(true);
    setError(null);

    if (draft.description !== trimmed) {
      useCloneStore.getState().setCreationDraft({ description: trimmed });
    }

    let newCloneId = createdCloneId;
    try {

      if (newCloneId == null) {
        setCreating(true);
        newCloneId = await attemptCreate();
        setCreating(false);
        console.log("[CLONE-CREATE] new cloneId=", newCloneId);
      }
      if (!newCloneId) {

        throw new Error("클론 생성에 실패했어요. (cloneId 누락)");
      }

      const mediaUrl = avatarUrlRef.current ?? null;
      console.log("[CLONE-CREATE] createCloneFeed →", { cloneId: newCloneId, hasMedia: !!mediaUrl });
      await createCloneFeed(accessToken, newCloneId, {
        content: trimmed,
        ...(mediaUrl ? { mediaUrl, mediaType: "image" } : {}),
      });
      console.log("[CLONE-CREATE] feed created.");
    } catch (err) {
      console.warn("[CLONE-CREATE] share post failed:", err);
      setCreating(false);
      if (err instanceof AuthApiError) {

        if (err.code === "CONFLICT" && err.message.includes("아이디")) {
          showAlert(t("create.step7.usernameConflictTitle", { defaultValue: "아이디 중복" }), err.message);
          setPosting(false);
          return;
        }

        setError(err.message);
        showAlert(
          t("create.step7.postFailedWithCode", { code: err.code, defaultValue: `게시 실패 (${err.code})` }),
          err.message,
        );
      } else {

        const msg = err instanceof Error
          ? err.message
          : t("create.step7.unknownError", { defaultValue: "알 수 없는 오류" });
        setError(msg);
        showAlert(t("create.step7.postFailed", { defaultValue: "게시 실패" }), msg);
      }
      setPosting(false);
      return;
    }

    setPosting(false);
    resetCreationDraft();
    if (newCloneId) navigation.replace("Step8", { cloneId: newCloneId });
  };

  const displayName = draft.name ?? t("create.step7.displayNameFallback", { defaultValue: "사용자 이름" });
  const displayHandle = draft.username ?? t("create.step7.displayHandleFallback", { defaultValue: "아이디" });
  const imageUri = draft.imageFile;

  return (
    <SafeView backgroundColor={COLORS.white}>
      {}
      <PageHeader
        title={t("create.step7.reviewTitle", { defaultValue: "클론 정보 리뷰" })}
        showBackButton
        onBackPress={() => {

          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {

            navigation.getParent()?.navigate("HomeTab" as never);
          }
        }}
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

          autoAdjustKeyboardPadding
          additionalBottomPadding={80}
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
          {idleJob?.status === 'done' && idleJob.out_url ? (

            <IdleVideoPreview uri={idleJob.out_url} />
          ) : (idleJob?.status === 'failed' || (!draft.idleVideoJobId && !!draft.imageFile)) ? (

            <TouchableOpacity
              testID="reupload-photo-button"
              style={styles.previewBox}
              onPress={handleReuploadPhoto}
              activeOpacity={0.8}
              disabled={reuploadLoading}
            >
              {draft.imageFile && (
                <Image source={{ uri: draft.imageFile }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              )}
              <View style={[styles.videoBadge, styles.videoBadgeFailed]}>
                {reuploadLoading ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.videoBadgeText}>
                      {t("create.step7.photoUploading", { defaultValue: "사진 올리는 중..." })}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.videoBadgeText}>
                    {t("create.step7.reuploadPhoto", { defaultValue: "사진 다시 올리기" })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ) : draft.idleVideoJobId && (!idleJob || idleJob.status === 'pending' || idleJob.status === 'running') ? (

            <View style={styles.previewBox}>
              {draft.imageFile && (
                <Image source={{ uri: draft.imageFile }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              )}
              <View style={[styles.videoBadge, styles.videoBadgePending]}>
                <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.videoBadgeText}>
                  {t("create.step7.videoPending", { defaultValue: "영상 준비 중" })}
                </Text>
              </View>
            </View>
          ) : draft.imageFile ? (
            <Image source={{ uri: draft.imageFile }} style={styles.previewBox} resizeMode="cover" />
          ) : (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                {t("create.step7.photoRequired", { defaultValue: "사진을 먼저 등록해 주세요" })}
              </Text>
            </View>
          )}

          {

}
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={(v) => { setCaption(v.slice(0, 500)); captionTouchedRef.current = true; }}
            placeholder={t("create.step7.captionPlaceholder", {
              defaultValue: "소개글 작성 (예: #일상 #infp 케이팝 노래 좋아해요)",
            })}
            placeholderTextColor={COLORS.zinc400}
            multiline
            maxLength={500}
          />
          <Text style={styles.captionCounter}>{caption.length}/500</Text>

          {}
          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </SafeScrollView>

        {

}
        <View style={styles.bottomBar}>
          <Button
            testID="share-post-button"
            title={
              error
                ? t("common.retry", { defaultValue: "다시 시도" })
                : createdCloneId != null
                ? t("create.step7.next", { defaultValue: "다음" })
                : posting || creating
                ? t("create.submitting", { defaultValue: "잠시만요..." })
                : t("create.step7.next", { defaultValue: "다음" })
            }
            onPress={
              error
                ? () => {

                    setError(null);
                    void handleSharePost();
                  }
                : handleSharePost
            }
            variant="accent"
            disabled={idleBlocking || posting || (creating && createdCloneId == null && !error)}
          />
        </View>
      </KeyboardAvoidingView>

      {}
    </SafeView>
  );
}

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
    paddingTop: 56,
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

  videoBadge: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.violet600,
  },
  videoBadgePending: {
    backgroundColor: "rgba(124,58,237,0.85)",
  },
  videoBadgeFailed: {
    backgroundColor: "rgba(239,68,68,0.9)",
  },
  videoBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
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

  captionCounter: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    color: COLORS.zinc400,
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
