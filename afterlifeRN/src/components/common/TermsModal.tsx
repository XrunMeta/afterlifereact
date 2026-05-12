

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_122070,
  v_39a996,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";

export type AgreementType = 1 | 2 | 3;

type Props = {
  visible: boolean;
  type: AgreementType | null;
  onClose: () => void;
  onAgree: () => void;
};

const v_a23604 = new Map<string, string>();

async function v_33650f(
  v_3b27d9,
  v_05bb19,
): Promise<string> {

  let v_c87c7a = (v_05bb19 || "ko").toLowerCase();
  if (v_c87c7a.startsWith("zh")) v_c87c7a = "zh";
  else v_c87c7a = v_c87c7a.split("-")[0]; 
  const v_b24339 = `${v_3b27d9}_${v_c87c7a}`;
  if (v_a23604.has(v_b24339)) return v_a23604.get(v_b24339)!;
  const v_f71b56 = `https://oth-path-f0013c.example.invalid/agreements?type=${v_3b27d9}&language=${v_c87c7a}`;
  console.log("[TermsModal] fetch:", v_f71b56);
  const v_8f00b9 = await fetch(v_f71b56);
  if (!v_8f00b9.ok) throw new Error(`Failed to load agreement (${v_8f00b9.status})`);
  const v_7ecfd1 = (await v_8f00b9.json()) as { data?: { content?: string } };
  const v_b43b74 = v_7ecfd1?.data?.content ?? "";
  console.log(
    `[TermsModal] response ok — content length=${v_b43b74.length}`,
  );
  v_a23604.set(v_b24339, v_b43b74);
  return v_b43b74;
}

const v_259ade = {
  1: "auth.signup.termsServiceTitle",
  2: "auth.signup.termsLocationTitle",
  3: "auth.signup.termsPrivacyTitle",
};

const v_9fab8c = {
  1: "서비스 약관",
  2: "위치정보 약관",
  3: "개인정보 약관",
};

export default function v_c0caa9({ visible: v_cf55be, type: v_3b27d9, onClose: v_0890f8, onAgree: v_5cccfe }: Props) {
  const { t: v_8d41d7, i18n: v_9c213b } = v_772971();
  const [v_b43b74, v_f435cb] = v_5ab095<string>("");
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_cf55be || !v_3b27d9) return;
    let v_2008a4 = false;
    v_34a50a(true);
    v_3a7d09(null);
    v_f435cb("");
    v_33650f(v_3b27d9, v_9c213b.language)
      .then((v_3f4e2e) => {
        if (!v_2008a4) v_f435cb(v_3f4e2e);
      })
      .catch((v_49263d) => {
        if (!v_2008a4) {
          console.warn("[TermsModal] fetch failed:", v_49263d);
          v_3a7d09(
            v_8d41d7("auth.signup.termsLoadFailed", {
              defaultValue: "약관을 불러오지 못했어요.",
            }),
          );
        }
      })
      .finally(() => {
        if (!v_2008a4) v_34a50a(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_cf55be, v_3b27d9, v_9c213b.language, v_8d41d7]);

  if (!v_3b27d9) return null;
  const v_9f1622 = v_8d41d7(v_259ade[v_3b27d9], { defaultValue: v_9fab8c[v_3b27d9] });

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="fade"
      onRequestClose={v_0890f8}
    >
      <Pressable style={v_fd5f43.overlay} onPress={v_0890f8}>
        <Pressable style={v_fd5f43.card} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
          {}
          <View style={v_fd5f43.header}>
            <View style={v_fd5f43.headerBtn} />
            <Text style={v_fd5f43.headerTitle}>{v_9f1622}</Text>
            <TouchableOpacity onPress={v_0890f8} style={v_fd5f43.headerBtn}>
              <Feather name="x" size={20} color={v_1bfbd0.zinc700} />
            </TouchableOpacity>
          </View>

          {}
          <ScrollView
            style={v_fd5f43.contentScroll}
            contentContainerStyle={v_fd5f43.contentInner}
            showsVerticalScrollIndicator
          >
            {v_683210 ? (
              <ActivityIndicator
                color={v_1bfbd0.violet500}
                style={{ marginTop: 32 }}
              />
            ) : v_5e9bfe ? (
              <Text style={v_fd5f43.errorText}>{v_5e9bfe}</Text>
            ) : (
              <Text style={v_fd5f43.contentText}>{v_b43b74}</Text>
            )}
          </ScrollView>

          {}
          <View style={v_fd5f43.footer}>
            <TouchableOpacity style={v_fd5f43.btnSecondary} onPress={v_0890f8}>
              <Text style={v_fd5f43.btnSecondaryText}>
                {v_8d41d7("common.close", { defaultValue: "닫기" })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_fd5f43.btnPrimary, v_683210 && v_fd5f43.btnDisabled]}
              onPress={v_5cccfe}
              disabled={v_683210}
            >
              <Text style={v_fd5f43.btnPrimaryText}>
                {v_8d41d7("common.agree", { defaultValue: "동의" })}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
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
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
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
    borderBottomColor: v_1bfbd0.zinc100,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  contentScroll: { flex: 1 },
  contentInner: { padding: v_9b1a04.large },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
    color: v_1bfbd0.zinc700,
  },
  errorText: {
    fontSize: 14,
    color: v_1bfbd0.error,
    textAlign: "center",
    marginTop: 32,
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    padding: v_9b1a04.medium,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 14, color: v_1bfbd0.zinc700, fontWeight: "600" },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: v_8b0c90.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 14, color: v_1bfbd0.white, fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
});
