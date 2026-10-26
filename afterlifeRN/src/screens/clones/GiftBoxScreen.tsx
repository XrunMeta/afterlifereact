

import { v_561bb6 } from "../../api/gifts";
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
  v_79c4f2,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_cf763b, v_ada615, v_2d8264, type v_ee3714, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_75de9d } from "zqqvxke";
import v_556baf from "../../components/ui/SafeView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90, v_d43669, v_c10a43 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_bf9881,
  v_c55c0b,
  v_6f0728,
  type v_407a6d,
  type v_02ed3c,
  type v_867a79,
} from "../../api/giftInventory";
import { v_61fb8c } from "../../hooks/useGiftExchange";
import v_177da7 from "../../components/gift/GiftExchangeSheet";
import type { v_2d88fc, v_8ad91b } from "../../navigation/types";

type TabKey = "received" | "sent" | "exchange";
type Route = v_ee3714<v_2d88fc, "GiftBox">;

function v_6cfd25(v_94302c) {
  return v_94302c === "received" || v_94302c === "ad_reward";
}
function v_9f8b94(v_94302c) {
  return v_94302c === "sent";
}

const v_30b99a = [
  "giftBox.weekdayShortSun",
  "giftBox.weekdayShortMon",
  "giftBox.weekdayShortTue",
  "giftBox.weekdayShortWed",
  "giftBox.weekdayShortThu",
  "giftBox.weekdayShortFri",
  "giftBox.weekdayShortSat",
] as const;
const v_f97821 = ["일", "월", "화", "수", "목", "금", "토"];

function v_b5c383(v_6fc191, t: v_75de9d): string {
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  const v_087ffc = v_d5dda0.getDay();
  return v_8d41d7("giftBox.monthDayWeek", {
    defaultValue: "{{m}}월 {{d}}일 ({{w}})",
    m: v_d5dda0.getMonth() + 1,
    d: v_d5dda0.getDate(),
    w: v_8d41d7(v_30b99a[v_087ffc], { defaultValue: v_f97821[v_087ffc] }),
  });
}

function v_e4bf58(v_6fc191, t: v_75de9d): string {
  const v_d5dda0 = new Date(v_6fc191);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  const v_65a2cd = v_d5dda0.getHours();
  const v_35f85c = v_d5dda0.getMinutes();
  const v_5e39a0 = v_65a2cd < 12
    ? v_8d41d7("giftBox.am", { defaultValue: "오전" })
    : v_8d41d7("giftBox.pm", { defaultValue: "오후" });
  const v_02de88 = v_65a2cd % 12 === 0 ? 12 : v_65a2cd % 12;
  return `${v_5e39a0} ${v_02de88}:${String(v_35f85c).padStart(2, "0")}`;
}

function v_514b67(v_217d49): string {
  const v_d5dda0 = typeof v_217d49 === "number" ? new Date(v_217d49) : new Date(v_217d49);
  if (Number.isNaN(v_d5dda0.getTime())) return "";
  return [
    String(v_d5dda0.getHours()).padStart(2, "0"),
    String(v_d5dda0.getMinutes()).padStart(2, "0"),
    String(v_d5dda0.getSeconds()).padStart(2, "0"),
  ].join(":");
}

function v_9b9d5e(v_217d49, t: v_75de9d): string {
  const v_d5dda0 = typeof v_217d49 === "number" ? new Date(v_217d49) : new Date(v_217d49);
  if (Number.isNaN(v_d5dda0.getTime())) return "—";
  const v_b3d1d6 = `${v_d5dda0.getFullYear()}.${String(v_d5dda0.getMonth() + 1).padStart(2, "0")}.${String(v_d5dda0.getDate()).padStart(2, "0")}`;
  const v_5c2f9f = new Date();
  const v_147971 =
    v_d5dda0.getFullYear() === v_5c2f9f.getFullYear() &&
    v_d5dda0.getMonth() === v_5c2f9f.getMonth() &&
    v_d5dda0.getDate() === v_5c2f9f.getDate();
  if (v_147971) {
    return v_8d41d7("giftBox.todayWithDate", {
      defaultValue: "오늘 · {{ymd}}",
      ymd: v_b3d1d6,
    });
  }
  const v_32f7b8 = v_8d41d7(v_30b99a[v_d5dda0.getDay()], {
    defaultValue: v_f97821[v_d5dda0.getDay()],
  });
  return v_8d41d7("giftBox.ymdWeek", {
    defaultValue: "{{ymd}} ({{w}})",
    ymd: v_b3d1d6,
    w: v_32f7b8,
  });
}

const v_1dee60 = require("../../../assets/images/rose-icon.png");

function v_0d7182({ count: v_9e8c70, size: v_05b441 = "md" }: { count: number; size?: "md" | "lg" }) {
  const v_2d9767 = v_05b441 === "lg" ? v_d81136.roseIconLg : v_d81136.roseIcon;
  return (
    <View style={v_d81136.roseAmountRow}>
      <Image source={v_1dee60} style={v_2d9767} />
      <Text style={v_05b441 === "lg" ? v_d81136.roseAmountLg : v_d81136.roseAmount}>
        {v_9e8c70} ROSE
      </Text>
    </View>
  );
}

const v_951062 = 15;

const v_ca9d61 = true;

type PagedKind = "received" | "sent";
type Paged = { items: v_407a6d[]; offset: number; done: boolean };
const v_459174 = { items: [], offset: 0, done: false };

