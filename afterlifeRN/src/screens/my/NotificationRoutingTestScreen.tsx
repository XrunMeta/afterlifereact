

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_39a996,
  v_122070,
} from "rcmrninabrnb";
import { v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_d60cdf, v_81d12f } from "../../api/clones";
import type { v_8ad91b } from "../../navigation/types";

type Nav = v_390fcc<v_8ad91b>;

interface RowConfig {
  type: string;
  label: string;
  hint: string;
  run: (nav: Nav, cloneId: number, userId: number) => void;
}

const v_2adce2 = [
  {
    type: "intimacy_score",
    label: "🌡️ 온도 상승 (intimacy_score)",
    hint: "구독 탭 → 해당 페르소나 온도 모달",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ShortsTab",
        params: { openIntimacyCloneId: v_6e0fd3 },
      }),
  },
  {
    type: "clone_like",
    label: "👍 좋아요 도착 (clone_like)",
    hint: "대시보드 → 해당 페르소나 좋아요 리스트",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: v_6e0fd3, openStatsTab: "likes" },
        },
      }),
  },
  {
    type: "clone_comment",
    label: "💬 댓글 도착 (clone_comment)",
    hint: "대시보드 → 해당 페르소나 댓글 리스트",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: v_6e0fd3, openStatsTab: "comments" },
        },
      }),
  },
  {
    type: "clone_gift",
    label: "🎁 선물 도착 (clone_gift)",
    hint: "대시보드 → 해당 페르소나 친밀도 모달(선물 표시)",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: v_6e0fd3, openStatsTab: "gifts" },
        },
      }),
  },
  {
    type: "clone_follow",
    label: "➕ 새 구독자 (clone_follow)",
    hint: "대시보드 → 해당 페르소나 구독자 리스트",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: {
          screen: "Dashboard",
          params: { openStatsCloneId: v_6e0fd3, openStatsTab: "followers" },
        },
      }),
  },
  {
    type: "user_follow",
    label: "👤 새 팔로워 (user_follow)",
    hint: "내 팔로워 리스트",
    run: (v_3c9f12, v_921029, v_43e90c) =>
      v_3c9f12.navigate("UserFollowList", { userId: v_43e90c, mode: "followers" }),
  },
  {
    type: "followee_new_clone",
    label: "✨ 팔로우 유저의 새 페르소나 (followee_new_clone)",
    hint: "그 페르소나 상세 화면",
    run: (v_3c9f12, v_6e0fd3) =>
      v_3c9f12.navigate("Main", {
        screen: "ClonesTab",
        params: { screen: "CloneDetail", params: { cloneId: v_6e0fd3 } },
      }),
  },
  {
    type: "moderation",
    label: "⚠️ 신고 제재 결과 (moderation)",
    hint: "설정 → 신고 → 신고 받은 내역 탭",
    run: (v_3c9f12) =>
      v_3c9f12.dispatch(
        v_650cfa.navigate({
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
    run: (v_3c9f12) =>
      v_3c9f12.navigate("InviteAccept", { token: "dummy-test-token" }),
  },
];

export default function v_93ca57() {
  const v_3c9f12 = v_ada615<Nav>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const [v_6e0fd3, v_5aba76] = v_5ab095<number | null>(null);
  const [v_f2ff36, v_caa192] = v_5ab095<string>("");
  const [v_683210, v_34a50a] = v_5ab095(true);

  v_c4deb2(() => {
    let v_2008a4 = false;
    async function v_f6f5de() {
      try {
        if (v_2ca7e0) {
          const v_8fc8f0 = await v_d60cdf(v_2ca7e0);
          if (!v_2008a4 && v_8fc8f0.items.length > 0) {
            const v_3f4e2e = v_8fc8f0.items[0];
            if (v_3f4e2e) {
              v_5aba76(v_3f4e2e.id);
              v_caa192(v_3f4e2e.name ?? `#${v_3f4e2e.id}`);
              return;
            }
          }
          const v_1a85dc = await v_81d12f(v_2ca7e0);
          if (!v_2008a4 && v_1a85dc.items.length > 0) {
            const v_3f4e2e = v_1a85dc.items[0];
            if (v_3f4e2e) {
              v_5aba76(v_3f4e2e.id);
              v_caa192(v_3f4e2e.name ?? `#${v_3f4e2e.id}`);
            }
          }
        }
      } catch (v_49263d) {
        console.warn("[NotificationRoutingTest] load clones failed:", v_49263d);
      } finally {
        if (!v_2008a4) v_34a50a(false);
      }
    }
    void v_f6f5de();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_43e90c = v_b113dd?.id ?? 0;

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="알림 라우팅 테스트" showBackButton onBackPress={() => v_3c9f12.goBack()} />
      <ScrollView contentContainerStyle={v_fd5f43.content}>
        {v_683210 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={v_1bfbd0.violet600} />
        ) : (
          <>
            <View style={v_fd5f43.infoBox}>
              <Text style={v_fd5f43.infoText}>
                {v_6e0fd3
                  ? `테스트 페르소나: ${v_f2ff36} (#${v_6e0fd3})`
                  : "테스트 페르소나 없음 — 페르소나 관련 라우팅은 동작 안 함"}
              </Text>
              <Text style={v_fd5f43.infoSub}>
                사용자 ID: {v_43e90c || "미로그인"}
              </Text>
            </View>
            {v_2adce2.map((v_3ac7e7) => {
              const v_e007e4 =
                v_3ac7e7.type !== "user_follow" &&
                v_3ac7e7.type !== "moderation" &&
                v_3ac7e7.type !== "invite_received";
              const v_4a6533 = v_e007e4 && !v_6e0fd3;
              return (
                <TouchableOpacity
                  key={v_3ac7e7.type}
                  style={[v_fd5f43.row, v_4a6533 && v_fd5f43.rowDisabled]}
                  disabled={v_4a6533}
                  onPress={() => v_3ac7e7.run(v_3c9f12, v_6e0fd3 ?? 0, v_43e90c)}
                  activeOpacity={0.7}
                >
                  <Text style={v_fd5f43.rowLabel}>{v_3ac7e7.label}</Text>
                  <Text style={v_fd5f43.rowHint}>{v_3ac7e7.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  content: { padding: 16, paddingBottom: 40 },
  infoBox: {
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8b0c90.md,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: v_1bfbd0.zinc900, fontWeight: "600" },
  infoSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },
  row: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    padding: 14,
    marginBottom: 10,
  },
  rowDisabled: { opacity: 0.4 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  rowHint: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },
});
