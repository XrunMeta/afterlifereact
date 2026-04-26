import v_a3453e from "bapkr";
import { v_cdbda8 } from "ykfzqfftuciufdadykzsyvzknqnwb";
import { v_709be7 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import { v_650cfa } from "ixigazcpvfldbecwtbvavtbi";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_3094a2, v_472849, v_cf9c33, v_326be8 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import type { v_97a9a8, v_2d88fc, v_2b51a5 } from "./types";
import { v_1bfbd0 } from "../components/constants";
import { v_1ed7d9 } from "../stores/authStore";

import v_c316d8 from "../screens/home/HomeScreen";
import v_def15b from "../screens/clones/MyClonesDashboardScreen";
import v_51ae06 from "../screens/clones/CloneDetailScreen";
import v_541fbd from "../screens/clones/CloneEditScreen";
import v_84d7a5 from "../screens/clone-creation/Step1CloneTypeScreen";
import v_afe4c8 from "../screens/clone-creation/Step2BasicInfoScreen";
import v_3d9025 from "../screens/clone-creation/Step3ImageUploadScreen";
import v_710783 from "../screens/clone-creation/Step4VoiceUploadScreen";
import v_f275b6 from "../screens/clone-creation/Step5VisibilityScreen";
import v_baac2f from "../screens/clone-creation/Step6CreatingScreen";
import v_448ad1 from "../screens/clone-creation/Step7CompleteScreen";
import v_d19b01 from "../screens/clone-creation/Step8CreateShortsScreen";
import v_14b43e from "../screens/following/FollowingScreen";
import v_87eb38 from "../screens/shorts/ShortsTabScreen";
import v_ed02a5 from "../screens/my/MyScreen";

const v_3ea452 = v_709be7<v_2d88fc>();
const v_be1c7b = v_709be7<v_2b51a5>();

function v_aedede() {
  return (
    <ClonesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClonesStack.Screen name="Dashboard" component={v_def15b} />
      <ClonesStack.Screen name="CloneDetail" component={v_51ae06} />
      <ClonesStack.Screen name="CloneEdit" component={v_541fbd} />
    </ClonesStack.Navigator>
  );
}

function v_31fee5() {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="Step1" component={v_84d7a5} />
      <CreateStack.Screen name="Step2" component={v_afe4c8} />
      <CreateStack.Screen name="Step3" component={v_3d9025} />
      <CreateStack.Screen name="Step4" component={v_710783} />
      <CreateStack.Screen name="Step5" component={v_f275b6} />
      <CreateStack.Screen name="Step6" component={v_baac2f} />
      <CreateStack.Screen name="Step7" component={v_448ad1} />
      <CreateStack.Screen name="Step8" component={v_d19b01} />
    </CreateStack.Navigator>
  );
}

const v_866a65 = v_cdbda8<v_97a9a8>();

const TAB_CONFIG: Record<string, { icon: keyof typeof v_dec439.glyphMap; label: string }> = {
  HomeTab: { icon: "home", label: "홈" },
  ClonesTab: { icon: "users", label: "페르소나" },
  CreateTab: { icon: "plus-circle", label: "생성" },
  ShortsTab: { icon: "user-check", label: "팔로잉" },
  MyTab: { icon: "user", label: "마이" },
};

export default function v_19ba0e() {
  const v_625c74 = v_1ed7d9((v_fd5f43) => v_fd5f43.user);
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);

  const v_53dd92 =
    v_326be8.OS === "ios"
      ? v_033e14.bottom
      : Math.max(v_f9771e, v_033e14.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route: v_c7daf6 }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          ...v_d81136.tabBar,
          height: 56 + v_53dd92,
          paddingBottom: v_53dd92,
        },
        tabBarIcon: ({ focused: v_50c827 }) => {
          const v_74a79c = v_5efb19[v_c7daf6.name];

          if (v_c7daf6.name === "MyTab" && v_625c74?.avatarUrl) {
            return (
              <View style={[v_d81136.avatarWrap, v_50c827 && v_d81136.avatarFocused]}>
                <Image
                  source={{ uri: v_625c74.avatarUrl }}
                  style={v_d81136.avatar}
                />
              </View>
            );
          }

          return (
            <Feather
              name={v_74a79c?.icon ?? "circle"}
              size={24}
              color={v_50c827 ? v_1bfbd0.zinc900 : v_1bfbd0.zinc400}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={v_c316d8} />
      <Tab.Screen name="ClonesTab" component={v_aedede} />
      <Tab.Screen
        name="CreateTab"
        component={v_31fee5}
        options={{ tabBarStyle: { display: "none" } }}
        listeners={({ navigation: v_c65f5d }) => ({
          tabPress: (v_9e86fd) => {
            v_9e86fd.preventDefault();
            const v_b6e533 = v_c65f5d.getState();
            const v_3f8a47 = v_b6e533.routes.findIndex(
              (v_cb35cb) => v_cb35cb.name === "CreateTab"
            );
            if (v_3f8a47 < 0) return;
            const v_81e34b = v_b6e533.routes.map((v_c7daf6) =>
              v_c7daf6.name === "CreateTab"
                ? {
                    ...v_c7daf6,
                    state: {
                      routes: [
                        {
                          name: "Step1" as const,
                          key: `Step1-${Date.now()}`,
                        },
                      ],
                      index: 0,
                    },
                  }
                : v_c7daf6
            );
            v_c65f5d.dispatch(
              v_650cfa.reset({
                ...v_b6e533,
                index: v_3f8a47,
                routes: v_81e34b,
              })
            );
          },
        })}
      />
      {
}
      <Tab.Screen name="ShortsTab" component={v_14b43e} />
      <Tab.Screen name="MyTab" component={v_ed02a5} />
    </Tab.Navigator>
  );
}

const v_d81136 = v_472849.create({
  tabBar: {
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
    paddingTop: 8,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  avatarFocused: {
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc900,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
});
