import v_a3453e, { v_c4deb2, v_df9f57, v_e662ae } from "bapkr";
import { v_aa7413, v_3094a2, v_19b633, v_4623af, v_472849, v_a2349e, v_700696 } from "rcmrninabrnb";
import {
  v_70c669,
  v_5bc116,
  v_06a5e7,
  v_944e0c,
  type v_905231,
  type v_bd225c,
} from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_772971 } from "jmpfvteuuztnp";
import v_11c5c8 from "../../../components/clone/UpperBodyGuide";
import { v_f98917, v_34b1b1, type v_49127c } from "../../../lib/cropImage";
import { v_1bfbd0 } from "../../../components/constants";
import { v_889fad } from "../../../stores/dialogStore";

interface Source { uri: string; width: number; height: number }
interface Props {
  visible: boolean;
  source: Source | null;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

export default function v_100dc2({ visible: v_cf55be, source: v_04e790, onConfirm: v_e2be2d, onCancel: v_c7001c }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { width: v_df48e9, height: v_bd274b } = v_700696.get("window");
  const v_e0560a = Math.min(v_df48e9 * 0.86, (v_bd274b * 0.7) / 2);
  const v_fc2e4f = v_e0560a * 2;

  const v_0d09bb = v_e662ae<v_49127c>({ translateX: 0, translateY: 0, scale: 1 });

  const v_1dd864 = v_e662ae(new v_a2349e.ValueXY({ x: 0, y: 0 })).current;
  const v_72e87f = v_e662ae({ x: 0, y: 0 }).current;
  const v_a37637 = v_e662ae(new v_a2349e.Value(1)).current;

  const v_475100 = v_e662ae(new v_a2349e.Value(1)).current;

  const v_e0371c = v_e662ae(1);

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
  }, [v_04e790?.uri]); 

  const v_231e09 = v_e662ae(false);

  const v_0403eb = v_a2349e.event([{ nativeEvent: { translationX: v_1dd864.x, translationY: v_1dd864.y } }], {
    useNativeDriver: false,
  });
  const v_b4ecf6 = (e: v_905231) => {
    const v_72c7a6 = v_9e86fd.nativeEvent.state;
    if (v_72c7a6 === v_944e0c.END) {
      v_72e87f.x += v_9e86fd.nativeEvent.translationX;
      v_72e87f.y += v_9e86fd.nativeEvent.translationY;
      v_1dd864.setOffset({ x: v_72e87f.x, y: v_72e87f.y });
      v_1dd864.setValue({ x: 0, y: 0 });
      v_0d09bb.current.translateX = v_72e87f.x;
      v_0d09bb.current.translateY = v_72e87f.y;
    } else if (v_72c7a6 === v_944e0c.CANCELLED || v_72c7a6 === v_944e0c.FAILED) {

      v_1dd864.setOffset({ x: v_72e87f.x, y: v_72e87f.y });
      v_1dd864.setValue({ x: 0, y: 0 });
    }
  };

  const v_b0e95b = v_a2349e.event([{ nativeEvent: { scale: v_a37637 } }], { useNativeDriver: false });
  const v_4129f2 = (e: v_bd225c) => {
    if (v_9e86fd.nativeEvent.state === v_944e0c.END) {
      const v_a448ad = Math.max(1, v_e0371c.current * v_9e86fd.nativeEvent.scale);
      v_475100.setValue(v_a448ad);
      v_e0371c.current = v_a448ad;
      v_0d09bb.current.scale = v_a448ad;
      v_a37637.setValue(1);
    }
  };

  const v_ee2cf4 = v_a2349e.multiply(v_a37637, v_475100);

  const v_ce9295 = async () => {
    if (!v_04e790) return;

    if (v_231e09.current) return;
    v_231e09.current = true;
    try {
      const v_cd1446 = await v_34b1b1(
        v_04e790.uri,
        { width: v_04e790.width, height: v_04e790.height },
        { width: v_e0560a, height: v_fc2e4f },
        v_0d09bb.current,
      );
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
        <PinchGestureHandler onGestureEvent={v_b0e95b} onHandlerStateChange={v_4129f2}>
          <Animated.View style={v_fd5f43.fill}>
            <PanGestureHandler onGestureEvent={v_0403eb} onHandlerStateChange={v_b4ecf6}>
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
            <UpperBodyGuide width={v_df48e9 * 0.5} />
          </View>
        </View>

        <View style={[v_fd5f43.actions]}>
          <TouchableOpacity style={v_fd5f43.btn} onPress={v_c7001c}>
            <Text style={v_fd5f43.btnText}>{v_8d41d7('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[v_fd5f43.btn, v_fd5f43.btnPrimary]} onPress={v_ce9295}>
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
  actions: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.15)" },
  btnPrimary: { backgroundColor: v_1bfbd0.white },
  btnText: { color: v_1bfbd0.white, fontWeight: "600" },
  btnPrimaryText: { color: v_1bfbd0.zinc900 },
});
