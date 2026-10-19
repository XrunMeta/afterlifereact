

import v_a3453e, { v_de06a3, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_122070,
  v_cf9c33,
  v_39a996,
  v_6c4f62,
  v_03e392,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_2d8264, type v_ee3714, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_d43669, v_c10a43 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_bf9881,
  v_83b207,
  type v_407a6d,
  type v_ccbfb2,
} from "../../api/giftInventory";
import type { v_2d88fc, v_8ad91b } from "../../navigation/types";

type TabKey = "received" | "sent" | "exchange";
type Route = v_ee3714<v_2d88fc, "GiftBox">;

function v_6cfd25(v_94302c) {
  return v_94302c === "received" || v_94302c === "ad_reward";
}
function v_9f8b94(v_94302c) {
  return v_94302c === "sent";
}
function v_a18e68(v_94302c) {
  return v_94302c === "exchanged" || v_94302c === "swapped";
}

function v_3f3aa6(v_6fc191): string {
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  const v_f86223 = ["일", "월", "화", "수", "목", "금", "토"][v_d5dda0.getDay()];
  return `${v_d5dda0.getMonth() + 1}월 ${v_d5dda0.getDate()}일 (${v_f86223})`;
}

function v_3380b3(v_6fc191): string {
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  const v_65a2cd = v_d5dda0.getHours();
  const v_35f85c = v_d5dda0.getMinutes();
  const v_5e39a0 = v_65a2cd < 12 ? "오전" : "오후";
  const v_02de88 = v_65a2cd % 12 === 0 ? 12 : v_65a2cd % 12;
  return `${v_5e39a0} ${v_02de88}:${String(v_35f85c).padStart(2, "0")}`;
}

function v_aaa53b(v_6fc191, v_5c2f9f = new Date()): boolean {
  const v_d5dda0 = new Date(v_6fc191);
  return v_d5dda0.getFullYear() === v_5c2f9f.getFullYear() && v_d5dda0.getMonth() === v_5c2f9f.getMonth();
}

