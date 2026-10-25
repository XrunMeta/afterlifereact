

import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_cf9c33,
  v_7618c3,
  v_472849,
  v_4623af,
  v_f2c756,
  v_326be8,
  v_9cabcb,
  v_e45a99,
  v_a2349e,
  type v_da479e,
  type v_bd64bf,
  type v_961e77,
  type v_7e4944,
  type v_0b9d80,
} from "rcmrninabrnb";
import { v_5ade23 } from "xbfwaaanosqvazmrqoah";
import { v_772971 } from "jmpfvteuuztnp";
import { v_889fad } from "../../stores/dialogStore";
import { v_1bfbd0 } from "../constants";

const v_024b5e =
  "https://apps.apple.com/kr/app/xrun-%EC%95%B1%ED%85%8C%ED%81%AC-%EB%8F%88%EB%B2%84%EB%8A%94%EC%95%B1-%EC%BA%90%EC%8B%9C/id6502924173";
const v_b0adfa =
  "https://play.google.com/store/apps/details?id=run.xrun.xrunapp";
const v_736ebf =
  "https://play.google.com/store/apps/details?id=run.xrun.clubx&hl=en";

const v_dae506 = require("../../../assets/partner/xrun-banner.png");
const v_cfd6e7 = require("../../../assets/partner/clubx-banner.jpg");
const v_5336e8 = require("../../../assets/partner/xrun-promo.jpg");
const v_635099 = require("../../../assets/partner/clubx-promo.jpg");

const v_1d54af = 4;
const v_66f2f8 = 10;
const v_1c7901 = 28;
const v_5ac224 = 120;
const v_6c015b = 2800;
const v_c124a6 = 280;

type AppKind = "xrun" | "clubx";

type BannerCard = {
  id: AppKind;
  app: AppKind;
  brand: string;
  slides: string[];
  bg: number;
  logo: number;

  wash: [string, string, string];

  logoBoxBg: string;
};

type Props = {
  style?: v_961e77<v_7e4944>;
};

function v_e99974(v_724489) {
  const [v_a56041, v_fa5e29] = v_5ab095(0);
  const v_df9f11 = v_e662ae(new v_a2349e.Value(1)).current;

  v_c4deb2(() => {
    if (v_724489 <= 1) return;
    const v_389afb = setInterval(() => {
      v_a2349e.timing(v_df9f11, {
        toValue: 0,
        duration: v_c124a6,
        useNativeDriver: true,
      }).start(({ finished: v_cc0753 }) => {
        if (!v_cc0753) return;
        v_fa5e29((v_ebec57) => (v_ebec57 + 1) % v_724489);
        v_a2349e.timing(v_df9f11, {
          toValue: 1,
          duration: v_c124a6,
          useNativeDriver: true,
        }).start();
      });
    }, v_6c015b);
    return () => clearInterval(v_389afb);
  }, [v_724489, v_df9f11]);

  return { index: v_a56041, opacity: v_df9f11 };
}

function v_223478({ slides: v_f81d0e }: { slides: string[] }) {
  const { index: v_a56041, opacity: v_df9f11 } = v_e99974(v_f81d0e.length);
  return (
    <Animated.Text style={[v_fd5f43.line2, { opacity: v_df9f11 }]} numberOfLines={2}>
      {v_f81d0e[v_a56041]}
    </Animated.Text>
  );
}

