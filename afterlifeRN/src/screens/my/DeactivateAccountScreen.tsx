

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_39a996, v_472849, v_19b633, v_79c4f2, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import { v_dec439 } from "zvyjokvuouwvifyzks";

import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_889fad } from "../../stores/dialogStore";
import { v_84a859, v_ab34b7, v_2d81c4 } from "../../api/auth";
import { v_8cf39a } from "../../lib/loginMethod";

type Method = "password" | "email";

export default function v_f0969e() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);

  const [v_bfe9b9, v_f12919] = v_5ab095<Method | null>(null);
  v_c4deb2(() => {
    void v_8cf39a().then((v_35f85c) => v_f12919(v_35f85c === "email" ? "password" : "email"));
  }, []);
  const [v_adc076, v_52b279] = v_5ab095("");
  const [v_b5ab16, v_b7733b] = v_5ab095(false);
  const [v_c99bd2, v_537cbb] = v_5ab095("");
  const [v_e83b97, v_19a0a2] = v_5ab095<string | null>(null);
  const [v_3f8465, v_b4f1d2] = v_5ab095(false);

  const v_27ef63 = [
    v_8d41d7("deactivate.effect.hide", { defaultValue: "내 프로필과 내가 만든 AI 클론이 홈피드·탐색·검색에서 숨겨지고, 공동관리자 말고는 대화·통화할 수 없어요." }),
    v_8d41d7("deactivate.effect.posts", { defaultValue: "내가 쓴 글과 댓글이 보이지 않아요." }),
    v_8d41d7("deactivate.effect.interaction", { defaultValue: "다른 사람이 선물·공유를 보낼 수 없어요." }),
    v_8d41d7("deactivate.effect.notify", { defaultValue: "모든 알림이 중단돼요." }),
    v_8d41d7("deactivate.effect.restore", { defaultValue: "다시 로그인하면 언제든 원래대로 되돌릴 수 있어요. 데이터는 지워지지 않아요." }),
  ];

  const v_49b78a = async () => {
    if (!v_2ca7e0 || v_3f8465) return;
    v_b4f1d2(true);
    try {
      const v_cb35cb = await v_2d81c4(v_2ca7e0);
      v_19a0a2(v_cb35cb.email);
    } catch (v_9e86fd) {
      v_889fad(v_8d41d7("common.error", { defaultValue: "오류" }), v_9e86fd instanceof v_84a859 ? v_9e86fd.message : String(v_9e86fd));
    } finally {
      v_b4f1d2(false);
    }
  };

  const v_4b57e7 = v_bfe9b9 === "password" ? v_adc076.length > 0 : /^\d{6}$/.test(v_c99bd2);

  const v_fbb22a = () => {
    if (!v_2ca7e0 || !v_4b57e7 || v_3f8465) return;
    v_889fad(
      v_8d41d7("deactivate.confirmTitle", { defaultValue: "계정을 비활성화할까요?" }),
      v_8d41d7("deactivate.confirmBody", { defaultValue: "모든 기기에서 바로 로그아웃돼요." }),
      [
        { text: v_8d41d7("common.cancel", { defaultValue: "취소" }), style: "cancel" },
        {
          text: v_8d41d7("deactivate.submit", { defaultValue: "비활성화" }),
          style: "destructive",
          onPress: async () => {
            v_b4f1d2(true);
            try {
              await v_ab34b7(
                v_2ca7e0,
                v_bfe9b9 === "password" ? { password: v_adc076 } : { verificationCode: v_c99bd2 },
              );
              await v_d7d5a2();
            } catch (v_9e86fd) {
              v_b4f1d2(false);
              v_889fad(
                v_8d41d7("common.error", { defaultValue: "오류" }),
                v_9e86fd instanceof v_84a859 ? v_9e86fd.message : String(v_9e86fd),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.zinc50} keyboardShouldPersistTaps="handled">
      <PageHeader
        title={v_8d41d7("my.menu.deactivate", { defaultValue: "계정 비활성화 (일시정지)" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <View style={v_fd5f43.content}>
        <Text style={v_fd5f43.label}>
          {v_bfe9b9 === "password"
            ? v_8d41d7("deactivate.verifyPassword", { defaultValue: "본인 확인 · 비밀번호" })
            : v_8d41d7("deactivate.verifyEmail", { defaultValue: "본인 확인 · 이메일 인증코드" })}
        </Text>

        {v_bfe9b9 === null ? (
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        ) : v_bfe9b9 === "password" ? (
          <View style={v_fd5f43.inputRow}>
            <TextInput
              style={v_fd5f43.inputFlex}
              value={v_adc076}
              onChangeText={v_52b279}
              placeholder={v_8d41d7("deactivate.passwordPlaceholder", { defaultValue: "비밀번호 입력" })}
              secureTextEntry={!v_b5ab16}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => v_b7733b((v_81e2ef) => !v_81e2ef)} hitSlop={8} style={v_fd5f43.eyeBtn}>
              <Feather name={v_b5ab16 ? "eye-off" : "eye"} size={18} color={v_1bfbd0.zinc500} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={v_fd5f43.secondaryBtn} onPress={v_49b78a} disabled={v_3f8465}>
              <Text style={v_fd5f43.secondaryBtnText}>
                {v_e83b97
                  ? v_8d41d7("deactivate.resendCode", { defaultValue: "인증코드 다시 받기" })
                  : v_8d41d7("deactivate.sendCode", { defaultValue: "가입 이메일로 인증코드 받기" })}
              </Text>
            </TouchableOpacity>
            {v_e83b97 && (
              <Text style={v_fd5f43.hint}>
                {v_8d41d7("deactivate.codeSent", { email: v_e83b97, defaultValue: `${v_e83b97} 으로 보냈어요.` })}
              </Text>
            )}
            <TextInput
              style={v_fd5f43.input}
              value={v_c99bd2}
              onChangeText={(v_81e2ef) => v_537cbb(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
              placeholder={v_8d41d7("deactivate.codePlaceholder", { defaultValue: "6자리 인증코드" })}
              keyboardType="number-pad"
            />
          </View>
        )}
        <TouchableOpacity style={[v_fd5f43.dangerBtn, (!v_4b57e7 || v_3f8465) && v_fd5f43.btnOff]} onPress={v_fbb22a} disabled={!v_4b57e7 || v_3f8465}>
          {v_3f8465 ? (
            <ActivityIndicator color={v_1bfbd0.white} />
          ) : (
            <Text style={v_fd5f43.dangerBtnText}>{v_8d41d7("deactivate.submit", { defaultValue: "비활성화" })}</Text>
          )}
        </TouchableOpacity>

        {}
        <View style={v_fd5f43.info}>
          <Text style={v_fd5f43.infoTitle}>{v_8d41d7("deactivate.whatHappens", { defaultValue: "비활성화하면" })}</Text>
          {v_27ef63.map((v_e6293e) => (
            <Text key={v_e6293e} style={v_fd5f43.bullet}>• {v_e6293e}</Text>
          ))}
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: { padding: 16, gap: 12 },
  info: { marginTop: 12, gap: 6 },
  infoTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  bullet: { fontSize: 14, lineHeight: 20, color: v_1bfbd0.zinc700 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  input: { borderWidth: 1, borderColor: v_1bfbd0.zinc200, borderRadius: 10, backgroundColor: v_1bfbd0.white, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: v_1bfbd0.zinc900 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: v_1bfbd0.zinc200, borderRadius: 10, backgroundColor: v_1bfbd0.white, paddingLeft: 12 },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 15, color: v_1bfbd0.zinc900 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  secondaryBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: v_1bfbd0.zinc300, alignItems: "center", backgroundColor: v_1bfbd0.white },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc800 },
  hint: { fontSize: 12, color: v_1bfbd0.zinc500 },
  dangerBtn: { marginTop: 8, height: 50, borderRadius: 12, backgroundColor: v_1bfbd0.error, alignItems: "center", justifyContent: "center" },
  dangerBtnText: { color: v_1bfbd0.white, fontSize: 16, fontWeight: "700" },
  btnOff: { opacity: 0.5 },
});