export default function v_8869a8() {
  const { t: v_8d41d7 } = v_772971();
  const v_c65f5d = v_ada615<v_390fcc<v_2d88fc>>();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const { params: v_24baff } = v_2d8264<Route>();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const v_5cbc42 =
    v_24baff?.view === "activity"
      ? ["received", "sent"]
      : v_24baff?.view === "exchange"
        ? ["exchange"]
        : ["received", "sent", "exchange"];
  const v_7ab4ca =
    v_24baff?.initialTab && v_5cbc42.includes(v_24baff.initialTab)
      ? v_24baff.initialTab
      : v_5cbc42[0];
  const [v_11083e, v_94ee83] = v_5ab095<TabKey>(v_7ab4ca);
  const [v_683210, v_34a50a] = v_5ab095(true);
  const [v_612e9f, v_575aad] = v_5ab095(false);
  const [v_79f454, v_588ee6] = v_5ab095<Paged>(v_459174);
  const [v_f966e3, v_835446] = v_5ab095<Paged>(v_459174);
  const [v_f34bc3, v_23061f] = v_5ab095<PagedKind | null>(null);
  const v_6f0b49 = v_a3453e.useRef(false);

  const v_8e5767 = v_a3453e.useRef(0);
  const [v_5da798, v_19e9c0] = v_5ab095(0);
  const [v_fcc796, v_0cc282] = v_5ab095<number | null>(null);
  const [v_b09797, v_c60f1e] = v_5ab095(0);
  const [v_084403, v_4710bd] = v_5ab095(false);

  v_cf763b(
    v_de06a3(() => {
      if (v_24baff?.initialTab && v_5cbc42.includes(v_24baff.initialTab)) {
        v_94ee83(v_24baff.initialTab);
      }

    }, [v_24baff?.initialTab]),
  );

  const v_088028 = v_de06a3(
    async (v_94302c, v_a13c2e) => {
      const v_554070 = v_94302c === "received" ? v_6cfd25 : v_9f8b94;
      let v_3bbadf = v_a13c2e.offset;
      let v_2fb8cc = false;
      const rows: v_407a6d[] = [];
      let last: Awaited<ReturnType<typeof v_bf9881>> | null = null;
      for (let v_ebec57 = 0; v_ebec57 < 10 && !v_2fb8cc && v_18b8bf.length === 0; v_ebec57++) {
        v_506e86 = await v_bf9881(v_2ca7e0!, { limit: v_951062, offset: v_3bbadf, kind: v_94302c });
        v_18b8bf.push(...v_506e86.items.filter((v_206b88) => v_554070(v_206b88.kind)));
        v_3bbadf += v_506e86.items.length;
        v_2fb8cc = v_506e86.items.length < v_951062;
      }
      return { paged: { items: [...v_a13c2e.items, ...v_18b8bf], offset: v_3bbadf, done: v_2fb8cc }, last: v_506e86 };
    },
    [v_2ca7e0],
  );

  const v_132dae = v_de06a3(
    async (v_94302c) => {
      const v_c3bc75 = v_94302c === "received" ? v_79f454 : v_f966e3;
      if (!v_2ca7e0 || v_c3bc75.done || v_6f0b49.current) return;
      v_6f0b49.current = true;
      v_23061f(v_94302c);
      const v_a936b7 = v_8e5767.current;
      try {
        const { paged: v_b2d23f } = await v_088028(v_94302c, v_c3bc75);
        if (v_a936b7 === v_8e5767.current) (v_94302c === "received" ? v_588ee6 : v_835446)(v_b2d23f);
      } catch (v_49263d) {
        console.warn("[GiftBox] load more fail:", v_49263d);
      } finally {
        v_6f0b49.current = false;
        v_23061f(null);
      }
    },
    [v_2ca7e0, v_79f454, v_f966e3, v_088028],
  );

  const {
    elig: v_ae840d, exHistory: v_b085c3, exchangeQty: v_eddb49, setExchangeQty: v_839e4f, exchangeMax: v_ea7b1e, submitting: v_cb66b4, toast: v_da74fa,
    loadExchange: v_308dd7, onExchangeDec: v_b54070, onExchangeInc: v_869bef, onExchangeSubmit: v_d037c4,
  } = v_61fb8c({ onChanged: () => void v_92fdf2(true) });

  const v_92fdf2 = v_de06a3(
    async (v_cc88f5 = false) => {
      if (!v_2ca7e0) {
        v_588ee6(v_459174);
        v_835446(v_459174);
        v_34a50a(false);
        v_575aad(false);
        return;
      }
      v_8e5767.current += 1;
      if (v_cc88f5) v_575aad(true);
      else v_34a50a(true);
      try {
        const [v_ed7fe5, v_204494] = await Promise.all([
          v_088028("received", v_459174),
          v_088028("sent", v_459174),
        ]);
        v_588ee6(v_ed7fe5.paged);
        v_835446(v_204494.paged);
        v_19e9c0(v_ed7fe5.last?.totalReceived ?? 0);
        v_0cc282(v_204494.last?.totalSent ?? null);
        v_c60f1e(v_ed7fe5.last?.currentOwned ?? v_204494.last?.currentOwned ?? 0);
        await v_308dd7();
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

  const v_8af8a0 = v_79f454.items;
  const v_ccaf2e = v_f966e3.items;

  const v_bc3259 = v_df9f57(() => {
    const v_8dcb51 = new Map<string, v_407a6d[]>();
    for (const v_8c0b26 of v_ccaf2e) {
      const v_b24339 = v_b5c383(v_8c0b26.createdAt, v_8d41d7) || "—";
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_ccaf2e, v_8d41d7]);

  const v_3aa149 = v_df9f57(
    () => v_8af8a0.reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0) || v_5da798,
    [v_8af8a0, v_5da798],
  );
  const v_26f84f =
    v_fcc796 ?? v_ccaf2e.reduce((v_f4e98d, v_206b88) => v_f4e98d + (v_206b88.count || 1), 0);

  const v_22668d = [
    {
      key: "received",
      label: v_8d41d7("giftBox.tabReceived", { defaultValue: "받은 선물" }),
      count: v_3aa149 > 0 ? v_3aa149 : undefined,
    },
    {
      key: "sent",
      label: v_8d41d7("giftBox.tabSent", { defaultValue: "보낸 선물" }),
      count: v_26f84f || undefined,
    },
    { key: "exchange", label: v_8d41d7("giftBox.tabExchange", { defaultValue: "교환" }) },
  ];

  const v_c6c04c = v_22668d.filter((v_c3c9ed) => v_5cbc42.includes(v_c3c9ed.key));

  const v_d0fd9b =
    v_24baff?.view === "exchange"
      ? v_8d41d7("giftBox.myRoseTitle", { defaultValue: "내 ROSE" })
      : v_8d41d7("giftBox.title", { defaultValue: "선물함" });

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50} showBottomBackground={false}>
      <PageHeader
        title={v_d0fd9b}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      {v_c6c04c.length > 1 ? (
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
              <View style={v_d81136.tabLabelRow}>
                <Text style={[v_d81136.tabText, v_f8b770 && v_d81136.tabTextActive]}>
                  {v_c3c9ed.label}
                </Text>
                {v_ca9d61 && v_c3c9ed.count != null ? (
                  v_c3c9ed.key === "sent" ? (
                    <View style={v_d81136.tabRoseCount}>
                      <Image source={v_1dee60} style={v_d81136.tabRoseIcon} />
                      <Text style={v_d81136.tabCount}>{v_c3c9ed.count}</Text>
                    </View>
                  ) : (
                    <Text style={v_d81136.tabCount}> {v_c3c9ed.count}</Text>
                  )
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      ) : null}

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
          scrollEventThrottle={200}
          onScroll={({ nativeEvent: v_9e86fd }) => {
            if (v_11083e === "exchange") return;
            if (v_9e86fd.layoutMeasurement.height + v_9e86fd.contentOffset.y >= v_9e86fd.contentSize.height - 240) {
              void v_132dae(v_11083e);
            }
          }}
        >
          {v_11083e === "received" && (
            <ReceivedTab
              items={v_8af8a0}
              loadingMore={v_f34bc3 === "received"}
              t={v_8d41d7}
            />
          )}
          {v_11083e === "sent" && (
            <SentTab
              items={v_ccaf2e}
              grouped={v_bc3259}
              loadingMore={v_f34bc3 === "sent"}
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
              elig={v_ae840d}
              history={v_b085c3}
              qty={v_eddb49}
              submitting={v_cb66b4}
              t={v_8d41d7}
              onDec={v_b54070}
              onInc={v_869bef}
              onSelectAll={() => v_ae840d && v_839e4f(v_ea7b1e)}
              maxQty={v_ea7b1e}
              onSubmit={() => void v_d037c4()}
              historyOnly={v_24baff?.view === "exchange"}
              ownedFallback={v_b09797}
              onOpenExchangeSheet={() => v_4710bd(true)}
            />
          )}
        </ScrollView>
      )}
      {v_da74fa ? (
        <View style={v_d81136.toast} pointerEvents="none">
          <Text style={v_d81136.toastText}>{v_da74fa}</Text>
        </View>
      ) : null}
      {v_24baff?.view === "exchange" ? (
        <GiftExchangeSheet
          visible={v_084403}
          onClose={() => v_4710bd(false)}
          onChanged={() => void v_92fdf2(true)}
          onGoHome={() => {
            v_4710bd(false);
            v_f4c991.dispatch(v_650cfa.navigate({ name: "HomeTab" }));
          }}
        />
      ) : null}
    </SafeView>
  );
}

function v_0f11bb(item: v_407a6d): boolean {
  return !v_8c0b26.counterpartId && !v_8c0b26.counterpartName && !v_8c0b26.counterpartEmail;
}

function v_44c2cb(
  item: v_407a6d,
  t: v_75de9d,
): string {
  if (v_8c0b26.kind === "ad_reward") {
    return v_8c0b26.cloneName || v_8d41d7("giftBox.adRewardSender", { defaultValue: "광고 보상" });
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
  const v_73a570 = ["#dbeafe", "#e9d5ff", "#fce7f3", "#d1fae5", "#fef3c7", "#ffedd5"];
  let v_65a2cd = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_1833e7.length; v_ebec57++) v_65a2cd = (v_65a2cd + v_1833e7.charCodeAt(v_ebec57) * 17) % v_73a570.length;
  return v_73a570[v_65a2cd];
}

type ReceivedSubTab = "all" | "user" | "clone";

function v_6da59e({
  items: v_4622b9,
  loadingMore: v_f34bc3,
  t: v_8d41d7,
}: {
  items: v_407a6d[];
  loadingMore: boolean;
  t: v_75de9d;
}) {
  const [v_4abce2, v_59fd10] = v_5ab095<ReceivedSubTab>("all");
  const [v_9875a1, v_2e7fc1] = v_5ab095("");
  const v_ab6401 = v_9875a1.trim().toLowerCase();

  const v_9f6088 = v_df9f57(
    () => v_4622b9.filter((v_23805a) => v_23805a.kind === "received").length,
    [v_4622b9],
  );
  const v_396c6c = v_df9f57(
    () => v_4622b9.filter((v_23805a) => v_23805a.kind === "ad_reward").length,
    [v_4622b9],
  );

  const v_e4cf17 = v_df9f57(() => {
    let v_ef8ab1 = v_4622b9;
    if (v_4abce2 === "user") v_ef8ab1 = v_ef8ab1.filter((v_23805a) => v_23805a.kind === "received");
    else if (v_4abce2 === "clone") v_ef8ab1 = v_ef8ab1.filter((v_23805a) => v_23805a.kind === "ad_reward");
    if (!v_ab6401) return v_ef8ab1;
    return v_ef8ab1.filter((v_23805a) => {
      const v_eddf67 = v_44c2cb(v_23805a, v_8d41d7).toLowerCase();
      const v_eb25ce = (v_23805a.cloneName || "").toLowerCase();
      const v_1ed516 = (v_23805a.cloneUsername || "").toLowerCase();
      return v_eddf67.includes(v_ab6401) || v_eb25ce.includes(v_ab6401) || v_1ed516.includes(v_ab6401);
    });
  }, [v_4622b9, v_4abce2, v_ab6401, v_8d41d7]);

  const v_4d79ca = v_df9f57(() => {
    const v_8dcb51 = new Map<string, v_407a6d[]>();
    for (const v_8c0b26 of v_e4cf17) {
      const v_b24339 = v_9b9d5e(v_8c0b26.createdAt, v_8d41d7);
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_e4cf17, v_8d41d7]);

  const v_bd105c = [
    {
      key: "all",
      label: v_8d41d7("giftBox.subTabAll", { defaultValue: "전체" }),
      count: v_9f6088 + v_396c6c,
    },
    {
      key: "user",
      label: v_8d41d7("giftBox.subTabFromUser", { defaultValue: "유저에게 받음" }),
      count: v_9f6088,
    },
    {
      key: "clone",
      label: v_8d41d7("giftBox.subTabFromClone", { defaultValue: "클론에게 받음" }),
      count: v_396c6c,
    },
  ];

  const v_6e7fc2 =
    v_ab6401
      ? v_8d41d7("giftBox.sentSearchNoMatch", { defaultValue: "검색 결과가 없어요" })
      : v_4abce2 === "all"
        ? v_8d41d7("dashboard.emptyGift", { defaultValue: "아직 받은 선물이 없어요" })
        : v_4abce2 === "user"
          ? v_8d41d7("giftBox.emptyUserGift", { defaultValue: "아직 유저가 보낸 선물이 없어요" })
          : v_8d41d7("giftBox.emptyCloneGift", { defaultValue: "아직 클론한테 받은 보상이 없어요" });

  return (
    <View>
      <View style={v_d81136.searchBar}>
        <Feather name="search" size={14} color={v_1bfbd0.zinc400} />
        <TextInput
          style={v_d81136.searchInput}
          value={v_9875a1}
          onChangeText={v_2e7fc1}
          placeholder={v_8d41d7("giftBox.receivedSearchPlaceholder", {
            defaultValue: "보낸 사람, 클론 이름 검색",
          })}
          placeholderTextColor={v_1bfbd0.zinc400}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {v_9875a1.length > 0 ? (
          <TouchableOpacity onPress={() => v_2e7fc1("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Feather name="x" size={14} color={v_1bfbd0.zinc400} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={v_d81136.subTabRow}
        style={v_d81136.subTabScroll}
      >
        {v_bd105c.map((v_c3c9ed) => {
          const v_f8b770 = v_4abce2 === v_c3c9ed.key;
          return (
            <TouchableOpacity
              key={v_c3c9ed.key}
              style={[v_d81136.subTabItem, v_f8b770 && v_d81136.subTabItemActive]}
              onPress={() => v_59fd10(v_c3c9ed.key)}
              activeOpacity={0.75}
            >
              <Text style={[v_d81136.subTabText, v_f8b770 && v_d81136.subTabTextActive]}>
                {v_c3c9ed.label} {v_c3c9ed.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {v_e4cf17.length === 0 ? (
        <View style={v_d81136.emptyBox}>
          <Text style={v_d81136.emptyText}>{v_6e7fc2}</Text>
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
          {v_f34bc3 && <ActivityIndicator style={v_d81136.pageSpinner} color={v_1bfbd0.zinc500} />}
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
  t: v_75de9d;
  showBorder: boolean;
}) {
  const v_e5f5f1 = v_8c0b26.kind === "ad_reward";
  const v_1833e7 = v_44c2cb(v_8c0b26, v_8d41d7);
  const v_9f1622 = v_e5f5f1
    ? v_8d41d7("giftBox.receivedFromCloneTitle", {
        name: v_8c0b26.cloneName || v_1833e7,
        defaultValue: "{{name}} 클론과 대화 중에 받았어요",
      })
    : v_8d41d7("giftBox.receivedFromUserTitle", {
        name: v_1833e7,
        clone: v_8c0b26.cloneName || v_8d41d7("giftBox.toUnknownClone", { defaultValue: "클론" }),
        defaultValue: "{{name}}님이 내 {{clone}} 클론에게 보냈어요",
      });
  const v_3fd4b5 = v_e5f5f1
    ? v_8d41d7("giftBox.badgeFromClone", { defaultValue: "클론에게 받음" })
    : v_8d41d7("giftBox.badgeFromUser", { defaultValue: "유저에게 받음" });
  const v_085ccc = v_8345ff(v_1833e7);

  return (
    <View style={[v_d81136.recvRow, v_ff995c && v_d81136.recvRowBorder]}>
      <View style={[v_d81136.avatar, { backgroundColor: v_085ccc }]}>
        {v_8c0b26.counterpartAvatarUrl ? (
          <Image source={{ uri: v_8c0b26.counterpartAvatarUrl }} style={v_d81136.avatarImg} />
        ) : v_8c0b26.cloneAvatarUrl && v_e5f5f1 ? (
          <Image source={{ uri: v_8c0b26.cloneAvatarUrl }} style={v_d81136.avatarImg} />
        ) : v_0f11bb(v_8c0b26) && !v_e5f5f1 ? (
          <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
        ) : (
          <Text style={v_d81136.avatarInitial}>{(v_1833e7.charAt(0) || "?").toUpperCase()}</Text>
        )}
      </View>
      <View style={v_d81136.logBody}>
        <Text style={v_d81136.recvTitle} numberOfLines={2}>
          {v_9f1622}
        </Text>
        <View style={v_d81136.recvMetaRow}>
          <View style={[v_d81136.sourceBadge, v_e5f5f1 ? v_d81136.sourceBadgeClone : v_d81136.sourceBadgeUser]}>
            <Text style={[v_d81136.sourceBadgeText, v_e5f5f1 ? v_d81136.sourceBadgeTextClone : v_d81136.sourceBadgeTextUser]}>
              {v_3fd4b5}
            </Text>
          </View>
          <Text style={v_d81136.metaTime}>{v_514b67(v_8c0b26.createdAt)}</Text>
        </View>
      </View>
      <RoseAmount count={v_8c0b26.count || 1} />
    </View>
  );
}

function v_950e4a({
  items: v_4622b9,
  grouped: v_4d79ca,
  loadingMore: v_f34bc3,
  t: v_8d41d7,
  onBrowseClones: v_9cb927,
}: {
  items: v_407a6d[];
  grouped: [string, v_407a6d[]][];
  loadingMore: boolean;
  t: v_75de9d;
  onBrowseClones: () => void;
}) {
  const v_cfb8ec = v_df9f57(() => {
    const v_5c2f9f = new Date();
    const v_64877a = v_5c2f9f.getFullYear();
    const v_35f85c = v_5c2f9f.getMonth();
    let v_272c28 = 0;
    const v_fdd5c7 = new Set<string>();
    for (const v_23805a of v_4622b9) {
      const v_d5dda0 = new Date(v_23805a.createdAt);
      if (v_d5dda0.getFullYear() !== v_64877a || v_d5dda0.getMonth() !== v_35f85c) continue;
      v_272c28 += v_23805a.count || 1;
      const v_b24339 =
        v_23805a.counterpartId != null
          ? `u:${v_23805a.counterpartId}`
          : v_23805a.cloneId != null
            ? `c:${v_23805a.cloneId}`
            : v_23805a.counterpartName || v_23805a.cloneName || v_23805a.id;
      v_fdd5c7.add(String(v_b24339));
    }
    return { rose: v_272c28, people: v_fdd5c7.size };
  }, [v_4622b9]);

  const v_93d60b = v_df9f57(() => {
    const v_8dcb51 = new Map<string, v_407a6d[]>();
    for (const v_8c0b26 of v_4622b9) {
      const v_b24339 = v_9b9d5e(v_8c0b26.createdAt, v_8d41d7);
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_4622b9, v_8d41d7]);

  void v_4d79ca;

  return (
    <View>
      <View style={v_d81136.sentSummaryCard}>
        <View style={v_d81136.sentSummaryCol}>
          <Text style={v_d81136.sentSummaryLabel}>
            {v_8d41d7("giftBox.sentThisMonth", { defaultValue: "이번 달 보낸 선물" })}
          </Text>
          <RoseAmount count={v_cfb8ec.rose} size="lg" />
        </View>
        <View style={v_d81136.sentSummaryCol}>
          <Text style={v_d81136.sentSummaryLabel}>
            {v_8d41d7("giftBox.sentPeople", { defaultValue: "받은 사람" })}
          </Text>
          <Text style={v_d81136.sentSummaryPeople}>
            {v_cfb8ec.people}
            {v_8d41d7("giftBox.peopleUnit", { defaultValue: "명" })}
          </Text>
        </View>
      </View>

      {v_93d60b.length === 0 ? (
        <View style={v_d81136.emptyBox}>
          <Text style={v_d81136.emptyText}>
            {v_8d41d7("giftBox.emptySent", { defaultValue: "아직 보낸 선물이 없어요" })}
          </Text>
        </View>
      ) : (
        v_93d60b.map(([v_dcea27, v_18b8bf]) => (
          <View key={v_dcea27} style={v_d81136.recvGroup}>
            <Text style={v_d81136.recvDateHeader}>{v_dcea27}</Text>
            {v_18b8bf.map((v_8c0b26) => {
              const v_97d2e9 =
                v_8c0b26.counterpartName ||
                v_8c0b26.counterpartEmail ||
                (v_8c0b26.counterpartId ? `user_${v_8c0b26.counterpartId}` : v_8d41d7("giftBox.someone", { defaultValue: "상대" }));
              const v_9f1622 = v_8c0b26.cloneName
                ? v_8d41d7("giftBox.sentToCloneTitle", {
                    name: v_97d2e9,
                    defaultValue: "{{name}}님의 클론에게 보냈어요",
                  })
                : v_8d41d7("giftBox.sentToUserTitle", {
                    name: v_97d2e9,
                    defaultValue: "{{name}}님에게 보냈어요",
                  });
              return (
                <View key={v_8c0b26.id} style={v_d81136.sentCard}>
                  <View style={[v_d81136.avatar, { backgroundColor: v_8345ff(v_97d2e9) }]}>
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
                      {v_9f1622}
                    </Text>
                    <Text style={v_d81136.meta}>
                      {v_514b67(v_8c0b26.createdAt)}
                      {" · "}
                      {v_8d41d7("giftBox.delivered", { defaultValue: "전달 완료" })}
                    </Text>
                  </View>
                  <RoseAmount count={v_8c0b26.count || 1} />
                </View>
              );
            })}
          </View>
        ))
      )}
      {v_f34bc3 && <ActivityIndicator style={v_d81136.pageSpinner} color={v_1bfbd0.zinc500} />}

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
  elig: v_ae840d,
  history: v_10740d,
  qty: v_d016c9,
  submitting: v_cb66b4,
  t: v_8d41d7,
  onDec: v_529659,
  onInc: v_187937,
  onSelectAll: v_e3f4f2,
  maxQty: v_063b5f,
  onSubmit: v_3bfe4c,
  historyOnly: v_ec3c62,
  ownedFallback: v_758ca4,
  onOpenExchangeSheet: v_160f98,
}: {
  elig: v_02ed3c | null;
  history: v_867a79[];
  qty: number;
  submitting: boolean;
  t: v_75de9d;
  onDec: () => void;
  onInc: () => void;
  onSelectAll: () => void;
  maxQty: number;
  onSubmit: () => void;

  historyOnly: boolean;
  ownedFallback: number;
  onOpenExchangeSheet: () => void;
}) {
  const [v_71921b, v_7ca8ec] = v_5ab095(false);
  v_a3453e.useEffect(() => {
    v_7ca8ec(false);
  }, [v_10740d]);

  if (v_ec3c62) {
    const v_2461e1 = v_ae840d?.ownedQty ?? v_758ca4;
    const v_cd229f =
      v_ae840d?.priceSegments?.[0]?.price != null
        ? v_35c0e0(Number(v_ae840d.priceSegments[0].price))
        : "0.1";
    const v_3cda59 = v_ae840d?.feeQty ?? 1;
    return (
      <View>
        <View style={v_d81136.myRoseCard}>
          <View style={v_d81136.myRoseTop}>
            <Image source={v_1dee60} style={v_d81136.myRoseIcon} />
            <View style={{ flex: 1 }}>
              <Text style={v_d81136.myRoseOwnedLabel}>
                {v_8d41d7("giftBox.ownedShort", { defaultValue: "보유" })}
              </Text>
              <Text style={v_d81136.myRoseBalance}>
                {v_2461e1}{" "}
                <Text style={v_d81136.myRoseUnit}>
                  {v_8d41d7("giftBox.roseUnit", { defaultValue: "ROSE" })}
                </Text>
              </Text>
            </View>
          </View>
          <View style={v_d81136.myRoseMetaRow}>
            <Text style={v_d81136.myRoseMeta}>
              {v_8d41d7("giftBox.exchangeRateHint", {
                defaultValue: "교환 비율 1 ROSE = {{rate}} XRUN",
                rate: v_cd229f,
              })}
            </Text>
            <Text style={v_d81136.myRoseMeta}>
              {v_8d41d7("giftBox.feePerExchange", {
                defaultValue: "수수료 {{fee}} ROSE / 회",
                fee: v_3cda59,
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={v_d81136.myRoseExchangeBtn}
            activeOpacity={0.85}
            onPress={v_160f98}
          >
            <Text style={v_d81136.myRoseExchangeBtnText}>
              {v_8d41d7("giftBox.exchangeToXrun", { defaultValue: "XRUN으로 교환" })}
            </Text>
          </TouchableOpacity>
        </View>

        <ExchangeHistory
          history={v_10740d}
          expanded={v_71921b}
          onExpand={() => v_7ca8ec(true)}
          t={v_8d41d7}
          showFilter={false}
          roseHistory
        />
      </View>
    );
  }

  if (!v_ae840d || !v_ae840d.giftId) {
    return (
      <View>
        <View style={v_d81136.emptyBox}>
          <Text style={v_d81136.emptyText}>
            {v_8d41d7("giftBox.emptyExchange", { defaultValue: "교환할 선물이 없어요" })}
          </Text>
        </View>
        <ExchangeHistory
          history={v_10740d}
          expanded={v_71921b}
          onExpand={() => v_7ca8ec(true)}
          t={v_8d41d7}
          showFilter={false}
          roseHistory={false}
        />
      </View>
    );
  }

  const v_80cae9 = v_8d41d7("giftBox.roseUnit", { defaultValue: "ROSE" });
  const v_097586 = v_ae840d.minQty + v_6f0728(v_ae840d, v_ae840d.minQty);
  const v_4f2dac = v_ae840d.exchangeableQty >= v_ae840d.minQty && !v_ae840d.maintenance && v_ae840d.enabled;
  const v_36c043 = v_4f2dac ? v_c55c0b(v_ae840d.priceSegments, v_d016c9) : 0;
  const v_2d815e = v_6f0728(v_ae840d, v_d016c9);
  const v_6b9a9b = v_d016c9 + v_2d815e;

  return (
    <View>
      <Text style={v_d81136.sectionLabel}>
        {v_8d41d7("giftBox.exchangeTarget", { defaultValue: "교환할 선물" })}
      </Text>
      <View style={v_d81136.exchangeCard}>
        <View style={v_d81136.exchangeGiftRow}>
          <View style={v_d81136.giftIconCircle}>
            <Text style={{ fontSize: 22 }}>{v_ae840d.giftEmoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={v_d81136.sentTitle}>{v_561bb6(v_ae840d.giftName, v_ae840d.giftId)}</Text>
          </View>
        </View>
        {v_4f2dac ? (
          <View style={v_d81136.stepperRow}>
            <View style={v_d81136.stepper}>
              <TouchableOpacity style={v_d81136.stepBtn} onPress={v_529659}>
                <Feather name="minus" size={16} color={v_d016c9 <= v_ae840d.minQty ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
              </TouchableOpacity>
              <Text style={v_d81136.stepQty}>{v_d016c9}</Text>
              <TouchableOpacity style={v_d81136.stepBtn} onPress={v_187937}>
                <Feather name="plus" size={16} color={v_d016c9 >= v_063b5f ? v_1bfbd0.zinc300 : v_1bfbd0.zinc900} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={v_d81136.selectAllBtn} onPress={v_e3f4f2} activeOpacity={0.8}>
              <Text style={v_d81136.selectAllText}>
                {v_8d41d7("giftBox.selectAll", { defaultValue: "전부 선택" })}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[v_d81136.meta, { marginTop: 12 }]}>
            {v_ae840d.maintenance
              ? v_8d41d7("giftBox.exchangeMaintenance", { defaultValue: "교환 서비스 점검 중이에요" })
              : v_8d41d7("giftBox.exchangeMinNotice", {
                  defaultValue: "수수료 포함 {{min}}송이부터 교환할 수 있어요 (지금 {{owned}}송이)",
                  min: v_097586,
                  owned: v_ae840d.ownedQty,
                })}
          </Text>
        )}
      </View>

      {v_4f2dac ? (
        <View style={v_d81136.calcCard}>
          <View style={v_d81136.calcRow}>
            <Text style={v_d81136.calcLabel}>{v_8d41d7("giftBox.exchangeQty", { defaultValue: "교환 수량" })}</Text>
            <Text style={v_d81136.calcValue}>
              {v_d016c9}
              {v_80cae9}
            </Text>
          </View>
          <View style={v_d81136.calcRow}>
            <Text style={v_d81136.calcLabel}>{v_8d41d7("giftBox.fee", { defaultValue: "수수료" })}</Text>
            <Text style={v_d81136.calcValue}>
              {v_2d815e}
              {v_80cae9}
            </Text>
          </View>
          <View style={v_d81136.calcDivider} />
          <View style={v_d81136.calcRow}>
            <Text style={v_d81136.calcTotalLabel}>
              {v_8d41d7("giftBox.reward", { defaultValue: "받게 될 보상" })}
            </Text>
            <Text style={v_d81136.calcTotalValue}>{v_35c0e0(v_36c043)} XRUN</Text>
          </View>
        </View>
      ) : null}

      <ExchangeHistory
        history={v_10740d}
        expanded={v_71921b}
        onExpand={() => v_7ca8ec(true)}
        t={v_8d41d7}
        showFilter={false}
        roseHistory={false}
      />

      {v_4f2dac ? (
        <Text style={v_d81136.exchangeSummary}>
          {v_8d41d7("giftBox.exchangeSummary", {
            defaultValue: "총 {{deducted}} ROSE 차감 (수수료 {{fee}} ROSE 포함) · 받는 보상 {{reward}} XRUN",
            deducted: v_6b9a9b,
            fee: v_2d815e,
            reward: v_35c0e0(v_36c043),
          })}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[v_d81136.exchangeCta, (!v_4f2dac || v_cb66b4) && { opacity: 0.4 }]}
        onPress={v_3bfe4c}
        disabled={!v_4f2dac || v_cb66b4}
        activeOpacity={0.85}
      >
        {v_cb66b4 ? (
          <ActivityIndicator color={v_1bfbd0.white} />
        ) : (
          <Text style={v_d81136.exchangeCtaText}>
            {v_4f2dac ? v_d016c9 : v_097586}
            {v_80cae9} {v_8d41d7("giftBox.exchangeAction", { defaultValue: "교환하기" })}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

type ExchangeHistoryFilter = "all" | "claimed" | "pending";

function v_36c8d0({
  history: v_10740d,
  expanded: v_ebda8f,
  onExpand: v_37d7de,
  t: v_8d41d7,
  showFilter: v_a4bef1,
  roseHistory: v_7c496a,
}: {
  history: v_867a79[];
  expanded: boolean;
  onExpand: () => void;
  t: v_75de9d;
  showFilter: boolean;

  roseHistory: boolean;
}) {
  const [v_f21110, v_d217e7] = v_5ab095<ExchangeHistoryFilter>("all");
  const v_986caa = 3;
  const v_bc78c8 = v_df9f57(() => {
    if (v_f21110 === "all") return v_10740d;
    if (v_f21110 === "claimed") return v_10740d.filter((v_65a2cd) => v_65a2cd.rewardStatus === "claimed");
    return v_10740d.filter((v_65a2cd) => v_65a2cd.rewardStatus === "pending_claim");
  }, [v_10740d, v_f21110]);
  const v_d1b432 = v_a4bef1
    ? v_bc78c8
    : v_7c496a
      ? v_bc78c8
      : v_bc78c8.slice(0, v_ebda8f ? v_bc78c8.length : v_986caa);
  const v_80cae9 = v_8d41d7("giftBox.roseUnit", { defaultValue: "ROSE" });
  const v_c4180e = (s: v_867a79["rewardStatus"]) =>
    v_fd5f43 === "claimed"
      ? v_8d41d7("giftBox.statusClaimed", { defaultValue: "수령 완료" })
      : v_fd5f43 === "failed"
        ? v_8d41d7("giftBox.statusFailed", { defaultValue: "실패 (선물 반환됨)" })
        : v_8d41d7("giftBox.statusPending", { defaultValue: "수령 대기" });
  const v_14233c = [
    { key: "all", label: v_8d41d7("giftBox.filterAll", { defaultValue: "전체" }) },
    { key: "claimed", label: v_8d41d7("giftBox.filterClaimed", { defaultValue: "수령" }) },
    { key: "pending", label: v_8d41d7("giftBox.filterPending", { defaultValue: "수령 대기" }) },
  ];

  const v_e774b1 = v_df9f57(() => {
    if (!v_7c496a) return null;
    const v_8dcb51 = new Map<string, v_867a79[]>();
    for (const v_8c0b26 of v_d1b432) {
      const v_b24339 = v_9b9d5e(v_8c0b26.createdAt, v_8d41d7);
      const v_d0c056 = v_8dcb51.get(v_b24339) ?? [];
      v_d0c056.push(v_8c0b26);
      v_8dcb51.set(v_b24339, v_d0c056);
    }
    return Array.from(v_8dcb51.entries());
  }, [v_7c496a, v_d1b432, v_8d41d7]);

  return (
    <>
      {v_a4bef1 ? (
        <View style={v_d81136.subTabRow}>
          {v_14233c.map((v_c3c9ed) => {
            const v_f8b770 = v_f21110 === v_c3c9ed.key;
            return (
              <TouchableOpacity
                key={v_c3c9ed.key}
                style={[v_d81136.subTabItem, v_f8b770 && v_d81136.subTabItemActive]}
                onPress={() => v_d217e7(v_c3c9ed.key)}
                activeOpacity={0.75}
              >
                <Text style={[v_d81136.subTabText, v_f8b770 && v_d81136.subTabTextActive]}>
                  {v_c3c9ed.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={v_d81136.historyHeader}>
          <Text style={[v_d81136.sectionLabel, { marginBottom: 0 }]}>
            {v_7c496a
              ? v_8d41d7("giftBox.exchangeHistoryTitle", { defaultValue: "교환 내역" })
              : v_8d41d7("giftBox.recentExchange", { defaultValue: "최근 교환 내역" })}
          </Text>
          {v_7c496a ? (
            <Text style={v_d81136.historyViewAll}>
              {v_8d41d7("giftBox.exchangeHistoryCount", {
                defaultValue: "총 {{n}}회",
                n: v_10740d.length,
              })}
            </Text>
          ) : v_10740d.length > v_986caa && !v_ebda8f ? (
            <TouchableOpacity onPress={v_37d7de} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={v_d81136.historyViewAll}>{v_8d41d7("giftBox.viewAll", { defaultValue: "전체보기" })}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {v_e774b1 ? (
        v_e774b1.length === 0 ? (
          <View style={v_d81136.emptyBox}>
            <Text style={v_d81136.emptyText}>
              {v_8d41d7("giftBox.emptyExchangeHistory", { defaultValue: "최근 교환 내역이 없어요" })}
            </Text>
          </View>
        ) : (
          v_e774b1.map(([v_dcea27, v_18b8bf]) => (
            <View key={v_dcea27} style={v_d81136.recvGroup}>
              <Text style={v_d81136.recvDateHeader}>{v_dcea27}</Text>
              {v_18b8bf.map((v_8c0b26) => (
                <View key={v_8c0b26.exchangeId} style={v_d81136.historyRoseCard}>
                  <View style={v_d81136.historyIcon}>
                    <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 12 }}>X</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={v_d81136.sentTitle} numberOfLines={1}>
                      {v_8c0b26.qty} {v_80cae9} → {v_8c0b26.reward} XRUN
                    </Text>
                    <Text style={v_d81136.meta}>
                      {v_514b67(v_8c0b26.createdAt)}
                      {" · "}
                      {v_8d41d7("giftBox.feeShort", {
                        defaultValue: "수수료 {{fee}} ROSE",
                        fee: v_8c0b26.feeQty,
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      v_d81136.statusPill,
                      v_8c0b26.rewardStatus === "claimed" && v_d81136.statusPillClaimed,
                      v_8c0b26.rewardStatus === "pending_claim" && v_d81136.statusPillPending,
                      v_8c0b26.rewardStatus === "failed" && v_d81136.statusPillFailed,
                    ]}
                  >
                    <Text
                      style={[
                        v_d81136.statusPillText,
                        v_8c0b26.rewardStatus === "claimed" && v_d81136.statusPillTextClaimed,
                        v_8c0b26.rewardStatus === "pending_claim" && v_d81136.statusPillTextPending,
                        v_8c0b26.rewardStatus === "failed" && v_d81136.statusPillTextFailed,
                      ]}
                    >
                      {v_c4180e(v_8c0b26.rewardStatus)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )
      ) : (
        <View style={v_d81136.historyCard}>
          {v_d1b432.length === 0 ? (
            <Text style={[v_d81136.emptyText, { paddingVertical: 20 }]}>
              {v_8d41d7("giftBox.emptyExchangeHistory", { defaultValue: "최근 교환 내역이 없어요" })}
            </Text>
          ) : (
            v_d1b432.map((v_8c0b26, v_e86ad8) => {
              const v_6fc191 = new Date(v_8c0b26.createdAt).toISOString();
              return (
                <View key={v_8c0b26.exchangeId} style={[v_d81136.historyRow, v_e86ad8 < v_d1b432.length - 1 && v_d81136.historyRowBorder]}>
                  <View style={v_d81136.historyIcon}>
                    <Text style={{ color: "#2563eb", fontWeight: "700" }}>⇄</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={v_d81136.sentTitle} numberOfLines={1}>
                      {v_561bb6(v_8c0b26.giftName)} {v_8c0b26.qty} {v_80cae9} → {v_8c0b26.reward} XRUN
                    </Text>
                    <Text style={v_d81136.meta}>
                      {v_b5c383(v_6fc191, v_8d41d7)} · {v_e4bf58(v_6fc191, v_8d41d7)} · {v_8c0b26.exchangeNo}
                    </Text>
                  </View>
                  <Text
                    style={[
                      v_d81136.doneBadge,
                      v_8c0b26.rewardStatus === "pending_claim" && v_d81136.pendingBadge,
                      v_8c0b26.rewardStatus === "failed" && v_d81136.failedBadge,
                    ]}
                  >
                    {v_c4180e(v_8c0b26.rewardStatus)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </>
  );
}

function v_35c0e0(v_f4e98d): string {
  if (!Number.isFinite(v_f4e98d)) return "0";
  return String(Math.round(v_f4e98d * 1e8) / 1e8);
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
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tabRoseCount: { flexDirection: "row", alignItems: "center", gap: 2 },
  tabRoseIcon: { width: 14, height: 14, borderRadius: 7 },
  tabCount: { fontWeight: "700", color: v_1bfbd0.secondary, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subTabScroll: { marginBottom: 14, flexGrow: 0 },
  subTabRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  subTabItem: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  subTabItemActive: {
    backgroundColor: v_1bfbd0.zinc900,
    borderColor: v_1bfbd0.zinc900,
  },
  subTabText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc600 },
  subTabTextActive: { color: v_1bfbd0.white },
  subTabCount: { fontWeight: "700", color: v_1bfbd0.secondary },
  subTabCountActive: { color: v_1bfbd0.white },
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
    borderBottomColor: v_1bfbd0.zinc200,
  },
  recvTitle: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.zinc900 },
  recvMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceBadgeUser: { backgroundColor: "#fce7f3" },
  sourceBadgeClone: { backgroundColor: "#dbeafe" },
  sourceBadgeText: { fontSize: 11, fontWeight: "700" },
  sourceBadgeTextUser: { color: "#be185d" },
  sourceBadgeTextClone: { color: "#2563eb" },
  metaTime: { fontSize: 12, color: v_1bfbd0.zinc500 },
  roseAmountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  roseIcon: { width: 18, height: 18, borderRadius: 9 },
  roseIconLg: { width: 22, height: 22, borderRadius: 11 },
  roseAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  roseAmountLg: {
    fontSize: 20,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    padding: 0,
  },
  sentSummaryCard: {
    flexDirection: "row",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sentSummaryCol: { flex: 1, gap: 6 },
  sentSummaryLabel: { fontSize: 12, color: v_1bfbd0.zinc500 },
  sentSummaryPeople: {
    fontSize: 20,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  myRoseCard: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  myRoseTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  myRoseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  myRoseOwnedLabel: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 2 },
  myRoseBalance: {
    fontSize: 26,
    fontWeight: "800",
    color: v_1bfbd0.zinc900,
    fontVariant: ["tabular-nums"],
  },
  myRoseUnit: { fontSize: 18, fontWeight: "800" },
  myRoseMetaRow: { gap: 4, marginBottom: 14 },
  myRoseMeta: { fontSize: 12, color: v_1bfbd0.zinc500 },
  myRoseExchangeBtn: {
    ...v_d43669.md,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  myRoseExchangeBtnText: { ...v_c10a43.md, color: v_1bfbd0.white },
  historyRoseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: v_1bfbd0.zinc100,
  },
  statusPillClaimed: { backgroundColor: "#e8f5e9" },
  statusPillPending: { backgroundColor: "#fff4e5" },
  statusPillFailed: { backgroundColor: "#fee2e2" },
  statusPillText: { fontSize: 11, fontWeight: "700", color: v_1bfbd0.zinc600 },
  statusPillTextClaimed: { color: "#2e7d32" },
  statusPillTextPending: { color: "#e65100" },
  statusPillTextFailed: { color: "#dc2626" },
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
  pageSpinner: { paddingVertical: 16 },
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

  pendingBadge: { color: "#ea580c" },
  failedBadge: { color: "#dc2626" },
  exchangeSummary: { fontSize: 12, color: v_1bfbd0.zinc500, textAlign: "center", marginBottom: 8, marginTop: 4 },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(24,24,27,0.92)",
  },
  toastText: { color: v_1bfbd0.white, fontSize: 13, textAlign: "center" },
  exchangeCta: {
    ...v_d43669.lg,
    backgroundColor: v_1bfbd0.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  exchangeCtaText: { ...v_c10a43.lg, color: v_1bfbd0.white },
});
