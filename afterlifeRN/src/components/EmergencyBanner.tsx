

import { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_f2c756,
  v_6b5698,
} from "rcmrninabrnb";
import { v_25515d } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_cc9198 } from "../config/apiBase";

interface EmergencyNotice {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  severity_level: number;
}

const v_c8eac4 = {
  1: "#3b82f6", 
  2: "#f59e0b", 
  3: "#ef4444", 
  4: "#dc2626", 
};
const v_c0bdad = v_c8eac4[2];

const v_fbb4dd = 60 * 1000;

async function v_0d4e58(v_361415): Promise<EmergencyNotice | null> {
  try {
    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, { signal: v_361415 });
    if (!v_8f00b9.ok) return null;
    const v_4d33b2 = (await v_8f00b9.json()) as { notice?: EmergencyNotice | null };
    return v_4d33b2.notice ?? null;
  } catch {

    return null;
  }
}

export default function v_479450() {
  const { t: v_8d41d7 } = v_772971();
  const [v_d48273, v_404431] = v_5ab095<EmergencyNotice | null>(null);

  const v_1b7402 = v_e662ae(v_6b5698.currentState);

  v_c4deb2(() => {

    let v_2008a4 = false;
    let v_22d288 = new AbortController();

    const v_9a5f22 = async () => {
      const v_f4e98d = await v_0d4e58(v_22d288.signal);
      if (!v_2008a4) v_404431(v_f4e98d);
    };

    void v_9a5f22();
    const v_389afb = setInterval(() => { void v_9a5f22(); }, v_fbb4dd);

    const v_1ae212 = v_6b5698.addEventListener("change", (v_a448ad) => {
      const v_ba2215 = v_1b7402.current;
      v_1b7402.current = v_a448ad;
      if (v_ba2215.match(/inactive|background/) && v_a448ad === "active") {

        v_22d288.abort();
        v_22d288 = new AbortController();
        void v_9a5f22();
      }
    });

    return () => {
      v_2008a4 = true;
      v_22d288.abort();
      clearInterval(v_389afb);
      v_1ae212.remove();
    };
  }, []);

  if (!v_d48273) return null;

  const v_ef160b = v_c8eac4[v_d48273.severity_level] ?? v_c0bdad;

  const v_4c3e84 = () => {
    if (!v_d48273.link) return;

    if (v_d48273.link.startsWith("http://") || v_d48273.link.startsWith("https://")) {
      v_f2c756.openURL(v_d48273.link).catch((v_49263d) => {
        console.error("[EmergencyBanner] failed to open URL:", v_49263d);
      });
    } else {
      console.warn("[EmergencyBanner] non-http link ignored:", v_d48273.link);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"

      onRequestClose={() => {  }}
      presentationStyle="fullScreen"
    >
      <View style={v_d81136.container}>
        <View style={v_d81136.header}>
          <Text style={v_d81136.title}>
            {v_8d41d7("common.emergencyStop.title", { defaultValue: "긴급 공지" })}
          </Text>
        </View>

        <View style={v_d81136.divider} />

        <View style={v_d81136.body}>
          <View style={v_d81136.iconContainer}>
            <Ionicons name="warning" size={64} color={v_ef160b} />
          </View>
          <Text style={v_d81136.headline}>{v_d48273.title}</Text>
          {v_d48273.description ? (
            <Text style={v_d81136.message}>{v_d48273.description}</Text>
          ) : null}
          {v_d48273.link ? (
            <TouchableOpacity
              style={v_d81136.linkButton}
              onPress={v_4c3e84}
              activeOpacity={0.7}
            >
              <Text style={v_d81136.linkText}>
                {v_8d41d7("common.emergencyStop.viewDetails", { defaultValue: "자세히 보기" })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#4c4e55" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#121212",
    textAlign: "center",
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
  iconContainer: {
    marginBottom: 32,
  },
  headline: {
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
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4c4e55",
  },
});
