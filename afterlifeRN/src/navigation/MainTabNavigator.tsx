import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { View, StyleSheet, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAndroidNavigationBarHeight } from "react-native-navigation-bar-height";
import type { MainTabParamList, ClonesStackParamList, CreateStackParamList, MyStackParamList } from "./types";
import { COLORS } from "../components/constants";
import { useAuthStore } from "../stores/authStore";

import HomeScreen from "../screens/home/HomeScreen";
import MyClonesDashboardScreen from "../screens/clones/MyClonesDashboardScreen";
import CloneDetailScreen from "../screens/clones/CloneDetailScreen";
import CloneEditScreen from "../screens/clones/CloneEditScreen";
import CloneInviteScreen from "../screens/clones/CloneInviteScreen";
import Step1CloneTypeScreen from "../screens/clone-creation/Step1CloneTypeScreen";
import Step2BasicInfoScreen from "../screens/clone-creation/Step2BasicInfoScreen";
import PersonaAssistantScreen from "../screens/clone-creation/PersonaAssistantScreen";
import Step3ImageUploadScreen from "../screens/clone-creation/Step3ImageUploadScreen";
import Step4VoiceUploadScreen from "../screens/clone-creation/Step4VoiceUploadScreen";
import Step5VisibilityScreen from "../screens/clone-creation/Step5VisibilityScreen";

import Step6CreatingScreen from "../screens/clone-creation/Step6CreatingScreen";
import Step7CompleteScreen from "../screens/clone-creation/Step7CompleteScreen";
import Step8CreateShortsScreen from "../screens/clone-creation/Step8CreateShortsScreen";
import FollowingScreen from "../screens/following/FollowingScreen";
import ShortsTabScreen from "../screens/shorts/ShortsTabScreen";
import SearchScreen from "../screens/search/SearchScreen";
import MyScreen from "../screens/my/MyScreen";
import EditProfileScreen from "../screens/my/EditProfileScreen";
import NotificationSettingsScreen from "../screens/my/NotificationSettingsScreen";
import PrivacySettingsScreen from "../screens/my/PrivacySettingsScreen";
import SavedItemsScreen from "../screens/my/SavedItemsScreen";
import AcquaintanceManagementScreen from "../screens/my/AcquaintanceManagementScreen";
import LanguageSettingsScreen from "../screens/my/LanguageSettingsScreen";
import PaymentPinScreen from "../screens/my/PaymentPinScreen";
import InviteStatusScreen from "../screens/my/InviteStatusScreen";
import BlockedListScreen from "../screens/my/BlockedListScreen";
import TransactionsScreen from "../screens/my/TransactionsScreen";

const ClonesStack = createNativeStackNavigator<ClonesStackParamList>();
const CreateStack = createNativeStackNavigator<CreateStackParamList>();
const MyStack = createNativeStackNavigator<MyStackParamList>();

function ClonesStackNavigator() {
  return (
    <ClonesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClonesStack.Screen name="Dashboard" component={MyClonesDashboardScreen} />
      <ClonesStack.Screen name="CloneDetail" component={CloneDetailScreen} />
      <ClonesStack.Screen name="CloneEdit" component={CloneEditScreen} />
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
      <CreateStack.Screen name="Step1" component={Step1CloneTypeScreen} />
      <CreateStack.Screen name="Step2" component={Step2BasicInfoScreen} />
      <CreateStack.Screen name="PersonaAssistant" component={PersonaAssistantScreen} />
      <CreateStack.Screen name="Step3" component={Step3ImageUploadScreen} />
      <CreateStack.Screen name="Step4" component={Step4VoiceUploadScreen} />
      <CreateStack.Screen name="Step5" component={Step5VisibilityScreen} />
      <CreateStack.Screen name="Step6" component={Step6CreatingScreen} />
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
      <MyStack.Screen name="SavedItems" component={SavedItemsScreen} />
      <MyStack.Screen name="AcquaintanceManagement" component={AcquaintanceManagementScreen} />
      <MyStack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
      <MyStack.Screen name="PaymentPin" component={PaymentPinScreen} />
      <MyStack.Screen name="InviteStatus" component={InviteStatusScreen} />
      <MyStack.Screen name="BlockedList" component={BlockedListScreen} />
      <MyStack.Screen name="Transactions" component={TransactionsScreen} />
    </MyStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  HomeTab: { icon: "home", label: "홈" },
  SearchTab: { icon: "search", label: "검색" },
  CreateTab: { icon: "plus-circle", label: "생성" },
  ShortsTab: { icon: "user-check", label: "구독 중" },
  ClonesTab: { icon: "users", label: "페르소나" },
  MyTab: { icon: "user", label: "마이" },
};

export default function MainTabNavigator() {
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
