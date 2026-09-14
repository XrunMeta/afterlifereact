import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_39a996,
  v_03e392,
  v_aa7413,
  v_09d0e5,
  v_79c4f2,
  v_4623af,
  v_e767d1,
  v_326be8,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";

import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_affcc0 } from "../../types/clone";
import { v_39eaf5, v_b55477, v_96d757, v_6c3f29, v_5e388b, v_b4f9f6, v_b20cba, v_ab4719, type v_e5d62a } from "../../api/clones";
import { v_8b11b8 } from "../../lib/experimentalPipelineFlag";
import { v_84a859 } from "../../api/auth";
import { v_7d2692 } from "../../api/files";
import { v_cf9c33 } from "rcmrninabrnb";
import { v_110960, v_52ec3e } from "euzpkmxzoe";
import { v_04686a } from "../../lib/imagePicker";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step7">;
};

const v_1fc273 = [
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

const v_549a47 = {
  memlow: { title: '추억을 이어가요',     sub: '편지가 도착했을 때 함께 읽어봐요.' },
  friend: { title: '친구가 준비됐어요',   sub: '첫 대화를 시작해 볼까요?' },
  mentor: { title: '멘토가 준비됐어요',   sub: '분야별 질문을 남겨 보세요.' },
  celeb:  { title: '팬클럽이 시작됐어요', sub: '첫 메시지를 남겨 보세요.' },
};

function v_1d1af8(v_1833e7, v_dd8af0): string {
  const v_f4e98d = (v_1833e7 ?? "").trim();

  const v_0671ac = (v_fd5f43): boolean => {
    if (!v_fd5f43) return false;
    const v_c99bd2 = v_fd5f43.charCodeAt(v_fd5f43.length - 1) - 0xac00;
    if (v_c99bd2 < 0 || v_c99bd2 > 11171) return false; 
    return v_c99bd2 % 28 !== 0;
  };
  const v_aa444d = v_f4e98d
    ? `안녕하세요, ${v_f4e98d}${v_0671ac(v_f4e98d) ? "이에요" : "예요"}.`
    : "안녕하세요, 만나서 반가워요.";
  const v_2534ba = {
    memlow:
      "함께한 추억이 아직 마음에 남아 있어요. 편지가 도착하면 언제든 함께 읽어봐요. 소소한 이야기라도 들려주시면 좋겠어요.",
    friend:
      "편하게 말 걸어주세요. 하루 있었던 일, 요즘 관심사, 사소한 고민까지 뭐든 이야기해요. 같이 웃고 같이 생각하고 싶어요.",
    mentor:
      "궁금한 게 있으면 언제든 물어봐 주세요. 아는 만큼 정성껏 나눠드릴게요. 함께 배우고 성장하는 시간을 만들어요.",
    celeb:
      "만나 뵙게 되어 정말 반가워요. 팬 여러분과 이야기 나누는 이 시간을 아낍니다. 궁금한 것도, 응원의 말도 편하게 남겨주세요.",
  };
  const v_ba70d8 =
    v_2534ba[(v_dd8af0 ?? "") as string] ??
    "편하게 이야기 나눠봐요. 관심사도, 오늘 있었던 소소한 일도, 궁금한 것도 뭐든 좋아요. 함께 즐거운 시간 보내요.";
  return `${v_aa444d} ${v_ba70d8}`;
}

function v_78ed2a({ uri: v_cd1446 }: { uri: string }) {
  const { t: v_8d41d7 } = v_772971();
  const v_86394a = v_110960(v_cd1446, (v_e2a85c) => {
    v_e2a85c.loop = true;
    v_e2a85c.muted = true;
    v_e2a85c.play();
  });
  return (
    <View style={v_d81136.previewBox}>
      <VideoView
        player={v_86394a}
        style={v_472849.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={v_d81136.videoBadge}>
        <Text style={v_d81136.videoBadgeText}>
          {v_8d41d7("create.step7.videoReady", { defaultValue: "영상 준비 완료" })}
        </Text>
      </View>
    </View>
  );
}

export default function v_448ad1({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_7a77e1 = v_194498((v_fd5f43) => v_fd5f43.resetCreationDraft);
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const v_956393 = v_194498((v_fd5f43) => v_fd5f43.addClone);
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_af4871, v_67122d] = v_5ab095<number | null>(null);
  const [v_805753, v_c7169b] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  const v_b12f33 = v_e662ae(false);

  const v_6de415 = v_e662ae<string | undefined>(undefined);

  const [v_7f3fda, v_3773cd] = v_5ab095<v_e5d62a | null>(null);
  const v_835261 = v_e662ae<ReturnType<typeof setInterval> | null>(null);

  const v_1c6048 = v_e662ae(false);
  const [v_6044a8, v_1d6b6a] = v_5ab095(() => {
    const v_41b99d = (v_f04727.description ?? "").slice(0, 500);
    if (v_41b99d) return v_41b99d;
    v_1c6048.current = true;
    return v_1d1af8(v_f04727.name, v_f04727.relation);
  });

  const v_d9bc63 = v_e662ae(false);

  v_c4deb2(() => {
    if (
      v_f04727.description &&
      !v_d9bc63.current &&
      (v_6044a8.trim().length === 0 || v_1c6048.current)
    ) {
      v_1d6b6a(v_f04727.description.slice(0, 500));
      v_1c6048.current = false;
    }

  }, [v_f04727.description]);

  v_c4deb2(() => {
    const v_04211c = v_f04727.idleVideoJobId;
    if (!v_04211c || !v_2ca7e0) return;
    let v_759436 = true;
    const v_16badd = async () => {
      try {
        const v_d5ec97 = await v_b20cba(v_2ca7e0, v_04211c);
        if (!v_759436) return;
        v_3773cd(v_d5ec97);
        if (v_d5ec97.status === 'done' || v_d5ec97.status === 'failed') {
          if (v_835261.current) {
            clearInterval(v_835261.current);
            v_835261.current = null;
          }
        }
      } catch (v_9e86fd) {
        console.warn('[Step7] idle job poll error:', v_9e86fd);
      }
    };
    void v_16badd();
    v_835261.current = setInterval(v_16badd, 4000);
    return () => {
      v_759436 = false;
      if (v_835261.current) {
        clearInterval(v_835261.current);
        v_835261.current = null;
      }
    };

  }, [v_f04727.idleVideoJobId, v_2ca7e0]);

  const [v_f6dbfe, v_f77874] = v_5ab095(false);

  const v_798360 = v_f04727.idleVideoJobId ? v_7f3fda?.status !== 'done' : true;

  const v_a3d9bc = v_de06a3(async () => {
    if (v_f6dbfe) return;

    if (!v_2ca7e0) {
      v_889fad(v_8d41d7('create.step7.loginNeeded', { defaultValue: '로그인 정보가 없어요. 다시 로그인해주세요.' }));
      return;
    }
    try {
      const v_43c42e = await v_04686a({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (v_43c42e.canceled || !v_43c42e.assets[0]) return;
      const v_cd1446 = v_43c42e.assets[0].uri;
      v_f77874(true);
      const v_40a923 = v_cd1446.split('.').pop()?.toLowerCase() ?? '';
      const v_b66751 =
        v_40a923 === 'png' ? 'image/png'
        : v_40a923 === 'webp' ? 'image/webp'
        : v_40a923 === 'gif' ? 'image/gif'
        : 'image/jpeg';
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_cd1446, {
        purpose: 'clone_avatar',
        mimeType: v_b66751,
        fileName: `avatar.${v_40a923 || 'jpg'}`,
      });

      const v_94abbb = await v_ab4719(v_2ca7e0, {
        kind: 'idle_video',
        src_file_id: v_57ac81.id,
        ...(v_f04727.idleEngine ? { engine: v_f04727.idleEngine } : {}),
      });

      v_3773cd(null);

      v_5795de({
        imageFile: v_cd1446,
        avatarFileId: v_57ac81.id,
        avatarUrl: v_57ac81.url,
        idleVideoJobId: v_94abbb.job_id,
      });
      v_6de415.current = v_57ac81.url;
    } catch (v_49263d) {
      console.warn('[Step7] 재업로드 실패:', v_49263d);

      v_889fad(
        v_8d41d7('create.step7.uploadFailedTitle', { defaultValue: '업로드 실패' }),
        v_8d41d7('create.step7.uploadFailedMsg', { defaultValue: '영상 생성 요청에 실패했어요. 다시 시도해주세요.' }),
      );
    } finally {
      v_f77874(false);
    }
  }, [v_f6dbfe, v_2ca7e0, v_5795de, v_8d41d7]);

  const [v_c3de9c, v_4b9b17] = v_5ab095(false);

  const v_140aea = v_de06a3(
    async (): Promise<number> => {
      const v_f04727 = v_194498.getState().creationDraft;
      console.log("[CLONE-CREATE] attemptCreate start. draft snapshot:", {
        cloneType: v_f04727.cloneType,
        name: v_f04727.name,
        username: v_f04727.username,
        hasImage: !!v_f04727.imageFile,
        hasVoice: !!(v_f04727.voiceFile || v_f04727.voiceSampleId),
        descriptionLen: v_f04727.description?.length ?? 0,
        notesLen: v_f04727.personaNotes?.length ?? 0,
      });
      if (!v_2ca7e0) {
        throw new Error("로그인 정보가 없어요. 다시 로그인해주세요.");
      }

      const v_01a739 = Boolean(v_f04727.imageFile);
      const v_f9c770 = Boolean(
        v_f04727.voiceFile || v_f04727.voiceSampleId || (v_f04727.recordDuration ?? 0) >= 30,
      );

      const v_818579 = v_f04727.visibility ?? "public";

      const v_ae88f2 = v_f04727.username?.trim() ?? "";
      const v_aad0e1 = v_96d757(v_ae88f2);
      if (v_ae88f2.length > 0 && v_aad0e1) {
        throw new Error(v_aad0e1);
      }
      const v_556427 = v_ae88f2.length > 0 ? v_ae88f2 : v_b55477(v_f04727.name || "user");

      const v_55a58f = {
        ...(v_f04727.personaAge ? { age: v_f04727.personaAge } : {}),
        ...(v_f04727.personaGender ? { gender: v_f04727.personaGender } : {}),
        ...(v_f04727.personaTypes && v_f04727.personaTypes.length > 0
          ? { personalities: v_f04727.personaTypes.join(",") }
          : {}),
        ...(v_f04727.personaMbti ? { mbti: v_f04727.personaMbti } : {}),
      };
      const v_564b6a = { attrs: v_55a58f, notes: v_f04727.personaNotes ?? "" };

      const v_60d170 = v_f04727.personaAnswers ?? {};

      let v_bf6b43 = v_6de415.current ?? v_f04727.avatarUrl;
      if (!v_bf6b43 && v_f04727.imageFile) {
        try {
          const v_40a923 = v_f04727.imageFile.split(".").pop()?.toLowerCase() ?? "";
          const v_b66751 =
            v_40a923 === "png" ? "image/png"
            : v_40a923 === "webp" ? "image/webp"
            : v_40a923 === "gif" ? "image/gif"
            : "image/jpeg";
          console.log("[CLONE-CREATE] avatar uploading...", { mime: v_b66751, path: v_f04727.imageFile });
          const v_57ac81 = await v_7d2692(v_2ca7e0, v_f04727.imageFile, {
            purpose: "clone_avatar",
            mimeType: v_b66751,
            fileName: `avatar.${v_40a923 || "jpg"}`,
          });
          v_bf6b43 = v_57ac81.url;
          v_6de415.current = v_bf6b43;

          v_194498.getState().setCreationDraft({ avatarUrl: v_57ac81.url });
          console.log("[CLONE-CREATE] avatar uploaded:", v_bf6b43);
        } catch (v_9b4b36) {
          console.warn("[CLONE-CREATE] avatar upload failed:", v_9b4b36);

          throw new Error(
            `이미지 업로드에 실패했어요. 네트워크 상태를 확인해주세요. (${v_9b4b36 instanceof Error ? v_9b4b36.message : "unknown"})`,
          );
        }
      }

      const v_285e72 = "friend" as const;
      console.log("[CLONE-CREATE] createClone request →", {
        clone_type: v_285e72,
        name: v_f04727.name ?? "Untitled",
        username: v_556427,
        visibility: v_818579,
        hasAvatar: !!v_bf6b43,
      });

      const v_85010a = v_f04727.voiceCloneJobId
        ? { voice_clone_job_id: v_f04727.voiceCloneJobId }
        : v_f04727.voicePresetId
        ? { voice_preset_id: v_f04727.voicePresetId }
        : {};

      const v_8f00b9 = await v_39eaf5(v_2ca7e0, {
        clone_type: v_285e72,
        name: v_f04727.name ?? "Untitled",
        username: v_556427,
        description: v_f04727.description || undefined,
        category: v_f04727.category || undefined,
        visibility: v_818579,
        interests: v_f04727.interests && v_f04727.interests.length > 0 ? v_f04727.interests : undefined,
        l1_profile: v_564b6a,

        ...(Object.keys(v_60d170).length > 0 ? { personaAnswers: v_60d170 } : {}),

        ...(v_f04727.relation ? { relation: v_f04727.relation } : {}),
        ...(v_bf6b43 ? { avatar_url: v_bf6b43 } : {}),
        ...v_85010a,

        ...(v_f04727.idleVideoJobId ? { idle_video_job_id: v_f04727.idleVideoJobId } : {}),

        ...(() => {
          const v_fad2e1 = v_8b11b8();
          if (v_fad2e1) return { pipeline: v_fad2e1 };
          return {};
        })(),

      });
      console.log("[CLONE-CREATE] success:", v_8f00b9);
      const v_94519a = v_8f00b9.clone;

      const clone: v_affcc0 = {
        id: v_94519a.id,
        cloneType: v_94519a.cloneType,
        ownerId: v_493eec,
        displayName: v_94519a.name,
        description: v_f04727.description ?? "",
        interests: v_f04727.interests ?? [],
        imageUrl: v_bf6b43 ?? v_f04727.imageFile ?? undefined,
        visibility: v_94519a.visibility,
        status: v_01a739 && v_f9c770 ? "active" : "pending_assets",
        createdAt: v_94519a.createdAt,
        l1Profile: v_564b6a,
      };
      v_956393(v_eb25ce);
      if (!v_b12f33.current) {
        v_67122d(v_94519a.id);
        v_c7169b(false);
      }
      return v_94519a.id;
    },
    [v_f04727, v_2ca7e0, v_493eec, v_956393],
  );

  v_c4deb2(() => {
    if (!v_f04727.cloneType) {
      v_3a7d09(v_8d41d7("create.step7.missingCloneInfo", { defaultValue: "클론 정보가 없어요. 처음부터 다시 만들어주세요." }));
    }
  }, [v_f04727.cloneType, v_8d41d7]);

  const v_3a8949 = v_f04727.cloneType ?? 'friend';
  const v_b38746 = {
    title: v_8d41d7(`create.complete.${v_3a8949}Title` as
      | 'create.complete.memlowTitle'
      | 'create.complete.friendTitle'
      | 'create.complete.mentorTitle'
      | 'create.complete.celebTitle'),
    sub: v_8d41d7(`create.complete.${v_3a8949}Sub` as
      | 'create.complete.memlowSub'
      | 'create.complete.friendSub'
      | 'create.complete.mentorSub'
      | 'create.complete.celebSub'),
  };
  const v_ba68bf = [
    { icon: 'refresh-cw' as const, title: v_8d41d7('create.complete.featAutoLearn'), desc: v_8d41d7('create.complete.featAutoLearnDesc') },
    { icon: 'shield' as const, title: v_8d41d7('create.complete.featSecurity'), desc: v_8d41d7('create.complete.featSecurityDesc') },
  ];

  const v_791884 = () => {
    if (v_af4871 == null) return;
    v_7a77e1();
    v_c65f5d.replace('Step8', { cloneId: v_af4871 });
  };

  const v_704242 = () => {
    v_7a77e1();
    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({ name: "ClonesTab" })
    );
  };

  const v_d01790 = async () => {
    if (v_805753 || v_c3de9c) return;

    if (v_798360) {
      v_889fad(
        v_8d41d7('create.step7.waitTitle', { defaultValue: '잠깐요' }),
        v_8d41d7('create.step7.waitVideoBuilding', { defaultValue: '영상 생성이 완료되면 게시할 수 있어요.' }),
      );
      return;
    }
    const v_2f361a = v_6044a8.trim();

    const v_055e6a = {
      cloneType: v_f04727.cloneType,
      name: v_f04727.name,
      nameLen: v_f04727.name?.length ?? 0,
      username: v_f04727.username,
      description: v_f04727.description,
      hasImageFile: !!v_f04727.imageFile,
      imageFile: v_f04727.imageFile,
      visibility: v_f04727.visibility,
      category: v_f04727.category,
      interests: v_f04727.interests,
      personaAge: v_f04727.personaAge,
      personaGender: v_f04727.personaGender,
      personaMbti: v_f04727.personaMbti,
      personaTypes: v_f04727.personaTypes,
      personaNotesLen: v_f04727.personaNotes?.length ?? 0,
    };
    console.log(
      "[CLONE-CREATE] handleSharePost tap. captionLen=",
      v_2f361a.length,
      "createdCloneId=",
      v_af4871,
      "hasAccessToken=",
      !!v_2ca7e0,
    );
    console.log("[CLONE-CREATE] DRAFT DUMP:", JSON.stringify(v_055e6a, null, 2));

    if (v_2f361a.length === 0) {
      console.log("[CLONE-CREATE] BLOCKED: caption empty");
      v_889fad(
        v_8d41d7("create.step7.captionRequiredTitle", { defaultValue: "소개글" }),
        v_8d41d7("create.step7.captionRequiredMsg", { defaultValue: "한 줄 소개를 입력해주세요." }),
      );
      return;
    }

    if (!v_2ca7e0) {
      console.log("[CLONE-CREATE] BLOCKED: no accessToken");
      v_889fad(
        v_8d41d7("create.step7.loginRequiredTitle", { defaultValue: "로그인 필요" }),
        v_8d41d7("create.step7.loginNeeded", { defaultValue: "로그인 정보가 없어요. 다시 로그인해주세요." }),
      );
      return;
    }

    if (!v_f04727.name || v_f04727.name.trim().length === 0) {
      console.log("[CLONE-CREATE] BLOCKED: name missing");
      v_889fad(
        v_8d41d7("create.step7.nameMissingTitle", { defaultValue: "이름 누락" }),
        v_8d41d7("create.step7.nameMissingMsg", { defaultValue: "클론 이름이 없어요. 이전 단계로 돌아가서 입력해주세요." }),
      );
      return;
    }

    const v_62578e = v_f04727.username?.trim() ?? "";
    if (v_62578e.length > 0) {
      const v_b6f6e4 = v_96d757(v_62578e);
      if (v_b6f6e4) {
        console.log("[CLONE-CREATE] BLOCKED: username invalid ―", v_62578e);
        v_889fad(
          v_8d41d7("create.step7.usernameInvalidTitle", { defaultValue: "아이디 형식 오류" }),
          v_b6f6e4,
        );
        return;
      }

      try {
        const v_e2299a = await v_6c3f29(v_62578e);
        if (!v_e2299a.available) {
          console.log("[CLONE-CREATE] BLOCKED: username unavailable ―", v_e2299a.reason);
          v_889fad(
            v_8d41d7("create.step7.usernameConflictTitle", { defaultValue: "아이디 중복" }),
            v_e2299a.reason === "reserved"
              ? "예약된 아이디입니다. 다른 아이디를 입력해주세요."
              : "이미 사용중인 아이디예요. 이전 단계에서 다른 아이디로 바꿔주세요.",
          );
          return;
        }
      } catch {

      }
    }
    console.log("[CLONE-CREATE] sanity check passed → proceed to attemptCreate");

    v_4b9b17(true);
    v_3a7d09(null);

    if (v_f04727.description !== v_2f361a) {
      v_194498.getState().setCreationDraft({ description: v_2f361a });
    }

    let v_80a1e3 = v_af4871;
    try {

      if (v_80a1e3 == null) {
        v_c7169b(true);
        v_80a1e3 = await v_140aea();
        v_c7169b(false);
        console.log("[CLONE-CREATE] new cloneId=", v_80a1e3);
      }
      if (!v_80a1e3) {

        throw new Error("클론 생성에 실패했어요. (cloneId 누락)");
      }

      const v_1458b7 = v_6de415.current ?? null;
      console.log("[CLONE-CREATE] createCloneFeed →", { cloneId: v_80a1e3, hasMedia: !!v_1458b7 });
      await v_5e388b(v_2ca7e0, v_80a1e3, {
        content: v_2f361a,
        ...(v_1458b7 ? { mediaUrl: v_1458b7, mediaType: "image" } : {}),
      });
      console.log("[CLONE-CREATE] feed created.");
    } catch (v_49263d) {
      console.warn("[CLONE-CREATE] share post failed:", v_49263d);
      v_c7169b(false);
      if (v_49263d instanceof v_84a859) {

        if (v_49263d.code === "CONFLICT" && v_49263d.message.includes("아이디")) {
          v_889fad(v_8d41d7("create.step7.usernameConflictTitle", { defaultValue: "아이디 중복" }), v_49263d.message);
          v_4b9b17(false);
          return;
        }

        v_3a7d09(v_49263d.message);
        v_889fad(
          v_8d41d7("create.step7.postFailedWithCode", { code: v_49263d.code, defaultValue: `게시 실패 (${v_49263d.code})` }),
          v_49263d.message,
        );
      } else {

        const v_badeaf = v_49263d instanceof Error
          ? v_49263d.message
          : v_8d41d7("create.step7.unknownError", { defaultValue: "알 수 없는 오류" });
        v_3a7d09(v_badeaf);
        v_889fad(v_8d41d7("create.step7.postFailed", { defaultValue: "게시 실패" }), v_badeaf);
      }
      v_4b9b17(false);
      return;
    }

    v_4b9b17(false);
    v_7a77e1();
    if (v_80a1e3) v_c65f5d.replace("Step8", { cloneId: v_80a1e3 });
  };

  const v_8a1355 = v_f04727.name ?? v_8d41d7("create.step7.displayNameFallback", { defaultValue: "사용자 이름" });
  const v_3e86f3 = v_f04727.username ?? v_8d41d7("create.step7.displayHandleFallback", { defaultValue: "아이디" });
  const v_ee89db = v_f04727.imageFile;

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      {}
      <PageHeader
        title={v_8d41d7("create.step7.reviewTitle", { defaultValue: "클론 정보 리뷰" })}
        showBackButton
        onBackPress={() => {

          if (v_c65f5d.canGoBack()) {
            v_c65f5d.goBack();
          } else {

            v_c65f5d.getParent()?.navigate("HomeTab" as never);
          }
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}

        behavior={v_326be8.OS === "ios" ? "padding" : "height"}
      >
        <SafeScrollView
          contentContainerStyle={v_d81136.composerContent}
          showBottomBackground={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"

          autoAdjustKeyboardPadding
          additionalBottomPadding={80}
        >
          {}
          <View style={v_d81136.authorRow}>
            {v_ee89db ? (
              <Image source={{ uri: v_ee89db }} style={v_d81136.authorAvatar} />
            ) : (
              <View style={[v_d81136.authorAvatar, v_d81136.authorAvatarPh]}>
                <Feather name="user" size={16} color={v_1bfbd0.zinc400} />
              </View>
            )}
            <View style={v_d81136.authorTextCol}>
              <Text style={v_d81136.authorName} numberOfLines={1}>{v_8a1355}</Text>
              <Text style={v_d81136.authorHandle} numberOfLines={1}>@{v_3e86f3}</Text>
            </View>
          </View>

          {

}
          {v_7f3fda?.status === 'done' && v_7f3fda.out_url ? (

            <IdleVideoPreview uri={v_7f3fda.out_url} />
          ) : (v_7f3fda?.status === 'failed' || (!v_f04727.idleVideoJobId && !!v_f04727.imageFile)) ? (

            <TouchableOpacity
              testID="reupload-photo-button"
              style={v_d81136.previewBox}
              onPress={v_a3d9bc}
              activeOpacity={0.8}
              disabled={v_f6dbfe}
            >
              {v_f04727.imageFile && (
                <Image source={{ uri: v_f04727.imageFile }} style={v_472849.absoluteFillObject} resizeMode="cover" />
              )}
              <View style={[v_d81136.videoBadge, v_d81136.videoBadgeFailed]}>
                {v_f6dbfe ? (
                  <>
                    <ActivityIndicator size="small" color={v_1bfbd0.white} style={{ marginRight: 6 }} />
                    <Text style={v_d81136.videoBadgeText}>
                      {v_8d41d7("create.step7.photoUploading", { defaultValue: "사진 올리는 중..." })}
                    </Text>
                  </>
                ) : (
                  <Text style={v_d81136.videoBadgeText}>
                    {v_8d41d7("create.step7.reuploadPhoto", { defaultValue: "사진 다시 올리기" })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ) : v_f04727.idleVideoJobId && (!v_7f3fda || v_7f3fda.status === 'pending' || v_7f3fda.status === 'running') ? (

            <View style={v_d81136.previewBox}>
              {v_f04727.imageFile && (
                <Image source={{ uri: v_f04727.imageFile }} style={v_472849.absoluteFillObject} resizeMode="cover" />
              )}
              <View style={[v_d81136.videoBadge, v_d81136.videoBadgePending]}>
                <ActivityIndicator size="small" color={v_1bfbd0.white} style={{ marginRight: 6 }} />
                <Text style={v_d81136.videoBadgeText}>
                  {v_8d41d7("create.step7.videoPending", { defaultValue: "영상 준비 중" })}
                </Text>
              </View>
            </View>
          ) : v_f04727.imageFile ? (
            <Image source={{ uri: v_f04727.imageFile }} style={v_d81136.previewBox} resizeMode="cover" />
          ) : (
            <View style={v_d81136.previewBox}>
              <Text style={v_d81136.previewText}>
                {v_8d41d7("create.step7.photoRequired", { defaultValue: "사진을 먼저 등록해 주세요" })}
              </Text>
            </View>
          )}

          {

}
          <TextInput
            style={v_d81136.captionInput}
            value={v_6044a8}
            onChangeText={(v_81e2ef) => { v_1d6b6a(v_81e2ef.slice(0, 500)); v_d9bc63.current = true; }}
            placeholder={v_8d41d7("create.step7.captionPlaceholder", {
              defaultValue: "소개글 작성 (예: #일상 #infp 케이팝 노래 좋아해요)",
            })}
            placeholderTextColor={v_1bfbd0.zinc400}
            multiline
            maxLength={500}
          />
          <Text style={v_d81136.captionCounter}>{v_6044a8.length}/500</Text>

          {}
          {v_5e9bfe && (
            <View style={v_d81136.errorBox}>
              <Feather name="alert-triangle" size={16} color={v_1bfbd0.error} />
              <Text style={v_d81136.errorText}>{v_5e9bfe}</Text>
            </View>
          )}
        </SafeScrollView>

        {

}
        <View style={v_d81136.bottomBar}>
          <Button
            testID="share-post-button"
            title={
              v_5e9bfe
                ? v_8d41d7("common.retry", { defaultValue: "다시 시도" })
                : v_af4871 != null
                ? v_8d41d7("create.step7.next", { defaultValue: "다음" })
                : v_c3de9c || v_805753
                ? v_8d41d7("create.submitting", { defaultValue: "잠시만요..." })
                : v_8d41d7("create.step7.next", { defaultValue: "다음" })
            }
            onPress={
              v_5e9bfe
                ? () => {

                    v_3a7d09(null);
                    void v_d01790();
                  }
                : v_d01790
            }
            variant="accent"
            disabled={v_798360 || v_c3de9c || (v_805753 && v_af4871 == null && !v_5e9bfe)}
          />
        </View>
      </KeyboardAvoidingView>

      {}
    </SafeView>
  );
}

const v_d81136 = v_472849.create({

  composerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  headerBack: { width: 40, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  headerHandle: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

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
    backgroundColor: v_1bfbd0.zinc100,
  },
  authorAvatarPh: { alignItems: "center", justifyContent: "center" },
  authorTextCol: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  authorHandle: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  previewBox: {
    width: "80%",
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
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
    backgroundColor: v_1bfbd0.violet600,
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
    color: v_1bfbd0.white,
  },

  captionInput: {
    minHeight: 100,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc50,
  },

  captionCounter: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    color: v_1bfbd0.zinc400,
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
  errorText: { flex: 1, fontSize: 13, color: v_1bfbd0.error, lineHeight: 18 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: v_9b1a04.xlarge,
  },
  creatingText: { fontSize: 14, color: v_1bfbd0.zinc600 },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
  },
  retryText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.white },

  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.xxxlarge,
  },
  container: { width: "100%", maxWidth: 780, alignItems: "center", gap: v_9b1a04.large },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: v_1bfbd0.violet500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "bold", color: v_1bfbd0.zinc900 },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    lineHeight: 20,
  },
  featureCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
  },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  featureDesc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.medium,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
  },
});
