

import v_a3453e, { v_5ab095, v_e662ae, v_c4deb2 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_122070,
  v_79c4f2,
  v_cf9c33,
  v_03e392,
  v_326be8,
  v_0e1f26,
  type v_5b67a3,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

type Props = v_432191<v_8ad91b, "Chat">;

type CallBlock = {
  id: string;
  duration: string;
  messages: Array<{ role: "persona" | "user"; text: string }>;
};

const v_4750b0 = [
  {
    id: "call-1",
    duration: "음성 통화 2m 31s",
    messages: [
      { role: "persona", text: "Yes, and I'll enter it. The." },
      {
        role: "user",
        text: "어느 정도는 안 맞는데, 이 정도면 서비스 가능해요. 대표님이 한번 해봐요.",
      },
    ],
  },
  {
    id: "call-2",
    duration: "음성 통화 32s",
    messages: [
      { role: "persona", text: "뭐 하나?" },
      {
        role: "user",
        text: "어... 오빠야? 죽는 줄 알았네... 너무 늦었잖아. 오빠가 그렇게 간다고 하더니 아직도 안 왔어.",
      },
    ],
  },
];

export default function v_02d653({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_033e14 = v_e0068c();
  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const v_dfb220 = v_eb25ce?.displayName ?? "페르소나";
  const v_e7274c = v_eb25ce?.imageUrl ?? null;

  const [v_bbda62, v_c31db7] = v_5ab095("");
  const [v_7e4acc, v_de86c2] = v_5ab095(0);

  const [v_20e160, v_955c04] = v_5ab095<CallBlock[]>(v_4750b0);

  const [v_229ff3, v_e4f239] = v_5ab095(true);

  const [v_842b8b, v_0f6477] = v_5ab095(true);

  v_c4deb2(() => {
    const v_399925 = v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_206f77 = v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_53f5d7 = v_0e1f26.addListener(v_399925, (e: v_5b67a3) => {
      v_de86c2(v_9e86fd.endCoordinates?.height ?? 0);
    });
    const v_52528b = v_0e1f26.addListener(v_206f77, () => v_de86c2(0));
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const v_465869 = () => {
    const v_2f361a = v_bbda62.trim();
    if (!v_2f361a) return;

    console.log("[Chat] send (placeholder):", v_2f361a);
    v_c31db7("");
    v_0e1f26.dismiss();
  };

  const v_ed4b67 = () => {
    v_03e392.alert(v_dfb220, undefined, [
      {
        text: v_842b8b ? "알림 끄기" : "알림 켜기",
        onPress: () => v_0f6477((v_81e2ef) => !v_81e2ef),
      },
      {
        text: "구독 취소",
        style: "destructive",
        onPress: () => {

          console.log("[Chat] 구독 취소 (placeholder) cloneId=", v_6e0fd3);
          v_c65f5d.goBack();
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const v_0fef43 = (v_be62d3, v_a6063d) => {
    v_03e392.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          v_955c04((v_ba2215) =>
            v_ba2215
              .map((v_3f4e2e) =>
                v_3f4e2e.id === v_be62d3
                  ? { ...v_3f4e2e, messages: v_3f4e2e.messages.filter((v_37eab7, v_ebec57) => v_ebec57 !== v_a6063d) }
                  : v_3f4e2e,
              )
              .filter((v_3f4e2e) => v_3f4e2e.messages.length > 0),
          );
        },
      },
    ]);
  };

  const v_53dd92 = v_7e4acc > 0 ? v_7e4acc : v_033e14.bottom;

  return (
    <View style={[v_d81136.root, { paddingTop: v_033e14.top }]}>
      {}
      <View style={v_d81136.header}>
        <TouchableOpacity
          style={v_d81136.headerIcon}
          onPress={() => v_c65f5d.goBack()}
          hitSlop={8}
          accessibilityLabel="back"
        >
          <Feather name="chevron-left" size={26} color={v_1bfbd0.zinc900} />
        </TouchableOpacity>
        {v_e7274c ? (
          <Image source={{ uri: v_e7274c }} style={v_d81136.headerAvatar} />
        ) : (
          <View style={[v_d81136.headerAvatar, v_d81136.headerAvatarFallback]}>
            <Text style={v_d81136.headerAvatarInitial}>
              {v_dfb220.charAt(0) || "?"}
            </Text>
          </View>
        )}
        <Text style={v_d81136.headerName} numberOfLines={1}>
          {v_dfb220}
        </Text>
        <View style={v_d81136.headerRight}>
          <TouchableOpacity style={v_d81136.headerActionBtn} hitSlop={8}>
            <Feather name="image" size={18} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
          <TouchableOpacity style={v_d81136.headerActionBtn} hitSlop={8}>
            <Feather name="phone" size={18} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
          <TouchableOpacity
            style={v_d81136.headerActionBtn}
            hitSlop={8}
            onPress={v_ed4b67}
          >
            <Feather name="more-horizontal" size={18} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        </View>
      </View>

      {}
      <View style={v_d81136.promoBanner}>
        <View style={v_d81136.promoIcon}>
          <Feather name="message-circle" size={16} color={v_1bfbd0.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={v_d81136.promoTitle} numberOfLines={1}>
            특별 혜택 - 재구독 시 첫 달 요금 50% 할인!
          </Text>
          <TouchableOpacity hitSlop={6}>
            <Text style={v_d81136.promoCta}>50% 할인 혜택 받기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {}
      <ScrollView
        ref={v_5ca6b8}
        style={v_d81136.scrollArea}
        contentContainerStyle={v_d81136.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {}
        {v_229ff3 && (
          <View style={v_d81136.personaIntroRow}>
            <Text style={v_d81136.personaIntroName}>{v_dfb220}</Text>
            <TouchableOpacity
              activeOpacity={1}
              onLongPress={() =>
                v_03e392.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
                  { text: "취소", style: "cancel" },
                  {
                    text: "삭제",
                    style: "destructive",
                    onPress: () => v_e4f239(false),
                  },
                ])
              }
              delayLongPress={300}
            >
              <View style={v_d81136.personaIntroBubble}>
                <Text style={v_d81136.personaIntroText}>
                  오늘 하루는 어땠어요? 퇴근길에 비 오던데 조심히 들어와요.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {}
        {v_20e160.map((v_51c3d2) => (
          <View key={v_51c3d2.id} style={v_d81136.callBlock}>
            <View style={v_d81136.callHeader}>
              <View style={v_d81136.callIconWrap}>
                <Feather name="phone" size={14} color={v_1bfbd0.white} />
              </View>
              <Text style={v_d81136.callDurationText}>{v_51c3d2.duration}</Text>
            </View>
            {v_51c3d2.messages.map((v_badeaf, v_e86ad8) => (
              <TouchableOpacity
                key={`${v_51c3d2.id}-${v_e86ad8}`}
                activeOpacity={0.85}
                onLongPress={() => v_0fef43(v_51c3d2.id, v_e86ad8)}
                delayLongPress={300}
                style={[
                  v_d81136.callBubble,
                  v_badeaf.role === "user" ? v_d81136.callBubbleRight : v_d81136.callBubbleLeft,
                ]}
              >
                <Text style={v_d81136.callBubbleText}>{v_badeaf.text}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={v_d81136.transcriptBtn} hitSlop={6}>
              <Text style={v_d81136.transcriptBtnText}>대본 보기</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {}
      <View style={[v_d81136.inputBar, { paddingBottom: v_53dd92 || 10 }]}>
        <TextInput
          style={v_d81136.inputField}
          value={v_bbda62}
          onChangeText={v_c31db7}
          placeholder={`${v_dfb220}(으)로 채팅 중`}
          placeholderTextColor={v_1bfbd0.zinc400}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={v_465869}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[v_d81136.sendBtn, !v_bbda62.trim() && v_d81136.sendBtnDisabled]}
          onPress={v_465869}
          disabled={!v_bbda62.trim()}
        >
          <Feather name="send" size={18} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1, backgroundColor: v_1bfbd0.violet100 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerIcon: { padding: 4 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: v_1bfbd0.zinc200,
  },
  headerAvatarFallback: {
    backgroundColor: v_1bfbd0.violet200, alignItems: "center", justifyContent: "center",
  },
  headerAvatarInitial: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.violet700 },
  headerName: { flex: 1, fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  headerRight: { flexDirection: "row", gap: 6 },
  headerActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center", justifyContent: "center",
  },

  promoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.violet600,
    marginHorizontal: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  promoIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  promoTitle: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  promoCta: {
    color: v_1bfbd0.white, fontSize: 13, fontWeight: "700",
    textDecorationLine: "underline",
  },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },

  personaIntroRow: { marginBottom: 20 },
  personaIntroName: { fontSize: 12, color: v_1bfbd0.zinc600, marginBottom: 6, marginLeft: 4 },
  personaIntroBubble: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  personaIntroText: { fontSize: 14, color: v_1bfbd0.zinc800, lineHeight: 20 },

  callBlock: {
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  callHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10,
  },
  callIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  callDurationText: { color: v_1bfbd0.white, fontSize: 13, fontWeight: "600" },

  callBubble: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "80%",
    marginBottom: 8,
  },
  callBubbleLeft: { alignSelf: "flex-start" },
  callBubbleRight: { alignSelf: "flex-end" },
  callBubbleText: { color: v_1bfbd0.white, fontSize: 13, lineHeight: 19 },

  transcriptBtn: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 6,
  },
  transcriptBtnText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
});
