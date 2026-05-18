

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_326be8,
  v_e767d1,
  v_0e1f26,
  v_122070,
  v_a2349e,
  v_39a996,
  v_cf9c33,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_194498 } from "../../stores/cloneStore";
import { v_6c3f29, v_b55477 } from "../../api/clones";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step6">;
};

type Phase =
  | "name"
  | "username"
  | "firstMeeting"
  | "habit"
  | "personality"
  | "memory";

const v_063b58 = [
  "name",
  "username",
  "firstMeeting",
  "habit",
  "personality",
  "memory",
];

const v_291e91 = "페르소나 생성 도우미";

const v_90ef75 = require("../../../assets/images/symbol.png");

const v_64bd1a = [
  "안녕하세요! 페르소나 생성 도우미입니다",
];

const v_d57121 = {
  name: {
    prompt: "지금 생성하는 페르소나의 이름이 뭔가요??\n평소에 부르던 이름이나 별명도 좋아요",
    placeholder: "예: 별이, 할머니, 모리",
    multiline: false,
    ack: "좋아요, 잘 기억해뒀어요!",
  },
  username: {
    prompt: "@아이디는 어떻게 할까요?\n영문 소문자, 숫자, _ 만 가능해요. 비워두시면 자동으로 만들어드릴게요!",
    placeholder: "예: starry_kim, modi_v",
    multiline: false,
    ack: "확인했습니다! 다음 질문이에요.",
  },
  firstMeeting: {
    prompt: "처음 만난 이야기를 들려주실래요?\n특별했던 순간이나 첫인상이 궁금해요.",
    placeholder: "예: 학교에서 처음 봤을 때 차가워 보였는데, 말 걸어보니 정말 순진했어요.",
    multiline: true,
    ack: "정말 소중한 순간이네요!",
  },
  habit: {
    prompt: "자주 하던 말이나 인상적인 습관이 있었나요?\n사소한 것도 좋아요!",
    placeholder: "예: 기분 좋으면 '하자, 하자!' 하고 아이처럼 말을 반복했어요.",
    multiline: true,
    ack: "그런 모습까지 잘 기억해둘게요!",
  },
  personality: {
    prompt: "성격은 어땠어요?\nMBTI 가 떠오르면 같이 알려주셔도 좋고, 평소 모습을 말씀해주셔도 돼요.",
    placeholder: "예: MBTI 는 INFP 였고, 사람 만나는 건 좋아했지만 집에 오면 방전되곤 했어요.",
    multiline: true,
    ack: "성격까지 다 들었어요!",
  },
  memory: {
    prompt: "마지막으로, 눈 감으면 떠오르는 한 장면이 있으면 들려주실래요?\n가장 행복하게 웃던 순간이면 좋아요.",
    placeholder: "예: 놀이동산에서 불꽃 터질 때 고백했었는데, 해맑게 웃으면서 받아줬어요.",
    multiline: true,
    ack: "다 들었어요! 이제 페르소나 만들러 가볼게요.",
  },
};

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
}

let v_aee24b = 1;
function v_67d24a(): string {
  return `m${v_aee24b++}_${Date.now()}`;
}

