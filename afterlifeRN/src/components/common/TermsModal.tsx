

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_122070,
  v_39a996,
  v_e45a99,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../constants";
import { v_cc9198 } from "../../config/apiBase";

export type AgreementType = 1 | 2 | 3 | 4 | 5;

type Props = {
  visible: boolean;
  type: AgreementType | null;
  onClose: () => void;
  onAgree: () => void;
};

const v_b7b41f = {
  1: 1,
  2: 3,
  3: 2,
  4: 4,
  5: 5,
};

async function v_33650f(
  v_3b27d9,
  v_05bb19,
): Promise<{ content: string; returnedLang: string }> {
  const v_768dd4 = v_b7b41f[v_3b27d9];
  if (v_768dd4 === null) {
    return { content: "", returnedLang: "" };
  }

  let v_c87c7a = (v_05bb19 || "ko").toLowerCase();
  if (v_c87c7a.startsWith("zh")) v_c87c7a = "zh";
  else v_c87c7a = v_c87c7a.split("-")[0]; 
  const v_f71b56 = `${v_cc9198}/oth-path?type=${v_768dd4}&lang=${v_c87c7a}`;
  console.log("[TermsModal] fetch:", v_f71b56, "(i18n.language =", v_05bb19, ")");
  const v_8f00b9 = await fetch(v_f71b56);
  if (!v_8f00b9.ok) throw new Error(`Failed to load agreement (${v_8f00b9.status})`);
  const v_7ecfd1 = (await v_8f00b9.json()) as { data?: { content?: string; language?: string } | null };
  const v_b43b74 = v_7ecfd1?.data?.content ?? "";
  const v_c61b34 = v_7ecfd1?.data?.language ?? "";
  console.log(
    `[TermsModal] response ok — content length=${v_b43b74.length}, returnedLang=${v_c61b34}`,
  );
  return { content: v_b43b74, returnedLang: v_c61b34 };
}

const v_259ade = {
  1: "auth.signup.termsServiceTitle",
  2: "auth.signup.termsLocationTitle",
  3: "auth.signup.termsPrivacyTitle",
  4: "auth.signup.termsBiometricTitle",
  5: "auth.signup.termsCallLearningTitle",
};

const v_9fab8c = {
  1: "서비스 약관",
  2: "위치정보 약관",
  3: "개인정보 약관",
  4: "생체정보(얼굴) 처리 동의",
  5: "통화 대화 학습 동의",
};

export default function v_c0caa9({ visible: v_cf55be, type: v_3b27d9, onClose: v_0890f8, onAgree: v_5cccfe }: Props) {
  const { t: v_8d41d7, i18n: v_9c213b } = v_772971();

  const { height: v_ce40bc } = v_e45a99();
  const v_3d6201 = Math.min(v_ce40bc * 0.8, v_ce40bc - 80);
  const [v_b43b74, v_f435cb] = v_5ab095<string>("");
  const [v_c61b34, v_1083a7] = v_5ab095<string>("");
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<string | null>(null);

  v_c4deb2(() => {
    if (!v_cf55be || !v_3b27d9) return;
    let v_2008a4 = false;
    v_34a50a(true);
    v_3a7d09(null);
    v_f435cb("");
    v_1083a7("");
    v_33650f(v_3b27d9, v_9c213b.language)
      .then(({ content: v_3f4e2e, returnedLang: v_cb35cb }) => {
        if (!v_2008a4) {
          v_f435cb(v_3f4e2e);
          v_1083a7(v_cb35cb);
        }
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

  const v_449829 = (() => {
    const v_1614db = (v_9c213b.language || "ko").toLowerCase();
    if (v_1614db.startsWith("zh")) return "zh";
    return v_1614db.split("-")[0];
  })();
  const v_6cf134 =
    v_c61b34 && v_449829 && v_c61b34 !== v_449829;

  if (!v_3b27d9) return null;
  const v_9f1622 = v_8d41d7(v_259ade[v_3b27d9], { defaultValue: v_9fab8c[v_3b27d9] });

  const v_aae497 = v_8d41d7("auth.signup.termsBiometricFallback", {
    defaultValue:
      "얼굴 인식정보 사용에 대한 안내\n\n통화 중 화자 식별을 위해 전면 카메라로 얼굴 위치만 감지하며, 얼굴 데이터(이미지·생체정보)는 저장되지 않습니다. 동의를 철회하면 즉시 중단됩니다.",
  });
  const v_ccca83 = v_8d41d7("auth.signup.termsLocationFallback", {
    defaultValue:
      "위치정보 이용에 대한 안내\n\n현재 본 앱은 위치정보를 수집·이용하지 않습니다. 추후 위치 기반 기능이 추가될 경우 별도로 동의를 받습니다.",
  });

  const v_f42243 = v_8d41d7("auth.signup.termsCallLearningFallback", {
    defaultValue:
      "통화 대화 학습에 대한 안내\n\n동의하시면 클론이 통화 중 나눈 대화 내용을 학습해 더 자연스럽고 개인화된 대화를 제공합니다. 이 동의는 선택 사항이며, 설정 화면에서 언제든지 철회할 수 있습니다. 철회하면 이후 통화 대화만 학습에서 제외되며, 이미 학습된 내용은 삭제되지 않고 유지됩니다. (학습 데이터 삭제는 회원 탈퇴 또는 개인정보 완전 삭제 시 함께 처리됩니다.)",
  });
  const v_c6145f =
    v_3b27d9 === 5 ? v_f42243 :
    v_3b27d9 === 4 ? v_aae497 : v_ccca83;
  const v_f50219 =
    (v_3b27d9 === 2 || v_3b27d9 === 4 || v_3b27d9 === 5) && !v_683210 && (!!v_5e9bfe || !v_b43b74.trim());

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="fade"
      onRequestClose={v_0890f8}
    >
      {
}
      <View style={v_fd5f43.overlay}>
        <View style={[v_fd5f43.card, { height: v_3d6201 }]}>
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
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {v_683210 ? (
              <ActivityIndicator
                color={v_1bfbd0.violet500}
                style={{ marginTop: 32 }}
              />
            ) : v_f50219 ? (
              <Text style={v_fd5f43.contentText}>{v_c6145f}</Text>
            ) : v_5e9bfe ? (
              <Text style={v_fd5f43.errorText}>{v_5e9bfe}</Text>
            ) : (
              <>
                {v_6cf134 && (
                  <Text style={v_fd5f43.langNotice}>
                    {v_8d41d7("terms.langNotice", {
                      expected: v_449829,
                      returned: v_c61b34,
                      defaultValue: "⚠️ {{expected}} → {{returned}} (해당 언어 약관 준비 중)",
                    })}
                  </Text>
                )}
                <Text style={v_fd5f43.contentText}>{v_b43b74}</Text>
              </>
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
        </View>
      </View>
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
  langNotice: {
    fontSize: 12,
    color: v_1bfbd0.amber700,
    backgroundColor: v_1bfbd0.amber50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: v_8b0c90.sm,
    marginBottom: 12,
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
