import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_5ab095, v_c4deb2, v_e662ae, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_700696,
  v_9cabcb,
  v_aa7413,
  v_09d0e5,
  v_a2349e,
  v_326be8,
  v_e767d1,
  v_79c4f2,
  v_03e392,
  v_f2c756,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_d4f1cc } from "mbgbsytfgyr";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_bab832, v_a0300b } from "rthlnescfffbyxfmhgq";
import { v_2ab825 } from "../../realtime/useAvatarCall";
import { v_c6d1f4 } from "../../config/callRoute";
import { v_7df8a4 } from "../../realtime/useHandsFreeController";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_8ad91b } from "../../navigation/types";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import type { v_84fd28 } from "../../types/gift";
import v_feb82c from "../../mocks/gifts.json";
import { v_5c99c1 } from "../../api/payments";
import {
  v_6d41b9,
  v_b14fce,
  v_0ff331,
  v_28dc16,
  v_c0681d,
} from "../../api/clones";
import { v_84a859 } from "../../api/auth";

type Props = v_432191<v_8ad91b, "Call">;

const { width: v_437248 } = v_700696.get("window");
const v_68bb66 = v_feb82c as v_84fd28[];

interface FloatingGift {
  id: number;
  emoji: string;
  animY: v_a2349e.Value;
  animOpacity: v_a2349e.Value;
  x: number;
}

