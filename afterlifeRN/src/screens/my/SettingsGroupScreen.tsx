

import v_a3453e, { v_e662ae } from "bapkr";
import { v_39a996, v_472849, v_19b633, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_e82960 } from "qmmwyqbwrg";
import { v_6d148f, v_4e6085 } from "umnthslqstcsfmed";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_650cfa, v_ada615, v_2d8264, type v_ee3714 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";

import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";
import { v_889fad } from "../../stores/dialogStore";
import { v_1256e7 } from "../../hooks/useDeleteAccount";
import { v_d60cdf } from "../../api/clones";
import { v_e0051d } from "../../config/apiBase";
import { v_1ed7d9 } from "../../stores/authStore";

export type SettingsGroupId = "account" | "notifications" | "face" | "service" | "app";

type Nav = v_390fcc<v_e57140>;

type GroupItem = {
  key: string;
  icon: keyof typeof v_dec439.glyphMap;
  labelKey: string;
  label: string;
  descKey?: string;
  desc?: string;
  onPress: () => void;
  busy?: boolean;
};

export const SETTINGS_GROUPS: Array<{ id: SettingsGroupId; icon: keyof typeof v_dec439.glyphMap; titleKey: string; title: string }> = [
  { id: "account", icon: "user", titleKey: "my.section.account", title: "계정 및 개인정보" },
  { id: "notifications", icon: "bell", titleKey: "my.section.notifications", title: "알림 설정" },
  { id: "face", icon: "smile", titleKey: "my.section.face", title: "얼굴 및 생체 인식 설정" },
  { id: "service", icon: "shield", titleKey: "my.section.service", title: "서비스 이용 및 차단" },
  { id: "app", icon: "sliders", titleKey: "my.section.app", title: "앱 환경 설정" },
];

