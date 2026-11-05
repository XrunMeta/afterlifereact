

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_472849, v_4623af, v_f2c756, v_6b5698, v_326be8 } from "rcmrninabrnb";
import { v_25515d } from "zvyjokvuouwvifyzks";
import v_c9be60 from "qfrscldecidiqs";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_cc9198 } from "../config/apiBase";
import { v_1bfbd0 } from "./constants";
import { v_037b0a, v_f3fadd, v_032970, type v_0bf4a6, type v_eca0c9 } from "../lib/systemGate";

const v_fbb4dd = 60 * 1000;

async function v_2bbad9(v_361415): Promise<v_eca0c9 | null> {
  try {
    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, { signal: v_361415 });
    if (!v_8f00b9.ok) return null;
    return v_f3fadd(await v_8f00b9.json());
  } catch {
    return null; 
  }
}

export default function v_cdba41() {
  const { t: v_8d41d7 } = v_772971();
  const [v_98ce98, v_dbebef] = v_5ab095<v_0bf4a6>(null);
  const [v_8d779a, v_5f3183] = v_5ab095(false);
  const v_1b7402 = v_e662ae(v_6b5698.currentState);
  const v_e48c14 = v_e662ae<AbortController | null>(null);

  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_2b650d = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);

  const v_de130a = v_de06a3(async () => {
    v_e48c14.current?.abort();
    const v_22d288 = new AbortController();
    v_e48c14.current = v_22d288;
    const v_01dcf5 = await v_2bbad9(v_22d288.signal);
    if (v_22d288.signal.aborted) return;
    v_dbebef(v_037b0a(v_01dcf5, v_326be8.OS, v_c9be60.expoConfig?.version, { skipVersion: __DEV__ }));
  }, []);

  v_c4deb2(() => {

    void v_de130a();
    const v_389afb = setInterval(() => { void v_de130a(); }, v_fbb4dd);
    const v_1ae212 = v_6b5698.addEventListener("change", (v_a448ad) => {
      const v_ba2215 = v_1b7402.current;
      v_1b7402.current = v_a448ad;
      if (v_ba2215.match(/inactive|background/) && v_a448ad === "active") void v_de130a();
    });
    return () => {
      v_e48c14.current?.abort();
      clearInterval(v_389afb);
      v_1ae212.remove();
    };
  }, [v_de130a]);

  if (!v_98ce98) return null;

  const v_b38746 = {
    update: {
      header: v_8d41d7("systemGate.updateHeader", { defaultValue: "업데이트 안내" }),
      title: v_8d41d7("systemGate.updateTitle", { defaultValue: "새 버전으로 업데이트해 주세요" }),
      body: v_8d41d7("systemGate.updateBody", { defaultValue: "지금 버전은 더 이상 지원되지 않아요. 스토어에서 최신 버전으로 업데이트한 뒤 이용해 주세요." }),
      icon: "arrow-up-circle" as const,
      color: v_1bfbd0.violet600,
    },
    maintenance: {
      header: v_8d41d7("systemGate.maintenanceHeader", { defaultValue: "서비스 점검" }),
      title: v_8d41d7("systemGate.maintenanceTitle", { defaultValue: "지금은 서비스 점검 중이에요" }),
      body: v_8d41d7("systemGate.maintenanceBody", { defaultValue: "더 나은 서비스를 위해 점검하고 있어요. 잠시 후 다시 이용해 주세요." }),
      icon: "construct" as const,
      color: "#f59e0b",
    },
    stopped: {
      header: v_8d41d7("systemGate.stoppedHeader", { defaultValue: "서비스 일시 중단" }),
      title: v_8d41d7("systemGate.stoppedTitle", { defaultValue: "서비스가 잠시 중단됐어요" }),
      body: v_8d41d7("systemGate.stoppedBody", { defaultValue: "이용에 불편을 드려 죄송해요. 잠시 후 다시 이용해 주세요." }),
      icon: "pause-circle" as const,
      color: "#ef4444",
    },
  }[v_98ce98];

  const v_719eed = async () => {
    if (v_98ce98 === "update") {
      const v_f71b56 = v_326be8.OS === "ios" ? v_032970.ios : v_032970.android;
      v_f2c756.openURL(v_f71b56).catch((v_49263d) => console.warn("[SystemGate] store open failed:", v_49263d));
      return;
    }
    v_5f3183(true);
    await v_de130a();
    v_5f3183(false);
  };

  return (
    <Modal
      visible
      animationType="fade"

      onRequestClose={() => {  }}
      presentationStyle="fullScreen"
    >
      <View style={[v_d81136.container, { paddingTop: Math.max(60, v_033e14.top + 24), paddingBottom: 24 + v_2b650d }]}>
        <Text style={v_d81136.header}>{v_b38746.header}</Text>
        <View style={v_d81136.divider} />
        <View style={v_d81136.body}>
          <Ionicons name={v_b38746.icon} size={64} color={v_b38746.color} style={v_d81136.icon} />
          <Text style={v_d81136.title}>{v_b38746.title}</Text>
          <Text style={v_d81136.message}>{v_b38746.body}</Text>
        </View>
        <TouchableOpacity
          style={[v_d81136.button, v_8d779a && v_d81136.buttonDisabled]}
          onPress={v_719eed}
          disabled={v_8d779a}
          activeOpacity={0.8}
        >
          <Text style={v_d81136.buttonText}>
            {v_98ce98 === "update"
              ? v_8d41d7("systemGate.updateButton", { defaultValue: "업데이트하기" })
              : v_8d779a
                ? v_8d41d7("systemGate.checking", { defaultValue: "확인 중…" })
                : v_8d41d7("systemGate.retry", { defaultValue: "다시 확인" })}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#121212",
    textAlign: "center",
    marginBottom: 20,
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: "#e4e4e4",
    marginBottom: 32,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  icon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121212",
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#4c4e55",
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
