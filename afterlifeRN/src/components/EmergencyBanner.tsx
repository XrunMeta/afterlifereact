

import { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_f2c756,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_cc9198 } from "../config/apiBase";
import { v_1ed7d9 } from "../stores/authStore";

interface EmergencyNotice {
  id: number;
  title: string;
  description: string | null;
  link: string | null;
  severity_level: number;
}

const v_0178ee = {
  1: "#3b82f6", 
  2: "#f59e0b", 
  3: "#ef4444", 
  4: "#dc2626", 
};
const v_2fdeb2 = v_0178ee[2];

const v_fbb4dd = 5 * 60 * 1000; 

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
  const v_033e14 = v_e0068c();
  const v_042a8b = v_1ed7d9((v_fd5f43) => v_fd5f43.isLoggedIn);
  const [v_d48273, v_404431] = v_5ab095<EmergencyNotice | null>(null);

  v_c4deb2(() => {

    if (!v_042a8b) {
      v_404431(null);
      return;
    }
    let v_2008a4 = false;
    const v_22d288 = new AbortController();

    const v_9a5f22 = async () => {
      const v_f4e98d = await v_0d4e58(v_22d288.signal);
      if (!v_2008a4) v_404431(v_f4e98d);
    };

    void v_9a5f22();
    const v_389afb = setInterval(() => { void v_9a5f22(); }, v_fbb4dd);

    return () => {
      v_2008a4 = true;
      v_22d288.abort();
      clearInterval(v_389afb);
    };
  }, [v_042a8b]);

  if (!v_042a8b || !v_d48273) return null;

  const v_6fe397 = v_0178ee[v_d48273.severity_level] ?? v_2fdeb2;

  const v_5ba0f2 = () => {
    if (!v_d48273.link) return;
    void v_f2c756.openURL(v_d48273.link).catch(() => {

    });
  };

  const v_db991d = (
    <View style={v_d81136.inner}>
      <Text style={v_d81136.title} numberOfLines={2}>
        {v_d48273.title}
      </Text>
      {v_d48273.description ? (
        <Text style={v_d81136.description} numberOfLines={3}>
          {v_d48273.description}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[v_d81136.container, { paddingTop: v_033e14.top, backgroundColor: v_6fe397 }]}>
      {v_d48273.link ? (
        <TouchableOpacity activeOpacity={0.8} onPress={v_5ba0f2}>
          {v_db991d}
        </TouchableOpacity>
      ) : (
        v_db991d
      )}
    </View>
  );
}

const v_d81136 = v_472849.create({
  container: {
    width: "100%",
  },
  inner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.95,
  },
});
