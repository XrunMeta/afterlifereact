import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import SafeScrollView from "../../components/ui/SafeScrollView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { useCloneStore } from "../../stores/cloneStore";
import { seedSource } from "../../api/source";
import { uploadFile } from "../../api/files";
import { patchMe } from "../../api/auth";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

const DEFAULT_USER_ID = 1;

const settingsItems: Array<{
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
}> = [
  { icon: "bookmark", label: "저장됨", description: "저장된 페르소나 확인" },
  { icon: "users", label: "지인관리", description: "지인 페르소나 관리" },
  { icon: "user", label: "개인 정보 관리", description: "이메일 및 연동된 SNS 계정 관리" },
  { icon: "bell", label: "알림 설정", description: "업데이트 및 페르소나 메시지 알림" },
  { icon: "shield", label: "개인정보 및 공개 범위", description: "내 콘텐츠 공개 범위 설정" },
];

const recentTransactions = [
  { label: "페르소나 생성", date: "2024.03.25 14:32", amount: -500 },
  { label: "영상 통화 (15분)", date: "2024.03.24 19:15", amount: -300 },
  { label: "코인 충전", date: "2024.03.23 10:20", amount: 10000 },
];

export default function MyScreen() {
  const user = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const patchApiUser = useAuthStore((s) => s.patchApiUser);
  const logout = useAuthStore((s) => s.logout);
  const follows = useFollowStore((s) => s.follows);
  const localClones = useCloneStore((s) => s.localClones);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleEditAvatar = async () => {
    if (!accessToken) {
      Alert.alert("알림", "로그인이 필요합니다.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("권한 필요", "사진 라이브러리 접근 권한을 허용해주세요.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];

    setUploadingAvatar(true);
    try {
      const uploaded = await uploadFile(accessToken, asset.uri, {
        purpose: "avatar",
        fileName: asset.fileName ?? "avatar.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      await patchMe(accessToken, { avatarUrl: uploaded.url });
      patchApiUser({ avatarUrl: uploaded.url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const displayName = apiUser?.name ?? user?.displayName ?? "사용자";
  const subLabel = apiUser?.email ?? user?.handle ?? "@afterlife";
  const avatarUrl = apiUser?.avatarUrl ?? user?.avatarUrl ?? null;
  const credits = apiUser?.credits ?? 12540;

  const uid = apiUser?.id ?? user?.id ?? DEFAULT_USER_ID;
  const followingCount = useMemo(
    () => follows.filter((f) => f.followerUserId === uid).length,
    [follows, uid],
  );
  const myClonesCount = useMemo(
    () =>
      seedSource.clones().filter((c) => c.ownerId === uid).length +
      localClones.filter((c) => c.ownerId === uid).length,
    [uid, localClones],
  );

  return (
    <SafeScrollView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title="My Page"
        rightAction={
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerBtn}>
              <Feather name="bell" size={22} color={COLORS.zinc700} />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerBtn}>
              <Feather name="settings" size={22} color={COLORS.zinc700} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={s.content}>
        {}
        <View style={s.profileSection}>
          <View style={s.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Feather name="user" size={40} color={COLORS.zinc400} />
              </View>
            )}
            <TouchableOpacity
              style={s.editAvatarBtn}
              onPress={handleEditAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Feather name="edit-2" size={14} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userHandle}>{subLabel}</Text>

          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{followingCount}</Text>
              <Text style={s.statLabel}>팔로우 중</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{myClonesCount}</Text>
              <Text style={s.statLabel}>내 페르소나</Text>
            </View>
          </View>
        </View>

        {}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>xrun 코인</Text>
        </View>

        {}
        <View style={s.coinCard}>
          <View style={s.coinCardTop}>
            <View style={s.coinLabelRow}>
              <Feather name="dollar-sign" size={18} color={COLORS.zinc700} />
              <Text style={s.coinLabel}>보유 코인</Text>
            </View>
            <TouchableOpacity
              style={s.chargeBtn}
              onPress={() => setShowComingSoon(true)}
            >
              <Feather name="plus" size={14} color={COLORS.white} />
              <Text style={s.chargeBtnText}>충전</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.coinAmount}>{credits.toLocaleString()}</Text>
          <Text style={s.coinWon}>약 ₩{credits.toLocaleString()} 상당</Text>
        </View>

        {}
        <View style={s.transactionsCard}>
          <View style={s.transactionsHeader}>
            <Text style={s.transactionsTitle}>최근 거래</Text>
          </View>
          {recentTransactions.map((tx, i) => (
            <View
              key={i}
              style={[
                s.txRow,
                i < recentTransactions.length - 1 && s.txRowBorder,
              ]}
            >
              <View style={s.txInfo}>
                <Text style={s.txLabel}>{tx.label}</Text>
                <Text style={s.txDate}>{tx.date}</Text>
              </View>
              <Text style={[s.txAmount, tx.amount > 0 ? s.txGreen : s.txRed]}>
                {tx.amount > 0 ? "+" : ""}
                {tx.amount.toLocaleString()} xrun
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={s.viewAllBtn}
            onPress={() => setShowComingSoon(true)}
          >
            <Text style={s.viewAllText}>전체 내역 보기</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>설정</Text>
        </View>

        <View style={s.settingsCard}>
          {settingsItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                s.settingsRow,
                i < settingsItems.length - 1 && s.settingsRowBorder,
              ]}
              onPress={() => setShowComingSoon(true)}
            >
              <View style={s.settingsIcon}>
                <Feather name={item.icon} size={22} color={COLORS.zinc900} />
              </View>
              <View style={s.settingsInfo}>
                <Text style={s.settingsLabel}>{item.label}</Text>
                <Text style={s.settingsDesc}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.zinc400} />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <TouchableOpacity style={s.logoutBtn} onPress={() => void logout()}>
          <Feather name="log-out" size={16} color={COLORS.zinc600} />
          <Text style={s.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {}
      <Modal visible={showComingSoon} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setShowComingSoon(false)}>
          <Pressable style={s.comingSoonBox} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setShowComingSoon(false)}
            >
              <Feather name="x" size={18} color={COLORS.zinc400} />
            </TouchableOpacity>

            <View style={s.comingSoonIcon}>
              <Text style={{ fontSize: 32 }}>🚀</Text>
            </View>
            <Text style={s.comingSoonTitle}>준비 중이에요</Text>
            <Text style={s.comingSoonDesc}>
              이 기능은 현재 개발 중입니다.{"\n"}곧 만나볼 수 있어요!
            </Text>
            <Button
              title="확인"
              variant="primary"
              onPress={() => setShowComingSoon(false)}
              style={s.comingSoonBtn}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
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
    backgroundColor: COLORS.zinc100,
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
    backgroundColor: COLORS.zinc900,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: { fontSize: 24, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  userHandle: { fontSize: 15, color: COLORS.zinc500 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.zinc50,
    borderRadius: 16,
  },
  statItem: { alignItems: "center", minWidth: 64 },
  statValue: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900 },
  statLabel: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.zinc200 },

  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: COLORS.zinc400, paddingHorizontal: 4 },

  coinCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
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
  coinLabel: { fontSize: 14, fontWeight: "500", color: COLORS.zinc600 },
  chargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.zinc900,
    borderRadius: RADIUS.full,
  },
  chargeBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  coinAmount: { fontSize: 32, fontWeight: "700", color: COLORS.zinc900 },
  coinWon: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },

  transactionsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  transactionsTitle: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: "500", color: COLORS.zinc900, marginBottom: 4 },
  txDate: { fontSize: 12, color: COLORS.zinc500 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txGreen: { color: COLORS.success },
  txRed: { color: COLORS.error },
  viewAllBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  viewAllText: { fontSize: 14, fontWeight: "500", color: COLORS.violet500 },

  settingsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
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
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc100 },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsInfo: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900, marginBottom: 2 },
  settingsDesc: { fontSize: 13, color: COLORS.zinc500 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 14, color: COLORS.zinc600 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  comingSoonBox: {
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.zinc100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900, marginBottom: 10 },
  comingSoonDesc: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  comingSoonBtn: { width: "100%", borderRadius: RADIUS.full },
});