export default function v_8869a8() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615<v_390fcc<v_2d88fc>>();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const { params: v_24baff } = v_2d8264<Route>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_11083e, v_94ee83] = v_5ab095<TabKey>(v_24baff?.initialTab ?? "received");
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_3e58a1, v_8ea37b] = v_5ab095<v_407a6d[]>([]);
  const [v_fa2885, v_83b7f7] = v_5ab095<v_ccbfb2[]>([]);
  const [v_5da798, v_19e9c0] = v_5ab095(0);
  const [v_eddb49, v_839e4f] = v_5ab095(1);

  const v_3b7876 = v_df9f57(() => {
    const v_b16994 = [...v_fa2885].filter((v_206b88) => v_206b88.count > 0).sort((v_779914, v_148ff6) => v_148ff6.count - v_779914.count);
    return v_b16994[0] ?? null;
  }, [v_fa2885]);

  const v_063b5f = v_3b7876?.count ?? 0;

  v_cf763b(
    v_de06a3(() => {
      if (v_24baff?.initialTab) v_94ee83(v_24baff.initialTab);
    }, [v_24baff?.initialTab]),
  );

  const v_92fdf2 = v_de06a3(
    async (v_cc88f5 = false) => {
      if (!v_2ca7e0) {
        v_8ea37b([]);
        v_83b7f7([]);
        v_34a50a(false);
        v_575aad(false);
        return;
      }
      if (v_cc88f5) v_575aad(true);
      else v_34a50a(true);
      try {
        const [v_be73a0, v_f0104f] = await Promise.all([
          v_bf9881(v_2ca7e0, { limit: 100 }),
          v_83b207(v_2ca7e0),
        ]);
        v_8ea37b(v_be73a0.items);
        v_19e9c0(v_be73a0.totalReceived);
        v_83b7f7(v_f0104f.items.filter((v_23805a) => (v_23805a.count ?? 0) > 0));
      } catch (v_49263d) {
        console.warn("[GiftBox] load fail:", v_49263d);
      } finally {
        v_34a50a(false);
        v_575aad(false);
      }
    },
    [v_2ca7e0],
  );

  v_cf763b(
    v_de06a3(() => {
      void v_92fdf2(false);
    }, [v_92fdf2]),
  );

  v_a3453e.useEffect(() => {
    if (v_063b5f <= 0) {
      v_839e4f(1);
      return;
    }
    v_839e4f((v_ab6401) => Math.min(Math.max(1, v_ab6401), v_063b5f));
  }, [v_063b5f, v_3b7876?.giftId]);

  const v_8af8a0 = v_df9f57(() => v_3e58a1.filter((v_206b88) => v_6cfd25(v_206b88.kind)), [v_3e58a1]);
  const v_ccaf2e = v_df9f57(() => v_3e58a1.filter((v_206b88) => v_9f8b94(v_206b88.kind)), [v_3e58a1]);
  const v_a717df = v_df9f57(() => v_3e58a1.filter((v_206b88) => v_a18e68(v_206b88.kind)), [v_3e58a1]);

  const v_809fd7 = v_df9f57(() => {
    const v_c4417c = v_ccaf2e.filter((v_206b88) => v_aaa53b(v_206b88.createdAt));
    const v_02cfa2 = v_c4417c.reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0);
    const v_fdd5c7 = new Set(
      v_c4417c.map((v_206b88) => v_206b88.counterpartId ?? v_206b88.counterpartEmail ?? v_206b88.counterpartName).filter(Boolean),
    );
    return { flowerSum: v_02cfa2, people: v_fdd5c7.size };
  }, [v_ccaf2e]);

  const v_bc3259 = v_df9f57(() => {
    const v_8dcb51 = new Map<string, v_407a6d[]>();
    for (const v_8c0b26 of v_ccaf2e) {
      const v_b24339 = v_3f3aa6(v_8c0b26.createdAt) || "—";
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_ccaf2e]);

  const v_475a8d = v_3b7876 ? v_eddb49 * (v_3b7876.xrunPerItem || 0) : 0;
  const v_473f7a = (v_f4e98d) => {
    if (!Number.isFinite(v_f4e98d)) return "0";
    return Number.isInteger(v_f4e98d) ? String(v_f4e98d) : v_f4e98d.toFixed(1).replace(/\.0$/, "");
  };

  const v_3aa149 = v_df9f57(
    () => v_8af8a0.reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0) || v_5da798,
    [v_8af8a0, v_5da798],
  );

  const v_c6c04c = [
    {
      key: "received",
      label: v_8d41d7("giftBox.tabReceived", { defaultValue: "받은 선물" }),
      count: v_3aa149 > 0 ? v_3aa149 : undefined,
    },
    {
      key: "sent",
      label: v_8d41d7("giftBox.tabSent", { defaultValue: "보낸 선물" }),
      count: v_ccaf2e.length > 0 ? v_ccaf2e.reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0) : undefined,
    },
    { key: "exchange", label: v_8d41d7("giftBox.tabExchange", { defaultValue: "교환" }) },
  ];

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("giftBox.title", { defaultValue: "선물함" })}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_d81136.tabRow}>
        {v_c6c04c.map((v_c3c9ed) => {
          const v_f8b770 = v_11083e === v_c3c9ed.key;
          return (
            <TouchableOpacity
              key={v_c3c9ed.key}
              style={[v_d81136.tabItem, v_f8b770 && v_d81136.tabItemActive]}
              onPress={() => v_94ee83(v_c3c9ed.key)}
              activeOpacity={0.7}
            >
              <Text style={[v_d81136.tabText, v_f8b770 && v_d81136.tabTextActive]}>
                {v_c3c9ed.label}
                {v_c3c9ed.count != null ? (
                  <Text style={v_d81136.tabCount}> {v_c3c9ed.count}</Text>
                ) : null}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {v_683210 ? (
        <View style={v_d81136.center}>
          <ActivityIndicator color={v_1bfbd0.zinc500} />
        </View>
      ) : (
        <ScrollView
          style={v_d81136.scroll}
          contentContainerStyle={v_d81136.scrollContent}
          refreshControl={
            <RefreshControl refreshing={v_612e9f} onRefresh={() => void v_92fdf2(true)} />
          }
          showsVerticalScrollIndicator={false}
        >
          {v_11083e === "received" && (
            <ReceivedTab
              items={v_8af8a0}
              ownedGift={v_3b7876}
              t={v_8d41d7}
              onExchange={() => v_94ee83("exchange")}
            />
          )}
          {v_11083e === "sent" && (
            <SentTab
              grouped={v_bc3259}
              monthStats={v_809fd7}
              t={v_8d41d7}
              onBrowseClones={() => {
                v_f4c991.dispatch(
                  v_650cfa.navigate({ name: "HomeTab" }),
                );
              }}
            />
          )}
          {v_11083e === "exchange" && (
            <ExchangeTab
              gift={v_3b7876}
              qty={v_eddb49}
              maxQty={v_063b5f}
              rewardXrun={v_475a8d}
              formatXrun={v_473f7a}
              history={v_a717df}
              t={v_8d41d7}
              onDec={() => v_839e4f((v_ab6401) => Math.max(1, v_ab6401 - 1))}
              onInc={() => v_839e4f((v_ab6401) => Math.min(v_063b5f, v_ab6401 + 1))}
              onSelectAll={() => v_839e4f(Math.max(1, v_063b5f))}
              onSubmit={() => {

                v_03e392.alert(
                  v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" }),
                  v_8d41d7("giftBox.exchangePreview", {
                    defaultValue: "교환 UI 미리보기입니다.",
                  }),
                );
              }}
            />
          )}
        </ScrollView>
      )}
    </SafeView>
  );
}

const v_61d6aa = 10;
const v_526d27 = "__all__";
const v_8156fe = "__anon__";

function v_8e47b4(v_6fc191, v_8d41d7): string {
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return "—";
  const v_5c2f9f = new Date();
  if (
    v_d5dda0.getFullYear() === v_5c2f9f.getFullYear() &&
    v_d5dda0.getMonth() === v_5c2f9f.getMonth() &&
    v_d5dda0.getDate() === v_5c2f9f.getDate()
  ) {
    return v_8d41d7("giftBox.today", { defaultValue: "오늘" });
  }
  return v_3f3aa6(v_6fc191);
}

function v_0f11bb(item: v_407a6d): boolean {
  return !v_8c0b26.counterpartId && !v_8c0b26.counterpartName && !v_8c0b26.counterpartEmail;
}

function v_44c2cb(
  item: v_407a6d,
  v_8d41d7,
): string {
  if (v_8c0b26.kind === "ad_reward") {
    return v_8d41d7("giftBox.adRewardSender", { defaultValue: "광고 보상" });
  }
  if (v_0f11bb(v_8c0b26)) {
    return v_8d41d7("giftBox.anonymous", { defaultValue: "익명" });
  }
  return (
    v_8c0b26.counterpartName ||
    v_8c0b26.counterpartEmail ||
    (v_8c0b26.counterpartId ? `user_${v_8c0b26.counterpartId}` : v_8d41d7("giftBox.anonymous", { defaultValue: "익명" }))
  );
}

function v_8345ff(v_1833e7): string {
  const v_73a570 = ["#dbeafe", "#e9d5ff", "#fce7f3", "#d1fae5", "#fef3c7"];
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_1833e7.length; v_ebec57++) v_65a2cd = (v_65a2cd + v_1833e7.charCodeAt(v_ebec57) * 17) % v_73a570.length;
  return v_73a570[v_65a2cd];
}

function v_6da59e({
  items: v_4622b9,
  ownedGift: v_9eb4d1,
  t: v_8d41d7,
  onExchange: v_5be83c,
}: {
  items: v_407a6d[];
  ownedGift: v_ccbfb2 | null;
  t: (k: string, o?: { defaultValue: string }) => string;
  onExchange: () => void;
}) {
  const [v_f21110, v_d217e7] = v_5ab095<string>(v_526d27);
  const [v_64bcd4, v_b53914] = v_5ab095(v_61d6aa);

  const v_863e6c = v_df9f57(() => {
    const v_77b1ac = [];
    const v_110a8b = new Set<string>();
    for (const v_206b88 of v_4622b9) {
      const v_f4e98d = v_206b88.cloneName?.trim();
      if (!v_f4e98d || v_110a8b.has(v_f4e98d)) continue;
      v_110a8b.add(v_f4e98d);
      v_77b1ac.push(v_f4e98d);
    }
    return v_77b1ac;
  }, [v_4622b9]);

  const v_e4cf17 = v_df9f57(() => {
    if (v_f21110 === v_526d27) return v_4622b9;
    if (v_f21110 === v_8156fe) return v_4622b9.filter(v_0f11bb);
    return v_4622b9.filter((v_206b88) => v_206b88.cloneName === v_f21110);
  }, [v_4622b9, v_f21110]);

  v_a3453e.useEffect(() => {
    v_b53914(v_61d6aa);
  }, [v_4622b9, v_f21110]);

  const v_cf55be = v_e4cf17.slice(0, v_64bcd4);
  const v_6bbe19 = v_64bcd4 < v_e4cf17.length;

  const v_4d79ca = v_df9f57(() => {
    const v_8dcb51 = new Map<string, v_407a6d[]>();
    for (const v_8c0b26 of v_cf55be) {
      const v_b24339 = v_8e47b4(v_8c0b26.createdAt, v_8d41d7);
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_cf55be, v_8d41d7]);

  return (
    <View>
      {}
      <View style={v_d81136.ownedCard}>
        <View style={v_d81136.ownedLeft}>
          <View style={v_d81136.ownedIconWrap}>
            <Text style={{ fontSize: 22 }}>{v_9eb4d1?.emoji ?? "🌹"}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={v_d81136.ownedLabel}>
              {v_8d41d7("giftBox.ownedLabel", { defaultValue: "보유 중" })}
            </Text>
            <Text style={v_d81136.ownedTitle} numberOfLines={1}>
              {v_9eb4d1
                ? `${v_9eb4d1.name} ${v_9eb4d1.count}${v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}`
                : v_8d41d7("giftBox.ownedEmpty", { defaultValue: "보유 중인 선물이 없어요" })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[v_d81136.ownedExchangeBtn, !v_9eb4d1 && { opacity: 0.4 }]}
          onPress={v_5be83c}
          disabled={!v_9eb4d1}
          activeOpacity={0.85}
        >
          <Text style={v_d81136.ownedExchangeBtnText}>
            {v_8d41d7("giftBox.tabExchange", { defaultValue: "교환" })}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={v_d81136.filterRow}
        style={{ marginBottom: 16 }}
      >
        <TouchableOpacity
          style={[v_d81136.filterChip, v_f21110 === v_526d27 && v_d81136.filterChipActive]}
          onPress={() => v_d217e7(v_526d27)}
          activeOpacity={0.8}
        >
          <Text style={[v_d81136.filterChipText, v_f21110 === v_526d27 && v_d81136.filterChipTextActive]}>
            {v_8d41d7("giftBox.filterAll", { defaultValue: "전체" })}
          </Text>
        </TouchableOpacity>
        {v_863e6c.map((v_1833e7) => {
          const v_f8b770 = v_f21110 === v_1833e7;
          return (
            <TouchableOpacity
              key={v_1833e7}
              style={[v_d81136.filterChip, v_f8b770 && v_d81136.filterChipActive]}
              onPress={() => v_d217e7(v_1833e7)}
              activeOpacity={0.8}
            >
              <Text style={[v_d81136.filterChipText, v_f8b770 && v_d81136.filterChipTextActive]}>
                {v_1833e7}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[v_d81136.filterChip, v_f21110 === v_8156fe && v_d81136.filterChipActive]}
          onPress={() => v_d217e7(v_8156fe)}
          activeOpacity={0.8}
        >
          <Text style={[v_d81136.filterChipText, v_f21110 === v_8156fe && v_d81136.filterChipTextActive]}>
            {v_8d41d7("giftBox.filterAnon", { defaultValue: "익명만" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {v_e4cf17.length === 0 ? (
        <View style={v_d81136.emptyBox}>
          <Text style={v_d81136.emptyText}>
            {v_8d41d7("dashboard.emptyGift", { defaultValue: "아직 받은 선물이 없어요" })}
          </Text>
        </View>
      ) : (
        <>
          {v_4d79ca.map(([v_dcea27, v_18b8bf]) => (
            <View key={v_dcea27} style={v_d81136.recvGroup}>
              <Text style={v_d81136.recvDateHeader}>{v_dcea27}</Text>
              <View style={v_d81136.recvGroupCard}>
                {v_18b8bf.map((v_8c0b26, v_e86ad8) => (
                  <ReceivedRow
                    key={v_8c0b26.id}
                    item={v_8c0b26}
                    t={v_8d41d7}
                    showBorder={v_e86ad8 < v_18b8bf.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}
          {v_6bbe19 && (
            <TouchableOpacity
              style={v_d81136.moreBtn}
              activeOpacity={0.7}
              onPress={() =>
                v_b53914((v_f4e98d) => Math.min(v_f4e98d + v_61d6aa, v_e4cf17.length))
              }
            >
              <Text style={v_d81136.moreBtnText}>
                {v_8d41d7("giftBox.loadMore", {
                  defaultValue: `더보기 (${v_e4cf17.length - v_64bcd4})`,
                })}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function v_223c52({
  item: v_8c0b26,
  t: v_8d41d7,
  showBorder: v_ff995c,
}: {
  item: v_407a6d;
  t: (k: string, o?: { defaultValue: string }) => string;
  showBorder: boolean;
}) {
  const v_1833e7 = v_44c2cb(v_8c0b26, v_8d41d7);
  const v_9f1622 = v_8d41d7("giftBox.receivedTitle", {
    name: v_1833e7,
    gift: v_8c0b26.giftName,
    defaultValue: `${v_1833e7}님이 ${v_8c0b26.giftName}를 보냈어요`,
  });
  const v_609005 = v_8c0b26.cloneName
    ? v_8d41d7("giftBox.toClone", {
        name: v_8c0b26.cloneName,
        defaultValue: `${v_8c0b26.cloneName} 클론에게`,
      })
    : v_8d41d7("giftBox.toUnknownClone", { defaultValue: "클론에게" });
  const v_ab4c96 = `${v_609005} · ${v_3380b3(v_8c0b26.createdAt)}`;
  const v_085ccc = v_8345ff(v_1833e7);

  return (
    <View style={[v_d81136.recvRow, v_ff995c && v_d81136.recvRowBorder]}>
      <View style={[v_d81136.avatar, { backgroundColor: v_085ccc }]}>
        {v_8c0b26.counterpartAvatarUrl ? (
          <Image source={{ uri: v_8c0b26.counterpartAvatarUrl }} style={v_d81136.avatarImg} />
        ) : v_0f11bb(v_8c0b26) && v_8c0b26.kind !== "ad_reward" ? (
          <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
        ) : (
          <Text style={v_d81136.avatarInitial}>{(v_1833e7.charAt(0) || "?").toUpperCase()}</Text>
        )}
      </View>
      <View style={v_d81136.logBody}>
        <Text style={v_d81136.recvTitle} numberOfLines={2}>
          {v_9f1622}
        </Text>
        <Text style={v_d81136.meta} numberOfLines={1}>
          {v_ab4c96}
        </Text>
      </View>
      <Text style={v_d81136.recvCount}>×{v_8c0b26.count || 1}</Text>
    </View>
  );
}

function v_950e4a({
  grouped: v_4d79ca,
  monthStats: v_cfb8ec,
  t: v_8d41d7,
  onBrowseClones: v_9cb927,
}: {
  grouped: [string, v_407a6d[]][];
  monthStats: { flowerSum: number; people: number };
  t: (k: string, o?: { defaultValue: string }) => string;
  onBrowseClones: () => void;
}) {
  return (
    <View>
      <View style={v_d81136.summaryCard}>
        <View style={v_d81136.summaryCol}>
          <Text style={v_d81136.metricLabel}>
            {v_8d41d7("giftBox.sentThisMonth", { defaultValue: "이번 달 보낸 선물" })}
          </Text>
          <Text style={v_d81136.metricValue}>
            {v_cfb8ec.flowerSum}
            {v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}
          </Text>
        </View>
        <View style={v_d81136.summaryCol}>
          <Text style={v_d81136.metricLabel}>
            {v_8d41d7("giftBox.sentPeople", { defaultValue: "받은 사람" })}
          </Text>
          <Text style={v_d81136.metricValue}>
            {v_cfb8ec.people}
            {v_8d41d7("giftBox.peopleUnit", { defaultValue: "명" })}
          </Text>
        </View>
      </View>

      {v_4d79ca.length === 0 ? (
        <View style={v_d81136.emptyBox}>
          <Text style={v_d81136.emptyText}>
            {v_8d41d7("giftBox.emptySent", { defaultValue: "아직 보낸 선물이 없어요" })}
          </Text>
        </View>
      ) : (
        v_4d79ca.map(([v_dcea27, v_18b8bf]) => (
          <View key={v_dcea27} style={{ marginBottom: 16 }}>
            <Text style={v_d81136.dateHeader}>{v_dcea27}</Text>
            {v_18b8bf.map((v_8c0b26) => {
              const v_97d2e9 =
                v_8c0b26.counterpartName ||
                v_8c0b26.counterpartEmail ||
                (v_8c0b26.counterpartId ? `user_${v_8c0b26.counterpartId}` : v_8d41d7("giftBox.someone", { defaultValue: "상대" }));
              return (
                <View key={v_8c0b26.id} style={v_d81136.sentCard}>
                  <View style={v_d81136.avatar}>
                    {v_8c0b26.counterpartAvatarUrl ? (
                      <Image source={{ uri: v_8c0b26.counterpartAvatarUrl }} style={v_d81136.avatarImg} />
                    ) : (
                      <Text style={v_d81136.avatarInitial}>
                        {(v_97d2e9.charAt(0) || "?").toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={v_d81136.logBody}>
                    <Text style={v_d81136.sentTitle} numberOfLines={2}>
                      {v_97d2e9}
                      {v_8d41d7("giftBox.sentToSuffix", { defaultValue: "님에게 " })}
                      {v_8c0b26.giftName}
                    </Text>
                    <Text style={v_d81136.meta}>
                      {v_3380b3(v_8c0b26.createdAt)}
                      {" · "}
                      {v_8d41d7("giftBox.delivered", { defaultValue: "전달 완료" })}
                    </Text>
                  </View>
                  <Text style={v_d81136.sentCount}>×{v_8c0b26.count || 1}</Text>
                </View>
              );
            })}
          </View>
        ))
      )}

      <View style={v_d81136.browseCta}>
        <Text style={v_d81136.browseHint}>
          {v_8d41d7("giftBox.browseHint", { defaultValue: "마음에 드는 클론에게 선물을 보내보세요" })}
        </Text>
        <TouchableOpacity style={v_d81136.browseBtn} onPress={v_9cb927} activeOpacity={0.8}>
          <Text style={v_d81136.browseBtnText}>
            {v_8d41d7("giftBox.browseClones", { defaultValue: "클론 둘러보기" })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function v_1bc5d1({
  gift: v_bbee9c,
  qty: v_d016c9,
  maxQty: v_063b5f,
  rewardXrun: v_475a8d,
  formatXrun: v_473f7a,
  history: v_10740d,
  t: v_8d41d7,
  onDec: v_529659,
  onInc: v_187937,
  onSelectAll: v_e3f4f2,
  onSubmit: v_3bfe4c,
}: {
  gift: v_ccbfb2 | null;
  qty: number;
  maxQty: number;
  rewardXrun: number;
  formatXrun: (n: number) => string;
  history: v_407a6d[];
  t: (k: string, o?: { defaultValue: string }) => string;
  onDec: () => void;
  onInc: () => void;
  onSelectAll: () => void;
  onSubmit: () => void;
}) {
  const [v_71921b, v_7ca8ec] = v_5ab095(false);
  v_a3453e.useEffect(() => {
    v_7ca8ec(false);
  }, [v_10740d]);

  if (!v_bbee9c) {
    return (
      <View style={v_d81136.emptyBox}>
        <Text style={v_d81136.emptyText}>
          {v_8d41d7("giftBox.emptyExchange", { defaultValue: "교환할 선물이 없어요" })}
        </Text>
      </View>
    );
  }

  const v_986caa = 3;
  const v_5fbf3c = v_473f7a(v_bbee9c.xrunPerItem || 0);

  return (
    <View>
      <Text style={v_d81136.sectionLabel}>
        {v_8d41d7("giftBox.exchangeTarget", { defaultValue: "교환할 선물" })}
      </Text>
      <View style={v_d81136.exchangeCard}>
        <View style={v_d81136.exchangeGiftRow}>
          <View style={v_d81136.giftIconCircle}>
            <Text style={{ fontSize: 22 }}>{v_bbee9c.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={v_d81136.sentTitle}>{v_bbee9c.name}</Text>
            <Text style={v_d81136.meta}>
              {v_8d41d7("giftBox.ownedPrefix", { defaultValue: "보유 " })}
              {v_bbee9c.count}
              {v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}
              {" · "}
              1{v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })} = {v_5fbf3c}XRUN
            </Text>
          </View>
        </View>
        <View style={v_d81136.stepperRow}>
          <View style={v_d81136.stepper}>
            <TouchableOpacity style={v_d81136.stepBtn} onPress={v_529659} disabled={v_d016c9 <= 1}>
              <Feather name="minus" size={16} color={v_d016c9 <= 1 ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
            </TouchableOpacity>
            <Text style={v_d81136.stepQty}>{v_d016c9}</Text>
            <TouchableOpacity style={v_d81136.stepBtn} onPress={v_187937} disabled={v_d016c9 >= v_063b5f}>
              <Feather name="plus" size={16} color={v_d016c9 >= v_063b5f ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={v_d81136.selectAllBtn} onPress={v_e3f4f2} activeOpacity={0.8}>
            <Text style={v_d81136.selectAllText}>
              {v_8d41d7("giftBox.selectAll", { defaultValue: "전부 선택" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={v_d81136.calcCard}>
        <View style={v_d81136.calcRow}>
          <Text style={v_d81136.calcLabel}>{v_8d41d7("giftBox.exchangeQty", { defaultValue: "교환 수량" })}</Text>
          <Text style={v_d81136.calcValue}>
            {v_d016c9}
            {v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}
          </Text>
        </View>
        <View style={v_d81136.calcRow}>
          <Text style={v_d81136.calcLabel}>{v_8d41d7("giftBox.fee", { defaultValue: "수수료" })}</Text>
          <Text style={v_d81136.calcValue}>
            0{v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}
          </Text>
        </View>
        <View style={v_d81136.calcDivider} />
        <View style={v_d81136.calcRow}>
          <Text style={v_d81136.calcTotalLabel}>
            {v_8d41d7("giftBox.reward", { defaultValue: "받게 될 보상" })}
          </Text>
          <Text style={v_d81136.calcTotalValue}>{v_473f7a(v_475a8d)} XRUN</Text>
        </View>
      </View>

      <View style={v_d81136.historyHeader}>
        <Text style={[v_d81136.sectionLabel, { marginBottom: 0 }]}>
          {v_8d41d7("giftBox.recentExchange", { defaultValue: "최근 교환 내역" })}
        </Text>
        <TouchableOpacity
          onPress={() => v_7ca8ec(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={v_d81136.historyViewAll}>
            {v_8d41d7("giftBox.viewAll", { defaultValue: "전체보기" })}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={v_d81136.historyCard}>
        {v_10740d.length === 0 ? (
          <Text style={[v_d81136.emptyText, { paddingVertical: 20 }]}>
            {v_8d41d7("giftBox.emptyExchangeHistory", { defaultValue: "최근 교환 내역이 없어요" })}
          </Text>
        ) : (
          v_10740d.slice(0, v_71921b ? v_10740d.length : v_986caa).map((v_8c0b26, v_e86ad8) => (
            <View
              key={v_8c0b26.id}
              style={[
                v_d81136.historyRow,
                v_e86ad8 < Math.min(v_10740d.length, v_71921b ? v_10740d.length : v_986caa) - 1 &&
                  v_d81136.historyRowBorder,
              ]}
            >
              <View style={v_d81136.historyIcon}>
                <Text style={{ color: "#2563eb", fontWeight: "700" }}>⇄</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={v_d81136.sentTitle} numberOfLines={1}>
                  {v_8c0b26.giftName} {v_8c0b26.count || 1}
                  {v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}{" "}
                  {v_8d41d7("giftBox.exchangedSuffix", { defaultValue: "교환" })}
                </Text>
                <Text style={v_d81136.meta}>
                  {v_3f3aa6(v_8c0b26.createdAt)} · {v_3380b3(v_8c0b26.createdAt)}
                </Text>
              </View>
              <Text style={v_d81136.doneBadge}>
                {v_8d41d7("giftBox.completed", { defaultValue: "완료" })}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[v_d81136.exchangeCta, v_063b5f <= 0 && { opacity: 0.4 }]}
        onPress={v_3bfe4c}
        disabled={v_063b5f <= 0}
        activeOpacity={0.85}
      >
        <Text style={v_d81136.exchangeCtaText}>
          {v_d016c9}
          {v_8d41d7("giftBox.flowerUnit", { defaultValue: "송이" })}{" "}
          {v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" })}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const v_d81136 = v_472849.create({
  tabRow: {
    flexDirection: "row",
    backgroundColor: v_1bfbd0.white,
    borderBottomWidth: v_472849.hairlineWidth,
    borderBottomColor: v_1bfbd0.zinc200,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: v_1bfbd0.zinc900 },
  tabText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc400 },
  tabTextActive: { fontWeight: "700", color: v_1bfbd0.zinc900 },
  tabCount: { fontWeight: "700", color: v_1bfbd0.secondary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  ownedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  ownedLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
  ownedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fce7f3",
    alignItems: "center",
    justifyContent: "center",
  },
  ownedLabel: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 2 },
  ownedTitle: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc900 },
  ownedExchangeBtn: {
    ...v_d43669.sm,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  ownedExchangeBtnText: { ...v_c10a43.sm, color: v_1bfbd0.white },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  filterChipActive: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700 },
  filterChipTextActive: { color: v_1bfbd0.white },
  recvGroup: { marginBottom: 16 },
  recvDateHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginBottom: 8,
    marginLeft: 2,
  },
  recvGroupCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    overflow: "hidden",
  },
  recvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  recvRowBorder: {
    borderBottomWidth: v_472849.hairlineWidth,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  recvTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  recvCount: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
  summaryLine: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 12 },
  summaryNum: { fontWeight: "700", color: v_1bfbd0.zinc900 },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
  },
  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center" },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarInitial: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.zinc500 },
  logBody: { flex: 1, minWidth: 0 },
  logTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kindLabel: { fontSize: 12, fontWeight: "700" },
  giftEmoji: { fontSize: 14 },
  giftName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, flexShrink: 1 },
  meta: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCol: { flex: 1 },
  metricLabel: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: "700", color: v_1bfbd0.zinc900 },
  dateHeader: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 8, marginLeft: 2 },
  sentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  sentTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  sentCount: { fontSize: 15, fontWeight: "700", color: "#c2410c" },
  browseCta: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc300,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  browseHint: { fontSize: 13, color: v_1bfbd0.zinc500, textAlign: "center" },
  browseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.white,
  },
  browseBtnText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc600, marginBottom: 8 },
  exchangeCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exchangeGiftRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  giftIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fce7f3",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moreBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  moreBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  historyViewAll: { fontSize: 13, color: v_1bfbd0.zinc400 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 10,
    overflow: "hidden",
  },
  stepBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepQty: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  selectAllBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.white,
  },
  selectAllText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc800 },
  calcCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  calcRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  calcLabel: { fontSize: 14, color: v_1bfbd0.zinc600 },
  calcValue: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  calcDivider: { height: v_472849.hairlineWidth, backgroundColor: v_1bfbd0.zinc200, marginVertical: 4 },
  calcTotalLabel: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  calcTotalValue: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.primary },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  historyRowBorder: { borderBottomWidth: v_472849.hairlineWidth, borderBottomColor: v_1bfbd0.zinc100 },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBadge: { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  exchangeCta: {
    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  exchangeCtaText: { ...v_c10a43.lg, color: v_1bfbd0.white },
});