export default function v_1619c2() {
  const v_c65f5d = v_ada615<Nav>();
  const v_c7daf6 = v_2d8264<v_ee3714<v_e57140, "SettingsGroup">>();
  const { t: v_8d41d7 } = v_772971();
  const { deleting: v_a1f68f, confirmDelete: v_6ff8af } = v_1256e7();
  const v_d7f648 = v_05537d.find((v_206b88) => v_206b88.id === v_c7daf6.params.group) ?? v_05537d[0]!;

  const v_2ca7e0 = v_1ed7d9((v_72c7a6) => v_72c7a6.accessToken);
  const v_774ef1 = v_e662ae<ReturnType<typeof v_e82960> | null>(null);
  const v_d023f2 = v_e662ae(false);
  const v_99abd8 = async () => {
    if (v_d023f2.current) return;
    v_d023f2.current = true;
    try {
      if (!v_2ca7e0) throw new Error("로그인이 필요해요");
      const v_1c1268 = await v_d60cdf(v_2ca7e0);
      const v_6e0fd3 = v_1c1268.items[0]?.id;
      if (!v_6e0fd3) throw new Error("내 페르소나가 없어요");
      const v_8f00b9 = await fetch(`${v_e0051d}/voice/lang-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_2ca7e0}` },
        body: JSON.stringify({ clone_id: v_6e0fd3, lang: "ko", text: "안녕하세요" }),
      });
      if (!v_8f00b9.ok) throw new Error(`합성 실패 ${v_8f00b9.status}`);
      const v_83ee53 = await v_8f00b9.arrayBuffer();

      const v_4de33e = new v_6d148f(v_4e6085.cache, `settings_voice_test_${Date.now()}.wav`);
      v_4de33e.create();
      v_4de33e.write(new Uint8Array(v_83ee53));
      v_774ef1.current?.remove();
      const v_e2a85c = v_e82960({ uri: v_4de33e.uri });
      v_774ef1.current = v_e2a85c;

      const v_a32dae = Date.now() + 4000;
      while (!v_e2a85c.isLoaded && Date.now() < v_a32dae) {
        await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 40));
      }
      v_e2a85c.play();
      if (__DEV__) console.log(`[Call][ios-audio-diag] settings voice test play() clone=${v_6e0fd3} bytes=${v_83ee53.byteLength} loaded=${v_e2a85c.isLoaded}`);
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error)?.message ?? String(v_49263d);
      if (__DEV__) console.warn(`[Call][ios-audio-diag] settings voice test failed: ${v_badeaf}`);
      v_889fad("말소리 테스트", v_badeaf);
    } finally {
      v_d023f2.current = false;
    }
  };

  const v_4622b9 = (() => {
    switch (v_d7f648.id) {
      case "account":
        return [
          {
            key: "profile", icon: "user", labelKey: "my.menu.profileEdit", label: "프로필 / 개인정보 수정",
            descKey: "settings.editProfile.title", onPress: () => v_c65f5d.navigate("EditProfile"),
          },
          {

            key: "deactivate", icon: "pause-circle", labelKey: "my.menu.deactivate", label: "계정 비활성화 (일시정지)",
            descKey: "my.menu.deactivateDesc", onPress: () => v_c65f5d.navigate("DeactivateAccount"),
          },
          {
            key: "delete", icon: "trash-2", labelKey: "settings.privacy.deleteAccount", label: "회원 탈퇴",
            onPress: v_6ff8af, busy: v_a1f68f,
          },
        ];
      case "notifications":

        return [
          {
            key: "push", icon: "bell", labelKey: "my.menu.notifications", label: "알림 설정",
            descKey: "settings.notifications.title", onPress: () => v_c65f5d.navigate("NotificationSettings"),
          },
          {
            key: "list", icon: "inbox", labelKey: "my.menu.notificationsListShort", label: "알림 리스트",
            descKey: "my.menu.notificationsListDesc",
            onPress: () => v_c65f5d.getParent()?.dispatch(v_650cfa.navigate({ name: "Notifications" })),
          },
        ];
      case "face":

        return [
          {
            key: "detect", icon: "eye", labelKey: "my.menu.faceDetect", label: "얼굴 감지",
            descKey: "my.menu.faceDetectDesc", onPress: () => v_c65f5d.navigate("RememberingClones"),
          },
          {
            key: "recog", icon: "smile", labelKey: "my.menu.faceRecognition", label: "얼굴 인식 동의",
            descKey: "my.menu.faceRecognitionDesc", onPress: () => v_c65f5d.navigate("Agreements", { section: "face" }),
          },
        ];
      case "service":
        return [
          {
            key: "blocked", icon: "slash", labelKey: "my.menu.blockedUsers", label: "차단 사용자 관리",
            descKey: "settings.privacy.title", onPress: () => v_c65f5d.navigate("PrivacySettings"),
          },
          {
            key: "reports", icon: "flag", labelKey: "my.menu.reportsMenu", label: "신고하기 / 신고 내역",
            descKey: "my.menu.reportsDesc", onPress: () => v_c65f5d.navigate("Reports", {}),
          },
          {
            key: "terms", icon: "check-square", labelKey: "my.menu.termsConsent", label: "약관 및 동의 관리",
            descKey: "my.menu.termsConsentDesc", onPress: () => v_c65f5d.navigate("Agreements", { section: "terms" }),
          },
        ];
      case "app":
        return [
          {
            key: "language", icon: "globe", labelKey: "my.menu.language", label: "언어 설정",
            descKey: "settings.language.title", onPress: () => v_c65f5d.navigate("LanguageSettings"),
          },
          {
            key: "voiceSoundTest", icon: "volume-2", labelKey: "my.menu.voiceSoundTest", label: "말소리 테스트",
            descKey: "my.menu.voiceSoundTestDesc", desc: "누르면 내 페르소나 목소리로 '안녕하세요'가 나와요",
            onPress: () => { void v_99abd8(); },
          },

        ];
    }
  })();

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.zinc50}>
      <PageHeader
        title={v_8d41d7(v_d7f648.titleKey, { defaultValue: v_d7f648.title })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <View style={v_fd5f43.content}>
        <View style={v_fd5f43.card}>
          {v_4622b9.map((v_23805a, v_ebec57) => (
            <TouchableOpacity
              key={v_23805a.key}
              style={[v_fd5f43.row, v_ebec57 < v_4622b9.length - 1 && v_fd5f43.rowBorder]}
              onPress={v_23805a.onPress}
              disabled={v_23805a.busy}
            >
              <View style={v_fd5f43.icon}>
                <Feather name={v_23805a.icon} size={22} color={v_1bfbd0.zinc900} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.label}>{v_8d41d7(v_23805a.labelKey, { defaultValue: v_23805a.label })}</Text>
                {v_23805a.descKey && <Text style={v_fd5f43.desc}>{v_8d41d7(v_23805a.descKey, { defaultValue: v_23805a.desc ?? "" })}</Text>}
              </View>
              {v_23805a.busy ? (
                <ActivityIndicator color={v_1bfbd0.zinc500} />
              ) : (
                <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc400} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 16,
    overflow: "hidden",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingVertical: 18, minHeight: 86 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  icon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500 },
});
