import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import Button from "../../components/ui/Button";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CreateStackParamList } from "../../navigation/types";

import SafeView from "../../components/ui/SafeView";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import StepIndicator from "../../components/common/StepIndicator";
import { COLORS, SIZES, RADIUS } from "../../components/constants";

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, "Step4">;
};

const VOICE_SAMPLES = [
  { id: "v1", name: "Nova", desc: "따뜻하고 부드러운" },
  { id: "v2", name: "Ursa", desc: "차분하고 깊은" },
  { id: "v3", name: "Vega", desc: "밝고 활기찬" },
  { id: "v4", name: "Orion", desc: "신뢰감 있는" },
  { id: "v5", name: "Luna", desc: "감성적인" },
  { id: "v6", name: "Stella", desc: "편안한" },
];

export default function Step4VoiceUploadScreen({ navigation }: Props) {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTime((t) => {
          if (t >= 15) {
            setIsRecording(false);
            return t;
          }
          return t + 1;
        });
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setUploadedFile(result.assets[0].name);
        setRecordTime(0);
        setIsRecording(false);
      }
    } catch {
      Alert.alert("오류", "파일을 선택할 수 없습니다.");
    }
  };

  const hasCustomVoice = recordTime >= 10 || uploadedFile;

  const handleNext = () => {
    navigation.navigate("Step5");
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="음성 설정"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 4, total: 7 }}
      />
      <StepIndicator currentStep={4} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showBottomBackground={false}
        autoAdjustKeyboardPadding={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {!showCustom ? (
            <>
              <Text style={styles.sectionTitle}>음성 샘플 선택</Text>
              {VOICE_SAMPLES.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[styles.voiceCard, selectedVoice === voice.id && styles.voiceCardActive]}
                  onPress={() => { setSelectedVoice(voice.id); setUploadedFile(null); setRecordTime(0); }}
                  activeOpacity={0.7}
                >
                  <View style={styles.voiceIcon}>
                    <Feather
                      name={selectedVoice === voice.id ? "pause-circle" : "play-circle"}
                      size={28}
                      color={selectedVoice === voice.id ? COLORS.violet500 : COLORS.zinc400}
                    />
                  </View>
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceDesc}>{voice.desc}</Text>
                  </View>
                  {selectedVoice === voice.id && (
                    <Feather name="check-circle" size={22} color={COLORS.violet500} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => { setShowCustom(true); setSelectedVoice(null); }}
                style={styles.customToggle}
                activeOpacity={0.7}
              >
                <Feather name="upload" size={20} color={COLORS.violet500} />
                <Text style={styles.customToggleText}>직접 오디오 업로드</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>음성 녹음 / 업로드</Text>
              <Text style={styles.hint}>녹음하거나 오디오 파일을 업로드해주세요</Text>

              {}
              <View style={styles.recordBox}>
                <Text style={styles.recordBoxTitle}>녹음하기</Text>
                <Text style={styles.recordScript}>
                  "안녕하세요, 저는 당신의 소중한 사람입니다. 오늘도 좋은 하루 보내세요."
                </Text>
                <Text style={styles.recordHint}>10~15초 분량으로 녹음해주세요</Text>
              </View>

              <View style={styles.recordCenter}>
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isRecording) {
                        setIsRecording(false);
                      } else {
                        setRecordTime(0);
                        setUploadedFile(null);
                        setIsRecording(true);
                      }
                    }}
                    style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                    activeOpacity={0.8}
                  >
                    <Feather name={isRecording ? "square" : "mic"} size={32} color={COLORS.white} />
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.timerText}>
                  {isRecording
                    ? `녹음 중 ${recordTime}s / 15s`
                    : recordTime > 0
                    ? `${recordTime}초 녹음 완료`
                    : "탭하여 녹음 시작"}
                </Text>
              </View>

              {}
              <View style={styles.orDivider}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>또는</Text>
                <View style={styles.orLine} />
              </View>

              {}
              <TouchableOpacity onPress={handlePickAudio} style={styles.uploadBox} activeOpacity={0.7}>
                <Feather name="upload-cloud" size={32} color={uploadedFile ? COLORS.violet500 : COLORS.zinc400} />
                {uploadedFile ? (
                  <View style={styles.uploadedInfo}>
                    <Text style={styles.uploadedName} numberOfLines={1}>{uploadedFile}</Text>
                    <Text style={styles.uploadedStatus}>업로드 완료</Text>
                  </View>
                ) : (
                  <Text style={styles.uploadText}>오디오 파일 선택</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setShowCustom(false); setRecordTime(0); setIsRecording(false); setUploadedFile(null); }}
                style={styles.backToSamples}
              >
                <Text style={styles.backToSamplesText}>샘플 목록으로 돌아가기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeScrollView>

      <View style={styles.bottomBar}>
        <Button
          title="다음 단계로 이동"
          onPress={handleNext}
          disabled={!selectedVoice && !hasCustomVoice}
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.xlarge },
  container: { width: "100%", maxWidth: 780, gap: SIZES.medium },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  hint: { fontSize: 13, color: COLORS.zinc500 },
  voiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    gap: 12,
  },
  voiceCardActive: { borderColor: COLORS.violet500, backgroundColor: COLORS.violet100 },
  voiceIcon: { width: 36, alignItems: "center" },
  voiceInfo: { flex: 1 },
  voiceName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  voiceDesc: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  customToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.violet500,
    borderStyle: "dashed",
  },
  customToggleText: { fontSize: 14, fontWeight: "600", color: COLORS.violet500 },
  recordBox: {
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    gap: 6,
  },
  recordBoxTitle: { fontSize: 14, fontWeight: "700", color: COLORS.zinc900 },
  recordScript: { fontSize: 14, color: COLORS.zinc700, lineHeight: 22, fontStyle: "italic" },
  recordHint: { fontSize: 12, color: COLORS.zinc400 },
  recordCenter: { alignItems: "center", gap: 16, paddingVertical: SIZES.medium },
  pulseRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(139,92,246,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.violet500,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: { backgroundColor: COLORS.error },
  timerText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc600 },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.zinc200 },
  orText: { marginHorizontal: SIZES.medium, color: COLORS.zinc400, fontSize: 13 },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderStyle: "dashed",
    backgroundColor: COLORS.zinc50,
  },
  uploadText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc500 },
  uploadedInfo: { flex: 1, gap: 2 },
  uploadedName: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  uploadedStatus: { fontSize: 12, color: COLORS.violet500, fontWeight: "500" },
  backToSamples: { alignItems: "center", paddingVertical: 12 },
  backToSamplesText: { fontSize: 14, color: COLORS.zinc500, textDecorationLine: "underline" },
  bottomBar: { paddingHorizontal: SIZES.xlarge, paddingVertical: SIZES.medium, borderTopWidth: 1, borderTopColor: COLORS.zinc200 },
});
