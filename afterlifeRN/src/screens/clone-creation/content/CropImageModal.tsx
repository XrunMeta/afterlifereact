import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_a2349e,
  v_700696,
  v_326be8,
} from "rcmrninabrnb";
import {
  v_70c669,
  v_5bc116,
  v_06a5e7,
  v_944e0c,
  type v_905231,
  type v_bd225c,
} from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import v_11c5c8 from "../../../components/clone/UpperBodyGuide";
import {
  v_f98917,
  v_0916d7,
  v_f965d7,
  v_622116,
  v_34b1b1,
  type v_49127c,
} from "../../../lib/cropImage";
import { v_1bfbd0 } from "../../../components/constants";
import { v_889fad } from "../../../stores/dialogStore";
import {
  v_069313,
  v_6036cc,
  v_8b5209,
  v_d43608,
} from "../../../lib/t208SilhouetteScale";
import { v_87a25c, v_951fee, v_890a60, v_d993b0 } from "../../../lib/t208MeasureStore";

interface Source { uri: string; width: number; height: number }
interface Props {
  visible: boolean;
  source: Source | null;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

export default function v_100dc2({ visible: v_cf55be, source: v_04e790, onConfirm: v_e2be2d, onCancel: v_c7001c }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);

  const v_53dd92 =
    v_326be8.OS === "ios" ? v_033e14.bottom : Math.max(v_f9771e, v_033e14.bottom);
  const { width: v_df48e9, height: v_bd274b } = v_700696.get("window");
  const v_e0560a = Math.min(v_df48e9 * 0.86, (v_bd274b * 0.7) / 2);
  const v_fc2e4f = v_e0560a * 2;

  const [v_7b377a, v_3bbf8c] = v_5ab095(v_069313);
  v_c4deb2(() => v_d43608(() => v_3bbf8c(v_069313())), []);

  const v_0d09bb = v_e662ae<v_49127c>({ translateX: 0, translateY: 0, scale: 1 });

  const v_1dd864 = v_e662ae(new v_a2349e.ValueXY({ x: 0, y: 0 })).current;
  const v_72e87f = v_e662ae({ x: 0, y: 0 }).current;
  const v_a37637 = v_e662ae(new v_a2349e.Value(1)).current;

  const v_475100 = v_e662ae(new v_a2349e.Value(1)).current;

  const v_e0371c = v_e662ae(1);

  const v_3ca9ce = v_e662ae(null);
  const v_f60c75 = v_e662ae(null);

  const [v_29e4ca, v_40496c] = v_5ab095(true);

  v_c4deb2(() => {
    if (!v_04e790) return;
    v_0d09bb.current = { translateX: 0, translateY: 0, scale: 1 };
    v_72e87f.x = 0;
    v_72e87f.y = 0;
    v_e0371c.current = 1;
    v_1dd864.setOffset({ x: 0, y: 0 });
    v_1dd864.setValue({ x: 0, y: 0 });
    v_475100.setValue(1);
    v_a37637.setValue(1);
    v_40496c(true);
  }, [v_04e790?.uri]); 

  const v_231e09 = v_e662ae(false);

  const v_9942bb = () => {
    if (!v_04e790) return;
    const v_7ddb73 = { width: v_04e790.width, height: v_04e790.height };
    const v_143cb5 = { width: v_e0560a, height: v_fc2e4f };
    const v_c7ca32 = v_f965d7(v_7ddb73, v_143cb5, v_e0371c.current, {
      x: v_72e87f.x,
      y: v_72e87f.y,
    });
    v_72e87f.x = v_c7ca32.x;
    v_72e87f.y = v_c7ca32.y;
    v_1dd864.setOffset({ x: v_72e87f.x, y: v_72e87f.y });
    v_1dd864.setValue({ x: 0, y: 0 });
    v_0d09bb.current.translateX = v_72e87f.x;
    v_0d09bb.current.translateY = v_72e87f.y;
    v_40496c(v_622116({ image: v_7ddb73, frame: v_143cb5 }, v_e0371c.current, v_c7ca32));
  };

