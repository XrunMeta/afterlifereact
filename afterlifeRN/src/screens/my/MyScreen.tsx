import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_aa7413,
  v_09d0e5,
  v_03e392,
  v_39a996,
  v_122070,
  v_f2c756,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615, v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_772971 } from "jmpfvteuuztnp";
import * as v_d05ab5 from "khtmgrssvfqqjmzoc";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_0e981f from "../../components/common/NotificationBell";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_b4902e } from "../../stores/followStore";
import { v_194498 } from "../../stores/cloneStore";
import { v_694b7f } from "../../api/source";
import { v_7d2692 } from "../../api/files";
import { v_976b89 } from "../../api/auth";
import { v_d60cdf, v_7281a5, type v_c33ae3, type v_fa0201 } from "../../api/clones";
import { v_cf763b } from "ixigazcpvfldbecwtbvavtbi";
import { v_9b8cb3, v_5c99c1, v_2a15d8, type v_42880a } from "../../api/payments";
import v_3cb56d, {
  v_b1f897,
} from "../../components/my/PaymentPinPromptModal";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_e57140 } from "../../navigation/types";

const v_b9d568 = 1;

function v_47562b(v_6fc191): string {
  const v_d5dda0 = new Date(v_6fc191.includes("T") ? v_6fc191 : v_6fc191.replace(" ", "T") + "Z");
  if (Number.isNaN(v_d5dda0.getTime())) return v_6fc191;
  const v_3ee5fb = (v_f4e98d) => String(v_f4e98d).padStart(2, "0");
  return `${v_d5dda0.getFullYear()}-${v_3ee5fb(v_d5dda0.getMonth() + 1)}-${v_3ee5fb(v_d5dda0.getDate())} ${v_3ee5fb(v_d5dda0.getHours())}:${v_3ee5fb(v_d5dda0.getMinutes())}`;
}

type MyNav = v_390fcc<v_e57140>;