const v_aabc29 = new Set([
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const);
type PersonaMbtiCode = "ISTJ"|"ISFJ"|"INFJ"|"INTJ"|"ISTP"|"ISFP"|"INFP"|"INTP"|"ESTP"|"ESFP"|"ENFP"|"ENTP"|"ESTJ"|"ESFJ"|"ENFJ"|"ENTJ";
function v_ab7d46(v_9b6134): PersonaMbtiCode | undefined {
  const v_35f85c = v_9b6134.match(/\b([EI][NS][FT][JP])\b/i);
  if (!v_35f85c) return undefined;
  const v_c99bd2 = v_35f85c[1]!.toUpperCase() as PersonaMbtiCode;
  return v_aabc29.has(v_c99bd2) ? v_c99bd2 : undefined;
}

export default function v_baac2f({ navigation: v_c65f5d }: Props) {
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const v_033e14 = v_e0068c();

  const [v_fa56e0, v_41d55d] = v_5ab095<ChatMessage[]>([]);

  const [v_0c285f, v_133e53] = v_5ab095<number | null>(null);

  const [v_bbda62, v_c31db7] = v_5ab095<string>("");

  const [v_6bae32, v_a0f9c4] = v_5ab095<boolean>(false);

  const v_03f138 = v_e662ae<Partial<Record<Phase, string>>>({});

  const [v_dff7ca, v_08d488] = v_5ab095<boolean>(false);

  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const v_91af42 = v_de06a3(() => {
    requestAnimationFrame(() => {
      v_5ca6b8.current?.scrollToEnd({ animated: true });
    });
  }, []);
  v_c4deb2(() => {
    v_91af42();
  }, [v_fa56e0, v_6bae32, v_91af42]);

  const v_f76640 = v_de06a3(async (v_9b6134, v_76e791 = 600) => {
    v_a0f9c4(true);
    await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, v_76e791));
    v_a0f9c4(false);
    v_41d55d((v_ba2215) => [...v_ba2215, { id: v_67d24a(), role: "ai", text: v_9b6134 }]);
  }, []);

  const v_13cb29 = v_de06a3((v_9b6134) => {
    v_41d55d((v_ba2215) => [...v_ba2215, { id: v_67d24a(), role: "user", text: v_9b6134 }]);
  }, []);

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      for (let v_ebec57 = 0; v_ebec57 < v_64bd1a.length; v_ebec57++) {
        if (v_2008a4) return;
        await v_f76640(v_64bd1a[v_ebec57]!, v_ebec57 === 0 ? 400 : 700);
      }
      if (v_2008a4) return;

      v_133e53(0);
      await v_f76640(v_d57121[v_063b58[0]!].prompt, 500);
    })();
    return () => {
      v_2008a4 = true;
    };

  }, []);

  const v_55bfb2 = v_0c285f != null && v_0c285f < v_063b58.length ? v_063b58[v_0c285f]! : null;
  const v_4b0b18 = v_df9f57(() => {
    if (v_55bfb2) return v_d57121[v_55bfb2].placeholder;
    return "답변을 입력하세요...";
  }, [v_55bfb2]);
  const v_577bb3 = v_df9f57(() => {
    return v_55bfb2 ? v_d57121[v_55bfb2].multiline : true;
  }, [v_55bfb2]);

  const v_fa41c6 = (): string => {
    const v_779914 = v_03f138.current;
    const v_946c09 = [];
    if (v_779914.firstMeeting) v_946c09.push(`[첫 만남]\n${v_779914.firstMeeting.trim()}`);
    if (v_779914.habit) v_946c09.push(`[습관/말투]\n${v_779914.habit.trim()}`);
    if (v_779914.personality) v_946c09.push(`[성격]\n${v_779914.personality.trim()}`);
    if (v_779914.memory) v_946c09.push(`[가장 선명한 추억]\n${v_779914.memory.trim()}`);
    return v_946c09.join("\n\n");
  };

  const v_fbb22a = async () => {
    if (v_55bfb2 == null) return;
    const v_9b6134 = v_bbda62.trim();
    if (!v_9b6134 && v_55bfb2 !== "username") return; 

    if (v_55bfb2 === "name") {

      if (v_9b6134.length === 0) return;
      v_13cb29(v_9b6134);
      v_03f138.current.name = v_9b6134;
      v_5795de({ name: v_9b6134 });
      v_c31db7("");

      await v_f76640(v_d57121[v_55bfb2].ack, 400);
      const v_a448ad = v_0c285f! + 1;
      v_133e53(v_a448ad);
      if (v_a448ad < v_063b58.length) {
        await v_f76640(v_d57121[v_063b58[v_a448ad]!].prompt, 500);
      }
      return;
    }

    if (v_55bfb2 === "username") {

      if (v_9b6134.length === 0) {
        const v_bff627 = v_b55477(v_03f138.current.name || "user");
        v_13cb29(`(빈 칸 — ${v_bff627} 로 자동 생성)`);
        v_03f138.current.username = v_bff627;
        v_5795de({ username: v_bff627 });
        v_c31db7("");
        await v_f76640(v_d57121[v_55bfb2].ack, 400);
        const v_a448ad = v_0c285f! + 1;
        v_133e53(v_a448ad);
        if (v_a448ad < v_063b58.length) {
          await v_f76640(v_d57121[v_063b58[v_a448ad]!].prompt, 500);
        }
        return;
      }
      const v_479f05 = v_9b6134.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(v_479f05)) {
        v_889fad("아이디 형식 오류", "영문 소문자, 숫자, _ 만 사용 가능해요.");
        return;
      }
      if (v_479f05.length < 3) {
        v_889fad("아이디 길이", "아이디는 3자 이상이어야 해요.");
        return;
      }
      if (v_479f05.length > 30) {
        v_889fad("아이디 길이", "아이디는 30자 이하여야 해요.");
        return;
      }

      if (v_dff7ca) return;
      v_08d488(true);
      try {
        const v_cb35cb = await v_6c3f29(v_479f05);
        if (!v_cb35cb.available) {
          let v_badeaf = "이미 사용중인 아이디예요. 다른 걸 입력해주세요.";
          if (v_cb35cb.reason === "reserved") v_badeaf = "예약된 아이디입니다. 다른 아이디를 입력해주세요.";
          else if (v_cb35cb.reason === "invalid") v_badeaf = "아이디 형식이 올바르지 않아요.";
          v_889fad("사용할 수 없는 아이디", v_badeaf);
          return;
        }
      } catch (v_49263d) {
        console.warn("[Step6] checkCloneUsername failed:", v_49263d);

      } finally {
        v_08d488(false);
      }
      v_13cb29(`@${v_479f05}`);
      v_03f138.current.username = v_479f05;
      v_5795de({ username: v_479f05 });
      v_c31db7("");
      await v_f76640(v_d57121[v_55bfb2].ack, 400);
      const v_a448ad = v_0c285f! + 1;
      v_133e53(v_a448ad);
      if (v_a448ad < v_063b58.length) {
        await v_f76640(v_d57121[v_063b58[v_a448ad]!].prompt, 500);
      }
      return;
    }

    v_13cb29(v_9b6134);
    v_03f138.current[v_55bfb2] = v_9b6134;
    v_c31db7("");

    if (v_55bfb2 === "personality") {
      const v_42f66e = v_ab7d46(v_9b6134);
      if (v_42f66e) v_5795de({ personaMbti: v_42f66e });
    }

    await v_f76640(v_d57121[v_55bfb2].ack, 400);

    const v_a448ad = v_0c285f! + 1;
    v_133e53(v_a448ad);
    if (v_a448ad < v_063b58.length) {
      await v_f76640(v_d57121[v_063b58[v_a448ad]!].prompt, 500);
    } else {

      v_5795de({ personaNotes: v_fa41c6() });
      await v_f76640("이제 게시물 작성 화면으로 갈게요!", 700);
      setTimeout(() => {
        v_c65f5d.navigate("Step7");
      }, 1000);
    }
  };

  const v_c7ac57 = () => {
    v_0e1f26.dismiss();
    v_c65f5d.goBack();
  };

  const v_199303 = v_0c285f != null && v_0c285f >= v_063b58.length;
  const v_9399bb = (() => {
    if (v_55bfb2 == null) return false; 
    if (v_55bfb2 === "username") return !v_dff7ca; 
    return v_bbda62.trim().length > 0;
  })();

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      {

}
      <View style={[v_fd5f43.header, { paddingTop: v_033e14.top + 6 }]}>
        <TouchableOpacity onPress={v_c7ac57} hitSlop={12} style={v_fd5f43.backBtn}>
          <Feather name="arrow-left" size={22} color={v_1bfbd0.zinc900} />
        </TouchableOpacity>
        <View style={v_fd5f43.headerCenter}>
          <View style={v_fd5f43.headerAvatar}>
            <Image source={v_90ef75} style={v_fd5f43.headerAvatarImg} resizeMode="contain" />
          </View>
          <Text style={v_fd5f43.headerName}>{v_291e91}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={v_326be8.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={v_326be8.OS === "ios" ? 0 : 0}
      >
        {}
        <ScrollView
          ref={v_5ca6b8}
          style={v_fd5f43.chatScroll}
          contentContainerStyle={v_fd5f43.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {v_fa56e0.map((v_35f85c, v_ebec57) => {
            const v_0bd65d = v_35f85c.role === "ai";

            const v_ba2215 = v_fa56e0[v_ebec57 - 1];
            const v_80139d = v_ba2215 && v_ba2215.role === v_35f85c.role;
            return (
              <View key={v_35f85c.id} style={[v_fd5f43.row, v_0bd65d ? v_fd5f43.rowAi : v_fd5f43.rowUser]}>
                {v_0bd65d && (
                  <View style={[v_fd5f43.avatar, v_80139d && { opacity: 0 }]}>
                    <Image source={v_90ef75} style={v_fd5f43.avatarImg} resizeMode="contain" />
                  </View>
                )}
                <View
                  style={[
                    v_fd5f43.bubble,
                    v_0bd65d ? v_fd5f43.bubbleAi : v_fd5f43.bubbleUser,
                    v_0bd65d && v_80139d && { marginLeft: 0 },
                  ]}
                >
                  <Text style={v_0bd65d ? v_fd5f43.bubbleTextAi : v_fd5f43.bubbleTextUser}>{v_35f85c.text}</Text>
                </View>
              </View>
            );
          })}
          {}
          {v_6bae32 && (
            <View style={[v_fd5f43.row, v_fd5f43.rowAi]}>
              <View style={v_fd5f43.avatar}>
                <Image source={v_90ef75} style={v_fd5f43.avatarImg} resizeMode="contain" />
              </View>
              <View style={[v_fd5f43.bubble, v_fd5f43.bubbleAi, v_fd5f43.typingBubble]}>
                <ActivityIndicator size="small" color={v_1bfbd0.zinc500} />
              </View>
            </View>
          )}
        </ScrollView>

        {}
        {
}
        <View style={v_fd5f43.inputBar}>
          <TextInput
            style={[v_fd5f43.input, v_577bb3 && v_fd5f43.inputMultiline]}
            value={v_bbda62}
            onChangeText={(v_81e2ef) => {
              if (v_55bfb2 === "username") {

                v_c31db7(v_81e2ef.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              } else {
                v_c31db7(v_81e2ef);
              }
            }}
            placeholder={v_4b0b18}
            placeholderTextColor={v_1bfbd0.zinc400}
            multiline={v_577bb3}
            maxLength={v_577bb3 ? 500 : 40}
            editable={!v_199303 && v_55bfb2 != null}
            returnKeyType={v_577bb3 ? "default" : "send"}
            onSubmitEditing={v_577bb3 ? undefined : v_fbb22a}
            blurOnSubmit={!v_577bb3}
          />
          <TouchableOpacity
            style={[v_fd5f43.sendBtn, !v_9399bb && v_fd5f43.sendBtnDisabled]}
            onPress={v_fbb22a}
            disabled={!v_9399bb}
            activeOpacity={0.85}
          >
            <Feather name="send" size={18} color={v_9399bb ? v_1bfbd0.white : v_1bfbd0.zinc400} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
    backgroundColor: v_1bfbd0.white,
  },
  backBtn: { padding: 8, width: 38 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarImg: { width: 22, height: 22 },
  headerName: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },

  chatScroll: { flex: 1, backgroundColor: "#f1f5f9"  },
  chatContent: { paddingVertical: 16, paddingHorizontal: 12, gap: 8 },

  row: { flexDirection: "row", alignItems: "flex-end", gap: 6, maxWidth: "100%" },
  rowAi: { justifyContent: "flex-start" },
  rowUser: { justifyContent: "flex-end" },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    overflow: "hidden",
  },
  avatarImg: { width: 24, height: 24 },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    maxWidth: "75%",
  },
  bubbleAi: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  bubbleUser: {
    backgroundColor: v_1bfbd0.violet600,
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  bubbleTextAi: { fontSize: 14, color: v_1bfbd0.zinc900, lineHeight: 20 },
  bubbleTextUser: { fontSize: 14, color: v_1bfbd0.white, lineHeight: 20 },

  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8, 
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc50,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  inputMultiline: { paddingTop: 10 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc200 },
});

void v_9b1a04;
void v_8b0c90;