  const v_0403eb = v_a2349e.event([{ nativeEvent: { translationX: v_1dd864.x, translationY: v_1dd864.y } }], {
    useNativeDriver: false,
  });
  const v_b4ecf6 = (e: v_905231) => {
    const v_72c7a6 = v_9e86fd.nativeEvent.state;
    if (v_72c7a6 === v_944e0c.END) {
      v_72e87f.x += v_9e86fd.nativeEvent.translationX;
      v_72e87f.y += v_9e86fd.nativeEvent.translationY;

      v_9942bb();
    } else if (v_72c7a6 === v_944e0c.CANCELLED || v_72c7a6 === v_944e0c.FAILED) {

      v_1dd864.setOffset({ x: v_72e87f.x, y: v_72e87f.y });
      v_1dd864.setValue({ x: 0, y: 0 });
    }
  };

  const v_b0e95b = v_a2349e.event([{ nativeEvent: { scale: v_a37637 } }], { useNativeDriver: false });
  const v_4129f2 = (e: v_bd225c) => {
    if (v_9e86fd.nativeEvent.state === v_944e0c.END) {

      const v_a448ad = v_0916d7(v_e0371c.current * v_9e86fd.nativeEvent.scale);
      v_475100.setValue(v_a448ad);
      v_e0371c.current = v_a448ad;
      v_0d09bb.current.scale = v_a448ad;
      v_a37637.setValue(1);

      v_9942bb();
    }
  };

  const v_ee2cf4 = v_a2349e.multiply(v_a37637, v_475100);

  const v_ce9295 = async () => {
    if (!v_04e790) return;

    if (v_231e09.current) return;

    if (
      !v_622116(
        { image: { width: v_04e790.width, height: v_04e790.height }, frame: { width: v_e0560a, height: v_fc2e4f } },
        v_e0371c.current,
        { x: v_72e87f.x, y: v_72e87f.y },
      )
    ) {
      return;
    }
    v_231e09.current = true;
    try {
      const v_cd1446 = await v_34b1b1(
        v_04e790.uri,
        { width: v_04e790.width, height: v_04e790.height },
        { width: v_e0560a, height: v_fc2e4f },
        v_0d09bb.current,
      );

      if (v_6036cc()) {
        const v_a37637 = v_069313();
        await v_87a25c(v_a37637, v_cd1446);
        const v_2fb8cc = v_951fee();
        const v_a448ad = v_2fb8cc ? null : v_d993b0();
        v_889fad(
          `T-208 크롭 저장 · ${v_8b5209(v_a37637)}`,
          v_2fb8cc
            ? `3종 크롭 완료!\n${v_890a60()}\n\n다음: 생성→사진에서「T-208 … 불러오기」로 배율별 크롭을 넣어 클론 3개 생성(음성·페르소나 동일) → 가비아 동일 대사 렌더.`
            : `기록됨.\n현황 ${v_890a60()}\n\n다음 배율로 전환: ${v_8b5209(v_a448ad ?? v_069313())}\n같은 사진으로 다시 크롭하세요.`,
        );
      }
      v_e2be2d(v_cd1446);
    } catch (v_49263d) {
      console.warn("[CropImageModal] cropToAvatar 실패:", v_49263d);
      v_889fad(v_8d41d7('common.error'), v_8d41d7('create.image.cropFailed'));
    } finally {
      v_231e09.current = false;
    }
  };

  const v_a576ef = v_df9f57(
    () => {
      const v_ca01e0 = v_04e790
        ? v_f98917({ width: v_04e790.width, height: v_04e790.height }, { width: v_e0560a, height: v_fc2e4f })
        : 1;
      return {
        width: (v_04e790?.width ?? 1) * v_ca01e0,
        height: (v_04e790?.height ?? 1) * v_ca01e0,
        transform: [{ translateX: v_1dd864.x }, { translateY: v_1dd864.y }, { scale: v_ee2cf4 }],
      };
    },
    [v_04e790, v_e0560a, v_fc2e4f, v_1dd864, v_ee2cf4],
  );