export default function v_f9a626({ style: v_7fa4e4 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { width: v_a4b8ea } = v_e45a99();
  const [v_2365e9, v_bf9d67] = v_5ab095(0);

  const v_eca921 = Math.max(240, v_a4b8ea - 40 - v_1d54af * 2 - v_1c7901);

  const v_4552ca = v_df9f57<BannerCard[]>(
    () => [
      {
        id: "xrun",
        app: "xrun",
        brand: v_8d41d7("partner.xrunTitle", { defaultValue: "XRUN" }),
        slides: [
          v_8d41d7("partner.xrunSlide1", { defaultValue: "돈 버는 앱" }),
          v_8d41d7("partner.xrunSlide2", { defaultValue: "지갑" }),
          v_8d41d7("partner.xrunSlide3", { defaultValue: "보상" }),
          v_8d41d7("partner.xrunSlide4", { defaultValue: "로그인 연동" }),
        ],
        bg: v_5336e8,
        logo: v_dae506,

        wash: ["rgba(8,12,28,0.90)", "rgba(8,12,28,0.40)", "rgba(8,12,28,0.82)"],
        logoBoxBg: "rgba(255,255,255,0.92)",
      },
      {
        id: "clubx",
        app: "clubx",
        brand: v_8d41d7("partner.clubxTitle", { defaultValue: "ClubX" }),
        slides: [
          v_8d41d7("partner.clubxSlide1", { defaultValue: "가상 클럽" }),
          v_8d41d7("partner.clubxSlide2", { defaultValue: "파티 · 소셜" }),
          v_8d41d7("partner.clubxSlide3", { defaultValue: "댄스 · 아이템" }),
        ],
        bg: v_635099,
        logo: v_cfd6e7,
        wash: ["rgba(6,10,24,0.92)", "rgba(12,8,28,0.42)", "rgba(6,10,24,0.85)"],

        logoBoxBg: "#0a1628",
      },
    ],
    [v_8d41d7],
  );

  const v_34c671 = async (v_f71b56) => {
    try {
      await v_f2c756.openURL(v_f71b56);
    } catch (v_49263d) {
      console.warn("[PartnerAppBanners] openURL failed:", v_49263d);
    }
  };

  const v_0d0a3b = v_de06a3(
    (v_466992) => {
      if (v_466992 === "xrun") {
        void v_34c671(v_326be8.OS === "ios" ? v_024b5e : v_b0adfa);
        return;
      }
      if (v_326be8.OS === "ios") {
        v_889fad(
          v_8d41d7("partner.clubxTitle", { defaultValue: "ClubX" }),
          v_8d41d7("partner.clubxIosSoon", {
            defaultValue: "App Store 준비 중입니다. Android에서 먼저 이용해 주세요.",
          }),
        );
        return;
      }
      void v_34c671(v_736ebf);
    },
    [v_8d41d7],
  );

  const v_60260f = (e: v_bd64bf<v_da479e>) => {
    const v_62c214 = v_9e86fd.nativeEvent.contentOffset.x;
    const v_a448ad = Math.round(v_62c214 / (v_eca921 + v_66f2f8));
    v_bf9d67(Math.max(0, Math.min(v_4552ca.length - 1, v_a448ad)));
  };

  const v_fcf6ec = ({ item: v_8c0b26 }: v_0b9d80<BannerCard>) => (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => v_0d0a3b(v_8c0b26.app)}
      accessibilityRole="button"
      accessibilityLabel={v_8c0b26.brand}
      style={[v_fd5f43.cardWrap, { width: v_eca921 }]}
    >
      <ImageBackground source={v_8c0b26.bg} style={v_fd5f43.cardBg} imageStyle={v_fd5f43.cardImg} resizeMode="cover">
        <LinearGradient colors={v_8c0b26.wash} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={v_fd5f43.wash}>
          <View style={v_fd5f43.textCol}>
            <Text style={v_fd5f43.line1} numberOfLines={1}>
              {v_8c0b26.brand}
            </Text>
            <CardSlideTitle slides={v_8c0b26.slides} />
          </View>
          <View style={[v_fd5f43.visual, { backgroundColor: v_8c0b26.logoBoxBg }]}>
            <Image source={v_8c0b26.logo} style={v_fd5f43.logo} resizeMode="contain" />
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={[v_fd5f43.wrap, v_7fa4e4]}>
      <Text style={v_fd5f43.caption}>
        {v_8d41d7("partner.appsCaption", { defaultValue: "함께 쓰는 앱" })}
      </Text>
      <FlatList
        data={v_4552ca}
        keyExtractor={(v_23805a) => v_23805a.id}
        renderItem={v_fcf6ec}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={v_eca921 + v_66f2f8}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={v_fd5f43.listContent}
        onMomentumScrollEnd={v_60260f}
        getItemLayout={(v_37eab7, v_a56041) => ({
          length: v_eca921 + v_66f2f8,
          offset: (v_eca921 + v_66f2f8) * v_a56041,
          index: v_a56041,
        })}
      />
      <View style={v_fd5f43.dots}>
        {v_4552ca.map((v_3f4e2e, v_ebec57) => (
          <View key={v_3f4e2e.id} style={[v_fd5f43.dot, v_ebec57 === v_2365e9 && v_fd5f43.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: {
    marginTop: 8,
    marginBottom: 20,
    alignSelf: "stretch",
  },
  caption: {
    fontSize: 12,
    fontWeight: "600",
    color: v_1bfbd0.zinc500,
    marginLeft: 2,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: v_1d54af,
    paddingBottom: 2,
  },
  cardWrap: {
    marginRight: v_66f2f8,
    height: v_5ac224,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: v_472849.hairlineWidth,
    borderColor: "rgba(15,23,42,0.18)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardBg: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  cardImg: {
    borderRadius: 18,
  },
  wash: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 14,
  },
  textCol: {
    flex: 1,
    gap: 6,
    paddingRight: 8,
    minWidth: 0,
    justifyContent: "center",
  },
  line1: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  line2: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 28,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  visual: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: v_472849.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: "88%",
    height: "70%",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: v_1bfbd0.zinc300,
  },
  dotActive: {
    width: 14,
    backgroundColor: v_1bfbd0.zinc700,
  },
});
