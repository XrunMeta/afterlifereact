import v_a3453e, { v_5ab095, v_e662ae, v_c4deb2, v_df9f57 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_9cabcb,
  v_326be8,
  v_0e1f26,
  type v_5b67a3,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import v_e775af from "../../components/ui/TextField";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_694b7f } from "../../api/source";
import { v_7b4c9e } from "../../api/clones";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_35413f } from "../../types/domain";

type Props = v_432191<v_8ad91b, "Chat">;

export default function v_02d653({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_03c87c = [v_8d41d7("chat.quickAction1"), v_8d41d7("chat.quickAction2"), v_8d41d7("chat.quickAction3")];
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_493eec = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_033e14 = v_e0068c();
  const v_ebdf9a = v_e662ae<v_9cabcb>(null);

  const v_8387df = v_df9f57<v_35413f[]>(
    () =>
      v_694b7f.messages()
        .filter((v_35f85c) => v_35f85c.cloneId === v_6e0fd3 && v_35f85c.userId === v_493eec)
        .slice()
        .sort((v_779914, v_148ff6) => v_779914.timestamp.localeCompare(v_148ff6.timestamp)),
    [v_6e0fd3, v_493eec],
  );
  const [v_fa56e0, v_41d55d] = v_5ab095<v_35413f[]>(v_8387df);
  const [v_bbda62, v_c31db7] = v_5ab095("");

  const [v_7e4acc, v_de86c2] = v_5ab095(0);

  const v_dfb220 = v_eb25ce?.displayName ?? v_8d41d7("chat.personaFallback");

  v_c4deb2(() => {
    const v_ef3bab =
      v_326be8.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const v_ffd7d0 =
      v_326be8.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const v_2fc242 = (e: v_5b67a3) =>
      v_de86c2(v_9e86fd.endCoordinates.height);
    const v_ee811a = () => v_de86c2(0);
    const v_53f5d7 = v_0e1f26.addListener(v_ef3bab, v_2fc242);
    const v_52528b = v_0e1f26.addListener(v_ffd7d0, v_ee811a);
    return () => {
      v_53f5d7.remove();
      v_52528b.remove();
    };
  }, []);

  const v_b5ad49 =
    v_7e4acc > 0 ? 58 : Math.max(v_033e14.bottom, 12);

  const v_91af42 = () => {
    setTimeout(() => {
      v_ebdf9a.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  v_c4deb2(() => {
    v_91af42();
  }, [v_fa56e0]);

  const v_465869 = () => {
    if (!v_bbda62.trim()) return;

    const userMsg: v_35413f = {
      id: Date.now(),
      cloneId: v_6e0fd3,
      userId: v_493eec,
      role: "user",
      content: v_bbda62,
      timestamp: new Date().toISOString(),
    };
    v_41d55d((v_ba2215) => [...v_ba2215, v_43f890]);
    v_c31db7("");

    if (v_2ca7e0) {
      console.log(`[Chat] POST /oth-path${v_6e0fd3}/chat-event`);
      v_7b4c9e(v_2ca7e0, v_6e0fd3)
        .then((v_8f00b9) =>
          console.log(`[Chat] chat-event ← ok scoreApplied=${v_8f00b9.scoreApplied ?? 0}°C (Daily Cap 15°C)`),
        )
        .catch((v_49263d) => console.warn("[Chat] postCloneChatEvent failed:", v_49263d));
    } else {
      console.warn(`[Chat] chat-event SKIP — no accessToken (cloneId=${v_6e0fd3})`);
    }

    setTimeout(() => {
      const aiMsg: v_35413f = {
        id: Date.now() + 1,
        cloneId: v_6e0fd3,
        userId: v_493eec,
        role: "clone",
        content: v_8d41d7("chat.stockReply"),
        timestamp: new Date().toISOString(),
      };
      v_41d55d((v_ba2215) => [...v_ba2215, v_4d04a7]);
    }, 1000);
  };

  const v_9f6fdd = (v_3a5fef) => {
    const v_d5dda0 = new Date(v_3a5fef);
    return v_d5dda0.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const v_82c167 = ({ item: v_8c0b26 }: { item: v_35413f }) => {
    const v_ca7346 = v_8c0b26.role === "user";

    return (
      <View style={v_fd5f43.msgContainer}>
        {!v_ca7346 && <Text style={v_fd5f43.trainerLabel}>AI TRAINER</Text>}
        {v_ca7346 && (
          <View style={v_fd5f43.userNameRow}>
            <Text style={v_fd5f43.userName}>{v_dfb220}</Text>
          </View>
        )}
        <View style={[v_fd5f43.bubbleRow, v_ca7346 && v_fd5f43.bubbleRowUser]}>
          <View style={[v_fd5f43.bubble, v_ca7346 ? v_fd5f43.bubbleUser : v_fd5f43.bubbleClone]}>
            <Text style={[v_fd5f43.bubbleText, v_ca7346 && v_fd5f43.bubbleTextUser]}>
              {v_8c0b26.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        v_fd5f43.container,
        v_7e4acc > 0 && { paddingBottom: v_7e4acc },
      ]}
    >
      {}
      <View style={[v_fd5f43.header, { paddingTop: v_033e14.top + 8 }]}>
        <View style={v_fd5f43.headerRow}>
          <TouchableOpacity style={v_fd5f43.backBtn} onPress={() => v_c65f5d.goBack()}>
            <Feather name="arrow-left" size={22} color={v_1bfbd0.zinc900} />
          </TouchableOpacity>
          <View style={v_fd5f43.headerCenter}>
            <Text style={v_fd5f43.headerName}>{v_dfb220}</Text>
            <Text style={v_fd5f43.headerSub}>{v_8d41d7("chat.subTitle")}</Text>
          </View>
          <TouchableOpacity style={{ padding: 4 }}>
            <Feather name="more-vertical" size={22} color={v_1bfbd0.zinc600} />
          </TouchableOpacity>
        </View>

        {}
        <View style={v_fd5f43.progressCard}>
          <View style={v_fd5f43.progressHeader}>
            <View style={v_fd5f43.progressLeft}>
              <Feather name="zap" size={16} color="#f97316" />
              <Text style={v_fd5f43.progressLabel}>{v_8d41d7("chat.trainingLabel")}</Text>
            </View>
            <Text style={v_fd5f43.progressPercent}>65%</Text>
          </View>
          <View style={v_fd5f43.progressTrack}>
            <View style={v_fd5f43.progressFill} />
          </View>
          <Text style={v_fd5f43.progressHint}>{v_8d41d7("chat.trainingHint")}</Text>
        </View>
      </View>

      {}
      <FlatList
        ref={v_ebdf9a}
        style={v_fd5f43.messageListFlex}
        data={v_fa56e0}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
        renderItem={v_82c167}
        contentContainerStyle={v_fd5f43.messageList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {}
      <View style={[v_fd5f43.inputArea, { paddingBottom: v_b5ad49 }]}>
        {}
        <FlatList
          data={v_03c87c}
          keyExtractor={(v_8c0b26) => v_8c0b26}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={v_fd5f43.quickRow}
          renderItem={({ item: v_8c0b26 }) => (
            <TouchableOpacity style={v_fd5f43.quickBtn}>
              <Text style={v_fd5f43.quickText}>{v_8c0b26}</Text>
            </TouchableOpacity>
          )}
        />

        {}
        <View style={v_fd5f43.inputRow}>
          <TouchableOpacity style={v_fd5f43.plusBtn}>
            <Feather name="plus" size={20} color={v_1bfbd0.zinc600} />
          </TouchableOpacity>

          <View style={v_fd5f43.inputWrap}>
            <TextField
              value={v_bbda62}
              onChangeText={v_c31db7}
              placeholder={v_8d41d7("chat.messagePlaceholder")}
              onSubmitEditing={v_465869}
              returnKeyType="send"
              rounded={v_8b0c90.full}
              rightIcon={
                <TouchableOpacity>
                  <Feather name="mic" size={18} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              }
            />
          </View>

          <TouchableOpacity
            style={[v_fd5f43.sendBtn, !v_bbda62.trim() && v_fd5f43.sendBtnDisabled]}
            onPress={v_465869}
            disabled={!v_bbda62.trim()}
          >
            <Feather name="send" size={18} color={v_1bfbd0.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  container: { flex: 1, backgroundColor: v_1bfbd0.white },
  messageListFlex: { flex: 1 },

  header: {
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
    paddingHorizontal: v_9b1a04.medium,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  headerSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 1 },

  progressCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.zinc50,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  progressPercent: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  progressTrack: {
    height: 8,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.full,
    overflow: "hidden",
  },
  progressFill: {
    width: "65%",
    height: "100%",
    borderRadius: v_8b0c90.full,
    backgroundColor: "#f97316",
  },
  progressHint: { fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 8 },

  messageList: {
    paddingHorizontal: v_9b1a04.medium,
    paddingVertical: 16,
    gap: 20,
  },
  msgContainer: { marginBottom: 4 },
  trainerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: v_1bfbd0.zinc400,
    letterSpacing: 1,
    marginBottom: 8,
  },
  userNameRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  userName: { fontSize: 12, color: v_1bfbd0.zinc500 },
  bubbleRow: { flexDirection: "row" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    maxWidth: "85%",
  },
  bubbleClone: {
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  bubbleUser: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: v_1bfbd0.zinc900,
  },
  bubbleTextUser: {
    color: v_1bfbd0.white,
  },

  inputArea: {
    paddingHorizontal: v_9b1a04.medium,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  quickRow: { gap: 8, marginBottom: 12 },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
  },
  quickText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc900 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  plusBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: { flex: 1 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: v_1bfbd0.zinc300,
  },
});
