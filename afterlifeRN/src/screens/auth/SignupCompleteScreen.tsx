

import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_4623af, v_472849, v_03e392 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_384e19 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";
import { v_7ef860, v_84a859 } from "../../api/auth";
import { v_1ed7d9 } from "../../stores/authStore";

type Props = v_432191<v_384e19, "SignupComplete">;

type ServiceKey = "afterlife" | "xrun";

export default function v_933130({ route: v_c7daf6 }: Props) {
  const { t: v_8d41d7 } = v_772971();

  const v_2ca7e0 = v_c7daf6.params?.accessToken;
  const v_3c038e = v_c7daf6.params?.persist ?? true;
  const v_31080f = v_1ed7d9((v_fd5f43) => v_fd5f43.setApiAuth);
  const v_232d52 = v_1ed7d9((v_fd5f43) => v_fd5f43.hydrate);
  console.log("[SignupComplete] mounted, hasToken:", !!v_2ca7e0);

  const [v_587413, v_2122dd] = v_5ab095<Record<ServiceKey, boolean>>({
    afterlife: true,
    xrun: true,
  });
  const [v_1d049f, v_558bed] = v_5ab095(false);

  const v_09f2bd = (v_b24339) => {
    v_2122dd((v_ba2215) => ({ ...v_ba2215, [v_b24339]: !v_ba2215[v_b24339] }));
  };

  const v_d0bbf9 = async () => {
    if (!v_2ca7e0) {
      console.warn("[SignupComplete] no accessToken in route.params");
      return;
    }
    v_558bed(true);
    try {

      const v_9ec4c0 = await v_7ef860(v_2ca7e0);
      await v_31080f(v_2ca7e0, v_9ec4c0.user, { persist: v_3c038e });

      console.log("[SignupComplete] services selected:", v_587413);
      await v_232d52();
    } catch (v_49263d) {
      console.warn("[SignupComplete] start failed:", v_49263d);
      const v_badeaf =
        v_49263d instanceof v_84a859 ? v_49263d.message : String(v_49263d);
      v_03e392.alert(v_8d41d7("common.error"), v_badeaf);

    } finally {
      v_558bed(false);
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.zinc50}>
      <SafeScrollView
        contentContainerStyle={v_fd5f43.scroll}
        showBottomBackground={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={v_fd5f43.container}>
          {}
          <Text style={v_fd5f43.title}>
            {v_8d41d7("auth.signupComplete.title", { defaultValue: "가입 완료!" })}
          </Text>
          <Text style={v_fd5f43.subtitle}>
            {v_8d41d7("auth.signupComplete.subtitle", {
              defaultValue: "이용할 서비스를 선택해주세요.",
            })}
          </Text>

          {}
          <View style={v_fd5f43.cards}>
            <ServiceCard
              icon={
                <Text style={v_fd5f43.iconText}>∞</Text>
              }
              title={v_8d41d7("auth.signupComplete.afterlifeTitle", {
                defaultValue: "애프터라이프",
              })}
              subtitle={v_8d41d7("auth.signupComplete.afterlifeDesc", {
                defaultValue: "다음 세상의 삶",
              })}
              selected={v_587413.afterlife}
              onPress={() => v_09f2bd("afterlife")}
            />
            <ServiceCard
              icon={<Text style={v_fd5f43.iconText}>X</Text>}
              title={v_8d41d7("auth.signupComplete.xrunTitle", {
                defaultValue: "XRUN",
              })}
              subtitle={v_8d41d7("auth.signupComplete.xrunDesc", {
                defaultValue: "Move to Earn",
              })}
              selected={v_587413.xrun}
              onPress={() => v_09f2bd("xrun")}
            />
          </View>
        </View>
      </SafeScrollView>

      {}
      <View style={v_fd5f43.footer}>
        <Button
          title={
            v_1d049f
              ? v_8d41d7("auth.signup.signingUp", { defaultValue: "진행 중..." })
              : v_8d41d7("auth.signupComplete.startBtn", { defaultValue: "시작하기" })
          }
          onPress={v_d0bbf9}
          disabled={v_1d049f}
        />
      </View>
    </SafeView>
  );
}

type ServiceCardProps = {
  icon: v_a3453e.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

function v_fd3960({
  icon: v_9ddfab,
  title: v_9f1622,
  subtitle: v_dda473,
  selected: v_587413,
  onPress: v_719eed,
}: ServiceCardProps) {
  return (
    <TouchableOpacity
      style={[v_fd5f43.card, v_587413 && v_fd5f43.cardSelected]}
      onPress={v_719eed}
      activeOpacity={0.85}
    >
      <View style={v_fd5f43.iconWrap}>{v_9ddfab}</View>
      <View style={{ flex: 1 }}>
        <Text style={v_fd5f43.cardTitle}>{v_9f1622}</Text>
        <Text style={v_fd5f43.cardSubtitle}>{v_dda473}</Text>
      </View>
      <View style={[v_fd5f43.check, v_587413 && v_fd5f43.checkActive]}>
        {v_587413 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
      </View>
    </TouchableOpacity>
  );
}

const v_fd5f43 = v_472849.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: v_9b1a04.xlarge,
    paddingTop: 80,
    paddingBottom: 24,
  },
  container: {
    alignItems: "center",
    gap: v_9b1a04.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginBottom: 32,
  },
  cards: {
    width: "100%",
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardSelected: {
    borderColor: v_1bfbd0.violet500,
    borderWidth: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 24,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: {
    backgroundColor: v_1bfbd0.violet500,
    borderColor: v_1bfbd0.violet500,
  },
  footer: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingTop: v_9b1a04.medium,
    paddingBottom: v_9b1a04.large,
    backgroundColor: v_1bfbd0.zinc50,
  },
});
