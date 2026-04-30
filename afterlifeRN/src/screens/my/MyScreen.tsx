import v_a3453e, { v_df9f57 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_194498 } from "../../stores/cloneStore";
import { v_694b7f } from "../../api/source";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";

const v_b9d568 = 1;

const v_cca523 = [
  { label: "페르소나 생성", date: "2024.03.25 14:32", amount: -500 },
  { label: "영상 통화 (15분)", date: "2024.03.24 19:15", amount: -300 },
  { label: "코인 충전", date: "2024.03.23 10:20", amount: 10000 },
];

type MyNav = v_390fcc<v_e57140>;

export default function v_ed02a5() {
  const v_c65f5d = v_ada615<MyNav>();
  const { t: v_8d41d7 } = v_772971();
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_06f32b = v_194498((v_fd5f43) => v_fd5f43.localClones);

  const v_0c8987 = v_625c74?.id ?? v_b9d568;
  const v_48d264 = v_df9f57(
    () => v_1e752a.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_0c8987).length,
    [v_1e752a, v_0c8987],
  );
  const v_8b222b = v_df9f57(
    () =>
      v_694b7f.clones().filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987).length +
      v_06f32b.filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987).length,
    [v_0c8987, v_06f32b],
  );

  const settingsItems: Array<{
    icon: keyof typeof v_dec439.glyphMap;
    labelKey: string;
    descKey: string;
    route: keyof v_e57140;
  }> = [
    {
      icon: "bookmark",
      labelKey: "my.menu.saved",
      descKey: "settings.saved.title",
      route: "SavedItems",
    },
    {
      icon: "users",
      labelKey: "my.menu.acquaintance",
      descKey: "settings.acquaintance.title",
      route: "AcquaintanceManagement",
    },
    {
      icon: "user",
      labelKey: "my.menu.editProfile",
      descKey: "settings.editProfile.title",
      route: "EditProfile",
    },
    {
      icon: "bell",
      labelKey: "my.menu.notifications",
      descKey: "settings.notifications.title",
      route: "NotificationSettings",
    },
    {
      icon: "globe",
      labelKey: "my.menu.language",
      descKey: "settings.language.title",
      route: "LanguageSettings",
    },
    {
      icon: "shield",
      labelKey: "my.menu.privacy",
      descKey: "settings.privacy.title",
      route: "PrivacySettings",
    },
  ];

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title="My Page"
        rightAction={
          <View style={v_fd5f43.headerRight}>
            <TouchableOpacity style={v_fd5f43.headerBtn}>
              <Feather name="bell" size={22} color={v_1bfbd0.zinc700} />
            </TouchableOpacity>
            <TouchableOpacity style={v_fd5f43.headerBtn}>
              <Feather name="settings" size={22} color={v_1bfbd0.zinc700} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={v_fd5f43.content}>
        {}
        <View style={v_fd5f43.profileSection}>
          <View style={v_fd5f43.avatarWrap}>
            {v_625c74?.avatarUrl ? (
              <Image source={{ uri: v_625c74.avatarUrl }} style={v_fd5f43.avatar} />
            ) : (
              <View style={[v_fd5f43.avatar, v_fd5f43.avatarPlaceholder]}>
                <Feather name="user" size={40} color={v_1bfbd0.zinc400} />
              </View>
            )}
            <TouchableOpacity
              style={v_fd5f43.editAvatarBtn}
              onPress={() => v_c65f5d.navigate("EditProfile")}
            >
              <Feather name="edit-2" size={14} color={v_1bfbd0.white} />
            </TouchableOpacity>
          </View>

          <Text style={v_fd5f43.userName}>{v_625c74?.displayName ?? "사용자"}</Text>
          <Text style={v_fd5f43.userHandle}>{v_625c74?.handle ?? "@afterlife"}</Text>

          <View style={v_fd5f43.statsRow}>
            <View style={v_fd5f43.statItem}>
              <Text style={v_fd5f43.statValue}>{v_48d264}</Text>
              <Text style={v_fd5f43.statLabel}>팔로우 중</Text>
            </View>
            <View style={v_fd5f43.statDivider} />
            <View style={v_fd5f43.statItem}>
              <Text style={v_fd5f43.statValue}>{v_8b222b}</Text>
              <Text style={v_fd5f43.statLabel}>내 페르소나</Text>
            </View>
          </View>
        </View>

        {}
        <View style={v_fd5f43.sectionHeader}>
          <Text style={v_fd5f43.sectionLabel}>xrun 코인</Text>
        </View>

        {}
        <View style={v_fd5f43.coinCard}>
          <View style={v_fd5f43.coinCardTop}>
            <View style={v_fd5f43.coinLabelRow}>
              <Feather name="dollar-sign" size={18} color={v_1bfbd0.zinc700} />
              <Text style={v_fd5f43.coinLabel}>보유 코인</Text>
            </View>
            <TouchableOpacity style={v_fd5f43.chargeBtn}>
              <Feather name="plus" size={14} color={v_1bfbd0.white} />
              <Text style={v_fd5f43.chargeBtnText}>충전</Text>
            </TouchableOpacity>
          </View>
          <Text style={v_fd5f43.coinAmount}>{(12540).toLocaleString()}</Text>
          <Text style={v_fd5f43.coinWon}>약 ₩{(12540).toLocaleString()} 상당</Text>
        </View>

        {}
        <View style={v_fd5f43.transactionsCard}>
          <View style={v_fd5f43.transactionsHeader}>
            <Text style={v_fd5f43.transactionsTitle}>최근 거래</Text>
          </View>
          {v_cca523.map((v_2f6fcc, v_ebec57) => (
            <View
              key={v_ebec57}
              style={[
                v_fd5f43.txRow,
                v_ebec57 < v_cca523.length - 1 && v_fd5f43.txRowBorder,
              ]}
            >
              <View style={v_fd5f43.txInfo}>
                <Text style={v_fd5f43.txLabel}>{v_2f6fcc.label}</Text>
                <Text style={v_fd5f43.txDate}>{v_2f6fcc.date}</Text>
              </View>
              <Text style={[v_fd5f43.txAmount, v_2f6fcc.amount > 0 ? v_fd5f43.txGreen : v_fd5f43.txRed]}>
                {v_2f6fcc.amount > 0 ? "+" : ""}
                {v_2f6fcc.amount.toLocaleString()} xrun
              </Text>
            </View>
          ))}
          <TouchableOpacity style={v_fd5f43.viewAllBtn}>
            <Text style={v_fd5f43.viewAllText}>전체 내역 보기</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={v_fd5f43.sectionHeader}>
          <Text style={v_fd5f43.sectionLabel}>{v_8d41d7("my.menu.editProfile") ? "설정" : "설정"}</Text>
        </View>

        <View style={v_fd5f43.settingsCard}>
          {v_7f0fd3.map((v_8c0b26, v_ebec57) => (
            <TouchableOpacity
              key={v_8c0b26.route}
              style={[
                v_fd5f43.settingsRow,
                v_ebec57 < v_7f0fd3.length - 1 && v_fd5f43.settingsRowBorder,
              ]}
              onPress={() => v_c65f5d.navigate(v_8c0b26.route)}
            >
              <View style={v_fd5f43.settingsIcon}>
                <Feather name={v_8c0b26.icon} size={22} color={v_1bfbd0.zinc900} />
              </View>
              <View style={v_fd5f43.settingsInfo}>
                <Text style={v_fd5f43.settingsLabel}>{v_8d41d7(v_8c0b26.labelKey)}</Text>
                <Text style={v_fd5f43.settingsDesc}>{v_8d41d7(v_8c0b26.descKey)}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <TouchableOpacity style={v_fd5f43.logoutBtn} onPress={() => void v_d7d5a2()}>
          <Feather name="log-out" size={16} color={v_1bfbd0.zinc600} />
          <Text style={v_fd5f43.logoutText}>{v_8d41d7("my.menu.logout")}</Text>
        </TouchableOpacity>
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
  headerRight: { flexDirection: "row", gap: 4 },
  headerBtn: { padding: 4 },

  profileSection: { alignItems: "center", marginBottom: 32 },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: v_1bfbd0.white,
  },
  userName: { fontSize: 24, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 4 },
  userHandle: { fontSize: 15, color: v_1bfbd0.zinc500 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 16,
  },
  statItem: { alignItems: "center", minWidth: 64 },
  statValue: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900 },
  statLabel: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: v_1bfbd0.zinc200 },

  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc400, paddingHorizontal: 4 },

  coinCard: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  coinCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  coinLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinLabel: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc600 },
  chargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: v_1bfbd0.zinc900,
    borderRadius: v_8b0c90.full,
  },
  chargeBtnText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.white },
  coinAmount: { fontSize: 32, fontWeight: "700", color: v_1bfbd0.zinc900 },
  coinWon: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },

  transactionsCard: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  transactionsTitle: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc900, marginBottom: 4 },
  txDate: { fontSize: 12, color: v_1bfbd0.zinc500 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txGreen: { color: v_1bfbd0.success },
  txRed: { color: v_1bfbd0.error },
  viewAllBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  viewAllText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.violet500 },

  settingsCard: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc100 },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsInfo: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },
  settingsDesc: { fontSize: 13, color: v_1bfbd0.zinc500 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 14, color: v_1bfbd0.zinc600 },
});
