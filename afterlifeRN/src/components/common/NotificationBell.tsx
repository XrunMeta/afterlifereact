

import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../stores/authStore";
import { getUnreadCount } from "../../api/notifications";
import { COLORS } from "../constants";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {

  color?: string;
  size?: number;
}

const POLL_MS = 30 * 1000;

export default function NotificationBell({ color = COLORS.zinc700, size = 22 }: Props) {
  const navigation = useNavigation<Nav>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [unread, setUnread] = useState(0);

  const refresh = React.useCallback(async () => {
    if (!accessToken) {
      setUnread(0);
      return;
    }
    try {
      const res = await getUnreadCount(accessToken);
      setUnread(res.count);
    } catch {

    }
  }, [accessToken]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
      const t = setInterval(refresh, POLL_MS);
      return () => clearInterval(t);
    }, [refresh]),
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      style={styles.btn}
      accessibilityLabel="notifications-bell"
    >
      <Feather name="bell" size={size} color={color} />
      {unread > 0 && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4, position: "relative" },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
});