  if (!v_04e790) return null;

  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_c7001c}>
      <GestureHandlerRootView style={v_fd5f43.root}>
        <PinchGestureHandler
          ref={v_3ca9ce}
          simultaneousHandlers={v_f60c75}
          onGestureEvent={v_b0e95b}
          onHandlerStateChange={v_4129f2}
        >
          <Animated.View style={v_fd5f43.fill}>
            <PanGestureHandler
              ref={v_f60c75}
              simultaneousHandlers={v_3ca9ce}
              onGestureEvent={v_0403eb}
              onHandlerStateChange={v_b4ecf6}
            >
              <Animated.View style={v_fd5f43.fill}>
                <Animated.Image source={{ uri: v_04e790.uri }} style={v_a576ef as any} resizeMode="cover" />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {}
        <View pointerEvents="none" style={v_472849.absoluteFill}>
          <View style={[v_fd5f43.dim, { top: 0, left: 0, right: 0, height: (v_bd274b - v_fc2e4f) / 2 }]} />
          <View style={[v_fd5f43.dim, { bottom: 0, left: 0, right: 0, height: (v_bd274b - v_fc2e4f) / 2 }]} />
          <View style={[v_fd5f43.dim, { top: (v_bd274b - v_fc2e4f) / 2, bottom: (v_bd274b - v_fc2e4f) / 2, left: 0, width: (v_df48e9 - v_e0560a) / 2 }]} />
          <View style={[v_fd5f43.dim, { top: (v_bd274b - v_fc2e4f) / 2, bottom: (v_bd274b - v_fc2e4f) / 2, right: 0, width: (v_df48e9 - v_e0560a) / 2 }]} />
          {}
          <View style={[v_fd5f43.frame, { top: (v_bd274b - v_fc2e4f) / 2, left: (v_df48e9 - v_e0560a) / 2, width: v_e0560a, height: v_fc2e4f }]} />
          {}
          <View style={[v_fd5f43.guide, { top: (v_bd274b - v_fc2e4f) / 2, left: (v_df48e9 - v_e0560a) / 2, width: v_e0560a, height: v_fc2e4f }]}>
            <UpperBodyGuide width={v_df48e9 * v_7b377a} />
          </View>
          {__DEV__ && v_6036cc() ? (
            <View style={v_fd5f43.devBadge} pointerEvents="none">
              <Text style={v_fd5f43.devBadgeText}>T-208 실측 {v_8b5209(v_7b377a)}</Text>
            </View>
          ) : null}
        </View>

        <View style={[v_fd5f43.actions, { bottom: 16 + v_53dd92 }]}>
          <TouchableOpacity style={v_fd5f43.btn} onPress={v_c7001c}>
            <Text style={v_fd5f43.btnText}>{v_8d41d7('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[v_fd5f43.btn, v_fd5f43.btnPrimary, !v_29e4ca && v_fd5f43.btnDisabled]}
            onPress={v_ce9295}
            disabled={!v_29e4ca}
          >
            <Text style={[v_fd5f43.btnText, v_fd5f43.btnPrimaryText]}>{v_8d41d7('common.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  root: { flex: 1, backgroundColor: "#000" },
  fill: { ...v_472849.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  frame: { position: "absolute", borderWidth: 2, borderColor: "rgba(255,255,255,0.9)" },
  guide: { position: "absolute", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  devBadge: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  devBadgeText: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    borderRadius: 8,
  },
  actions: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)" },
  btnPrimary: { backgroundColor: v_1bfbd0.white },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: v_1bfbd0.white, fontWeight: "600" },
  btnPrimaryText: { color: v_1bfbd0.zinc900 },
});
