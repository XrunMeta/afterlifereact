import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_aa7413,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

const settingsItems: Array<{
  icon: keyof typeof v_dec439.glyphMap;
  label: string;
  description: string;
}> = [
  { icon: "bookmark", label: "저장됨", description: "저장된 페르소나 확인" },
  { icon: "users", label: "지인관리", description: "지인 페르소나 관리" },
  { icon: "user", label: "개인 정보 관리", description: "이메일 및 연동된 SNS 계정 관리" },
  { icon: "bell", label: "알림 설정", description: "업데이트 및 페르소나 메시지 알림" },
  { icon: "shield", label: "개인정보 및 공개 범위", description: "내 콘텐츠 공개 범위 설정" },
];

const v_cca523 = [
  { label: "페르소나 생성", date: "2024.03.25 14:32", amount: -500 },
  { label: "영상 통화 (15분)", date: "2024.03.24 19:15", amount: -300 },
  { label: "코인 충전", date: "2024.03.23 10:20", amount: 10000 },
];

export default function v_ed02a5() {
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const [v_47abd6, v_e12360] = v_5ab095(false);

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
            <TouchableOpacity style={v_fd5f43.editAvatarBtn}>
              <Feather name="edit-2" size={14} color={v_1bfbd0.white} />
            </TouchableOpacity>
          </View>

          <Text style={v_fd5f43.userName}>{v_625c74?.displayName ?? "사용자"}</Text>
          <Text style={v_fd5f43.userHandle}>{v_625c74?.handle ?? "@afterlife"}</Text>
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
            <TouchableOpacity
              style={v_fd5f43.chargeBtn}
              onPress={() => v_e12360(true)}
            >
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
          <TouchableOpacity
            style={v_fd5f43.viewAllBtn}
            onPress={() => v_e12360(true)}
          >
            <Text style={v_fd5f43.viewAllText}>전체 내역 보기</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={v_fd5f43.sectionHeader}>
          <Text style={v_fd5f43.sectionLabel}>설정</Text>
        </View>

        <View style={v_fd5f43.settingsCard}>
          {v_7f0fd3.map((v_8c0b26, v_ebec57) => (
            <TouchableOpacity
              key={v_ebec57}
              style={[
                v_fd5f43.settingsRow,
                v_ebec57 < v_7f0fd3.length - 1 && v_fd5f43.settingsRowBorder,
              ]}
              onPress={() => v_e12360(true)}
            >
              <View style={v_fd5f43.settingsIcon}>
                <Feather name={v_8c0b26.icon} size={22} color={v_1bfbd0.zinc900} />
              </View>
              <View style={v_fd5f43.settingsInfo}>
                <Text style={v_fd5f43.settingsLabel}>{v_8c0b26.label}</Text>
                <Text style={v_fd5f43.settingsDesc}>{v_8c0b26.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <TouchableOpacity style={v_fd5f43.logoutBtn} onPress={() => void v_d7d5a2()}>
          <Feather name="log-out" size={16} color={v_1bfbd0.zinc600} />
          <Text style={v_fd5f43.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {}
      <Modal visible={v_47abd6} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_e12360(false)}>
          <Pressable style={v_fd5f43.comingSoonBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <TouchableOpacity
              style={v_fd5f43.closeBtn}
              onPress={() => v_e12360(false)}
            >
              <Feather name="x" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>

            <View style={v_fd5f43.comingSoonIcon}>
              <Text style={{ fontSize: 32 }}>🚀</Text>
            </View>
            <Text style={v_fd5f43.comingSoonTitle}>준비 중이에요</Text>
            <Text style={v_fd5f43.comingSoonDesc}>
              이 기능은 현재 개발 중입니다.{"\n"}곧 만나볼 수 있어요!
            </Text>
            <Button
              title="확인"
              variant="primary"
              onPress={() => v_e12360(false)}
              style={v_fd5f43.comingSoonBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  comingSoonBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 24,
    padding: 32,
    maxWidth: 340,
    width: "100%",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  comingSoonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 10 },
  comingSoonDesc: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  comingSoonBtn: { width: "100%", borderRadius: v_8b0c90.full },
});
