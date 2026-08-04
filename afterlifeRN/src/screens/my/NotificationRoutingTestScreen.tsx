

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, RADIUS } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import { listMyClones, listSystemClones } from "../../api/clones";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RowConfig {
  type: string;
  label: string;
  hint: string;
  run: (nav: Nav, cloneId: number, userId: number) => void;
}

const ROWS: RowConfig[] = [
  {
    type: "intimacy_score",
    label: "🌡️ 온도 상승 (intimacy_score)",
    hint: "구독 탭 → 해당 페르소나 온도 모달",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ShortsTab",
        params: { openIntimacyCloneId: cloneId },
      }),
  },
  {
    type: "clone_like",
    label: "👍 좋아요 도착 (clone_like)",
    hint: "대시보드 → 해당 페르소나 좋아요 리스트",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: cloneId, openStatsTab: "likes" },
        },
      }),
  },
  {
    type: "clone_comment",
    label: "💬 댓글 도착 (clone_comment)",
    hint: "대시보드 → 해당 페르소나 댓글 리스트",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: cloneId, openStatsTab: "comments" },
        },
      }),
  },
  {
    type: "clone_gift",
    label: "🎁 선물 도착 (clone_gift)",
    hint: "대시보드 → 해당 페르소나 친밀도 모달(선물 표시)",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: cloneId, openStatsTab: "gifts" },
        },
      }),
  },
  {
    type: "clone_follow",
    label: "➕ 새 구독자 (clone_follow)",
    hint: "대시보드 → 해당 페르소나 구독자 리스트",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: cloneId, openStatsTab: "followers" },
        },
      }),
  },
  {
    type: "user_follow",
    label: "👤 새 팔로워 (user_follow)",
    hint: "내 팔로워 리스트",
    run: (nav, _cloneId, userId) =>
      nav.navigate("UserFollowList", { userId, mode: "followers" }),
  },
  {
    type: "followee_new_clone",
    label: "✨ 팔로우 유저의 새 페르소나 (followee_new_clone)",
    hint: "그 페르소나 상세 화면",
    run: (nav, cloneId) =>
      nav.navigate("Main", {
        screen: "ClonesTab",
        params: { screen: "CloneDetail", params: { cloneId } },
      }),
  },
  {
    type: "moderation",
    label: "⚠️ 신고 제재 결과 (moderation)",
    hint: "설정 → 신고 → 신고 받은 내역 탭",
    run: (nav) =>
      nav.dispatch(
        CommonActions.navigate({
          name: "Main",
          params: {
            screen: "MyTab",
            params: { screen: "Reports", params: { tab: "received" } },
          },
        }),
      ),
  },
  {
    type: "invite_received",
    label: "📨 공동관리자 초대 (invite_received)",
    hint: "InviteAccept 화면 (dummy token → 실제로는 오류 팝업 예상, 라우팅 확인용)",
    run: (nav) =>
      nav.navigate("InviteAccept", { token: "dummy-test-token" }),
  },
];

export default function NotificationRoutingTestScreen() {
  const nav = useNavigation<Nav>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const apiUser = useAuthStore((s) => s.apiUser);
  const [cloneId, setCloneId] = useState<number | null>(null);
  const [cloneName, setCloneName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (accessToken) {
          const my = await listMyClones(accessToken);
          if (!cancelled && my.items.length > 0) {
            const c = my.items[0];
            if (c) {
              setCloneId(c.id);
              setCloneName(c.name ?? `#${c.id}`);
              return;
            }
          }
          const sys = await listSystemClones(accessToken);
          if (!cancelled && sys.items.length > 0) {
            const c = sys.items[0];
            if (c) {
              setCloneId(c.id);
              setCloneName(c.name ?? `#${c.id}`);
            }
          }
        }
      } catch (err) {
        console.warn("[NotificationRoutingTest] load clones failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const userId = apiUser?.id ?? 0;

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader title="알림 라우팅 테스트" showBackButton onBackPress={() => nav.goBack()} />
      <ScrollView contentContainerStyle={s.content}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.violet600} />
        ) : (
          <>
            <View style={s.infoBox}>
              <Text style={s.infoText}>
                {cloneId
                  ? `테스트 페르소나: ${cloneName} (#${cloneId})`
                  : "테스트 페르소나 없음 — 페르소나 관련 라우팅은 동작 안 함"}
              </Text>
              <Text style={s.infoSub}>
                사용자 ID: {userId || "미로그인"}
              </Text>
            </View>
            {ROWS.map((row) => {
              const needsClone =
                row.type !== "user_follow" &&
                row.type !== "moderation" &&
                row.type !== "invite_received";
              const disabled = needsClone && !cloneId;
              return (
                <TouchableOpacity
                  key={row.type}
                  style={[s.row, disabled && s.rowDisabled]}
                  disabled={disabled}
                  onPress={() => row.run(nav, cloneId ?? 0, userId)}
                  activeOpacity={0.7}
                >
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowHint}>{row.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  infoBox: {
    backgroundColor: COLORS.zinc50,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: COLORS.zinc900, fontWeight: "600" },
  infoSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },
  row: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowDisabled: { opacity: 0.4 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  rowHint: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },
});