export default function v_bfc6c1({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { cloneId: v_6e0fd3, name: v_a4744c, image: v_c1e151 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_53dd92 =
    v_326be8.OS === "ios" ? v_033e14.bottom : Math.max(v_f9771e, v_033e14.bottom);

  const [v_d1a6bb, v_1e66f0] = v_d4f1cc();
  const [v_5bb98b, v_fce7f9] = v_5ab095<"front" | "back">("front");
  const [v_4e2aec, v_326ca4] = v_5ab095(false);
  const [v_9e64e1, v_e064ce] = v_5ab095(false);

  const [v_17643c, v_10e972] = v_5ab095<MediaStream | null>(null);

  const v_cb91bc = v_e662ae<MediaStream | null>(null);

  const v_0fcb08 = v_de06a3(() => {
    if (v_cb91bc.current) {
      v_cb91bc.current.getTracks().forEach((v_8d41d7) => v_8d41d7.stop());
      v_cb91bc.current = null;
    }
  }, []);

  v_c4deb2(() => {
    if (!v_d1a6bb?.granted || v_9e64e1) {
      v_0fcb08();
      v_10e972(null);
      return;
    }
    let v_2008a4 = false;
    (async () => {
      try {
        const v_cab51f = await v_a0300b.getUserMedia({
          audio: false,
          video: {
            facingMode: v_5bb98b === "front" ? "user" : "environment",
          },
        }) as unknown as MediaStream;
        if (v_2008a4) {
          v_cab51f.getTracks().forEach((v_8d41d7) => v_8d41d7.stop());
          return;
        }
        v_0fcb08(); 
        v_cb91bc.current = v_cab51f;
        v_10e972(v_cab51f);
      } catch (v_49263d) {
        console.warn("[Call][PiP] getUserMedia failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };

  }, [v_d1a6bb?.granted, v_5bb98b, v_9e64e1, v_0fcb08]);

  v_c4deb2(() => () => v_0fcb08(), [v_0fcb08]);

  const {
    state: v_6cc918,
    remoteStream: v_b4d824,
    start: v_223067,
    stop: v_cd8b64,
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: v_811f30,
  } = v_2ab825({ cloneId: v_6e0fd3, accessToken: v_2ca7e0 ?? "" });

  const {
    phase: v_ab4803,
    micOn: v_1065f7,
    toggleMic: v_6e1295,
    transcript: v_0885ca,
    interimTranscript: v_a2d9d1,
  } = v_7df8a4({
    enabled: v_6cc918 === "live",
    say: v_3e2c87,
    getStatsReport: v_791152,
    notifySpeechEnd: v_811f30,
  });

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    void v_223067();

  }, []);

  v_c4deb2(() => {
    if (!v_d1a6bb?.granted) {
      v_1e66f0();
    }
  }, []);
  const [v_d416b8, v_2a4980] = v_5ab095(false);

  const [v_e2c945, v_06e986] = v_5ab095<number>(0);
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);
  const [v_85c07b, v_ff0eb0] = v_5ab095(false);
  const [v_605664, v_0f07a9] = v_5ab095<FloatingGift[]>([]);
  const v_63eb29 = v_e662ae(0);

  const [v_5a751a, v_6d75b1] = v_5ab095(0);
  v_c4deb2(() => {
    if (v_6cc918 !== "live") return;
    const v_389afb = setInterval(() => v_6d75b1((v_fd5f43) => v_fd5f43 + 1), 1000);
    return () => clearInterval(v_389afb);
  }, [v_6cc918]);

  const v_1406a6 = v_e662ae<number>(Date.now());
  const v_4d96d4 = v_e662ae(v_2ca7e0);
  const v_32c215 = v_e662ae(v_6e0fd3);
  v_c4deb2(() => {
    v_4d96d4.current = v_2ca7e0;
    v_32c215.current = v_6e0fd3;
  }, [v_2ca7e0, v_6e0fd3]);
  v_c4deb2(() => {
    return () => {
      const v_21cc31 = v_4d96d4.current;
      const v_062ae9 = v_32c215.current;
      console.log(`[Call] 화면 종료 — call-event 전송 시도 token=${!!v_21cc31} cloneId=${v_062ae9}`);
      if (!v_21cc31 || !v_062ae9) {
        console.warn(`[Call] call-event 전송 SKIP (token=${!!v_21cc31} cid=${v_062ae9})`);
        return;
      }
      const v_40c855 = Math.floor((Date.now() - v_1406a6.current) / 1000);
      console.log(`[Call] POST /oth-path${v_062ae9}/call-event { durationSeconds: ${v_40c855} }`);

      v_c0681d(v_21cc31, v_062ae9, { durationSeconds: v_40c855 })
        .then((v_8f00b9) =>
          console.log(`[Call] call-event ← ok scoreApplied=${(v_8f00b9 as { scoreApplied?: number }).scoreApplied ?? 0}°C (duration=${v_40c855}s, >=1200 이면 +15°C)`),
        )
        .catch((v_49263d) => console.warn("[Call] postCloneCallEvent failed:", v_49263d));
    };
  }, []);

  v_c4deb2(() => {
    console.log(`[Call] 진입 cloneId=${v_6e0fd3} name=${v_a4744c ?? "?"} (likedByMe fetch 중...)`);
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    v_6d41b9(v_2ca7e0, v_6e0fd3)
      .then((v_cb35cb) => {
        if (v_2008a4) return;
        console.log(`[Call] likedByMe fetch ← ${v_cb35cb.liked}`);
        v_ff0eb0(v_cb35cb.liked);
      })
      .catch((v_49263d) => {
        console.warn("[Call] likedByMe fetch failed:", v_49263d);
      });
    return () => {
      v_2008a4 = true;
    };

  }, [v_2ca7e0, v_6e0fd3]);
  const v_813acc = `${String(Math.floor(v_5a751a / 60)).padStart(2, "0")}:${String(v_5a751a % 60).padStart(2, "0")}`;

  const v_d3ded9 = v_de06a3(async () => {
    if (!v_2ca7e0) return;
    try {
      const v_cb35cb = await v_5c99c1(v_2ca7e0);
      if (v_cb35cb.linked && typeof v_cb35cb.xrun === "number") v_06e986(v_cb35cb.xrun);
    } catch (v_49263d) {
      console.warn("[Call] getXrunBalance failed:", v_49263d);
    }
  }, [v_2ca7e0]);
  v_c4deb2(() => {
    void v_d3ded9();
  }, [v_d3ded9]);

  const v_dfb220 = v_a4744c || v_eb25ce?.displayName || v_8d41d7("chat.personaFallback");
  const v_0e38ad = v_c1e151 || v_eb25ce?.imageUrl || "";

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_cb36b1 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_cb36b1);
    }
  }, [v_8282fa]);

  const [v_58c86d, v_ece29b] = v_5ab095(false);
  const [v_555760, v_5afccf] = v_5ab095<v_84fd28 | null>(null);
  const [v_c924cc, v_d0452a] = v_5ab095("");
  const [v_904d6c, v_a8bf66] = v_5ab095(false);

  const v_0c2802 = async () => {
    const v_e0c7e8 = v_1ed7d9.getState().apiUser?.email ?? null;
    const v_2208dc = v_e0c7e8
      ? `xrun://?email=${encodeURIComponent(v_e0c7e8)}&from=afterlife`
      : "xrun://";
    try {
      await v_f2c756.openURL(v_2208dc);
    } catch {
      const v_b71a74 =
        v_326be8.OS === "ios"
          ? "https://apps.apple.com/app/xrun/id1602489406"
          : "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
      try {
        await v_f2c756.openURL(v_b71a74);
      } catch {

      }
    }
  };

  const v_25b14f = (gift: v_84fd28) => {
    console.log(
      `[Call][gift-tap] giftId=${v_bbee9c.id} name=${v_bbee9c.name} price=${v_bbee9c.price} ` +
        `myCredits=${v_e2c945} (typeof=${typeof v_e2c945}) enough=${v_e2c945 >= v_bbee9c.price}`,
    );
    if (v_e2c945 < v_bbee9c.price) {
      const v_ff3b79 = Math.max(0, v_bbee9c.price - v_e2c945);
      console.log(
        `[Call][gift-insufficient-precheck] ${v_e2c945} < ${v_bbee9c.price} (shortage=${v_ff3b79}) → block PIN modal`,
      );
      v_889fad(
        `${v_ff3b79} 잔액이 부족합니다`,
        `선물을 보내기 위해 ${v_ff3b79} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`,
        [
          { text: "다음에 하기", style: "cancel" },
          { text: "XRUN 충전하기", onPress: () => void v_0c2802() },
        ],
      );
      return;
    }
    v_5afccf(v_bbee9c);
    v_d0452a("");
    v_2a4980(false);
    v_ece29b(true);
    console.log(`[Call][gift-pin-open] open PIN modal for gift=${v_bbee9c.name}`);
  };

  const v_c04570 = async () => {
    if (!v_555760 || !v_2ca7e0) return;
    if (!/^\d{6}$/.test(v_c924cc)) {
      v_15c939("PIN 6자리를 입력해 주세요");
      return;
    }
    console.log(
      `[Call][gift-submit] giftId=${v_555760.id} amount=${v_555760.price} ` +
        `myCredits=${v_e2c945} cloneId=${v_6e0fd3} pin=*** (${v_c924cc.length} chars)`,
    );
    v_a8bf66(true);
    try {
      const v_8f00b9 = await v_28dc16(v_2ca7e0, v_6e0fd3, {
        giftId: v_555760.id,
        giftName: v_555760.name,
        amount: v_555760.price,
        pin: v_c924cc,
      });
      console.log("[Call][gift-ok] gift sent:", v_8f00b9.gift);
      const v_bbee9c = v_555760;

      if (v_8f00b9.gift.newBalance != null && !Number.isNaN(Number(v_8f00b9.gift.newBalance))) {
        v_06e986(Number(v_8f00b9.gift.newBalance));
        console.log(`[Call] credits = ${v_8f00b9.gift.newBalance} (from newBalance)`);
      }
      void v_d3ded9().then(() => console.log("[Call] balance refetched after gift"));
      v_ece29b(false);
      v_5afccf(null);
      v_d0452a("");

      v_161a89(v_bbee9c);
    } catch (v_49263d) {
      console.warn("[Call][gift-fail] raw err =", v_49263d);
      if (v_49263d instanceof v_84a859) {
        console.warn(
          `[Call][gift-fail] code=${v_49263d.code} status=${v_49263d.status} msg="${v_49263d.message}" details=${JSON.stringify(v_49263d.details)}`,
        );
      } else if (v_49263d instanceof Error) {
        console.warn(`[Call][gift-fail] non-AuthApiError name=${v_49263d.name} msg=${v_49263d.message}`);
      }
      let v_9f1622 = "송금 실패";
      let v_badeaf = "송금에 실패했어요.";
      let v_81532e = false;
      if (v_49263d instanceof v_84a859) {
        if (v_49263d.code === "UNAUTHENTICATED") v_badeaf = "결제 비밀번호가 일치하지 않아요.";
        else if (v_49263d.code === "INSUFFICIENT_FUNDS") {
          v_81532e = true;

          const v_ff3b79 = v_555760
            ? Math.max(0, v_555760.price - v_e2c945)
            : 0;
          v_9f1622 = v_ff3b79 > 0
            ? `${v_ff3b79} 잔액이 부족합니다`
            : "잔액이 부족합니다";
          v_badeaf = v_ff3b79 > 0
            ? `선물을 보내기 위해 ${v_ff3b79} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`
            : "선물을 보내기에 XRUN 이 부족해요.\nXRUN에서 암호화폐를 얻어보세요!";
        } else if (v_49263d.code === "CONFLICT") v_badeaf = v_49263d.message;
        else if (v_49263d.code === "UPSTREAM_NOT_IMPLEMENTED")
          v_badeaf = "xrun 게이트웨이 송금 기능이 아직 준비 중이에요.";
        else if (v_49263d.code === "UPSTREAM_FAILURE") {

          if (/insufficient|잔액|balance/i.test(v_49263d.message)) {
            v_81532e = true;
            const v_ff3b79 = v_555760
              ? Math.max(0, v_555760.price - v_e2c945)
              : 0;
            v_9f1622 = v_ff3b79 > 0
              ? `${v_ff3b79} 잔액이 부족합니다`
              : "잔액이 부족합니다";
            v_badeaf = v_ff3b79 > 0
              ? `선물을 보내기 위해 ${v_ff3b79} XRUN이 더 필요해요.\nXRUN에서 암호화폐를 얻어보세요!`
              : "선물을 보내기에 XRUN 이 부족해요.\nXRUN에서 암호화폐를 얻어보세요!";
          } else {
            v_badeaf = "xrun 송금 처리 중 오류가 발생했어요.";
          }
        } else v_badeaf = v_49263d.message;
      }

      v_ece29b(false);
      v_d0452a("");
      v_889fad(
        v_9f1622,
        v_badeaf,
        v_81532e
          ? [
              { text: "다음에 하기", style: "cancel" },
              { text: "XRUN 충전하기", onPress: () => void v_0c2802() },
            ]
          : undefined,
      );
    } finally {
      v_a8bf66(false);
    }
  };

  const v_161a89 = (gift: v_84fd28) => {
    v_15c939(v_8d41d7("call.giftSent", { name: v_bbee9c.name }));

    const v_389afb = v_63eb29.current++;
    const v_15f379 = new v_a2349e.Value(0);
    const v_3929b3 = new v_a2349e.Value(0);
    const v_62c214 = v_437248 / 2 + (Math.random() * 120 - 60);

    const v_90ca83 = { id: v_389afb, emoji: v_bbee9c.emoji, animY: v_15f379, animOpacity: v_3929b3, x: v_62c214 };
    v_0f07a9((v_ba2215) => [...v_ba2215, v_90ca83]);

    v_a2349e.parallel([
      v_a2349e.timing(v_15f379, {
        toValue: -400,
        duration: 2500,
        useNativeDriver: true,
      }),
      v_a2349e.sequence([
        v_a2349e.timing(v_3929b3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        v_a2349e.delay(1500),
        v_a2349e.timing(v_3929b3, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      v_0f07a9((v_ba2215) => v_ba2215.filter((v_206b88) => v_206b88.id !== v_389afb));
    });

    v_2a4980(false);
  };

  return (
    <View style={v_fd5f43.container}>
      {}
      {v_b4d824 ? (
        <RTCView
          streamURL={(v_b4d824 as unknown as { toURL: () => string }).toURL()}
          objectFit="cover"
          style={[v_472849.absoluteFill, { width: "100%", height: "100%" }]}
        />
      ) : v_0e38ad ? (
        <Image
          source={typeof v_0e38ad === "number" ? v_0e38ad : { uri: v_0e38ad }}
          style={[v_472849.absoluteFill, { width: "100%", height: "100%" }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[v_472849.absoluteFill, { backgroundColor: v_1bfbd0.zinc900 }]} />
      )}

      {__DEV__ ? (
        <Text style={{ position: 'absolute', top: 8, left: 8, zIndex: 10,
          color: '#0f0', fontSize: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2 }}>
          route:{v_c6d1f4}
        </Text>
      ) : null}

      {}
      {v_6cc918 !== "live" && (
        <View style={v_fd5f43.liveOverlay} pointerEvents="none">
          <Text style={v_fd5f43.liveOverlayText}>
            {v_6cc918 === "error" ? "연결에 실패했어요" : "연결 중…"}
          </Text>
        </View>
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "transparent", "rgba(9,9,11,0.5)"]}
        locations={[0, 0.4, 1]}
        style={v_472849.absoluteFill}
      />

      {
}
      <TouchableOpacity
        style={[v_fd5f43.pip, { top: v_033e14.top + 8 }]}
        activeOpacity={0.9}
        onPress={() => v_fce7f9((v_8b5cd8) => (v_8b5cd8 === "front" ? "back" : "front"))}
      >
        {v_9e64e1 ? (
          <View style={v_fd5f43.pipOff}>
            <Feather name="video-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        ) : v_17643c ? (
          <RTCView
            streamURL={(v_17643c as unknown as { toURL: () => string }).toURL()}
            style={v_fd5f43.pipCamera}
            objectFit="cover"
            zOrder={1}
            mirror={v_5bb98b === "front"}
          />
        ) : (
          <View style={v_fd5f43.pipOff}>
            <Feather name="camera-off" size={20} color={v_1bfbd0.zinc600} />
          </View>
        )}
      </TouchableOpacity>

      {
}

      {}
      <View style={[v_fd5f43.callInfo, { top: v_033e14.top + 24 }]}>
        <Text style={v_fd5f43.callName}>{v_dfb220}</Text>
        <Text style={v_fd5f43.callTimeText}>
          {v_6cc918 === "live" ? v_813acc : "연결 중…"}
        </Text>
      </View>

      {}
      <View style={v_fd5f43.rightActions}>
        <TouchableOpacity
          style={[v_fd5f43.sideBtn, v_d416b8 && v_fd5f43.sideBtnActive]}
          onPress={() => v_2a4980(!v_d416b8)}
        >
          <Feather name="gift" size={22} color={v_1bfbd0.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={v_fd5f43.sideBtn}
          onPress={async () => {
            const v_a448ad = !v_85c07b;
            console.log(
              `[Call] 좋아요 클릭 cloneId=${v_6e0fd3} ${v_85c07b ? "true" : "false"} → ${v_a448ad ? "true" : "false"}`,
            );
            v_ff0eb0(v_a448ad); 
            if (!v_2ca7e0) return;
            try {
              if (v_a448ad) await v_b14fce(v_2ca7e0, v_6e0fd3);
              else await v_0ff331(v_2ca7e0, v_6e0fd3);
              console.log(`[Call] 좋아요 API ← ok next=${v_a448ad}`);
            } catch (v_49263d) {
              console.warn("[Call] 좋아요 API 실패:", v_49263d);
              v_ff0eb0(!v_a448ad); 
            }
          }}
        >
          {}
          <Ionicons
            name={v_85c07b ? "heart" : "heart-outline"}
            size={24}
            color={v_85c07b ? "#ef4444" : v_1bfbd0.white}
          />
        </TouchableOpacity>
        {}
      </View>

      {}
      {v_605664.map((v_206b88) => (
        <Animated.Text
          key={v_206b88.id}
          style={[
            v_fd5f43.floatingEmoji,
            {
              left: v_206b88.x,
              transform: [{ translateY: v_206b88.animY }],
              opacity: v_206b88.animOpacity,
            },
          ]}
        >
          {v_206b88.emoji}
        </Animated.Text>
      ))}

      {}
      {v_ab4803 === 'listening' && (!!v_a2d9d1 || !!v_0885ca) ? (
        <View style={v_fd5f43.subtitleContainer} pointerEvents="none">
          <Text style={v_fd5f43.subtitleText} numberOfLines={2} ellipsizeMode="tail">
            {v_a2d9d1 || v_0885ca}
          </Text>
        </View>
      ) : null}

      {}
      <View style={[v_fd5f43.controls, { paddingBottom: v_53dd92 + 24 }]}>
        {}
        <Pressable
          onPress={v_6e1295}
          style={[
            v_fd5f43.controlBtn,
            v_1065f7 && v_ab4803 === 'listening' && v_fd5f43.controlBtnActive,
            v_ab4803 === 'speaking' && v_fd5f43.controlBtnDanger,
          ]}
        >
          <Text style={v_fd5f43.talkBtnText}>
            {!v_1065f7
              ? '마이크 꺼짐'
              : v_ab4803 === 'speaking'
                ? '응답 중...'
                : v_ab4803 === 'listening'
                  ? '듣는 중...'
                  : '대기'}
          </Text>
        </Pressable>

        <TouchableOpacity
          style={[v_fd5f43.controlBtn, v_4e2aec && v_fd5f43.controlBtnDanger]}
          onPress={() => {
            const v_a448ad = !v_4e2aec;
            v_326ca4(v_a448ad);

            const v_ff0300 = (v_b4d824 as unknown as { getAudioTracks?: () => Array<{ enabled: boolean }> })
              ?.getAudioTracks?.() ?? [];
            v_ff0300.forEach((v_8d41d7) => {
              v_8d41d7.enabled = !v_a448ad;
            });
          }}
        >
          <Feather name={v_4e2aec ? "mic-off" : "mic"} size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={v_fd5f43.endCallBtn}
          onPress={async () => {
            await v_cd8b64();
            v_c65f5d.goBack();
          }}
        >
          <Feather name="phone" size={28} color={v_1bfbd0.white} style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[v_fd5f43.controlBtn, v_9e64e1 && v_fd5f43.controlBtnDanger]}
          onPress={() => v_e064ce(!v_9e64e1)}
        >
          <Feather name={v_9e64e1 ? "video-off" : "video"} size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>

      {}
      <Modal
        visible={v_d416b8}
        transparent
        animationType="slide"
        onShow={() => void v_d3ded9()}
      >
        <Pressable style={v_fd5f43.giftOverlay} onPress={() => v_2a4980(false)}>
          <Pressable
            style={[v_fd5f43.giftSheet, { paddingBottom: 24 + v_53dd92 }]}
            onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}
          >
            {}
            <View style={v_fd5f43.giftHeader}>
              <View style={v_fd5f43.giftHeaderLeft}>
                <Text style={v_fd5f43.giftTitle}>{v_8d41d7("call.giftTitle")}</Text>
                <View style={v_fd5f43.creditsPill}>
                  <Text style={v_fd5f43.creditsPillText}>
                    {v_e2c945.toLocaleString()} XRUN
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={v_fd5f43.closeBtn}
                onPress={() => v_2a4980(false)}
              >
                <Feather name="x" size={18} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <FlatList
              data={v_68bb66}
              keyExtractor={(v_8c0b26) => v_8c0b26.id}
              numColumns={3}
              columnWrapperStyle={v_fd5f43.giftRow}
              contentContainerStyle={v_fd5f43.giftGrid}
              scrollEnabled={false}
              renderItem={({ item: v_8c0b26 }) => (
                <TouchableOpacity
                  style={v_fd5f43.giftItem}
                  onPress={() => v_25b14f(v_8c0b26)}
                  activeOpacity={0.7}
                >
                  <View style={v_fd5f43.giftEmojiWrap}>
                    <Text style={v_fd5f43.giftEmoji}>{v_8c0b26.emoji}</Text>
                  </View>
                  <Text style={v_fd5f43.giftName}>{v_8c0b26.name}</Text>
                  <Text style={v_fd5f43.giftPrice}>{v_8c0b26.price} XRUN</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}

      {}
      <Modal visible={v_58c86d} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={v_326be8.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={v_fd5f43.pinOverlay}
            onPress={() => !v_904d6c && v_ece29b(false)}
          >
            <Pressable style={v_fd5f43.pinBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
              <View style={v_fd5f43.pinIconWrap}>
                <Feather name="lock" size={26} color={v_1bfbd0.violet600} />
              </View>
              <Text style={v_fd5f43.pinTitle}>결제 비밀번호</Text>
              {v_555760 && (
                <Text style={v_fd5f43.pinDesc}>
                  {v_555760.emoji} {v_555760.name} · {v_555760.price} XRUN
                  {"\n"}선물하시려면 6자리 PIN 을 입력해 주세요
                </Text>
              )}
              <TextInput
                style={v_fd5f43.pinInput}
                value={v_c924cc}
                onChangeText={(v_81e2ef) => v_d0452a(v_81e2ef.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN 6자리"
                placeholderTextColor={v_1bfbd0.zinc400}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                autoFocus
                editable={!v_904d6c}
              />
              <View style={v_fd5f43.pinBtns}>
                <TouchableOpacity
                  style={v_fd5f43.pinCancelBtn}
                  onPress={() => v_ece29b(false)}
                  disabled={v_904d6c}
                >
                  <Text style={v_fd5f43.pinCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[v_fd5f43.pinConfirmBtn, (v_c924cc.length !== 6 || v_904d6c) && v_fd5f43.pinBtnDisabled]}
                  onPress={v_c04570}
                  disabled={v_c924cc.length !== 6 || v_904d6c}
                >
                  <Text style={v_fd5f43.pinConfirmText}>{v_904d6c ? "선물 중..." : "선물하기"}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {}
      {v_8282fa && (
        <View style={v_fd5f43.toast}>
          <Text style={v_fd5f43.toastText}>{v_8282fa}</Text>
        </View>
      )}
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  container: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc950,
  },
  liveOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  liveOverlayText: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.white,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  pip: {
    position: "absolute",
    left: 16,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    zIndex: 10,
    elevation: 10,
  },
  pipImage: { width: "100%", height: "100%" },
  pipCamera: { width: "100%", height: "100%" },
  pipOff: {
    width: "100%",
    height: "100%",
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },

  callInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  callName: {
    fontSize: 24,
    fontWeight: "700",
    color: v_1bfbd0.white,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  callTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  rightActions: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    gap: 20,
    zIndex: 20,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnActive: {
    backgroundColor: v_1bfbd0.violet500,
  },

  floatingEmoji: {
    position: "absolute",
    bottom: 200,
    fontSize: 48,
    zIndex: 30,
  },

  subtitleContainer: {
    position: 'absolute',
    bottom: 150,
    left: 48,
    right: 48,
    alignItems: 'center',
    zIndex: 15,
  },
  subtitleText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: v_1bfbd0.white,
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    textAlign: 'center',
    overflow: 'hidden',
  },

  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 10,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(24,24,27,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnDanger: {
    backgroundColor: v_1bfbd0.error,
  },
  controlBtnActive: {
    backgroundColor: v_1bfbd0.violet500,
  },
  talkBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: v_1bfbd0.white,
    textAlign: "center",
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.error,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: v_1bfbd0.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  giftOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  giftSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,

    height: "80%",
  },
  giftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc200,
  },
  giftHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  giftTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  creditsPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.full,
  },
  creditsPillText: { fontSize: 13, fontWeight: "700", color: v_1bfbd0.violet600 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  giftGrid: { paddingHorizontal: 24, paddingTop: 20 },
  giftRow: { gap: 12, marginBottom: 12 },
  giftItem: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8b0c90.lg,
  },
  giftEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: v_1bfbd0.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  giftEmoji: { fontSize: 24 },
  giftName: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 2 },
  giftPrice: { fontSize: 12, fontWeight: "700", color: v_1bfbd0.violet600 },

  toast: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: v_8b0c90.full,
    zIndex: 50,
  },
  toastText: { fontSize: 14, color: v_1bfbd0.white },

  pinOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  pinBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  pinIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.violet100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pinTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 10 },
  pinDesc: {
    fontSize: 13,
    color: v_1bfbd0.zinc600,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  pinInput: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 4, 
    color: v_1bfbd0.zinc900,
    backgroundColor: v_1bfbd0.zinc50,
    marginBottom: 18,
  },
  pinBtns: { flexDirection: "row", gap: 8, width: "100%" },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
  },
  pinCancelText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc600 },
  pinConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
  },
  pinConfirmText: { fontSize: 14, fontWeight: "700", color: v_1bfbd0.white },
  pinBtnDisabled: { backgroundColor: v_1bfbd0.zinc300 },
});
