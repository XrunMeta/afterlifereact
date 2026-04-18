import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, SIZES } from "../../components/constants";

export default function RestoreDeletedScreen() {
  const [loading, setLoading] = useState(false);

  async function restore() {
    setLoading(true);
    try {

      await new Promise((r) => setTimeout(r, 400));
      Alert.alert("복구 완료", "계정이 다시 활성화되었습니다.");
    } catch (e) {
      Alert.alert("복구 실패", "복구 기간(90일)이 만료되었거나 상태가 다릅니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title="계정 복구" />
      <View style={s.wrap}>
        <Text style={s.title}>삭제 대기 중인 계정입니다</Text>
        <Text style={s.body}>
          귀하의 계정은 현재 소프트 삭제 상태입니다. 삭제 요청일로부터 90일 이내에 복구하실 수 있습니다.
          {"\n\n"}
          90일 경과 후에는 콜드 아카이브로 이동하며(추가 275일 보관), 이 기간에는 관리자 문의를 통해서만
          복구 가능합니다. 총 1년 경과 시 최종 삭제됩니다.
          {"\n\n"}
          귀하의 암호화 키(DEK)는 기본적으로 보존됩니다. 영구 폐기를 원하시면 "GDPR 삭제"를 사용하세요.
        </Text>
        <View style={{ height: 20 }} />
        <Button title={loading ? "복구 중..." : "지금 복구하기"} onPress={restore} disabled={loading} />
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, color: COLORS.zinc600 },
});
