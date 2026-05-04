import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_f2c756,
  v_03e392,
  v_39a996,
} from "rcmrninabrnb";
import { v_ada615, v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import * as v_fba5a0 from "hfxxehldoiokdq";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_11921f } from "../../lib/pushNotifications";

interface PushState {
  granted: boolean;
  token: string | null;
  supported: boolean; 
  loading: boolean;
}

export default function v_4036d1() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();

  const [v_b6e533, v_1fa668] = v_5ab095<PushState>({
    granted: false,
    token: null,
    supported: true,
    loading: true,
  });

  const v_1a1b9b = v_a3453e.useCallback(async () => {
    v_1fa668((v_ba2215) => ({ ...v_ba2215, loading: true }));
    try {
      const v_8f00b9 = await v_11921f();
      console.log("[PUSH-STATUS]", v_8f00b9);

      v_1fa668({
        granted: v_8f00b9.granted,
        token: v_8f00b9.token,
        supported: true,
        loading: false,
      });
    } catch (v_49263d) {
      console.warn("[PUSH-STATUS] failed:", v_49263d);
      v_1fa668({ granted: false, token: null, supported: true, loading: false });
    }
  }, []);

  v_c4deb2(() => {
    v_1a1b9b();
  }, [v_1a1b9b]);

  v_cf763b(
    v_a3453e.useCallback(() => {
      v_1a1b9b();
    }, [v_1a1b9b]),
  );

  const v_e34bc5 = async () => {
    try {
      await v_f2c756.openSettings();
    } catch (v_49263d) {
      console.warn("[PUSH-STATUS] openSettings failed:", v_49263d);
    }
  };

  const v_58cf06 = async () => {
    if (!v_b6e533.token) return;
    try {
      await v_fba5a0.setStringAsync(v_b6e533.token);
      v_03e392.alert("알림", v_8d41d7("settings.notifications.copied"));
    } catch (v_49263d) {
      console.warn("[PUSH-STATUS] copy failed:", v_49263d);
    }
  };

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.notifications.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {}
        <View style={v_fd5f43.card}>
          <View style={v_fd5f43.row}>
            <Text style={v_fd5f43.rowLabel}>{v_8d41d7("settings.notifications.push")}</Text>
            {v_b6e533.loading ? (
              <ActivityIndicator color={v_1bfbd0.zinc500} />
            ) : (
              <View
                style={[
                  v_fd5f43.badge,
                  v_b6e533.granted ? v_fd5f43.badgeGranted : v_fd5f43.badgeDenied,
                ]}
              >
                <Feather
                  name={v_b6e533.granted ? "check-circle" : "x-circle"}
                  size={14}
                  color={v_b6e533.granted ? v_1bfbd0.success : v_1bfbd0.error}
                />
                <Text
                  style={[
                    v_fd5f43.badgeText,
                    v_b6e533.granted ? v_fd5f43.badgeTextGranted : v_fd5f43.badgeTextDenied,
                  ]}
                >
                  {v_b6e533.granted
                    ? v_8d41d7("settings.notifications.statusGranted")
                    : v_8d41d7("settings.notifications.statusDenied")}
                </Text>
              </View>
            )}
          </View>

          {!v_b6e533.loading && !v_b6e533.granted && (
            <>
              <View style={v_fd5f43.divider} />
              <View style={v_fd5f43.deniedSection}>
                <Text style={v_fd5f43.deniedHint}>
                  {v_8d41d7("settings.notifications.deniedHint")}
                </Text>
                <TouchableOpacity style={v_fd5f43.openBtn} onPress={v_e34bc5}>
                  <Feather name="external-link" size={14} color={v_1bfbd0.white} />
                  <Text style={v_fd5f43.openBtnText}>
                    {v_8d41d7("settings.notifications.openSettings")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {}
        {v_b6e533.granted && (
          <View style={[v_fd5f43.card, { marginTop: 16 }]}>
            <View style={v_fd5f43.tokenSection}>
              <Text style={v_fd5f43.tokenLabel}>
                {v_8d41d7("settings.notifications.tokenLabel")}
              </Text>
              {v_b6e533.loading ? (
                <Text style={v_fd5f43.tokenValueMuted}>
                  {v_8d41d7("settings.notifications.tokenLoading")}
                </Text>
              ) : v_b6e533.token ? (
                <>
                  <Text style={v_fd5f43.tokenValue} selectable>
                    {v_b6e533.token}
                  </Text>
                  <TouchableOpacity style={v_fd5f43.copyBtn} onPress={v_58cf06}>
                    <Feather name="copy" size={14} color={v_1bfbd0.zinc700} />
                    <Text style={v_fd5f43.copyBtnText}>
                      {v_8d41d7("settings.notifications.copyToken")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={v_fd5f43.tokenValueMuted}>
                  {v_8d41d7("settings.notifications.tokenNone")}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowLabel: { fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc900 },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: v_8b0c90.full ?? 999,
    borderWidth: 1,
  },
  badgeGranted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  badgeDenied: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeTextGranted: { color: v_1bfbd0.success },
  badgeTextDenied: { color: v_1bfbd0.error },
  deniedSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  deniedHint: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    lineHeight: 18,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.white,
  },
  tokenSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
  },
  tokenValue: {
    fontSize: 12,
    color: v_1bfbd0.zinc900,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  tokenValueMuted: {
    fontSize: 13,
    color: v_1bfbd0.zinc400,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
  },
});
