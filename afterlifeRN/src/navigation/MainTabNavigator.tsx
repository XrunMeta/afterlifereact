import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { View, StyleSheet, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import { useTranslation } from "react-i18next";
import type { MainTabParamList, ClonesStackParamList, CreateStackParamList, MyStackParamList } from "./types";
import { COLORS } from "../components/constants";
import { useAuthStore } from "../stores/authStore";

import HomeScreen from "../screens/home/HomeScreen";
import MyClonesDashboardScreen from "../screens/clones/MyClonesDashboardScreen";
import CloneDetailScreen from "../screens/clones/CloneDetailScreen";
import CloneEditScreen from "../screens/clones/CloneEditScreen";
import CloneLearnScreen from "../screens/clones/CloneLearnScreen";
import CloneInviteScreen from "../screens/clones/CloneInviteScreen";

import PersonaAssistantScreen from "../screens/clone-creation/PersonaAssistantScreen";
import Step3ImageUploadScreen from "../screens/clone-creation/Step3ImageUploadScreen";
import Step4VoiceUploadScreen from "../screens/clone-creation/Step4VoiceUploadScreen";
import Step5VisibilityScreen from "../screens/clone-creation/Step5VisibilityScreen";
import Step7CompleteScreen from "../screens/clone-creation/Step7CompleteScreen";
import Step8CreateShortsScreen from "../screens/clone-creation/Step8CreateShortsScreen";
import FollowingScreen from "../screens/following/FollowingScreen";
import ShortsTabScreen from "../screens/shorts/ShortsTabScreen";
import SearchScreen from "../screens/search/SearchScreen";
import MyScreen from "../screens/my/MyScreen";
import EditProfileScreen from "../screens/my/EditProfileScreen";
import NotificationSettingsScreen from "../screens/my/NotificationSettingsScreen";
import PrivacySettingsScreen from "../screens/my/PrivacySettingsScreen";
import AgreementsScreen from "../screens/my/AgreementsScreen";
import SavedItemsScreen from "../screens/my/SavedItemsScreen";
import RememberingClonesScreen from "../screens/my/RememberingClonesScreen";
import LanguageSettingsScreen from "../screens/my/LanguageSettingsScreen";
import PaymentPinScreen from "../screens/my/PaymentPinScreen";
import InviteStatusScreen from "../screens/my/InviteStatusScreen";
import BlockedListScreen from "../screens/my/BlockedListScreen";
import ReportsScreen from "../screens/my/ReportsScreen";
import TransactionsScreen from "../screens/my/TransactionsScreen";

import PurchaseScreen from "../screens/my/PurchaseScreen";

const ClonesStack = createNativeStackNavigator<ClonesStackParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();
const MyStack = createNativeStackNavigator<MyStackParamList>();

function ClonesStackNavigator() {
  return (
    <ClonesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClonesStack.Screen name="Dashboard" component={MyClonesDashboardScreen} />
      <ClonesStack.Screen name="CloneDetail" component={CloneDetailScreen} />
      <ClonesStack.Screen name="CloneEdit" component={CloneEditScreen} />
      <ClonesStack.Screen name="CloneLearn" component={CloneLearnScreen} />
      <ClonesStack.Screen name="CloneInvite" component={CloneInviteScreen} />
      <ClonesStack.Screen name="InviteStatus" component={InviteStatusScreen} />
    </ClonesStack.Navigator>
  );
}

function CreateStackNavigator() {

  React.useEffect(() => {
    const { creationDraft, setCreationDraft } =
      require("../stores/cloneStore").useCloneStore.getState();
    if (!creationDraft.cloneType) {
      console.log("[CreateStack] cloneType missing on mount — defaulting to friend");
      setCreationDraft({ cloneType: "friend", visibility: "public" });
    }
  }, []);
  return (

    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="Step3" component={Step3ImageUploadScreen} />
      <CreateStack.Screen name="Step4" component={Step4VoiceUploadScreen} />
      {}
      <CreateStack.Screen name="PersonaAssistant" component={PersonaAssistantScreen} />
      <CreateStack.Screen name="Step5" component={Step5VisibilityScreen} />
      <CreateStack.Screen name="Step7" component={Step7CompleteScreen} />
      <CreateStack.Screen name="Step8" component={Step8CreateShortsScreen} />
    </CreateStack.Navigator>
  );
}

function MyStackNavigator() {
  return (
    <MyStack.Navigator screenOptions={{ headerShown: false }}>
      <MyStack.Screen name="MyHome" component={MyScreen} />
      <MyStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MyStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <MyStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <MyStack.Screen name="Agreements" component={AgreementsScreen} />
      <MyStack.Screen name="SavedItems" component={SavedItemsScreen} />
      <MyStack.Screen name="RememberingClones" component={RememberingClonesScreen} />
      <MyStack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <MyStack.Screen name="PaymentPin" component={PaymentPinScreen} />
      <MyStack.Screen name="InviteStatus" component={InviteStatusScreen} />
      <MyStack.Screen name="BlockedList" component={BlockedListScreen} />
      <MyStack.Screen name="Transactions" component={TransactionsScreen} />
      <MyStack.Screen name="Purchase" component={PurchaseScreen} />
      <MyStack.Screen name="Reports" component={ReportsScreen} />
    </MyStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; labelKey: string }> = {
  HomeTab: { icon: "home", labelKey: "tabs.home" },
  SearchTab: { icon: "search", labelKey: "tabs.search" },
  CreateTab: { icon: "plus-circle", labelKey: "tabs.create" },
  ShortsTab: { icon: "user-check", labelKey: "tabs.subscribing" },
  ClonesTab: { icon: "users", labelKey: "tabs.clones" },
  MyTab: { icon: "user", labelKey: "tabs.my" },
};

export default function MainTabNavigator() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const apiUser = useAuthStore((s) => s.apiUser);

  const avatarUrl = apiUser ? apiUser.avatarUrl : user?.avatarUrl ?? null;
  const insets = useSafeAreaInsets();
  const navBarHeight = useAndroidNavigationBarHeight(0);

  const bottomInset =
    Platform.OS === "ios"
      ? insets.bottom
      : Math.max(navBarHeight, insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,

        tabBarLabel: t(TAB_CONFIG[route.name]?.labelKey ?? "", {
          defaultValue: "",
        }),
        tabBarStyle: {
          ...styles.tabBar,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
        },
        tabBarIcon: ({ focused }) => {
          const config = TAB_CONFIG[route.name];

          if (route.name === "MyTab" && avatarUrl) {
            return (
              <View style={[styles.avatarWrap, focused && styles.avatarFocused]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </View>
            );
          }

          return (
            <Feather
              name={config?.icon ?? "circle"}
              size={24}
              color={focused ? COLORS.zinc900 : COLORS.zinc400}
            />
          );
        },
      })}
    >
      {

}
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      <Tab.Screen
        name="CreateTab"
        component={CreateStackNavigator}
        options={{ tabBarStyle: { display: "none" } }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            const { setCreationDraft, resetCreationDraft } =
              require("../stores/cloneStore").useCloneStore.getState();
            resetCreationDraft();
            setCreationDraft({ cloneType: "friend", visibility: "public" });
            const state = navigation.getState();
            const createIndex = state.routes.findIndex(
              (r) => r.name === "CreateTab"
            );
            if (createIndex < 0) return;
            const routes = state.routes.map((route) =>
              route.name === "CreateTab"
                ? {
                    ...route,
                    state: {
                      routes: [
                        {
                          name: "Step3" as const,
                          key: `Step3-${Date.now()}`,
                        },
                      ],
                      index: 0,
                    },
                  }
                : route
            );
            navigation.dispatch(
              CommonActions.reset({
                ...state,
                index: createIndex,
                routes,
              })
            );
          },
        })}
      />
      <Tab.Screen name="ShortsTab" component={FollowingScreen} />
      <Tab.Screen name="ClonesTab" component={ClonesStackNavigator} />
      {

}
      <Tab.Screen
        name="MyTab"
        component={MyStackNavigator}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
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
    borderColor: COLORS.zinc900,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
});
