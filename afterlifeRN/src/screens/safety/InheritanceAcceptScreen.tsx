import { showAlert } from "../../stores/dialogStore";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

export default function InheritanceAcceptScreen() {
  const route = useRoute();
  const initialToken = (route.params as { token?: string } | undefined)?.token ?? "";
  const [token, setToken] = useState(initialToken);

  async function respond(decision: "accept" | "decline") {
    if (token.length < 32) {
      showAlert("유효한 초대 토큰이 필요합니다.");
      return;
    }
    showAlert(
      decision === "accept" ? "수락 완료" : "거절 완료",
      decision === "accept"
        ? "상속 지정이 수락되었습니다. 실제 이관은 관리자 검증 후 집행됩니다."
        : "초대를 거절했습니다.",
    );
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title="상속 초대 응답" />
      <View style={s.wrap}>
        <Text style={s.intro}>
          다른 사용자로부터 비상연락처/상속 지정 초대를 받으셨습니다. 초대 토큰을 확인한 후 수락
          또는 거절을 선택해주세요. 수락 시 상속 이관 조건이 충족되면 관리자 승인 하에 일부
          권한이 이관될 수 있습니다.
        </Text>

        <Text style={s.label}>초대 토큰</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="이메일에 포함된 토큰을 입력하세요"
          style={s.input}
          autoCapitalize="none"
        />

        <View style={s.btnRow}>
          <Button title="수락" onPress={() => respond("accept")} />
          <View style={{ height: 12 }} />
          <Button title="거절" variant="ghost" onPress={() => respond("decline")} />
        </View>
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium, gap: 12 },
  intro: { color: COLORS.zinc600, fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
  },
  btnRow: { marginTop: 24 },
});