export default function v_ed02a5() {
  const v_c65f5d = v_ada615<MyNav>();
  const { t: v_8d41d7 } = v_772971();
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_21f395 = v_1ed7d9((v_fd5f43) => v_fd5f43.patchApiUser);
  const v_d7d5a2 = v_1ed7d9((v_fd5f43) => v_fd5f43.logout);
  const v_1e752a = v_b4902e((v_fd5f43) => v_fd5f43.follows);
  const v_b30b81 = v_b4902e((v_fd5f43) => v_fd5f43.isFollowing);
  const v_3094d4 = v_b4902e((v_fd5f43) => v_fd5f43.toggleFollow);
  const v_06f32b = v_194498((v_fd5f43) => v_fd5f43.localClones);
  const [v_47abd6, v_e12360] = v_5ab095(false);
  const [v_026c2d, v_5eda29] = v_5ab095(false);
  const [v_fda1fd, v_7ece2f] = v_5ab095(false);

  const [v_1d54f1, v_67ba02] = v_5ab095<number | null | undefined>(undefined);
  const [v_969a3a, v_562b4b] = v_5ab095<number | null | undefined>(undefined);
  const [v_19340b, v_14129c] = v_5ab095(true);

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      if (!v_2ca7e0) return;
      const v_999957 = await v_b1f897();
      if (!v_999957 || v_2008a4) return;
      try {
        const v_d308b5 = await v_9b8cb3(v_2ca7e0);
        console.log("[PIN-STATUS]", v_d308b5);
        if (v_2008a4) return;

        if (v_d308b5.linked && !v_d308b5.hasPin) {
          v_7ece2f(true);
        }
      } catch (v_49263d) {
        console.warn("[PIN-STATUS] fetch failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  v_c4deb2(() => {
    let v_2008a4 = false;
    if (!v_2ca7e0) {

      v_14129c(false);
      v_67ba02(undefined);
      v_562b4b(undefined);
      return;
    }
    v_14129c(true);
    (async () => {
      try {
        const v_8f00b9 = await v_5c99c1(v_2ca7e0);
        console.log("[XRUN-BALANCE]", v_8f00b9);
        if (v_2008a4) return;
        if (v_8f00b9.linked) {

          v_67ba02(v_8f00b9.xrun ?? 0);
          v_562b4b(v_8f00b9.ad ?? 0);
        } else {
          v_67ba02(undefined);
          v_562b4b(undefined);
        }
      } catch (v_49263d) {
        console.warn("[XRUN-BALANCE] fetch failed:", v_49263d);
        if (!v_2008a4) {
          v_67ba02(undefined);
          v_562b4b(undefined);
        }
      } finally {
        if (!v_2008a4) v_14129c(false);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_d28ade = async () => {
    if (!v_2ca7e0) {
      v_03e392.alert(v_8d41d7("common.notice"), v_8d41d7("my.loginRequired"));
      return;
    }
    const v_d60769 = await v_d05ab5.requestMediaLibraryPermissionsAsync();
    if (!v_d60769.granted) {
      v_03e392.alert(v_8d41d7("my.permTitle"), v_8d41d7("my.permDesc"));
      return;
    }
    const v_07fb2e = await v_d05ab5.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (v_07fb2e.canceled || !v_07fb2e.assets?.[0]) return;
    const v_b76cd8 = v_07fb2e.assets[0];

    v_5eda29(true);
    try {
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_b76cd8.uri, {
        purpose: "avatar",
        fileName: v_b76cd8.fileName ?? "avatar.jpg",
        mimeType: v_b76cd8.mimeType ?? "image/jpeg",
      });
      await v_976b89(v_2ca7e0, { avatarUrl: v_57ac81.url });
      v_21f395({ avatarUrl: v_57ac81.url });
    } catch (v_49263d) {
      const v_badeaf = v_49263d instanceof Error ? v_49263d.message : v_8d41d7("my.uploadFailed");
      v_03e392.alert(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_5eda29(false);
    }
  };

  const v_8a1355 = v_b113dd?.name ?? v_625c74?.displayName ?? v_8d41d7("my.userFallback");
  const v_04c129 = v_b113dd?.email ?? v_625c74?.handle ?? "@afterlife";
  const v_bf6b43 = v_b113dd ? v_b113dd.avatarUrl : v_625c74?.avatarUrl ?? null;

  const v_747a87 = v_19340b;
  const v_519444 = v_1d54f1 ?? null;
  const v_30af0f = v_969a3a ?? null;

  const v_0c8987 = v_b113dd?.id ?? v_625c74?.id ?? v_b9d568;
  const [v_65adaf, v_b81b74] = v_5ab095<number | null>(null);
  const [v_8f9093, v_3e7aad] = v_5ab095<number | null>(null);

  const v_74ecfc = (v_6e0fd3) => {
    v_d5cd7b(null);
    v_c65f5d.getParent()?.dispatch(
      v_650cfa.navigate({
        name: "ClonesTab",
        params: { screen: "CloneDetail", params: { cloneId: v_6e0fd3 } },
      }),
    );
  };
  const [v_1f6f04, v_9127a1] = v_5ab095<v_c33ae3[] | null>(null);
  const [v_58e68f, v_6df89a] = v_5ab095<v_fa0201[] | null>(null);
  const [v_8bb912, v_d5cd7b] = v_5ab095<"following" | "myClones" | null>(null);
  const [v_04e734, v_d6a117] = v_5ab095(false);
  const [v_020dac, v_386b34] = v_5ab095<v_42880a[]>([]);

  const v_d37d97 = async () => {
    v_d6a117(false);
    const v_41e43c = "market://details?id=run.xrun.xrunapp";
    const v_5bca88 = "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
    const v_2292ca = "https://apps.apple.com/kr/search?term=xrun";
    try {
      if (v_326be8.OS === "android") {

        const v_e4c8cf = await v_f2c756.canOpenURL(v_41e43c);
        await v_f2c756.openURL(v_e4c8cf ? v_41e43c : v_5bca88);
      } else {
        await v_f2c756.openURL(v_2292ca);
      }
    } catch (v_49263d) {
      console.warn("[MyScreen] open xrun app failed:", v_49263d);
      v_03e392.alert("오류", "스토어를 열 수 없어요. 직접 xrun 을 검색해 주세요.");
    }
  };

  v_cf763b(
    v_a3453e.useCallback(() => {
      let v_2008a4 = false;
      if (!v_2ca7e0 || !v_b113dd?.id) {
        v_b81b74(null);
        v_3e7aad(null);
        return;
      }
      const v_43e90c = v_b113dd.id;
      console.log(`[MyScreen] fetch start userId=${v_43e90c}`);
      v_7281a5(v_2ca7e0, v_43e90c)
        .then((v_cb35cb) => {
          if (!v_2008a4) {
            console.log(
              `[MyScreen] followedClones ← ${v_cb35cb.items.length} items`,
              v_cb35cb.items.map((v_23805a) => ({ id: v_23805a.id, name: v_23805a.name })),
            );
            v_b81b74(v_cb35cb.items.length);
            v_9127a1(v_cb35cb.items);
          }
        })
        .catch((v_49263d) => console.warn("[MyScreen] followedClones fail:", v_49263d));
      v_d60cdf(v_2ca7e0)
        .then((v_cb35cb) => {
          if (!v_2008a4) {
            console.log(
              `[MyScreen] myClones ← ${v_cb35cb.items.length} items`,
              v_cb35cb.items.map((v_23805a) => ({ id: v_23805a.id, name: v_23805a.name })),
            );
            v_3e7aad(v_cb35cb.items.length);
            v_6df89a(v_cb35cb.items);
          }
        })
        .catch((v_49263d) => console.warn("[MyScreen] myClones fail:", v_49263d));

      v_2a15d8(v_2ca7e0, { limit: 20 })
        .then((v_cb35cb) => {
          if (!v_2008a4) {
            console.log(`[MyScreen] transactions ← ${v_cb35cb.items.length} items`);
            v_386b34(v_cb35cb.items);
          }
        })
        .catch((v_49263d) => console.warn("[MyScreen] transactions fail:", v_49263d));
      return () => {
        v_2008a4 = true;
      };
    }, [v_2ca7e0, v_b113dd?.id]),
  );

  const v_48d264 =
    v_65adaf ??
    v_1e752a.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_0c8987).length;
  const v_8b222b =
    v_8f9093 ??
    v_694b7f.clones().filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987).length +
      v_06f32b.filter((v_3f4e2e) => v_3f4e2e.ownerId === v_0c8987).length;

  const settingsItems: Array<{
    icon: keyof typeof v_dec439.glyphMap;
    labelKey: string;
    descKey: string;
    route: keyof v_e57140;
  }> = [

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
        rightAction={<NotificationBell />}
      />

      <View style={v_fd5f43.content}>
        {}
        <View style={v_fd5f43.profileSection}>
          <View style={v_fd5f43.avatarWrap}>
            {v_bf6b43 ? (
              <Image source={{ uri: v_bf6b43 }} style={v_fd5f43.avatar} />
            ) : (
              <View style={[v_fd5f43.avatar, v_fd5f43.avatarPlaceholder]}>
                <Feather name="user" size={40} color={v_1bfbd0.zinc400} />
              </View>
            )}
            <TouchableOpacity
              style={v_fd5f43.editAvatarBtn}
              onPress={v_d28ade}
              disabled={v_026c2d}
            >
              <Feather name="edit-2" size={14} color={v_1bfbd0.white} />
            </TouchableOpacity>
          </View>

          <Text style={v_fd5f43.userName}>{v_8a1355}</Text>
          <Text style={v_fd5f43.userHandle}>{v_04c129}</Text>

          {

}
          <View style={v_fd5f43.statsRow}>
            <View style={v_fd5f43.statItem}>
              <Text style={v_fd5f43.statValue}>0</Text>
              <Text style={v_fd5f43.statLabel}>팔로워</Text>
            </View>
            <View style={v_fd5f43.statDivider} />
            <View style={v_fd5f43.statItem}>
              <Text style={v_fd5f43.statValue}>0</Text>
              <Text style={v_fd5f43.statLabel}>팔로잉</Text>
            </View>
            <View style={v_fd5f43.statDivider} />
            <TouchableOpacity
              style={v_fd5f43.statItem}
              onPress={() => {
                console.log(
                  `[MyScreen] stat TAP "구독 중" — apiFollowingCount=${v_65adaf}`,
                );
                v_d5cd7b("following");
              }}
            >
              <Text style={v_fd5f43.statValue}>{v_48d264}</Text>
              <Text style={v_fd5f43.statLabel}>구독 중</Text>
            </TouchableOpacity>
          </View>
        </View>

        {}

        {}
        <View style={v_fd5f43.transactionsCard}>
          <View style={v_fd5f43.transactionsHeader}>
            <Text style={v_fd5f43.transactionsTitle}>{v_8d41d7("my.coin.transactions")}</Text>
          </View>
          {v_020dac.length === 0 ? (
            <View style={[v_fd5f43.txRow, { justifyContent: "center" }]}>
              <Text style={[v_fd5f43.txDate, { textAlign: "center" }]}>
                아직 거래 내역이 없어요
              </Text>
            </View>
          ) : (
            v_020dac.map((v_2f6fcc, v_ebec57) => {
              const v_2869c1 =
                v_2f6fcc.type === "gift_sent"
                  ? `${v_2f6fcc.cloneName ?? "페르소나"}에게 ${v_2f6fcc.giftName} 선물`
                  : `${v_2f6fcc.cloneName ?? "페르소나"}로부터 ${v_2f6fcc.giftName} 선물 수익`;
              return (
                <View
                  key={v_2f6fcc.id}
                  style={[v_fd5f43.txRow, v_ebec57 < v_020dac.length - 1 && v_fd5f43.txRowBorder]}
                >
                  <View style={v_fd5f43.txInfo}>
                    <Text style={v_fd5f43.txLabel}>{v_2869c1}</Text>
                    <Text style={v_fd5f43.txDate}>{v_47562b(v_2f6fcc.createdAt)}</Text>
                  </View>
                  <Text style={[v_fd5f43.txAmount, v_2f6fcc.amount > 0 ? v_fd5f43.txGreen : v_fd5f43.txRed]}>
                    {v_2f6fcc.amount > 0 ? "+" : ""}
                    {v_2f6fcc.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} xrun
                  </Text>
                </View>
              );
            })
          )}
          <TouchableOpacity
            style={v_fd5f43.viewAllBtn}
            onPress={() => v_c65f5d.navigate("Transactions")}
          >
            <Text style={v_fd5f43.viewAllText}>{v_8d41d7("my.coin.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={v_fd5f43.sectionHeader}>
          <Text style={v_fd5f43.sectionLabel}>{v_8d41d7("my.coin.settings")}</Text>
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

      <PaymentPinPromptModal
        visible={v_fda1fd}
        onClose={() => v_7ece2f(false)}
      />

      {}
      <Modal visible={v_04e734} transparent animationType="fade">
        <Pressable style={v_fd5f43.chargeOverlay} onPress={() => v_d6a117(false)}>
          <Pressable style={v_fd5f43.chargeBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.chargeIconWrap}>
              <Feather name="zap" size={28} color={v_1bfbd0.violet600} />
            </View>
            <Text style={v_fd5f43.chargeTitle}>암호화폐 충전 안내</Text>
            <Text style={v_fd5f43.chargeDesc}>
              금액을 충전하고 싶다면{"\n"}xrun 앱에서 암호화폐를 얻어보세요
            </Text>
            <Text style={v_fd5f43.chargeHint}>※ 같은 아이디로 로그인 하셔야 합니다</Text>
            <View style={v_fd5f43.chargeBtns}>
              <TouchableOpacity
                style={v_fd5f43.chargeCancelBtn}
                onPress={() => v_d6a117(false)}
              >
                <Text style={v_fd5f43.chargeCancelText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={v_fd5f43.chargeGoBtn} onPress={v_d37d97}>
                <Feather name="external-link" size={14} color={v_1bfbd0.white} />
                <Text style={v_fd5f43.chargeGoText}>바로가기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_8bb912 !== null} transparent animationType="slide">
        <Pressable style={v_fd5f43.statsOverlay} onPress={() => v_d5cd7b(null)}>
          <Pressable style={v_fd5f43.statsSheet} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsTitle}>
              {v_8bb912 === "following" ? v_8d41d7("my.stats.following") : v_8d41d7("my.stats.myPersona")}
            </Text>
            <ScrollView style={{ maxHeight: 480 }}>
              {v_8bb912 === "following" && (
                !v_1f6f04 || v_1f6f04.length === 0 ? (
                  <View style={v_fd5f43.statsEmpty}>
                    <Feather name="users" size={28} color={v_1bfbd0.zinc300} />
                    <Text style={v_fd5f43.statsEmptyText}>아직 구독한 페르소나가 없어요</Text>
                  </View>
                ) : (
                  v_1f6f04.map((v_3f4e2e) => {
                    const v_10387a = v_b30b81(v_3f4e2e.id);
                    console.log(
                      `[MyScreen] following row render — cloneId=${v_3f4e2e.id} name=${v_3f4e2e.name} isFollowing=${v_10387a}`,
                    );
                    return (
                      <TouchableOpacity
                        key={v_3f4e2e.id}
                        style={v_fd5f43.listRow}
                        activeOpacity={0.6}
                        onPress={() => {
                          console.log(
                            `[MyScreen] following row TAP — goToClone cloneId=${v_3f4e2e.id} name=${v_3f4e2e.name}`,
                          );
                          v_74ecfc(v_3f4e2e.id);
                        }}
                      >
                        {v_3f4e2e.avatarUrl ? (
                          <Image source={{ uri: v_3f4e2e.avatarUrl }} style={v_fd5f43.listAvatar} />
                        ) : (
                          <View style={[v_fd5f43.listAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={v_fd5f43.listName}>{v_3f4e2e.name}</Text>
                          <Text style={v_fd5f43.listSub}>@{v_3f4e2e.username}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={async () => {
                            console.log(
                              `[MyScreen] follow toggle TAP cloneId=${v_3f4e2e.id} wasFollowing=${v_10387a}`,
                            );
                            await v_3094d4(v_3f4e2e.id);

                            if (v_10387a) {
                              console.log(
                                `[MyScreen] post-unfollow → list filter + count -1 cloneId=${v_3f4e2e.id}`,
                              );
                              v_9127a1((v_ba2215) =>
                                v_ba2215 ? v_ba2215.filter((v_62c214) => v_62c214.id !== v_3f4e2e.id) : v_ba2215,
                              );
                              v_b81b74((v_ba2215) =>
                                typeof v_ba2215 === "number" ? Math.max(0, v_ba2215 - 1) : v_ba2215,
                              );
                            } else {
                              console.log(
                                `[MyScreen] post-follow → count +1 cloneId=${v_3f4e2e.id}`,
                              );
                              v_b81b74((v_ba2215) =>
                                typeof v_ba2215 === "number" ? v_ba2215 + 1 : v_ba2215,
                              );
                            }
                          }}
                          style={[v_fd5f43.followToggleBtn, v_10387a && v_fd5f43.followToggleBtnActive]}
                        >
                          <Text style={[v_fd5f43.followToggleText, v_10387a && v_fd5f43.followToggleTextActive]}>
                            {v_10387a ? "구독 중" : "구독"}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )
              )}
              {v_8bb912 === "myClones" && (
                !v_58e68f || v_58e68f.length === 0 ? (
                  <View style={v_fd5f43.statsEmpty}>
                    <Feather name="user" size={28} color={v_1bfbd0.zinc300} />
                    <Text style={v_fd5f43.statsEmptyText}>아직 만든 페르소나가 없어요</Text>
                  </View>
                ) : (
                  v_58e68f.map((v_3f4e2e) => (
                    <TouchableOpacity
                      key={v_3f4e2e.id}
                      style={v_fd5f43.listRow}
                      activeOpacity={0.6}
                      onPress={() => v_74ecfc(v_3f4e2e.id)}
                    >
                      {v_3f4e2e.avatarUrl ? (
                        <Image source={{ uri: v_3f4e2e.avatarUrl }} style={v_fd5f43.listAvatar} />
                      ) : (
                        <View style={[v_fd5f43.listAvatar, { backgroundColor: v_1bfbd0.zinc200 }]} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={v_fd5f43.listName}>{v_3f4e2e.name}</Text>
                        <Text style={v_fd5f43.listSub}>@{v_3f4e2e.username}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )
              )}
            </ScrollView>
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

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 16,
    alignSelf: "stretch",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900 },
  statLabel: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: v_1bfbd0.zinc200 },

  sectionHeader: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc400, paddingHorizontal: 4 },

  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: v_1bfbd0.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  coinTextWrap: { flex: 1 },
  coinSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  coinNetwork: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    marginTop: 2,
  },
  coinAmountWrap: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  coinAmountText: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  coinUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
  },
  coinChargeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  adNote: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: -4,
  },

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

  chargeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  chargeBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  chargeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  chargeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 10,
  },
  chargeDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 12,
  },
  chargeHint: {
    fontSize: 11,
    color: v_1bfbd0.zinc400,
    textAlign: "center",
    marginBottom: 20,
  },
  chargeBtns: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  chargeCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
  },
  chargeCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc600,
  },
  chargeGoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: v_1bfbd0.violet600,
  },
  chargeGoText: {
    fontSize: 14,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
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

  statsOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  statsSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: "70%",
  },
  followToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: v_1bfbd0.zinc900,
  },
  followToggleBtnActive: {
    backgroundColor: v_1bfbd0.zinc100,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
  },
  followToggleText: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.white },
  followToggleTextActive: { color: v_1bfbd0.zinc700 },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginVertical: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 12,
  },
  statsEmpty: { alignItems: "center", paddingVertical: 36, gap: 8 },
  statsEmptyText: { color: v_1bfbd0.zinc500, fontSize: 13 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  listAvatar: { width: 40, height: 40, borderRadius: 20 },
  listName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  listSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
});
