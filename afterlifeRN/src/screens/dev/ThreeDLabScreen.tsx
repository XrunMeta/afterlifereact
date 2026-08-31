

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ToastAndroid,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES } from "../../components/constants";
import { useAuthStore } from "../../stores/authStore";
import {
  triposrGenerate,
  absoluteAssetUrl,
  type TriposrGenerateResponse,
} from "../../api/triposr";

export default function ThreeDLabScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriposrGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("권한 필요", "갤러리 접근 권한을 허용해주세요.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setImageUri(res.assets[0].uri);
    setResult(null);
    setError(null);
  };

  const runGenerate = async () => {
    if (!imageUri || !accessToken) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await triposrGenerate(accessToken, imageUri);
      setResult(r);
      if (Platform.OS === "android") {
        ToastAndroid.show(`생성 완료 · ${(r.elapsed_ms / 1000).toFixed(1)}s`, ToastAndroid.SHORT);
      }
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      setError(msg);
      Alert.alert("3D 생성 실패", msg);
    } finally {
      setLoading(false);
    }
  };

  const openMesh = () => {
    if (!result) return;
    void Linking.openURL(absoluteAssetUrl(result.base_url, result.mesh_url));
  };

  return (
    <View style={s.container}>
      <PageHeader showBackButton title="3D 생성 테스트" transparent />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.desc}>
          사진 1장 → TripoSR 서버 (가비아) → mesh + 5각도 렌더.{"\n"}
          첫 요청은 model 로딩으로 30초까지, 이후는 5~15초.
        </Text>

        <TouchableOpacity style={s.pickBtn} onPress={pickImage} disabled={loading}>
          <Feather name="image" size={20} color={COLORS.white} />
          <Text style={s.pickBtnLabel}>사진 선택</Text>
        </TouchableOpacity>

        {imageUri ? (
          <View style={s.inputCard}>
            <Text style={s.sectionLabel}>입력</Text>
            <Image source={{ uri: imageUri }} style={s.inputImage} resizeMode="contain" />
            <TouchableOpacity
              style={[s.runBtn, loading && s.runBtnDisabled]}
              onPress={runGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Feather name="box" size={18} color={COLORS.white} />
                  <Text style={s.runBtnLabel}>3D 생성</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <View style={s.errorCard}>
            <Text style={s.errorLabel}>실패</Text>
            <Text style={s.errorMsg}>{error}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={s.resultCard}>
            <Text style={s.sectionLabel}>
              결과 · {(result.elapsed_ms / 1000).toFixed(1)}s · mesh {(result.mesh_bytes / 1024 / 1024).toFixed(1)}MB
            </Text>
            <View style={s.renderRow}>
              {result.render_urls.map((rel, i) => (
                <Image
                  key={i}
                  source={{ uri: absoluteAssetUrl(result.base_url, rel) }}
                  style={s.renderThumb}
                  resizeMode="cover"
                />
              ))}
            </View>
            <TouchableOpacity style={s.meshBtn} onPress={openMesh}>
              <Feather name="download" size={16} color={COLORS.white} />
              <Text style={s.meshBtnLabel}>mesh.obj 열기 (브라우저)</Text>
            </TouchableOpacity>
            <Text style={s.jobId}>job_id: {result.job_id}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.zinc950 },
  scroll: { padding: SIZES.medium, gap: SIZES.medium },
  desc: {
    color: COLORS.zinc300,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SIZES.small,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.small,
    backgroundColor: COLORS.zinc800,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
  },
  pickBtnLabel: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  inputCard: {
    backgroundColor: COLORS.zinc900,
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    gap: SIZES.small,
  },
  sectionLabel: { color: COLORS.zinc300, fontSize: 13, fontWeight: "600" },
  inputImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: SIZES.small,
    backgroundColor: COLORS.zinc800,
  },
  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.small,
    backgroundColor: "#4f46e5",
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    marginTop: SIZES.small,
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnLabel: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  errorCard: {
    backgroundColor: "#3b1f1f",
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    gap: 4,
  },
  errorLabel: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  errorMsg: { color: COLORS.zinc300, fontSize: 12, lineHeight: 18 },
  resultCard: {
    backgroundColor: COLORS.zinc900,
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    gap: SIZES.small,
  },
  renderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.small,
  },
  renderThumb: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: SIZES.small,
    backgroundColor: COLORS.zinc800,
  },
  meshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SIZES.small,
    backgroundColor: COLORS.zinc800,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    marginTop: SIZES.small,
  },
  meshBtnLabel: { color: COLORS.white, fontSize: 14, fontWeight: "600" },
  jobId: { color: COLORS.zinc300, fontSize: 11, textAlign: "center", marginTop: 4 },
});
